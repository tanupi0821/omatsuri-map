/**
 * レアリアの記事 → 祭りデータ
 *
 *   node scripts/import/rarea.mjs
 *
 * 市区町村は題名から取る。号外NET と違って【】ではなく、
 * 題名のどこかに素で出てくる:
 *   「2026年8月15日　厚木市　森の里若宮公園で夏祭り」
 *   「…8月16日は「富士見公園夏まつり」＠川崎市川崎区」
 *
 * **既に定義してある市区町村名だけを拾う**。素朴に「◯◯市」を拾うと
 * 祭りの名前の一部（「サギ草市」など）を市だと思ってしまう。
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emit, ROOT } from './_lib.mjs';
import { loadAreaList } from '../lib/areas.mjs';
import { byName } from '../lib/prefs.mjs';
import {
  IS_FESTIVAL, NOT_FESTIVAL, KIND, hasStalls, pickDates, pickVenue, pickName, usableName,
} from './_article.mjs';

const CHECKED = '2026-08-05';
const RAW = join(ROOT, 'data', 'raw', 'rarea', 'posts.json');

if (!existsSync(RAW)) {
  console.error('data/raw/rarea/posts.json がない。先に scripts/crawl/rarea.mjs を回すこと');
  process.exit(1);
}

// 政令市の区を先に見る（「川崎市川崎区」は区まで分かる方がよい）
const wards = [];
const cities = [];
for (const a of loadAreaList(ROOT)) {
  cities.push({ pref: a.pref, city: a.city, citySlug: a.slug, key: a.city });
  for (const w of a.wards ?? []) {
    wards.push({
      pref: a.pref, city: a.city, citySlug: a.slug,
      ward: w.name, wardSlug: w.slug, key: `${a.city}${w.name}`,
    });
  }
}
// 長い名前から順に見る（「川崎市川崎区」が「川崎市」より先に当たるように）
const LOOKUP = [...wards, ...cities].sort((a, b) => b.key.length - a.key.length);

const { items } = JSON.parse(readFileSync(RAW, 'utf8'));
const rowsByArea = new Map();
let noCity = 0; let noDate = 0; let notFestival = 0;

for (const it of items) {
  const area = LOOKUP.find((a) => it.title.includes(a.key))
    ?? LOOKUP.find((a) => it.body.slice(0, 300).includes(a.key));
  if (!area) { noCity++; continue; }

  const name = pickName(it.body, it.title);
  if (!usableName(name) || !IS_FESTIVAL.test(name) || NOT_FESTIVAL.test(name)) {
    notFestival++; continue;
  }

  const dates = pickDates(it.body, it.title, it.date);
  if (!dates.length) { noDate++; continue; }
  const year = Number(dates[0].slice(0, 4));
  if (dates.some((d) => Number(d.slice(0, 4)) !== year)) { noDate++; continue; }

  const key = `${area.pref}|${area.city}|${area.ward ?? ''}`;
  if (!rowsByArea.has(key)) rowsByArea.set(key, { area, rows: [] });
  rowsByArea.get(key).rows.push({
    city: area.city,
    citySlug: area.citySlug,
    ...(area.ward ? { ward: area.ward, wardSlug: area.wardSlug } : {}),
    slug: `rarea-${it.id}`,
    name,
    kind: KIND(name),
    venue: pickVenue(it.body) ?? `${area.ward ?? area.city}内`,
    scale: '町内会',
    stalls: hasStalls(it.body) ? 'yes' : 'unknown',
    dates,
    year,
    source: it.url,
    sourceName: 'レアリア',
    sourceType: 'media',
  });
}

for (const [, { area, rows }] of rowsByArea) {
  emit(rows, {
    pref: area.pref,
    prefSlug: byName(area.pref)?.slug,
    label: `レアリア（${area.ward ?? area.city}）`,
    checkedAt: CHECKED,
    year: 2026,
  });
}

console.log(`  市区町村不明 ${noCity} / 日付なし ${noDate} / 祭りでない ${notFestival}`);
