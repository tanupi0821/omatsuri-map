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
  if (/名称|行事|イベント/.test(head)) return 'name';
  if (/日にち|日時|開催日|期日|日程/.test(head)) return 'date';
  if (/場所|会場/.test(head)) return 'place';
  if (/時間|時刻/.test(head)) return 'time';
  if (/地域|学区|町会|地区/.test(head)) return 'area';
  return null;
}

// 既存データは「大阪市西淀川区」を 1 つの市区町村として持っている。それに合わせる
const byCity = new Map(loadAreaList(ROOT).map((a) => [`${a.pref}|${a.city}`, a.slug]));
const generated = new Map();
const seq = new Map();
function slugOf(pref, city) {
  const k = `${pref}|${city}`;
  if (byCity.has(k)) return byCity.get(k);
  const p = byName(pref);
  const used = new Set(byCity.values());
  let slug;
  do {
    const n = (seq.get(p.slug) ?? 0) + 1;
    seq.set(p.slug, n);
    slug = `${p.slug}-${String(900 + n).padStart(3, '0')}`;
  } while (used.has(slug));
  byCity.set(k, slug);
  if (!generated.has(p.slug)) generated.set(p.slug, { pref, cities: [] });
  generated.get(p.slug).cities.push({ name: city, slug });
  return slug;
}

const rowsByCity = new Map();
let skipped = 0;

for (const [key, { pref, city, url }] of Object.entries(PAGES)) {
  const path = join(RAW, `${key}.html`);
  if (!existsSync(path)) { console.warn(`${city}: ${path} がない`); continue; }
  const html = readFileSync(path, 'utf8');

  for (const table of html.match(/<table[\s\S]*?<\/table>/g) ?? []) {
    const trs = [...table.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((m) => m[0]);
    if (!trs.length) continue;

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

      const name = pick(cells, 'name');
      const dateText = pick(cells, 'date');
      const place = pick(cells, 'place');
      const area = pick(cells, 'area');
      if (!name || !dateText) continue;

      // 「8月14日(金曜日)、8月15日(土曜日)」のように複数日のことがある。
      // 「予備日7月5日」は雨天時の日程なので開催日ではない
      const seg = dateText.split(/予備日|雨天|順延/)[0];
      const dates = [...new Set(
        [...seg.matchAll(/(\d{1,2})月\s*(\d{1,2})日/g)]
          .map((g) => `${YEAR}-${String(g[1]).padStart(2, '0')}-${String(g[2]).padStart(2, '0')}`),
      )].slice(0, 4);
      if (!dates.length) { skipped++; continue; }

      if (!rowsByCity.has(city)) rowsByCity.set(city, { pref, rows: [] });
      rowsByCity.get(city).rows.push({
        city,
        citySlug: slugOf(pref, city),
        slug: `ward-${key}-${name.replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z0-9]/gu, '').slice(0, 16)}`,
        // 表には「※」で注記の印が付く。名前の一部ではない
        name: name.replace(/[※*＊]+\s*$/, '').trim(),
        kind: KIND(name),
        // 会場欄は「柏里小学校（柏里2-13-33）」。住所は括弧の中
        venue: place.replace(/[（(].*$/, '').trim() || `${city}内`,
        address: (place.match(/[（(]([^）)]+)[）)]/) ?? [])[1] ?? null,
        scale: '町内会',
        // 「酉島夜店と花火大会」のように名前や日時欄に夜店とあれば屋台は出る
        stalls: /夜店|屋台|露店|模擬店/.test(`${name} ${dateText}`) ? 'yes' : 'unknown',
        ...(area && area !== name ? { organizer: `${area}地域` } : {}),
        dates,
        year: YEAR,
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
