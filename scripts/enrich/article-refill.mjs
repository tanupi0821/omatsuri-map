/**
 * 地域メディア（号外NET・レアリア・東京フェスタ）の記事を掘り直して
 * 住所・開催時刻・主催・公式リンクを埋める
 *
 *   node scripts/enrich/article-refill.mjs [--apply] [--limit 50] [--id <祭りid>]
 *
 * 取り込み（scripts/import/goguynet.mjs ほか）は名前・日付・会場名までしか
 * 拾っていない。記事にはもっと書いてあるので、後追いで埋める。
 *
 * **記事の文章は一切持ち込まない。** 拾うのは住所・時刻・主催者名・リンク先 URL
 * という事実の項目だけ。description / note には触れない。
 *
 * 生データは data/raw/article-html/<host>.json（scripts/crawl/article-html.mjs）。
 * 既存の data/raw/goguynet などは strip() 済みなので、
 * **住所と緯度経度が入っている Google マップの iframe が残っていない**。
 * そのため HTML のまま取り直したものを使う。
 *
 * ---- 記事を実際に読んで分かったこと（抽出ルールの根拠）----
 *
 * 1. 住所は本文にほとんど書かれていない（本文に「住所」欄があるのは 1%）。
 *    代わりに記事の末尾に必ずと言っていいほど Google マップが貼ってあり、
 *      - maps/embed/v1/place?...&q=<会場名>,+<住所>   … 住所が入っている形
 *      - maps/embed?pb=!1m18...!2d<経度>!3d<緯度>...!2z<base64の地名>
 *    の 2 形式がある。前者から住所、後者から緯度経度が取れる。
 * 2. 時刻は「日時　2026年8月22日（土）18時～20時30分」のように**日付の直後**に
 *    書かれる。「時間：15時～22時」「開催時間：9:00～18:00」も日付の近くに来る。
 *    表記は 18時／18:00／18：00（全角コロン）／「12時から21時まで」が混在。
 * 3. **まとめ記事が多い**（「8月1日・2日の周南エリアイベントまとめ」など）。
 *    1 記事に複数の祭りとその時刻が並ぶので、日付の近くの時刻を素朴に採ると
 *    別の祭りの時刻を入れてしまう。候補が食い違ったら**入れない**。
 * 4. 主催は「主催：◯◯」だけでなく「主催は◯◯です」「◯◯主催による」もある。
 *    「主催者様より」「主催者の発表」は主催者名ではないので必ず外す。
 * 5. 公式サイトへのリンクは「公式サイト」「公式HP」「◯◯神社公式サイト」という
 *    アンカー文字列で貼られる。t.co・tenki.jp・食べログなどは主催者ではない。
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parse } from 'yaml';
import { ROOT, patch } from '../import/_lib.mjs';
import { PREFS } from '../lib/prefs.mjs';

const APPLY = process.argv.includes('--apply');
const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const LIMIT = Number(arg('--limit', Infinity));
const ONLY_ID = arg('--id', null);
const VERBOSE = process.argv.includes('--verbose');

const RAW = join(ROOT, 'data', 'raw', 'article-html');
if (!existsSync(RAW)) {
  console.log('article-refill: data/raw/article-html が無いので何もしない'
    + '（先に scripts/crawl/article-html.mjs）');
  process.exit(0);
}

const PREF_NAMES = PREFS.map((p) => p.name);

// ---------------------------------------------------------------------------
// 文字列の下ごしらえ
// ---------------------------------------------------------------------------

/**
 * 全角英数を半角に。「１７−１７」「１８：００」が混ざる。
 * **長音符「ー」は絶対に変換しない。**「センター」「ロータリー」が
 * 「センタ-」になって住所も会場名も壊れる。潰すのは記号のハイフンだけ。
 */
const han = (s) => String(s ?? '')
  .replace(/[０-９Ａ-Ｚａ-ｚ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
  .replace(/[：]/g, ':')
  .replace(/[－―‐−]/g, '-')
  .replace(/[〜～]/g, '~');

/** 住所用。数字だけ半角にして、波ダッシュや長音はそのまま残す */
const hanNum = (s) => String(s ?? '')
  .replace(/[０-９Ａ-Ｚａ-ｚ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
  .replace(/[－−‐]/g, '-');

const strip = (h) => String(h ?? '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  .replace(/&hellip;/g, '…').replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

/** Google マップ埋め込みの base64（URL セーフ）。壊れていたら null */
function b64(x) {
  try {
    const s = Buffer.from(x.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return /�/.test(s) ? null : s;
  } catch { return null; }
}

/** 記事に貼られた Google マップの埋め込みを全部拾う */
function mapEmbeds(html) {
  const out = [];
  for (const m of html.matchAll(/<iframe[^>]+src=["']([^"']*google\.com\/maps[^"']*)["']/g)) {
    const src = m[1].replace(/&amp;/g, '&');
    const rec = { place: null, address: null, lat: null, lng: null };
    const q = src.match(/[?&]q=([^&"']+)/);
    if (q) {
      // 「あびこ+ショッピングプラザ,+千葉県我孫子市我孫子４丁目１１−１」
      // 「+」は空白。カンマの後ろが住所（無いこともある）
      const dec = decodeURIComponent(q[1]).replace(/\+/g, ' ').trim();
      const parts = dec.split(',').map((x) => x.trim()).filter(Boolean);
      rec.place = parts[0] ?? null;
      const addr = parts.slice(1).join('');
      if (addr) rec.address = addr;
      // カンマ無しでも住所そのものを q にしていることがある
      if (!addr && /[都道府県].{0,8}[市区町村]/.test(dec)) rec.address = dec;
    } else {
      const ll = src.match(/!2d(-?[\d.]+)!3d(-?[\d.]+)/);
      if (ll) { rec.lng = Number(ll[1]); rec.lat = Number(ll[2]); }
      const z = src.match(/!2z([A-Za-z0-9_-]+)/);
      if (z) {
        const dec = b64(z[1]);
        if (dec) {
          // 「〒039-0103 青森県三戸郡南部町大向飛鳥２０−２」の形なら住所
          if (/〒\s*\d{3}/.test(dec)) rec.address = dec.replace(/^〒\s*[\d-]+\s*/, '');
          else rec.place = dec;
        }
      }
    }
    if (rec.place || rec.address || rec.lat != null) out.push(rec);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 住所
// ---------------------------------------------------------------------------

/** 都道府県名を落とす。「横浜市都筑区」の「都」に当てないよう列挙して消す */
const dropPref = (a) => PREF_NAMES.reduce((s, p) => (s.startsWith(p) ? s.slice(p.length) : s), a).trim();

/**
 * 住所として使えるか。**掲載市と一致することを必ず確かめる**。
 * 別の市の住所を取り込む事故が過去に何度も起きている。
 */
function usableAddress(raw, f) {
  if (!raw) return null;
  let a = hanNum(raw).replace(/\s+/g, ' ').trim();
  // 「日本、〒231-0023 神奈川県…」の前置き
  a = a.replace(/^日本[、,]\s*/, '').replace(/^〒\s*[\d-]+\s*/, '');
  a = dropPref(a);
  if (a.length < 4 || a.length > 60) return null;
  // 記事の地の文が混ざったもの。過去に「】神田川会場…」のような崩れが出ている
  if (/[「」『』【】（）()。、！!？?…：:]/.test(a)) return null;
  if (/[ぁ-ん]{4,}/.test(a)) return null; // ひらがなが続くのは文章
  if (/より|ため|です|ます|周辺|付近|ほか|地内|など/.test(a)) return null;

  const city = f.area?.city ?? '';
  const ward = f.area?.ward ?? '';
  // 政令市は「横浜市都筑区…」。city には既に「横浜市都筑区」等が入っている場合もある
  const needles = [city, ward, city.replace(/市.+区$/, '市')].filter(Boolean);
  if (!needles.some((n) => a.includes(n))) return null;

  // 市名から始まるように整える（既存データの書き方に合わせる）
  const i = Math.min(...needles.map((n) => a.indexOf(n)).filter((x) => x >= 0));
  if (i > 0) a = a.slice(i);

  /**
   * 番地の後ろに建物名や説明が続いていることがある。
   *   「船橋市薬円台3丁目20-1 習志野駐屯地厚生センタ 内」
   *   「新潟市秋葉区新津本町3丁目3-26 にいつ0番線待合室来て基地」
   * 空白の前が数字で終わっていれば、そこまでが住所。
   * 「多摩市落合 パルテノン大通り」のように数字で終わらないものは町名の続きなので残す。
   */
  a = a.replace(/^(.*\d)\s+(?![~〜～])\S.*$/, '$1');

  // 市名だけ、区名だけは情報として薄いので入れない（「一宮市」で終わるもの）
  const tail = a.replace(new RegExp(`^(${needles.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`), '');
  if (tail.replace(/[\s-]/g, '').length < 2) return null;
  // 「新宿区2-9-2」のように町名が抜けているもの。出典の書き落としで、
  // このままでは別の場所を指してしまう
  if (/^\d/.test(tail)) return null;

  // 政令市の区だけで始まっているときは市名を足す（既存データの書き方に合わせる）
  if (ward && a.startsWith(ward) && city && !a.includes(city)) a = city + a;
  return a;
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * 記事の地の文から住所を拾う。
 *
 * **形を厳しく見ないと文章を住所にしてしまう。** 素朴に「市名＋続き」で拾うと
 *   「印西市大森にある六軒厳島神社の夏の祭礼が…」
 *   「茅ヶ崎市は6月5日」「津市合併20周年」「鈴鹿市駅から徒歩約5分」
 * を住所として取り込んでいた。そこで
 *   - 使える文字を漢字・カタカナ・数字・「の」「丁目」「番地」「号」に限る
 *     （ひらがなが入るのは地の文）
 *   - 末尾が番地らしいこと（数字・丁目・番地・号で終わる）
 *   - 年月日・徒歩・駅・周年などの語を含まない
 * を全部満たすものだけを候補にする。
 *
 * さらに**どの会場の住所か**が言えるものに限る:
 *   a) 直前に「住所」「所在地」の見出しがある
 *   b) 会場名の直後にある（「◯◯公園（印西市戸神1045）」）
 *   c) まとめ記事でなく、記事中で住所らしき文字列が 1 つだけ
 */
function addressFromText(text, f, { venueName, roundup }) {
  const t = hanNum(text);
  const needles = [f.area?.ward, f.area?.city, (f.area?.city ?? '').replace(/市.+区$/, '市')]
    .filter(Boolean);
  const BODY = '[一-鿿ァ-ヶー0-9の丁目番地号-]';
  const NG = /年|月|日|周年|徒歩|駅|歴史|時|分|円|以上|限定|以降|以内|番線|号線|号館|周辺|付近/;

  const cands = [];
  for (const n of needles) {
    for (const m of t.matchAll(new RegExp(`${esc(n)}${BODY}{2,25}`, 'g'))) {
      const v = m[0];
      if (NG.test(v.slice(n.length))) continue;
      if (!/(\d|丁目|番地|号)$/.test(v)) continue;
      if (!/\d/.test(v)) continue;
      cands.push({ v, i: m.index });
    }
  }
  if (!cands.length) return null;

  const pick = (c) => usableAddress(c.v, f);

  // a) 「住所：」「所在地：」の直後
  for (const c of cands) {
    if (/(住\s*所|所在地)[^\S\n]{0,3}[：:]?[^\S\n]{0,3}$/.test(t.slice(Math.max(0, c.i - 12), c.i))) {
      const a = pick(c);
      if (a) return a;
    }
  }
  // b) 会場名のすぐ後ろ
  if (venueName && venueName.length >= 3 && !/^.+[市区町村]内$/.test(venueName)) {
    const vi = t.indexOf(venueName);
    if (vi >= 0) {
      for (const c of cands) {
        if (c.i > vi && c.i - (vi + venueName.length) <= 40) {
          const a = pick(c);
          if (a) return a;
        }
      }
    }
  }
  // c) 候補が 1 種類だけならそれ。まとめ記事はどの祭りのものか決められない
  if (!roundup) {
    const uniq = [...new Set(cands.map((c) => c.v))];
    if (uniq.length === 1) return pick(cands[0]);
  }
  return null;
}

/**
 * 会場名にカッコ書きで住所が入っていることがある。
 * 「京都市立砂川小学校グラウンド（伏見区深草ケナサ町25-5）」
 * 取り込みのときに会場名ごと入れてしまっているので、ここで住所として取り出す。
 */
function addressFromVenueName(venueName, f) {
  if (!venueName) return null;
  // 閉じ括弧まで揃っているものだけ。取り込みで会場名が途中で切れていることがあり、
  // 「…（大阪市平野区長吉出戸5-3-5」を採ると番地を 1 桁落とす
  for (const m of venueName.matchAll(/[（(]([^）)]{5,40})[）)]/g)) {
    const a = usableAddress(m[1], f);
    if (a && /(\d|丁目|番地|号)$/.test(a)) return a;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 開催時刻
// ---------------------------------------------------------------------------

const HH = (h, m) => `${String(Number(h)).padStart(2, '0')}:${String(Number(m ?? 0)).padStart(2, '0')}`;

/**
 * 「午前10時から午後4時まで」「午後8時半」を 24 時制に直す。
 * **記事の 3 割弱がこの書き方**なので、直さないと時刻を落とすか、
 * 「午後4時～9時」を 4:00～9:00 と取り違える。
 */
function normalizeClock(seg) {
  return seg
    .replace(/(\d{1,2})\s*時\s*半/g, (_, h) => `${h}時30分`)
    .replace(/午前\s*(\d{1,2})\s*時/g, (_, h) => `${Number(h) === 12 ? 0 : Number(h)}時`)
    .replace(/午後\s*(\d{1,2})\s*時/g, (_, h) => `${Number(h) < 12 ? Number(h) + 12 : Number(h)}時`);
}

/** 「18時～20時30分」「15:30~20:00」「12時から21時まで」を {start,end} に */
function scanRange(rawSeg) {
  const seg = normalizeClock(rawSeg);
  // 「午後4時～9時」は終わりにも午後が掛かる。開始を午後に直した後だけ補う
  const pmStart = /午後/.test(rawSeg);
  const out = [];
  const push = (h1, m1, h2, m2) => {
    const a = Number(h1); let b = Number(h2);
    if (pmStart && a >= 12 && b < 12) b += 12;
    // 「25時」まで書く媒体は無い。深夜跨ぎ（22時～翌1時）は判断できないので捨てる
    if (a > 23 || b > 23 || a >= b) return;
    if (Number(m1 ?? 0) > 59 || Number(m2 ?? 0) > 59) return;
    out.push({ start: HH(h1, m1), end: HH(b, m2) });
  };
  for (const m of seg.matchAll(/(\d{1,2})\s*:\s*(\d{2})\s*~\s*(\d{1,2})\s*:\s*(\d{2})/g)) push(m[1], m[2], m[3], m[4]);
  for (const m of seg.matchAll(/(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?\s*~\s*(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?/g)) push(m[1], m[2], m[3], m[4]);
  for (const m of seg.matchAll(/(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?\s*から\s*(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?\s*まで/g)) push(m[1], m[2], m[3], m[4]);
  for (const m of seg.matchAll(/(\d{1,2})\s*:\s*(\d{2})\s*から\s*(\d{1,2})\s*:\s*(\d{2})\s*まで/g)) push(m[1], m[2], m[3], m[4]);
  return out;
}

/**
 * 開催時刻。**日付の直後**に書かれるので、既に持っている日付を手掛かりにする。
 * まとめ記事では同じ日付が何度も出て時刻が食い違う。そのときは入れない。
 */
function pickTime(text, dates) {
  const t = han(text);
  const cands = [];
  for (const d of dates) {
    const mm = Number(d.slice(5, 7)); const dd = Number(d.slice(8, 10));
    const re = new RegExp(`${mm}\\s*月\\s*${dd}\\s*日`, 'g');
    for (const m of t.matchAll(re)) {
      // 日付の後ろ 70 字。これ以上広げると次の祭りの時刻を拾い始める
      const seg = t.slice(m.index, m.index + 70);
      // 「雨天の場合は8月2日に順延」以降は開催時刻ではない
      const cut = seg.split(/雨天|順延|中止|予備|昨年|去年|受付|開場|問い合わせ|申込/)[0];
      const r = scanRange(cut);
      if (r.length) cands.push(r[0]);
    }
  }
  if (!cands.length) return null;
  const uniq = [...new Set(cands.map((c) => `${c.start}-${c.end}`))];
  // 食い違うなら分からないということ。推測しない
  if (uniq.length !== 1) return null;
  return cands[0];
}

// ---------------------------------------------------------------------------
// 主催
// ---------------------------------------------------------------------------

// 団体らしい語尾。ここに当たらないものは主催者名として採らない
const ORG_TAIL = /(町会|町内会|自治会|自治連合会|連合会|実行委員会|委員会|協議会|振興会|商店会|商店街|青年会|青年部|子ども会|こども会|保存会|奉賛会|同好会|神社|神宮|大社|寺|教会|組合|協会|連盟|クラブ|会館|センター|株式会社|有限会社|財団法人|社団法人|商工会|商工会議所|観光協会|振興組合|の会|会|部会|支部|市役所|区役所|町役場|村役場|市|区|町|村|大学|学校|病院|グループ|実行委)$/;

const ORG_NG = /^(者|様|側|する|による|により|の|は|が|を|に|で|と|も|・|、|など|この|その)/;

function pickOrganizerFull(text) {
  const t = text;
  const clean = (v) => v
    .replace(/^[：:\s　・]+/, '')
    .replace(/[（(].*$/, '')
    .replace(/[」』】]+$/, '')
    .trim();
  // 総称であって特定の団体を指していないもの
  const GENERIC = /^(町内会|自治会|各町会|地元|地域|有志|実行委員会|商店街|主催者)$/;
  const ok = (v) => v.length >= 3 && v.length <= 30
    && /[ぁ-んァ-ヶ一-鿿]/.test(v)
    && !ORG_NG.test(v)
    && !GENERIC.test(v)
    && !/主催|提供|写真|情報|詳細|最新|公式|発表|判断|確認/.test(v)
    // 「町内会や自治会」のように総称を並べただけのもの
    && !/(町内会|自治会|町会)[やと・](町内会|自治会|町会)/.test(v)
    // 地の文が頭に付いたもの。「今回で4回目を迎える三島自治会」
    // 「土蔵造りのある山町筋まちづくり協議会」を団体名にしていた
    && !/\d/.test(v)
    && !/迎え|開催|行わ|ある|いる|する|なる|よる|られ|くれ|など|そうで/.test(v)
    && ORG_TAIL.test(v);

  const cands = [];
  // 「主催：京橋一の部連合町会」「主催　西加瀬町内会」
  for (const m of t.matchAll(/主\s*催\s*[：:]?\s*([^\s、。／/]{2,30})/g)) cands.push(clean(m[1]));
  // 「主催は会津若松まちなか活性委員会です」
  for (const m of t.matchAll(/主\s*催\s*は\s*([^\s、。]{2,30}?)(?:です|で[、す]|が)/g)) cands.push(clean(m[1]));
  // 「◯◯主催による」「◯◯が主催する」
  for (const m of t.matchAll(/([^\s、。「」『』（）()]{3,25}?)(?:が|の)?主\s*催(?:による|の|する|で)/g)) cands.push(clean(m[1]));

  for (const c of cands) if (ok(c)) return c;
  return null;
}

// ---------------------------------------------------------------------------
// 公式リンク
// ---------------------------------------------------------------------------

// 主催者の公式ページではないもの
const LINK_NG_HOST = /(^|\.)(t\.co|twitter\.com|x\.com|tenki\.jp|tabelog\.com|google\.[a-z.]+|docs\.google\.com|goo\.gl|amazon\.co\.jp|rakuten\.co\.jp|youtube\.com|youtu\.be|jorudan\.co\.jp|navitime\.co\.jp|walkerplus\.com|jalan\.net|prtimes\.jp|note\.com|ameblo\.jp|line\.me|peatix\.com|eventbrite|wikipedia\.org)$/;
const MEDIA_HOST = /(goguynet\.jp|rarea\.events|tokyofesta\.com|maji\.tv)$/;
// 「公式サイト」「◯◯神社公式HP」のように書かれたリンクだけを採る
const LINK_OK_TEXT = /公式|オフィシャル|ホームページ|(^|[^A-Za-z])HP([^A-Za-z]|$)/;

function pickLinks(html) {
  const out = [];
  for (const m of html.matchAll(/<a\s[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/g)) {
    const url = m[1].replace(/&amp;/g, '&');
    const text = strip(m[2]);
    let host;
    try { host = new URL(url).host; } catch { continue; }
    if (MEDIA_HOST.test(host) || LINK_NG_HOST.test(host)) continue;
    if (!LINK_OK_TEXT.test(text)) continue;
    // Instagram / Facebook は投稿の permalink ではなくアカウントのページだけ
    if (/instagram\.com|facebook\.com/.test(host) && /\/p\/|\/posts\/|\/reel\//.test(url)) continue;
    // 計測用のパラメータは落とす。同じ URL が別物として溜まるのを防ぐ
    const clean = url.replace(/[?&](utm_[^=]+|fbclid|igsh|ref_src|ref_url)=[^&]*/g, '')
      .replace(/[?&]$/, '');
    if (out.some((x) => x.url === clean)) continue;
    // 詳細ページは {title,url} で出す（素の URL 文字列だと URL がそのまま表示される）
    // 記事の見出し記号や「〜はこちら」は題名ではないので落とす
    const title = text
      .replace(/^[・\-–—\s]+/, '')
      .replace(/^[【\[（(]|[】\]）)]$/g, '')
      // アンカーが複数行にまたがると煽り文まで入る
      // （「◯◯公式サイト 開催決定！8月30日」）。最初の一文だけにする
      .split(/[！!。]/)[0]
      .replace(/\s*(はこちら|こちら|より|はコチラ)\s*$/, '')
      .replace(/[、,。]+$/, '')
      .slice(0, 30)
      .trim();
    out.push({ title: title || clean, url: clean });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 実行
// ---------------------------------------------------------------------------

// 記事 HTML を id で引けるようにする
const articles = new Map(); // `${host}|${postId}` -> item
for (const file of readdirSync(RAW).filter((f) => f.endsWith('.json'))) {
  const j = JSON.parse(readFileSync(join(RAW, file), 'utf8'));
  for (const it of j.items) articles.set(`${j.host}|${it.id}`, it);
}
console.log(`記事 HTML ${articles.size} 件`);

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e.endsWith('.yml')) out.push(p);
  }
  return out;
}

const AUDIT = process.argv.includes('--audit');
// --audit organizer のように、確認したい項目だけに絞れる
const AUDIT_KEY = AUDIT ? arg('--audit', null) : null;

/** 抽出した値のまわりの記事本文を出す（目視確認だけに使う。データには入れない） */
function auditContext(text, ch, occ) {
  const t = han(text);
  const out = [];
  if (ch.occurrence?.start_time) {
    for (const d of occ?.dates ?? []) {
      const re = new RegExp(`${Number(d.slice(5, 7))}\\s*月\\s*${Number(d.slice(8, 10))}\\s*日`, 'g');
      for (const m of t.matchAll(re)) out.push(`時刻> …${t.slice(m.index, m.index + 70)}…`);
    }
  }
  if (ch.organizer) {
    const i = t.indexOf('主催');
    if (i >= 0) out.push(`主催> …${t.slice(Math.max(0, i - 20), i + 50)}…`);
  }
  return out.slice(0, 4);
}

const stat = { addr: 0, time: 0, org: 0, links: 0, latlng: 0, touched: 0, noArticle: 0 };
const samples = [];
let seen = 0;

for (const path of walk(join(ROOT, 'data', 'festivals'))) {
  const b = basename(path, '.yml');
  if (!/-(goguynet|rarea|tokyofesta)-\d+$/.test(b)) continue;
  const f = parse(readFileSync(path, 'utf8'));
  if (ONLY_ID && f.id !== ONLY_ID) continue;
  if (seen >= LIMIT) break;

  const src = f.occurrences?.[0]?.source_url;
  if (!src) continue;
  let host;
  try { host = new URL(src).host; } catch { continue; }
  const it = articles.get(`${host}|${b.match(/-(\d+)$/)[1]}`);
  if (!it) { stat.noArticle++; continue; }
  seen++;

  const text = strip(it.html);
  const embeds = mapEmbeds(it.html);
  const venueName = f.venue?.name ?? '';
  // 「◯◯市内」は取り込みが会場を取れなかったときの入れ物。会場名として照合しない
  const venueIsPlaceholder = /^.+[市区町村]内$/.test(venueName);

  /**
   * 記事に複数の地図があるのはまとめ記事。**会場名と一致する地図だけ**を使う。
   * 一致するものが無ければ、地図が 1 つのときだけ採る。
   */
  const nameMatches = (p) => {
    if (!p || venueIsPlaceholder || venueName.length < 3) return false;
    const a = han(p).replace(/\s/g, '');
    const v = han(venueName).replace(/\s/g, '');
    return a.includes(v) || v.includes(a)
      // 「都立汐入公園噴水広場周辺」対「都立汐入公園」のような部分一致
      || (v.length >= 4 && a.length >= 4 && (a.includes(v.slice(0, 4)) || v.includes(a.slice(0, 4))));
  };
  const matched = embeds.filter((e) => nameMatches(e.place) || nameMatches(e.address));
  const chosen = matched.length === 1 ? matched[0]
    : (embeds.length === 1 ? embeds[0] : null);

  /**
   * まとめ記事（「8月1日・2日の◯◯エリアイベントまとめ」）は 1 記事に
   * 複数の祭りが並ぶ。主催や公式リンクはどの祭りのものか決められないので採らない。
   * 地図が 3 つ以上あるのも実質まとめ記事。
   */
  const roundup = /まとめ|イベント情報|特集|一覧|ガイド|おでかけ情報|イベント5選|イベント3選/.test(strip(it.title))
    || embeds.length >= 3;

  const ch = {};

  // ---- 住所 ----
  // 強い順に見る。地図の埋め込み > 会場名のカッコ書き > 本文の「住所：」 > 地の文
  if (!f.venue?.address) {
    const addr = usableAddress(chosen?.address, f)
      ?? addressFromVenueName(venueName, f)
      ?? usableAddress(
        (text.match(/(?:住\s*所|所在地)\s*[：:]?\s*([^\s、。]{5,50})/) ?? [])[1], f,
      )
      ?? addressFromText(text, f, { venueName, roundup });
    if (addr) { ch.venue = { ...(ch.venue ?? {}), address: addr }; stat.addr++; }
  }

  // ---- 緯度経度（地図の埋め込みにしか無い。会場名が一致したものだけ）----
  if (f.venue?.lat == null && chosen?.lat != null && matched.length === 1) {
    const { lat, lng } = chosen;
    // 日本の範囲。桁を取り違えたものを弾く
    if (lat > 24 && lat < 46 && lng > 122 && lng < 154) {
      ch.venue = { ...(ch.venue ?? {}), lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
      stat.latlng++;
    }
  }

  // ---- 開催時刻 ----
  const occ = f.occurrences?.[0];
  if (occ && !occ.start_time && (occ.dates ?? []).length) {
    const r = pickTime(text, occ.dates);
    if (r) {
      ch.occurrence = { year: occ.year, start_time: r.start, end_time: r.end };
      stat.time++;
    }
  }

  // ---- 主催 ----
  if (!f.organizer && !roundup) {
    const org = pickOrganizerFull(text);
    if (org) { ch.organizer = org; stat.org++; }
  }

  // ---- 公式リンク ----
  // 1 記事から大量に採らない。まとめ記事で他の祭りの公式サイトが混ざる
  const found = roundup ? [] : pickLinks(it.html).slice(0, 2);
  if (found.length) {
    /**
     * 既存の links には**素の URL 文字列と {title,url} が混ざっている**。
     * URL で突き合わせ、こちらが拾い直したものは題名つきに差し替える。
     * 追加だけだと同じ URL が 2 通りの形で並んでしまう。
     */
    const urlOf = (l) => (typeof l === 'string' ? l : l?.url);
    const mine = new Map(found.map((l) => [l.url, l]));
    const merged = (f.links ?? []).map((l) => mine.get(urlOf(l)) ?? l);
    const haveUrls = new Set(merged.map(urlOf));
    const added = found.filter((l) => !haveUrls.has(l.url));
    const next = [...merged, ...added];
    // 中身で比べる。参照で比べると毎回「変わった」ことになり、
    // 何度流しても差分が出続ける
    if (JSON.stringify(next) !== JSON.stringify(f.links ?? [])) {
      ch.links_set = next;
      stat.links++;
    }
  }

  if (!Object.keys(ch).length) continue;
  stat.touched++;
  if (samples.length < 2000) {
    samples.push({
      id: f.id, name: f.name, city: f.area.city, venue: venueName, ch, url: src,
      // 目視確認用。抽出値のまわりの地の文（保存はしない）
      ctx: AUDIT ? auditContext(text, ch, occ) : null,
    });
  }
  if (VERBOSE) console.log(`  ${f.id} ${JSON.stringify(ch)}`);
  if (APPLY) patch(f.id, ch);
}

console.log(`\n対象 ${seen} 件（記事 HTML なし ${stat.noArticle} 件）`);
console.log(`  住所      ${stat.addr}`);
console.log(`  緯度経度  ${stat.latlng}`);
console.log(`  開催時刻  ${stat.time}`);
console.log(`  主催      ${stat.org}`);
console.log(`  リンク    ${stat.links}`);
console.log(`  更新した祭り ${stat.touched} 件${APPLY ? '' : '（--apply を付けると実際に書き込む）'}`);

if (!APPLY) {
  console.log('\n--- 抜き出し例 ---');
  // --audit のときは無作為に並べ替えて出す（偏りなく目視できるように）
  const list = AUDIT
    ? samples.filter((s) => (AUDIT_KEY ? AUDIT_KEY in s.ch : true))
      .sort((a, b) => (a.id < b.id ? -1 : 1))
      .filter((_, i) => i % Math.max(1, Math.floor(samples.length / 60)) === 0)
    : samples.slice(0, 15);
  for (const s of list.slice(0, AUDIT ? 60 : 15)) {
    console.log(`${s.city} ${s.name}（会場: ${s.venue}）`);
    console.log(`  ${JSON.stringify(s.ch)}`);
    for (const c of s.ctx ?? []) console.log(`    ${c}`);
    if (AUDIT) console.log(`    ${s.url}`);
  }
}
