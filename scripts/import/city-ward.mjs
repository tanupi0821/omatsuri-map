/**
 * 政令市の区の夏祭り・盆踊り一覧 → 祭りデータ
 *
 *   node scripts/import/city-ward.mjs
 *
 * 区（名古屋は学区）が作る一覧は**町会レベル**なので、東京の足立区・江戸川区と
 * 同じく町内会規模として扱う。開催日は年が無いのでページの年（2026）を補う。
 *
 * **列の並びが区ごとに違う**:
 *   西淀川区: 地域 / 名称 / 開催日 / 場所
 *   此花区:   行事 / 日時 / 場所
 *   名東区:   行事名 / 日にち / 時間 / 場所
 *
 * 列の数で決め打ちすると名東区で「日にち」を場所だと思ってしまうので、
 * **見出し行から列の意味を読む**。
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emit, ROOT } from './_lib.mjs';
import { KIND } from './_article.mjs';
import { PAGES } from '../crawl/city-ward.mjs';
import { loadAreaList } from '../lib/areas.mjs';
import { makeSlugPool } from './_slug.mjs';
import { byName } from '../lib/prefs.mjs';
import { writeNationwideAreas } from './_nationwide.mjs';

const CHECKED = '2026-08-05';
const YEAR = 2026;
const RAW = join(ROOT, 'data', 'raw', 'city-ward');

const strip = (s) => s
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();

/** 見出しの語から列の役割を決める */
function roleOf(head) {
  if (/名称|行事|イベント|まつり/.test(head)) return 'name';
  // 住吉区は見出しが「日」の 1 文字。長い語から先に判定すること
  if (/日にち|日時|開催日|期日|日程/.test(head) || head === '日') return 'date';
  if (/場所|会場/.test(head)) return 'place';
  if (/時間|時刻/.test(head)) return 'time';
  if (/主催/.test(head)) return 'org';
  if (/地域|学区|町会|地区|校区/.test(head)) return 'area';
  return null;
}

/**
 * その表を取り込んでよいか。
 * 堺市南区は 1 ページに「校区まつり」と「校区防災訓練」の表が同居している。
 * 防災訓練を祭りとして載せるわけにはいかない。
 */
const NOT_FESTIVAL_TABLE = /防災訓練|避難訓練|清掃|美化|健診|健康診断|説明会/;

/**
 * **行ごと**の除外。区が出しているのが「夏祭り一覧」とは限らない。
 * 門司区は区内の年間行事カレンダーなので、マラソン・清掃活動・イルミネーション・
 * 帆船の一般公開まで同じ表に並んでいる。表単位の判定では落とせない。
 *
 * ここに並ぶのはすべて実データで見つけた誤取り込み。
 * 迷うもの（ビアフェスタ・マルシェ・記念イベントなど）は入れない。
 * 祭りでないものを載せる害と、祭りを落とす害の両方があるので、
 * **明らかに祭りでないものだけ**を挙げる。
 */
const NOT_FESTIVAL_ROW = new RegExp([
  'マラソン', 'ウォーク', 'ウォーキング', '駅伝', // 北九州マラソン2026・維新海峡ウォーク
  'クリーンアップ', 'クリーン作戦', '清掃', '美化活動', // 海の玄関口クリーンアップ活動
  'イルミネーション', 'ライトアップ', '点灯式', // 門司港レトロ浪漫灯彩・城山さくら夜間ライトアップ
  '体験航海', '一般公開', // 帆船「みらいへ」体験航海・船舶一般公開
  '博物館', '人形展示', '写真展', // 門司港バナナ博物館・ひな人形展示
  'カラオケ大会', 'コンサート', 'サンタ', // 折尾駅前カラオケ大会・ヤングサンタ
  '防災訓練', '避難訓練', '健診', '検診', '説明会', '献血', '講座', '教室',
].join('|'));

/**
 * 名前の掃除。表のリンク文言や年度がそのまま名前になり、id にも入っていた
 * （`…-北九州マラソン2026外部リンク`）。id は名前から作るので、
 * **id を作る前に**ここを通す。
 */
function cleanName(raw) {
  return raw
    // 「（外部リンク）」は表のリンクにHTMLで付く注記。祭りの名前ではない
    .replace(/[（(]\s*(?:外部リンク|外部サイト|PDF|ＰＤＦ)[^）)]*[）)]/g, '')
    // 「令和8年度 極楽学区納涼夏まつり」の年度は名前ではない。
    // ただし「2024原山まつり」のように過年度の同名を区別している書き方は残す
    // （消すと同じ id になって片方しか残らない）
    .replace(/^令和\s*\d{1,2}\s*年度\s*/, '')
    // 表には「※」で注記の印が付く。名前の一部ではない
    .replace(/[※*＊]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 「夏まつり」「盆踊り大会」のように**種別しか言っていない名前**が区の表には出る。
 * そのまま載せると全国の同名と見分けが付かず、写真も引きずられる（docs/kanto-plan.md）。
 * 地域欄（学区・校区・町会）があればそれを、無ければ会場名を前に付ける。
 */
const GENERIC_NAME = /^(?:夏|春|秋|冬)?(?:まつり|祭り|祭|夏まつり|夏祭り|夏祭り盆踊り|盆踊り|盆おどり|盆踊り大会|盆踊り大会|納涼祭|納涼大会|納涼の夕べ|夕涼み会|こどもまつり|子どもまつり|秋まつり|秋祭り)$/;

/** 全角数字を半角に */
const han = (s) => s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));

/** 「午後4時50分」「17時30分」「正午」を分に落とす */
function timeTokens(s) {
  const out = [];
  const re = /(午前|午後)?\s*(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?|正午/g;
  let m;
  while ((m = re.exec(s))) {
    let h = 12;
    let mi = 0;
    if (m[0] !== '正午') {
      h = Number(m[2]);
      mi = Number(m[3] ?? 0);
      if (m[1] === '午後' && h < 12) h += 12;
      if (m[1] === '午前' && h === 12) h = 0;
    }
    if (h > 23 || mi > 59) continue;
    out.push({ at: m.index, to: re.lastIndex, hhmm: `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}` });
  }
  return out;
}

/**
 * 時間欄から開始・終了を読む。**区の表は 4 種類の書き方がある**:
 *   午後4時50分から午後8時 / 17時～21時 / 各日19時～ / 午前10時～正午
 *
 * **「〜」で直結した 2 つだけを開始・終了の組とみなす**。
 * 「夜店17時30分～／花火20時頃～」の 20 時は終わりの時刻ではなく
 * 花火の開始なので、終了に入れてはいけない。
 * 「子ども16時～19時30分 大人20時～21時50分」は組が 2 つあるので
 * 最初の開始と最後の終了を取り、全体の時間帯にする。
 */
function parseTimeRange(text) {
  if (!text || /未定|調整中/.test(text)) return {};
  const s = han(String(text)).replace(/[〜~ー－]/g, '～');
  const t = timeTokens(s);
  if (!t.length) return {};
  const pairs = [];
  for (let i = 0; i + 1 < t.length; i++) {
    if (/^\s*(?:～|から|-)\s*$/.test(s.slice(t[i].to, t[i + 1].at))) pairs.push([t[i], t[i + 1]]);
  }
  if (!pairs.length) return { start: t[0].hhmm };
  const start = pairs[0][0].hhmm;
  let end = pairs[pairs.length - 1][1].hhmm;
  // 堺市南区は「午後5時~9時」と後ろの午前・午後を省く。素直に読むと 17:00→09:00 になる
  if (end <= start) {
    const h = Number(end.slice(0, 2)) + 12;
    end = h <= 23 ? `${h}:${end.slice(3)}` : null;
    if (end && end <= start) end = null;
  }
  return { start, ...(end ? { end } : {}) };
}

/**
 * 会場欄の括弧の中が住所とは限らない。
 * 「（イベント会場：杉守神社）」「（学園大通り口）」を住所にしていた。
 * **数字を含むものだけ**を住所とみなす。
 */
function addressOf(place, city) {
  const inner = (place.match(/[（(]([^）)]+)[）)]/) ?? [])[1];
  if (!inner) return null;
  const s = inner.replace(/\s+/g, '').trim();
  if (/[：:]/.test(s)) return null;
  if (!/\d/.test(s) && !/(丁目|番地)/.test(s)) return null;
  // 「（八幡西区東鳴水5丁目）」のように市区名が既に入っていることがある。
  // emit() が市区町村名を前に付けるので、ここで落とさないと二重になる
  const ward = city.replace(/^.*?市/, '');
  return ward && s.startsWith(ward) ? s.slice(ward.length) : s;
}

/**
 * 表の直前の見出しから年度を取る。
 * 堺市南区は 1 ページに令和6・7・8年度が並び、日程欄に年が無い。
 * ページの年で一律に補うと、過年度の祭りに今年の年を付けてしまう。
 */
function yearBefore(html, tableIndex, fallback) {
  const before = html.slice(0, tableIndex);
  const heads = [...before.matchAll(/令和\s*(\d{1,2})\s*年度?/g)];
  if (!heads.length) return fallback;
  return 2018 + Number(heads[heads.length - 1][1]);
}

// 既存データは「大阪市西淀川区」を 1 つの市区町村として持っている。それに合わせる
const byCity = new Map(loadAreaList(ROOT).map((a) => [`${a.pref}|${a.city}`, a.slug]));
const generated = new Map();
// slug の採り方は `_slug.mjs` に共通化した（別の市が同じ URL を共有するのを防ぐ）
const pool = makeSlugPool(ROOT);
function slugOf(pref, city) {
  const k = `${pref}|${city}`;
  if (byCity.has(k)) return byCity.get(k);
  const p = byName(pref);
  const slug = pool.assign(p.name, city, p.slug, 900);
  byCity.set(k, slug);
  if (!generated.has(p.slug)) generated.set(p.slug, { pref, cities: [] });
  generated.get(p.slug).cities.push({ name: city, slug });
  return slug;
}

const rowsByCity = new Map();
const notFestival = [];
let skipped = 0;

for (const [key, { pref, city, url }] of Object.entries(PAGES)) {
  const path = join(RAW, `${key}.html`);
  if (!existsSync(path)) { console.warn(`${city}: ${path} がない`); continue; }
  const html = readFileSync(path, 'utf8');

  for (const m0 of html.matchAll(/<table[\s\S]*?<\/table>/g)) {
    const table = m0[0];
    const trs = [...table.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((m) => m[0]);
    if (!trs.length) continue;

    // 表そのものが祭り以外（防災訓練など）なら丸ごと飛ばす。
    // 見出しは表の外にあるので、直前 300 字も一緒に見る
    const context = html.slice(Math.max(0, m0.index - 300), m0.index) + strip(table).slice(0, 200);
    if (NOT_FESTIVAL_TABLE.test(context)) continue;

    // この表が何年度のものか
    const year = yearBefore(html, m0.index, YEAR);

    // 西淀川区は 2 つめの表が `<caption>神社のおまつり</caption>` で、
    // **名称欄が神社名・場所欄が鎮座地の住所**になっている。地域の盆踊りの表と
    // 同じ規則で読むと「五社神社」という名前で会場が「中島1-2-8」になる
    const caption = strip((table.match(/<caption[^>]*>([\s\S]*?)<\/caption>/) ?? [])[1] ?? '');
    const shrineTable = /神社|神宮|宮/.test(caption);

    // 1 行目を見出しとみて列の役割を決める
    const roles = [...trs[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
      .map((c) => roleOf(strip(c[1])));
    // 名称と日付の列が分からない表は扱えない（地域名だけの一覧など）
    if (!roles.includes('name') || !roles.includes('date')) continue;

    const pick = (cells, role) => {
      const i = roles.indexOf(role);
      return i >= 0 ? (cells[i] ?? '') : '';
    };

    for (const tr of trs.slice(1)) {
      const cells = [...tr.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((c) => strip(c[1]));
      if (cells.length < roles.length) continue;

      const rawName = cleanName(pick(cells, 'name'));
      const dateText = pick(cells, 'date');
      let place = pick(cells, 'place');
      const area = pick(cells, 'area');
      if (!rawName || !dateText) continue;

      // 祭りでない行（マラソン・清掃活動・イルミネーションなど）は入れない
      if (NOT_FESTIVAL_ROW.test(rawName)) { notFestival.push(`${city}: ${rawName}`); continue; }

      // 神社の表は「名称＝神社名／場所＝鎮座地」。祭りの名前に直す。
      // 表の題は「神社のおまつり」、ページの題は「区内で開催される夏祭り・盆踊り」なので
      // 夏祭りとして扱う（7月下旬〜8月初旬という日付とも合う）
      const shrine = shrineTable ? rawName.replace(/\s+/g, '') : null;
      let name = shrine ? `${shrine} 夏祭り` : rawName;
      if (shrine) place = `${shrine}（${place}）`;

      // 種別しか言っていない名前は、地域名か会場名を前に付けて他と見分けられるようにする
      if (GENERIC_NAME.test(name)) {
        const prefix = area || place.replace(/[（(].*$/, '').trim();
        if (prefix && prefix !== name) name = `${prefix} ${name}`;
      }

      // 「8月14日(金曜日)、8月15日(土曜日)」のように複数日のことがある。
      // 「予備日7月5日」は雨天時の日程なので開催日ではない
      // 「雨天延期日」「予備日」は開催日ではない
      const seg = dateText.split(/予備日|雨天|順延|延期/)[0];
      // 「2026年7月11日（土曜日）」のように年が入っていればそれを使い、
      // 無ければ表の年度（堺市南区は 1 ページに 3 年度ぶんある）
      const dates = [...new Set(
        [...seg.matchAll(/(?:(20\d\d)年)?\s*(\d{1,2})月\s*(\d{1,2})日/g)]
          .map((g) => `${g[1] ?? year}-${String(g[2]).padStart(2, '0')}-${String(g[3]).padStart(2, '0')}`),
      )].slice(0, 4);
      if (!dates.length) { skipped++; continue; }

      // 時間の列は roleOf で読んでいたのに使っていなかった。
      // 名東区・住吉区・堺市南区は時間の列を持ち、此花区は日時欄に時刻が入る
      const { start, end } = parseTimeRange(pick(cells, 'time') || dateText);

      // 主催の欄には問い合わせ先の電話番号が続く（「折尾まつり実行委員会 電話：093-…」）。
      // 主催者名だけにする
      const org = pick(cells, 'org').replace(/\s*(?:電話|TEL|Tel)\s*[:：].*$/, '').trim();

      if (!rowsByCity.has(city)) rowsByCity.set(city, { pref, rows: [] });
      rowsByCity.get(city).rows.push({
        city,
        citySlug: slugOf(pref, city),
        slug: `ward-${key}-${name.replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9]/gu, '').slice(0, 16)}`,
        name,
        kind: shrine ? '夏祭り' : KIND(name),
        // 会場欄は「柏里小学校（柏里2-13-33）」。住所は括弧の中
        venue: place.replace(/[（(].*$/, '').replace(/\s+/g, ' ').trim() || `${city}内`,
        address: addressOf(place, city),
        ...(shrine ? { shrine } : {}),
        // 神社の夏祭りは氏子地域が集まるので町内会より広い
        scale: shrine ? '地区' : '町内会',
        // 「酉島夜店と花火大会」のように名前や日時欄に夜店とあれば屋台は出る
        stalls: /夜店|屋台|露店|模擬店/.test(`${name} ${dateText}`) ? 'yes' : 'unknown',
        // 主催の列があればそれを、無ければ地域名を主催として扱う
        ...(org ? { organizer: org }
          : area && area !== name ? { organizer: `${area}地域` } : {}),
        dates,
        start,
        end,
        year,
        source: url,
        sourceName: city,
        sourceType: 'gov',
      });
    }
  }
}

writeNationwideAreas(generated);

for (const [city, { pref, rows }] of rowsByCity) {
  emit(rows, {
    pref,
    prefSlug: byName(pref)?.slug,
    label: `${city}の一覧`,
    checkedAt: CHECKED,
    year: YEAR,
  });
}
console.log(`  日付が読めず除外 ${skipped}`);
// 何を祭りでないとして落としたかは残しておく。除外条件を足すたびに
// 祭りまで落としていないか目で確かめられるように
console.log(`  祭りでないとして除外 ${notFestival.length}`);
for (const x of notFestival) console.log(`    - ${x}`);
