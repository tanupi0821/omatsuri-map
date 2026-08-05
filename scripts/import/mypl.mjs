/**
 * まいぷれの夏祭り特集（表形式）→ 祭りデータ
 *
 *   node scripts/import/mypl.mjs suginami
 *
 * 記事本文が「月 / イベント名 / 会場 / 開催日 / 時間」の表になっている。
 * 表の行として読むのが一番確実で、文章から拾おうとすると誤爬する。
 *
 * 祭りでないもの（屋内の遊び場、劇場企画など）が混ざるので選別する。
 * 屋台・模擬店・露店と書いてあるものだけ stalls: yes にする。
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emit, ROOT } from './_lib.mjs';

const CHECKED = '2026-08-04';

const AREAS = {
  suginami: { pref: '東京都', prefSlug: 'tokyo', city: '杉並区', citySlug: 'suginami' },
  tokorozawa: { pref: '埼玉県', prefSlug: 'saitama', city: '所沢市', citySlug: 'tokorozawa' },
  kashiwa: { pref: '千葉県', prefSlug: 'chiba', city: '柏市', citySlug: 'kashiwa' },
  hachioji: { pref: '東京都', prefSlug: 'tokyo', city: '八王子市', citySlug: 'hachioji' },
  machida: { pref: '東京都', prefSlug: 'tokyo', city: '町田市', citySlug: 'machida' },
  kita: { pref: '東京都', prefSlug: 'tokyo', city: '北区', citySlug: 'kita' },
  arakawa: { pref: '東京都', prefSlug: 'tokyo', city: '荒川区', citySlug: 'arakawa' },
};

const strip = (s) => s
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();

// 祭りでないもの。屋内の遊び場や劇場企画は載せない
const NOT_FESTIVAL = /ジム|スライダー|プレイグラウンド|映画|展示|講座|教室|マルシェ|フリマ|コンサート/;
const IS_FESTIVAL = /祭|まつり|マツリ|盆おどり|ぼんおどり|盆踊|縁日|花火|七夕|阿波踊り|エイサー/;

const KIND = (n) => {
  if (/盆踊|ぼんおどり|盆おどり|音頭/.test(n)) return '盆踊り';
  if (/納涼/.test(n)) return '納涼祭';
  if (/花火/.test(n)) return '花火';
  if (/例大祭|例祭|大祭/.test(n)) return '例大祭';
  return '夏祭り';
};

/** 「23日・24日」「1日・2日」「2026年9月5日（土）」→ ISO の日付 */
function toDates(monthText, dayText, year) {
  const m = Number((monthText.match(/(\d{1,2})\s*月/) ?? [])[1]);
  const out = [];
  // 「2026年9月5日」のように行の中に年月日が揃っている場合
  for (const g of dayText.matchAll(/(\d{4})年(\d{1,2})月(\d{1,2})日/g)) {
    out.push(`${g[1]}-${String(g[2]).padStart(2, '0')}-${String(g[3]).padStart(2, '0')}`);
  }
  if (out.length) return [...new Set(out)];
  if (!m) return [];
  for (const g of dayText.matchAll(/(\d{1,2})\s*日/g)) {
    const d = Number(g[1]);
    if (d < 1 || d > 31) continue;
    out.push(`${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return [...new Set(out)];
}

const area = process.argv[2];
if (!AREAS[area]) {
  console.error(`使い方: node scripts/import/mypl.mjs <${Object.keys(AREAS).join('|')}>`);
  process.exit(1);
}
const A = AREAS[area];
const path = join(ROOT, 'data', 'raw', 'mypl', `${area}.html`);
if (!existsSync(path)) {
  console.error(`${path} がない。先に scripts/crawl/mypl.mjs を回すこと`);
  process.exit(1);
}

const html = readFileSync(path, 'utf8');
const rows = [];
let skipped = 0;

for (const table of html.match(/<table[\s\S]*?<\/table>/g) ?? []) {
  for (const tr of table.matchAll(/<tr[\s\S]*?<\/tr>/g)) {
    const cells = [...tr[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
      .map((c) => strip(c[1]));
    if (cells.length < 4) continue;
    const [monthText, name, venue, dayText, ...rest] = cells;
    if (!name || /イベント名/.test(name)) continue; // 見出し行

    if (!IS_FESTIVAL.test(name) || NOT_FESTIVAL.test(name)) { skipped++; continue; }

    const dates = toDates(monthText, dayText, 2026);
    if (!dates.length) { skipped++; continue; }

    const detail = [dayText, ...rest].join(' ');
    rows.push({
      city: A.city,
      citySlug: A.citySlug,
      slug: `mypl-${name.replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9]/gu, '').slice(0, 20)}`,
      name,
      kind: KIND(name),
      venue: venue || `${A.city}内`,
      scale: '地区',
      // 屋台・模擬店・露店と書いてある行だけ yes。書いていなければ未確認のまま
      stalls: /屋台|模擬店|露店|夜店/.test(detail + name) ? 'yes' : 'unknown',
      dates,
      year: 2026,
      source: `https://${area}.mypl.net/article/summer-fes_${area}`,
      sourceName: `まいぷれ[${A.city}]`,
      sourceType: 'media',
    });
  }
}

emit(rows, {
  pref: A.pref,
  prefSlug: A.prefSlug,
  label: `まいぷれ（${A.city}）`,
  checkedAt: CHECKED,
  year: 2026,
});
console.log(`  祭り以外・日付なしで除外 ${skipped}`);
