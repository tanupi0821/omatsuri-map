/**
 * 名鑑（news.gotouti.jp）経由で集めた地域メディアの記事 → 祭りデータ
 *
 *   node scripts/import/gotouti.mjs
 *
 * 号外NET・レアリア・つーしん系と同じ形の WordPress 記事なので、
 * 名前・日付・会場の取り出しは `_article.mjs` をそのまま使う。
 *
 * **この入口の強みは市区町村の判定**。名鑑が媒体ごとに「行政区域」を
 * 県名つきの市区町村名で持っている（「千葉県山武市・千葉県東金市」）ので、
 * 題名や本文から市名を推測する必要がない。
 *
 *  - 媒体の守備範囲が 1 市なら、その市に決まる
 *  - 複数市なら、**題名 → 本文の頭**の順に市名を探す。見つからなければ捨てる。
 *    ここで適当に 1 つ目を選ぶと、同じ記事が別の市の祭りとして入ってしまう
 *  - 行政区域が県までしか無い媒体（「静岡県」だけ）は市が決められないので使わない
 *
 * 出典の格は media。主催者の公式が見つかったら enrich で格上げする。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emit, ROOT } from './_lib.mjs';
import { loadAreaList } from '../lib/areas.mjs';
import { byName, PREFS } from '../lib/prefs.mjs';
import { citySlug } from '../lib/romaji.mjs';
import { writeNationwideAreas } from './_nationwide.mjs';
import {
  IS_FESTIVAL, NOT_FESTIVAL, KIND, hasStalls, pickDates, pickVenue, pickName, usableName,
} from './_article.mjs';
import { buildGazetteer, GAZETTEER, citiesIn } from './_gazetteer.mjs';

const CHECKED = '2026-08-06';
const RAW = join(ROOT, 'data', 'raw', 'gotouti', 'media');
// REST が塞がっている媒体は RSS から取っている（`crawl/gotouti-rss.mjs`）。
// 出力の形は media/ と同じにしてあるので、同じ処理で読める
const RAW_RSS = join(ROOT, 'data', 'raw', 'gotouti', 'rss');

if (!existsSync(RAW)) {
  console.error('data/raw/gotouti/media がない。先に scripts/crawl/gotouti-media.mjs を回すこと');
  process.exit(1);
}

const PREF_NAMES = PREFS.map((p) => p.name);

// ---------------------------------------------------------------------------
// エリア解決（goguynet と同じ考え方）
// ---------------------------------------------------------------------------

const byCity = new Map();
const add = (name, rec) => {
  if (!byCity.has(name)) byCity.set(name, []);
  byCity.get(name).push(rec);
};
for (const a of loadAreaList(ROOT)) {
  add(a.city, { pref: a.pref, city: a.city, citySlug: a.slug });
  for (const w of a.wards ?? []) {
    add(w.name, { pref: a.pref, city: a.city, citySlug: a.slug, ward: w.name, wardSlug: w.slug });
  }
}

const generated = new Map();
const seq = new Map();

/**
 * 市区町村名 → エリア定義。
 *
 * **同じ県に同名の候補が複数あるとき**、以前は null を返して create() に流していた。
 * ところが create() は byCity に足すので、次の記事でも候補が増えて null のまま
 * になり、**同じ市に slug が次々と作られる**。実際に多摩市の同じ記事が
 * tokyo-702 と tokyo-704 の 2 か所に登録された。
 * 指している場所が同じ（市＋区が同じ）なら 1 つにまとめて先頭を使う。
 * 本当に別の場所（横浜市緑区と相模原市緑区のような同名の区）なら null のまま。
 */
function lookup(city, pref) {
  const cands = (byCity.get(city) ?? []).filter((a) => !pref || a.pref === pref);
  if (!cands.length) return null;
  const uniq = [...new Map(cands.map((a) => [`${a.city}|${a.ward ?? ''}`, a])).values()];
  return uniq.length === 1 ? uniq[0] : null;
}

function create(city, pref) {
  if (!/[市区町村]$/.test(city)) return null;
  // 既にこの県で登録済みの名前なら作らない（上記の暴走を止める最後の砦）
  if ((byCity.get(city) ?? []).some((a) => a.pref === pref)) return null;
  const p = byName(pref);
  if (!p) return null;
  const used = new Set([...byCity.values()].flat().map((r) => r.citySlug));
  let slug = citySlug(city);
  if (!slug || used.has(slug)) {
    do {
      const n = (seq.get(p.slug) ?? 0) + 1;
      seq.set(p.slug, n);
      slug = `${p.slug}-${String(700 + n).padStart(3, '0')}`;
    } while (used.has(slug));
  }
  const rec = { pref: p.name, city, citySlug: slug };
  add(city, rec);
  if (!generated.has(p.slug)) generated.set(p.slug, { pref: p.name, cities: [] });
  generated.get(p.slug).cities.push({ name: city, slug });
  return rec;
}

/**
 * 名鑑の「行政区域」1 つを {pref, city} に割る。
 *   「千葉県山武市」        → 千葉県 / 山武市
 *   「千葉県山武郡横芝光町」→ 千葉県 / 横芝光町（郡は落とす）
 *   「神戸市長田区」        → 兵庫県 / 神戸市長田区（政令市は区まで）
 *   「静岡県東部」          → 市が決まらないので null
 */
function parseArea(raw) {
  const pref = PREF_NAMES.find((p) => raw.startsWith(p));
  if (!pref) return null;
  let rest = raw.slice(pref.length).replace(/[（(].*$/, '').trim();
  if (!rest) return { pref, city: null };
  // 郡は行政区画だが住所の一部でしかない。市区町村名だけにする
  rest = rest.replace(/^.+?郡/, '');
  const m = rest.match(/^(.+?[市区町村])/);
  if (!m) return { pref, city: null };
  let city = m[1];
  // 政令市は「大阪市西淀川区」まで見る（区ごとにデータを分けてあるため）
  const w = rest.slice(city.length).match(/^(.+?区)/);
  if (w && /市$/.test(city)) city = { city, ward: w[1] };
  return { pref, city };
}

/** 媒体の守備範囲を {pref, city, ward} の配列にする */
function coverage(areas) {
  const out = [];
  for (const a of areas) {
    const p = parseArea(a);
    if (!p?.city) continue;
    if (typeof p.city === 'string') out.push({ pref: p.pref, name: p.city, full: p.city });
    else out.push({ pref: p.pref, name: p.city.ward, full: p.city.city + p.city.ward, cityOnly: p.city.city });
  }
  // 同じ市が何度も出るのを落とす
  const seen = new Set();
  return out.filter((x) => (seen.has(x.full) ? false : (seen.add(x.full), true)));
}

/**
 * 市区町村の辞書（県 → 市区町村名の集合）は `_gazetteer.mjs` に切り出した。
 * 号外NET の取り込みでも同じ辞書が要る（版の名前と実際の市町村が違う問題）。
 *
 * **行政区域が「群馬県」までしか無い媒体が 59 あり、そこに 562 記事ある。**
 * しかも北関東・山形・鳥取・宮崎・福井といった、このサイトがいちばん薄い県ばかり。
 * 市が決められないという理由で捨てていたが、**題名に市名が出ていれば決まる**。
 */
buildGazetteer(ROOT);

/**
 * 県だけしか分からない媒体で、題名から市区町村を決める。
 * **本文ではなく題名だけを見る**（本文には近隣の市の名前も出るため）。
 * 2 文字の地名（原村など）は誤爆しやすいので使わない。
 */
function cityFromTitle(title, prefs) {
  const hits = [];
  for (const pref of prefs) {
    for (const c of GAZETTEER.get(pref) ?? []) {
      if (c.length < 3) continue;
      if (title.includes(c)) hits.push({ pref, name: c, full: c });
    }
  }
  if (!hits.length) return null;
  // 「つくば市」と「つくばみらい市」が両方当たることがある。長い方だけ残す
  const longest = hits.filter((h) => !hits.some((o) => o !== h && o.full.includes(h.full)));
  return longest.length === 1 ? longest[0] : null;
}

/** 実在の市区町村名か（辞書の全県ぶんを串刺しで見る） */
const ALL_CITIES = new Set([...GAZETTEER.values()].flatMap((s2) => [...s2]));
const isRealCity = (c) => ALL_CITIES.has(c);

/**
 * 本文の「住所：◯◯県△△市…」が掲載市と違うなら、その記事は別の市の祭り。
 * 「くりこま夜市マーケット（住所：宮城県栗原市…）」を登米市に入れていた。
 */
function otherCityInBody(body, own, name) {
  const m = body.match(/住\s*所\s*[：:]?\s*([^\s、。]{6,40})/);
  if (!m) return false;
  const pref = PREF_NAMES.find((p) => m[1].includes(p));
  if (!pref) return false;
  const rest = m[1].slice(m[1].indexOf(pref) + pref.length);
  const c = (rest.match(/^(.+?[市区町村])/) ?? [])[1];
  if (!c || !isRealCity(c)) return false;
  return c !== own && c !== name && !own.includes(c);
}

/** 守備範囲の 1 件をエリア定義に結びつける */
function resolve(cov) {
  // 政令市の区は区名で引く（横浜市・川崎市・大阪市などは area ファイルに区がある）
  const asWard = lookup(cov.name, cov.pref);
  if (asWard) return asWard;
  // area ファイルに無い政令市の区は「神戸市長田区」という 1 つの市として登録する
  //（つーしん系の取り込みと同じ扱い。あとで区に割り直せる）
  const key = cov.cityOnly ? cov.full : cov.name;
  const asCity = lookup(key, cov.pref);
  if (asCity) return asCity;
  return create(key, cov.pref);
}

// ---------------------------------------------------------------------------
// 時刻・住所・主催（記事から取れるものは取り込み時に入れておく）
// ---------------------------------------------------------------------------

const han = (s) => s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
const HH = (h, m) => `${String(Number(h)).padStart(2, '0')}:${String(Number(m ?? 0)).padStart(2, '0')}`;

/** enrich/article-refill.mjs と同じ直し方。「午後4時～9時」を 4:00 と読まないため */
function normalizeClock(seg) {
  return seg
    .replace(/(\d{1,2})\s*時\s*半/g, (_, h) => `${h}時30分`)
    .replace(/午前\s*(\d{1,2})\s*時/g, (_, h) => `${Number(h) === 12 ? 0 : Number(h)}時`)
    .replace(/午後\s*(\d{1,2})\s*時/g, (_, h) => `${Number(h) < 12 ? Number(h) + 12 : Number(h)}時`);
}

function scanRange(rawSeg) {
  const seg = normalizeClock(han(rawSeg)).replace(/[〜～]/g, '~');
  const pm = /午後/.test(rawSeg);
  const out = [];
  const push = (h1, m1, h2, m2) => {
    const a = Number(h1); let b = Number(h2);
    if (pm && a >= 12 && b < 12) b += 12;
    if (a > 23 || b > 23 || a >= b) return;
    if (Number(m1 ?? 0) > 59 || Number(m2 ?? 0) > 59) return;
    out.push({ start: HH(h1, m1), end: HH(b, m2) });
  };
  for (const m of seg.matchAll(/(\d{1,2})\s*:\s*(\d{2})\s*~\s*(\d{1,2})\s*:\s*(\d{2})/g)) push(m[1], m[2], m[3], m[4]);
  for (const m of seg.matchAll(/(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?\s*~\s*(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?/g)) push(m[1], m[2], m[3], m[4]);
  for (const m of seg.matchAll(/(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?\s*から\s*(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?\s*まで/g)) push(m[1], m[2], m[3], m[4]);
  return out;
}

/** 日付の直後 70 字から時刻を取る。**候補が食い違ったら入れない**（まとめ記事対策） */
function pickTime(text, dates) {
  const t = han(text);
  const cands = [];
  for (const d of dates) {
    const mm = Number(d.slice(5, 7)); const dd = Number(d.slice(8, 10));
    for (const m of t.matchAll(new RegExp(`${mm}\\s*月\\s*${dd}\\s*日`, 'g'))) {
      const seg = t.slice(m.index, m.index + 70)
        .split(/雨天|順延|中止|予備|昨年|去年|受付|開場|問い合わせ|申込/)[0];
      const r = scanRange(seg);
      if (r.length) cands.push(r[0]);
    }
  }
  // 「時間：18:00〜21:00」のラベル付きが本文にあればそれも見る
  for (const m of t.matchAll(/(?:時\s*間|開催時間|時刻)\s*[：:]\s*([^\s、。]{4,30})/g)) {
    const r = scanRange(m[1]);
    if (r.length) cands.push(r[0]);
  }
  if (!cands.length) return null;
  const u = [...new Set(cands.map((c) => `${c.start}-${c.end}`))];
  return u.length === 1 ? cands[0] : null;
}

/**
 * 住所。**掲載市区町村と突き合わせないと地の文を住所にしてしまう**
 * （「印西市大森にある六軒厳島神社の…」を住所にしていた例がある）。
 */
function pickAddress(body, pref, cityName) {
  const pats = [
    /住所は[、,]?\s*(.{6,60}?)\s*です[。、]?/,
    /[［\[]住所[］\]]\s*([^\s、。\n]{6,60})/,
    /住\s*所\s*[:：]\s*([^\s、。\n]{6,60})/,
    /所在地\s*[:：]\s*([^\s、。\n]{6,60})/,
  ];
  for (const re of pats) {
    const m = body.match(re);
    if (!m) continue;
    const a = m[1].replace(/〒?\d{3}-?\d{4}\s*/, '').replace(/です[。、]?$/, '').trim();
    if (!a.startsWith(pref)) continue;
    const rest = a.slice(pref.length);
    if (!rest.startsWith(cityName)) continue; // 別の市の住所は入れない
    const tail = rest.slice(cityName.length).trim();
    // 末尾が番地らしいものだけ。これが無いと「◯◯市は6月5日」を住所にする
    if (!/[0-9０-９]/.test(tail)) continue;
    return tail || null;
  }
  return null;
}

const ORG_TAIL = /(町会|町内会|自治会|連合会|実行委員会|委員会|協議会|振興会|商店会|商店街|青年会|子ども会|こども会|保存会|奉賛会|神社|神宮|大社|寺|組合|協会|連盟|商工会|商工会議所|観光協会|振興組合|の会|部会|支部|実行委)$/;

function pickOrganizer(body) {
  for (const m of body.matchAll(/主\s*催\s*[：:は]?\s*([^\s、。（(]{3,30})/g)) {
    const v = m[1].replace(/[」』】]+$/, '').trim();
    if (!/[ぁ-んァ-ヶ一-鿿]/.test(v)) continue;
    if (/^(者|様|側|する|による|により|後援|協力|の|は|が|を|に|で|と|も)/.test(v)) continue;
    if (ORG_TAIL.test(v)) return v;
  }
  return null;
}

// ---------------------------------------------------------------------------

/**
 * 記事本文が祭りの告知でないものを落とす。
 * `_article.mjs` の NOT_FESTIVAL に加えて、この入口で実際に混ざったものを足す。
 */
// 後半（ビアホール〜）は店の企画。「納涼ビアホール」「流しそうめん大会」は地域の祭りではない
const NOT_FESTIVAL_EXTRA = /マラソン|駅伝|清掃|イルミネーション|カラオケ|ライブ|物産展|献血|講演|セミナー|説明会|表彰|選挙|募集|求人|クーポン|プレゼントキャンペーン|福袋|初売り|婚活|献花|追悼|慰霊祭|供養|法要|プロ野球|ボートレース|競馬|パチンコ|閉館|リニューアル|ビアホール|ビアガーデン|流しそうめん|ファッションショー|大学祭|学園祭|名大祭|学祭|ビュッフェ|バイキング|フリーマーケット|マルシェ|体験会|ベイブレード|クルーズ|チケット|観覧席|募金|キックオフ|前夜祭の|企画展|謎解き|eスポーツ|婚礼/;

/**
 * 「国立市内の盆踊り」「名古屋駅前・レジャック跡地で盆踊り」のように、
 * **まとめ記事の見出しをそのまま名前にしてしまったもの**を落とす。
 * どの祭りを指すのか決まらないので、載せると利用者が現地に行けない。
 */
const ROUNDUP_NAME = /[市区町村]内(の|で)|情報まとめ|まとめ$|一覧$|[はがで]\s*(盆踊り|夏祭り|夏まつり|縁日)$|特集/;

/**
 * 名前として使えない切れ端を落とす。**ここは全部このデータで実際に出たもの**。
 *
 *   「/23（土）24（日）浦安市堀江・久助稲荷神社にて久助稲荷大祭」 日付ごと切り出した
 *   「までです。 住吉神社例大祭期間中（7/14」                     文の途中
 *   「”のぼり”がお祭りを感じさせますね」                          地の文
 *   「おんまくってどんな祭り？」                                  見出しの問いかけ
 *   「㈯夏まつり」「・花火大会」「【第32回まほろば夏まつり」        記号から始まる
 */
function brokenName(n) {
  if (/^[^ぁ-んァ-ヶ一-鿿A-Za-z0-9]/.test(n)) return true;      // 記号・スラッシュ始まり
  if (/[。？?！!、]/.test(n)) return true;                        // 文が混ざっている
  if (/[【（(「][^】）)」]*$/.test(n)) return true;               // 括弧が閉じていない
  if (/[】）)」]/.test(n) && !/[【（(「]/.test(n)) return true;   // 閉じ括弧だけ
  if (/にて|期間中|ですね|でしょう|しましょう|おどろう|どんな|について|とは$/.test(n)) return true;
  if (/^(ピカチュウ|AIフォト)/.test(n)) return true;              // 見出しの飾り
  // 絵文字が入る題名は本文の呼びかけ（「富山最大のお祭り🪅楽しいな」）
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u.test(n)) return true;
  // 「…楽しいな」「…だね」のような口語で終わるものは祭りの名前ではない
  if (/(いな|しいな|だね|ですね|かな)$/.test(n)) return true;
  // 「明日は戸田橋花火大会」のように、いつの話かを頭に付けた見出し
  if (/^(明日|今日|本日|来週|今週|昨日|先週|きょう|あす)/.test(n)) return true;
  // 「宮城県北エリア【７月開催】花火大会」はまとめ記事の見出し
  if (/エリア|【|】/.test(n)) return true;
  // 「高槻の北部からみた大阪天満宮の天神祭り」「交野市最大の夏祭り」のような
  // 記事の言い回し。祭りの名前ではない
  if (/からみた|から見た|最大の|話題の|人気の|注目の|恒例の|おすすめ|特集|レポート/.test(n)) return true;
  // 「長岡まつり大花火大会休憩所」は祭りそのものではなく付帯設備
  if (/休憩所|観覧席|駐車場|臨時列車|交通規制|通行止/.test(n)) return true;
  // 「群馬・前橋市の8神社と前橋花火大会」のような、県名から始まる記事の見出し
  if (/^(北海道|青森|岩手|宮城|秋田|山形|福島|茨城|栃木|群馬|埼玉|千葉|東京|神奈川|新潟|富山|石川|福井|山梨|長野|岐阜|静岡|愛知|三重|滋賀|京都|大阪|兵庫|奈良|和歌山|鳥取|島根|岡山|広島|山口|徳島|香川|愛媛|高知|福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄)[・･]/.test(n)) return true;
  if (/[市区町村]の\d/.test(n)) return true;
  // 「お祭りイベント」「夏のイベント」のような総称
  if (/^(お?祭り|夏|春|秋|冬)の?(イベント|行事|情報)$/.test(n)) return true;
  if (/[㈪-㈰㊊-㊐]/.test(n)) return true;                        // 丸囲みの曜日
  return false;
}

/**
 * 商業施設・店舗の集客企画。地域の祭りではない。
 * 「イオンモール富谷 納涼祭」「Suicaのペンギン夏まつり」「そよら金剛 誕生祭」など。
 */
const COMMERCIAL = /イオンモール|イオンスタイル|アリオ|ららぽーと|イトーヨーカ|ドン・?キホーテ|パルコ|ルミネ|アトレ|エキュート|三井アウトレット|プレミアム・?アウトレット|コストコ|Suicaのペンギン|そよら|周年記念|誕生祭|感謝祭|リゾート|ホテル|パインアメ|モデルハウス|住宅展示場|展示場|営業所|オープン記念|周年祭|蜒の市/;

/**
 * まとめ記事か。**1 記事に祭りが 3 つ以上並ぶと、日付・時刻・会場が混ざる**。
 * ばらばらの日付が 4 つ以上出るものはまとめ記事とみなして丸ごと捨てる
 * （1 件目の会場を全部に付けるより、落とすほうがまし）。
 */
function isRoundup(body) {
  const t = han(body.slice(0, 2500));
  const days = new Set([...t.matchAll(/(\d{1,2})月\s*(\d{1,2})日/g)].map((m) => `${m[1]}/${m[2]}`));
  return days.size >= 4;
}

/**
 * 日付が離れすぎているものは読み違い（「7月18日…8月31日」を 1 つの祭りにしていた）。
 * 先頭から 14 日以内のものだけ残す。連日開催の祭りはこの幅に収まる。
 */
function tightenDates(dates) {
  const sorted = [...dates].sort();
  const t0 = new Date(sorted[0]).getTime();
  return sorted.filter((d) => (new Date(d).getTime() - t0) / 86400000 <= 14);
}

const rowsByArea = new Map();
let noCity = 0; let noDate = 0; let notFestival = 0; let ambiguous = 0;
let otherCity = 0; let roundup = 0;
let usedMedia = 0; let skippedMedia = 0;
const skipReasons = new Map();
const perMedia = new Map();

const corpora = [
  ...readdirSync(RAW).filter((f) => f.endsWith('.json')).map((f) => join(RAW, f)),
  ...(existsSync(RAW_RSS) ? readdirSync(RAW_RSS).filter((f) => f.endsWith('.json')).map((f) => join(RAW_RSS, f)) : []),
];
for (const file of corpora) {
  const j = JSON.parse(readFileSync(file, 'utf8'));
  if (j.skipped) {
    skippedMedia++;
    const key = j.skipped.replace(/\(.*\)/, '(…)').replace(/（.*）/, '（…）');
    skipReasons.set(key, (skipReasons.get(key) ?? 0) + 1);
    continue;
  }
  if (!j.items?.length) continue;

  const cov = coverage(j.areas ?? []);
  /**
   * 行政区域が県までしかない媒体は、**題名に市名が出ている記事だけ**を使う。
   * 4 県以上をまたぐ媒体は誤りやすいので使わない。
   */
  const wide = !cov.length && (j.prefs ?? []).length >= 1 && (j.prefs ?? []).length <= 3;
  if (!cov.length && !wide) { skipReasons.set('行政区域が県までしか無い', (skipReasons.get('行政区域が県までしか無い') ?? 0) + 1); continue; }
  // 守備範囲が広すぎる媒体は市の判定を誤りやすい（県内全市など）
  if (cov.length > 12) { skipReasons.set('守備範囲が広すぎる（13市以上）', (skipReasons.get('守備範囲が広すぎる（13市以上）') ?? 0) + 1); continue; }

  const hostKey = j.host.replace(/\.(co\.)?(jp|com|net|org|info|tokyo|link|life|city|work)$/, '').replace(/[^a-z0-9-]/gi, '-');
  let n = 0;

  for (const it of j.items) {
    // --- 市区町村を決める ---
    let hit = null;
    if (wide) {
      hit = cityFromTitle(it.title, j.prefs ?? []);
    } else if (cov.length === 1) {
      hit = cov[0];
    } else {
      /**
       * 守備範囲が複数市の媒体は、**どの市の名前がいちばん出てくるか**で決める。
       * 題名は 3 倍、本文の頭 600 字は 1 倍。号外NET の版名を覆すのと同じ数え方
       * （`_gazetteer.mjs` の `actualCity`）。
       *
       * 以前は「題名にちょうど 1 つ出ていること」を条件にしていたが、
       * それだと 903 記事が「市が絞れない」で落ちていた。市名は本文の
       * 会場や住所の側に書かれることが多い。
       *
       * **1 位が 2 位と同点なら捨てる。** 隣り合う 2 市を並べて書く記事
       * （「松戸市と柏市の夏祭り」）は、どちらの祭りか決められない。
       */
      const head = it.body.slice(0, 600);
      const countOf = (text, w) => {
        let n = 0; let i = text.indexOf(w);
        while (i >= 0) { n++; i = text.indexOf(w, i + w.length); }
        return n;
      };
      const scored = cov.map((c) => {
        // 「川崎市中原区」は「中原区」とも「川崎市中原区」とも書かれる。長い方を先に数える
        const keys = [...new Set([c.full, c.name])].sort((a, b) => b.length - a.length);
        const stem = (k) => k.replace(/[市区町村]$/, '');
        const score = keys.reduce(
          (acc, k) => acc + 3 * countOf(it.title, stem(k)) + countOf(head, stem(k)),
          0,
        );
        return { c, score };
      }).sort((a, b) => b.score - a.score);
      if (scored[0].score >= 3 && scored[0].score > (scored[1]?.score ?? 0)) hit = scored[0].c;
    }
    if (!hit) { ambiguous++; continue; }
    const area = resolve(hit);
    if (!area) { noCity++; continue; }

    /**
     * **地域メディアは隣の市の祭りも記事にする**。船橋つうしんの
     * 「市川市民納涼花火大会」を船橋市の祭りとして入れていた。
     * 題名に実在する別の市区町村名が出ていて、自分の市の名前が出ていなければ捨てる。
     */
    const own = hit.full;
    // **辞書全体で見る**。byCity（既に登録済みの市）だけだと、まだ載せたことの
    // 無い市の名前が素通りする。登米市の媒体に栗原市・一関市の祭りが入っていた
    const others = citiesIn(it.title)
      .filter((c) => c !== hit.name && c !== own && !own.includes(c));
    if (others.length && !it.title.includes(hit.name)) { otherCity++; continue; }
    // 本文の住所が別の市を指しているものも捨てる（題名に市名が出ないことがある）
    if (otherCityInBody(it.body, own, hit.name)) { otherCity++; continue; }

    // まとめ記事は日付・時刻・会場が混ざるので丸ごと捨てる
    if (isRoundup(it.body)) { roundup++; continue; }

    // --- 祭りかどうか ---
    const name = pickName(it.body, it.title);
    if (!usableName(name) || !IS_FESTIVAL.test(name) || NOT_FESTIVAL.test(name)) { notFestival++; continue; }
    if (NOT_FESTIVAL_EXTRA.test(name) || ROUNDUP_NAME.test(name)) { notFestival++; continue; }
    if (brokenName(name) || COMMERCIAL.test(name)) { notFestival++; continue; }
    // 店舗の集客企画。商店街・町内会・神社のものは残す
    if (/来店|ご来店|店舗限定|開店記念|新装開店/.test(it.body)
      && !/商店街|町内会|自治会|神社|公園|小学校|中学校|八幡|稲荷/.test(name + it.body.slice(0, 200))) {
      notFestival++; continue;
    }

    // --- 日付 ---
    const raw = pickDates(it.body, it.title, it.date);
    if (!raw.length) { noDate++; continue; }
    const dates = tightenDates(raw);
    const year = Number(dates[0].slice(0, 4));
    if (dates.some((d) => Number(d.slice(0, 4)) !== year)) { noDate++; continue; }
    // 記事の掲載日より 1 年以上先／2 年以上前は読み違い
    // 記事は 2026-03 以降のものしか取っていない。2025 年の日付は回顧の文を拾ったもの
    if (year < 2026 || year > 2027) { noDate++; continue; }

    // 会場に括弧が開いたまま残ることがある（「…ふれあい広場（玉川3-24-16先」）
    /**
     * 会場に題名の【】や括弧の片割れが残ることがある（「】一関市大町ほか」）。
     * また記事の見出し（「MAP」「マップ＆出店リスト」「北側道路通行止め」）を
     * 会場として拾ってしまう。場所を指していないものは会場にしない。
     */
    const VENUE_NG = /^(MAP|マップ|地図|会場|アクセス|出店|屋台|日時|時間|入り|注意|備考)|マップ|出店リスト|通行止|交通規制|お問い合わせ|詳細|一覧$/i;
    const rawVenue = pickVenue(it.body)
      ?.replace(/[（(][^）)]*$/, '')
      .replace(/^[】）)」』\]／\/・]+/, '')
      .replace(/[【（(「『\[]+$/, '')
      .trim() || null;
    const venue = rawVenue && !VENUE_NG.test(rawVenue) && rawVenue.length >= 2 ? rawVenue : null;
    const t = pickTime(it.body, dates);
    const cityLabel = area.ward ? area.ward : area.city;
    // 住所は「千葉県船橋市西習志野1-47-1」の形。政令市は区まで突き合わせる
    const address = pickAddress(it.body, area.pref, area.ward ? area.city + area.ward : area.city);

    /**
     * **会場名に別の市の名前が入っていたら捨てる。**
     * 宮崎県のみを守備範囲とする媒体の「西都夏まつり（西都市中心市街地）」を
     * 宮崎市の祭りとして入れていた。題名に市名が出ないぶん、会場で気づける。
     */
    const vc = citiesIn(venue).find((c) => c !== cityLabel && c !== area.city && !area.city.includes(c));
    if (vc) { otherCity++; continue; }

    /**
     * **祭りの名前そのものがいちばん強い手がかり。**
     * 「高崎前橋経済新聞」の記事から「前橋花火大会」を取り出して高崎市に
     * 入れていた。名前に別の市の地名（「前橋」「大阪天満宮」の「大阪」）が
     * 入っていて、それが掲載市と違うなら、その記事はここの祭りではない。
     *
     * 名前は「◯◯市」と書かずに地名だけで書かれる（「前橋花火大会」）ので、
     * 市区町村名から市／区／町／村を落とした形で照合する。
     */
    const nameStem = (c) => c.replace(/[市区町村]$/, '').replace(/^.+?郡/, '');
    const ownStems = new Set([cityLabel, area.city].filter(Boolean).map(nameStem));
    const foreign = [...(GAZETTEER.get(area.pref) ?? [])]
      .map(nameStem)
      // 2 文字未満の地名は普通の言葉と衝突する（「南」「原」）
      .filter((st) => st.length >= 2 && !ownStems.has(st) && ![...ownStems].some((o) => o.includes(st) || st.includes(o)))
      .find((st) => name.includes(st));
    if (foreign) { otherCity++; continue; }

    const key = `${area.pref}|${area.citySlug}|${area.wardSlug ?? ''}`;
    if (!rowsByArea.has(key)) rowsByArea.set(key, { area, rows: [] });
    rowsByArea.get(key).rows.push({
      city: area.city,
      citySlug: area.citySlug,
      ...(area.ward ? { ward: area.ward, wardSlug: area.wardSlug } : {}),
      slug: `gotouti-${hostKey}-${j.via === 'rss' ? 'r' : ''}${it.id}`,
      name,
      kind: KIND(name),
      venue: venue ?? `${cityLabel}内`,
      address,
      scale: '地区',
      organizer: pickOrganizer(it.body),
      stalls: hasStalls(it.body) ? 'yes' : 'unknown',
      dates,
      ...(t ? { start: t.start, end: t.end } : {}),
      year,
      source: it.url,
      sourceName: j.name,
      sourceType: 'media',
    });
    n++;
  }
  if (n) { usedMedia++; perMedia.set(j.name, n); }
}

// --dry のときは書かずに中身を見せるだけ（誤りを混ぜる前に確かめるため）
if (process.argv.includes('--dry')) {
  const all = [...rowsByArea.values()].flatMap(({ area, rows }) => rows.map((r) => ({ area, r })));
  console.log(`\n[dry] ${all.length} 件`);
  for (const { area, r } of all.slice(0, 60)) {
    console.log(`  ${area.pref}${r.ward ?? r.city} | ${r.name} | ${r.kind} | ${r.venue} | ${r.dates.join(',')} | ${r.start ?? '-'}-${r.end ?? '-'} | 屋台${r.stalls} | ${r.organizer ?? '-'} | ${r.address ?? '-'}`);
  }
  console.log(`  市が絞れない ${ambiguous} / 別の市の記事 ${otherCity} / まとめ記事 ${roundup} / 市区町村不明 ${noCity} / 日付なし ${noDate} / 祭りでない ${notFestival}`);
  console.log('  歩留まり:', [...perMedia].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${k}:${v}`).join(' / '));
  console.log('  使わなかった理由:', [...skipReasons].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' / '));
  process.exit(0);
}

writeNationwideAreas(generated);

let total = 0;
for (const [, { area, rows }] of rowsByArea) {
  const r = emit(rows, {
    pref: area.pref,
    prefSlug: byName(area.pref)?.slug,
    label: `名鑑（${area.ward ?? area.city}）`,
    checkedAt: CHECKED,
    year: 2026,
  });
  total += r.written;
}

console.log(`\n媒体 ${usedMedia} 件から ${total} 件を新規書き出し（触らなかった媒体 ${skippedMedia}）`);
console.log(`  市が絞れない ${ambiguous} / 別の市の記事 ${otherCity} / まとめ記事 ${roundup} / 市区町村不明 ${noCity} / 日付なし ${noDate} / 祭りでない ${notFestival}`);
console.log('  歩留まりの良かった媒体:');
for (const [k, v] of [...perMedia].sort((a, b) => b[1] - a[1]).slice(0, 20)) console.log(`    ${k}: ${v}`);
console.log('  使わなかった理由:');
for (const [k, v] of [...skipReasons].sort((a, b) => b[1] - a[1])) console.log(`    ${k}: ${v}`);
