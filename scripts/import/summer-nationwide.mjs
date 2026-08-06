/**
 * 全国の「屋台が出る夏祭り・盆踊り」→ 祭りデータ
 *
 *   node scripts/import/summer-nationwide.mjs
 *
 * data/raw/summer/<pref>.json を読む。出典が屋台の有無を属性として持つので
 * **stalls: yes** で入れられる。
 *
 * 市区町村 slug の決め方は花火側と同じ（既存の表 → ローマ字 → 県ごとの連番）。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emit, ROOT } from './_lib.mjs';
import { makeSlugPool } from './_slug.mjs';
import { PREFS } from '../lib/prefs.mjs';
import { loadAreaList } from '../lib/areas.mjs';
import { writeNationwideAreas } from './_nationwide.mjs';

const CHECKED = '2026-08-04';
const RAW = join(ROOT, 'data', 'raw', 'summer');

if (!existsSync(RAW)) {
  console.error('data/raw/summer がない。先に scripts/crawl/summer-nationwide.mjs を回すこと');
  process.exit(1);
}

/**
 * **slug は `_slug.mjs` にまとめて採らせる。**
 * ここは以前、県ごとに `let seq = 0` から連番を振り直していて、
 * しかも使用済みかどうかを見ていなかった。
 */
const pool = makeSlugPool(ROOT);

const KIND = (name) => {
  if (/盆踊|盆おどり|音頭/.test(name)) return '盆踊り';
  if (/納涼/.test(name)) return '納涼祭';
  if (/花火/.test(name)) return '花火';
  if (/七夕/.test(name)) return '夏祭り';
  return '夏祭り';
};

const generated = new Map();
const rowsByPref = new Map();
let skippedNoCity = 0;
let skippedNoDate = 0;
let skippedCancelled = 0;
const THIS_YEAR = 2026;

for (const file of readdirSync(RAW).filter((f) => f.endsWith('.json'))) {
  const j = JSON.parse(readFileSync(join(RAW, file), 'utf8'));
  const pref = PREFS.find((p) => p.slug === j.slug);
  if (!pref) continue;

  const cities = new Map();

  for (const it of j.items) {
    if (it.pref && it.pref !== j.pref) continue;
    // 出典が名前に「【2026年中止】」と書いているものは載せない
    if (/中止|開催されません/.test(it.name)) { skippedCancelled++; continue; }
    // 「【延期】」「【規模縮小】」は載せてよいが、そのままだと
    // 「開催予定」に見える。名前から外して備考に回す（取り込み後に enrich で処理）
    if (!it.city) { skippedNoCity++; continue; }
    if (!it.startDate) { skippedNoDate++; continue; }

    if (!cities.has(it.city)) {
      cities.set(it.city, pool.assign(j.pref, it.city, pref.slug, 500));
    }
    const cSlug = cities.get(it.city);

    const dates = [it.startDate];
    if (it.endDate && it.endDate !== it.startDate) dates.push(it.endDate);
    const year = Number(it.startDate.slice(0, 4));
    // 年をまたぐ期間は初日の年に寄せられないので入れない
    if (dates.some((d) => Number(d.slice(0, 4)) !== year)) { skippedNoDate++; continue; }

    const id = (it.url?.match(/\/detail(?:_e)?\/([a-zA-Z0-9]+)\//) ?? [])[1]
      ?? `${dates[0]}-${cSlug}`;

    if (!rowsByPref.has(pref.slug)) rowsByPref.set(pref.slug, []);
    rowsByPref.get(pref.slug).push({
      city: it.city,
      citySlug: cSlug,
      slug: `summer-${id}`,
      name: it.name,
      kind: KIND(it.name),
      venue: it.venue ?? `${it.city}内`,
      // emit() は住所に市区町村名を前置するので、出典側の「東京都港区六本木…」から
      // 都道府県＋市区町村を削っておく。でないと「港区東京都港区…」になる
      address: it.address
        ? it.address.replace(new RegExp(`^${j.pref}\\s*${it.city}\\s*`), '') || null
        : null,
      scale: '市',
      stalls: 'yes',
      dates,
      year,
      note: [
        dates.length === 2 ? '掲載の2日付は期間の初日と最終日' : null,
        year < THIS_YEAR
          ? `出典は${year}年の日程のまま。${THIS_YEAR}年の開催は発表されていない`
          : null,
      ].filter(Boolean).join('／') || undefined,
      source: it.url ?? `https://summer.walkerplus.com/odekake/list/${pref.ar}/sg0999/yatai/`,
      sourceName: '夏休みおでかけガイド2026（ウォーカープラス）',
      sourceType: 'aggregator',
    });
  }

  if (cities.size) generated.set(pref.slug, { pref: j.pref, cities: [...cities].map(([name, slug]) => ({ name, slug })) });
}

writeNationwideAreas(generated);

for (const [prefSlug, rows] of rowsByPref) {
  const pref = PREFS.find((p) => p.slug === prefSlug);
  emit(rows, {
    pref: pref.name,
    prefSlug,
    label: `${pref.name}（夏祭り・屋台あり）`,
    checkedAt: CHECKED,
    year: 2026,
  });
}

console.log(`  市区町村不明で除外 ${skippedNoCity} / 日付なしで除外 ${skippedNoDate} / 中止で除外 ${skippedCancelled}`);
