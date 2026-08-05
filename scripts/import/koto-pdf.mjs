/**
 * 江東区「令和8年度 盆踊り・夏まつり開催情報」PDF → 祭りデータ
 *
 *   node scripts/import/koto-pdf.mjs [--dry]
 *
 * 区が町会・自治会単位で出している一覧。**行政の一次情報**なので出典の格は gov。
 * 江東区は既に地域情報サイト（minamisuna1.com）由来のデータが入っているが、
 * こちらは**住所と実施団体（町会名）が全件に付いている**点で上位互換。
 * 重なる分は `scripts/dedupe.mjs` が出典の格で残す方を決める。
 *
 * 表の癖:
 *  - **1 行に 2 つの行事**が入ることがある（「夕涼み会 / 花火大会」で時間が 2 つ）。
 *    先頭を採り、残りは note に書く。分けて別の祭りにすると会場・住所が持てない
 *  - 会場・住所が 2 つ並ぶ行がある（亀戸二丁目町会は 2 会場）。同じく先頭＋note
 *  - 時間欄に「18:30～21:00（子供は20:00まで）」の注記が入る
 *  - 「18;30～」のようにコロンが誤ってセミコロンになっている行がある
 *  - 終了時刻が無い行が多い（「17:00～」）。end は null のままにする
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emit, ROOT } from './_lib.mjs';

const CHECKED = '2026-08-06';
const RAW = join(ROOT, 'data', 'raw', 'koto', 'bonodori-2026.json');
const SOURCE = 'https://www.city.koto.lg.jp/101010/kurashi/komyunitei/chokai/jichikai/bonnodorinatsumatsuri/index.html';

if (!existsSync(RAW)) {
  console.error('data/raw/koto/bonodori-2026.json がない。先に scripts/crawl/koto-pdf.mjs を回すこと');
  process.exit(1);
}
const { rows } = JSON.parse(readFileSync(RAW, 'utf8'));

const han = (s) => String(s ?? '').replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));

/** 「7月19日（日） 7月25日（土）」→ ['2026-07-19','2026-07-25']（令和8年度＝2026年） */
function dates(cell) {
  return [...new Set([...han(cell).matchAll(/(\d{1,2})月\s*(\d{1,2})日/g)]
    .map((m) => `2026-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`))];
}

/** 「18:30～21:00」「17:00～」「18;30～」→ {start,end,rest} */
function times(cell) {
  const t = han(cell).replace(/;/g, ':').replace(/[〜～]/g, '~');
  const ranges = [...t.matchAll(/(\d{1,2}):(\d{2})\s*~\s*(?:(\d{1,2}):(\d{2}))?/g)].map((m) => ({
    start: `${String(m[1]).padStart(2, '0')}:${m[2]}`,
    end: m[3] ? `${String(m[3]).padStart(2, '0')}:${m[4]}` : null,
  }));
  if (!ranges.length) return { start: null, end: null, rest: null };
  // **出典の誤り**（「19:00～12:00」）。終わりが始まりより前なら終了時刻を入れない
  const bad = ranges[0].end && ranges[0].end <= ranges[0].start;
  // 「（子供は20:00まで）」のような注記は開始・終了ではない
  const note = /[（(][^）)]*[）)]/.test(cell) ? cell.match(/[（(][^）)]*[）)]/)[0] : null;
  return {
    start: ranges[0].start,
    end: bad ? null : ranges[0].end,
    rest: [bad ? `出典の終了時刻は「${ranges[0].end}」で開始より前。誤記とみて載せていない` : null,
      ranges.length > 1 ? `この行事は時間帯が ${ranges.map((r) => `${r.start}〜${r.end ?? ''}`).join(' と ')} に分かれる` : null, note]
      .filter(Boolean).join('。') || null,
  };
}

const KIND = (n) => {
  if (/盆踊|ぼんおどり|盆おどり/.test(n)) return '盆踊り';
  if (/花火/.test(n)) return '花火';
  if (/納涼|夕涼/.test(n)) return '納涼祭';
  if (/えんにち|縁日|お祭り広場/.test(n)) return '縁日';
  if (/みこし|神輿|灯篭流し|灯籠流し|慰霊/.test(n)) return '神事';
  return '夏祭り';
};

/**
 * 折り返しで入った空白を詰める。日本語の名称に本来の空白は無いので、
 * **名称は空白を全部落とす**（「納涼こども花火まつ り」→「納涼こども花火まつり」、
 * 「大島１・２丁目町会納涼盆踊り 大会」→「…納涼盆踊り大会」）。
 */
const tightName = (s) => String(s ?? '').replace(/\s+/g, '').trim();

/**
 * 名前が総称のときに町会名を前に付ける。
 * 実施団体から「町会」「自治会」などを落とした部分（町名）が名前に出ていなければ、
 * その祭りは名前だけでは区別できない（江東区に「盆踊り」が 8 件ある）。
 */
function prefixOrg(name, org) {
  if (!org) return name;
  if (name.length >= 12) return name; // 十分に具体的な名前
  const key = org.replace(/(町会|自治会|団地自治会|自治管理組合|管理組合|合同開催|連合会|の会)$/, '');
  // **同じ町名を「亀戸２丁目」と「亀戸二丁目」の 2 通りで書く**。
  // 数字の書き方を揃えてから比べないと、町名が入っているのに二重に付けてしまう
  const KANSUJI = { 一: '1', 二: '2', 三: '3', 四: '4', 五: '5', 六: '6', 七: '7', 八: '8', 九: '9', 十: '10' };
  const num = (s) => han(s).replace(/[一二三四五六七八九十]/g, (c) => KANSUJI[c] ?? c);
  if (key && num(name).includes(num(key))) return name;
  return `${org} ${name}`;
}

/** ローマ字 slug を作れないので、行番号と町会名の連番で一意にする */
const out = [];
for (const r of rows) {
  const name = tightName(r.name);
  if (!name) continue;

  const d = dates(r.dates);
  if (!d.length) continue;
  const t = times(r.time);

  /**
   * 会場・住所が 2 つ並ぶ行（亀戸二丁目町会は文泉公園と第一亀戸小学校）。
   * ただし**折り返しで割れただけ**のこともある（「…集会所前と団地敷 / 地内」）。
   * 2 つ目が場所らしい語で終わるときだけ別会場とみなす。
   */
  const PLACE_END = /(公園|広場|会館|小学校|中学校|幼稚園|神社|寺|センター|校庭|通り|敷地内|団地内|グラウンド|ホール|前)$/;
  const parts = r.venue.split(/\s+/).filter(Boolean);
  const venues = (parts.length > 1 && PLACE_END.test(parts[1]) && !/^[（(]/.test(parts[1]))
    ? parts : [parts.join('')];
  const addrs = r.address.replace(/^江東区/, '').split(/\s+/).filter((a) => /\d/.test(a));
  // 「江東公園 （扇橋二丁目バス停前）」は 1 会場の補足なので割らない
  const venue = venues[0];
  const extraVenue = venues.slice(1).join('・') || null;

  // 実施団体は複数並ぶことがある（合同開催）。先頭を主催、残りは共催として note に
  const orgs = r.organizer.split(/\s+/).filter(Boolean).map((o) => o.replace(/合同開催$/, ''));

  const note = [
    t.rest,
    extraVenue ? `会場は ${venue} と ${extraVenue} の 2 か所` : null,
    orgs.length > 1 ? `${orgs.slice(1).join('・')}との合同開催` : null,
  ].filter(Boolean).join('。') || null;

  out.push({
    slug: `kotopdf-${String(r.no).padStart(2, '0')}`,
    // **「盆踊り」「夏まつり」だけの名前が多い**。町会名を前に付けないと区別できない。
    // 既に町名が入っているもの（「千田町会納涼盆踊り大会」）には付けない
    name: prefixOrg(name, orgs[0]),
    kind: KIND(name),
    scale: '町内会',
    venue: venue || `江東区${addrs[0] ?? ''}`,
    address: addrs[0] ?? null,
    organizer: orgs[0] ?? null,
    // PDF に備考欄が無いので屋台の有無は分からない
    stalls: 'unknown',
    dates: d,
    start: t.start,
    end: t.end,
    year: 2026,
    status: 'confirmed',
    ...(note ? { note } : {}),
  });
}

if (process.argv.includes('--dry')) {
  for (const r of out) {
    console.log(`${r.slug} | ${r.name} | ${r.kind} | ${r.venue} | ${r.address} | ${r.dates.join(',')} | ${r.start ?? '-'}〜${r.end ?? '-'} | ${r.organizer} | ${r.note ?? ''}`);
  }
  console.log(`${out.length} 件`);
  process.exit(0);
}

emit(out, {
  pref: '東京都',
  prefSlug: 'tokyo',
  city: '江東区',
  citySlug: 'koto',
  label: '江東区（区公式PDF）',
  source: SOURCE,
  sourceName: '江東区',
  sourceType: 'gov',
  checkedAt: CHECKED,
  year: 2026,
});
