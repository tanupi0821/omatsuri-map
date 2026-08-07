/**
 * 政令市の持ち方を横浜市・川崎市に揃える
 *
 *   node scripts/fix-seirei-wards.mjs [--apply]
 *
 * `area.city` に「大阪市此花区」のように**区まで入っている**祭りが 418 件あり、
 * その結果 1 つの市が複数の URL に割れていた（大阪市は 18 本）。
 * 大阪市を探しに来た人は、主たるページで全体の一部しか見られない。
 *
 * 横浜市・川崎市・さいたま市・千葉市・相模原市は最初から
 * `city: 横浜市` / `ward: 青葉区` と持っていて、市のページに区がまとまる。
 * **残り 15 の政令市もこれに揃える。**
 *
 * やること:
 *   1. `area.city` を市と区に割る
 *   2. ファイルを市のディレクトリへ移し、id の頭を市の slug に付け替える
 *   3. エリア定義に市と区を登録する（登録しないと取り込みが区を市として作り直す）
 */
import { readdirSync, readFileSync, writeFileSync, statSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { parse, parseAllDocuments, stringify } from 'yaml';
import { byName } from './lib/prefs.mjs';
import { citySlug } from './lib/romaji.mjs';
import { ROOT } from './import/_lib.mjs';

const APPLY = process.argv.includes('--apply');
const FEST = join(ROOT, 'data', 'festivals');
const AREAS = join(ROOT, 'data', 'areas');

/** 政令指定都市。既に city+ward で持てているものも含めて全部並べる */
const SEIREI = [
  '札幌市', '仙台市', 'さいたま市', '千葉市', '横浜市', '川崎市', '相模原市',
  '新潟市', '静岡市', '浜松市', '名古屋市', '京都市', '大阪市', '堺市', '神戸市',
  '岡山市', '広島市', '北九州市', '福岡市', '熊本市',
];

const items = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;
    const rel = relative(FEST, p).split(sep);
    items.push({ path: p, f: parse(readFileSync(p, 'utf8')), prefSlug: rel[0], citySlug: rel[1] });
  }
})(FEST);

/**
 * 市の置き場所。**既に city+ward で持てている市はその置き場所が正**。
 * 無ければ romaji から引く。それも無ければこの表から。
 */
const FALLBACK = {
  札幌市: 'sapporo', 仙台市: 'sendai', 新潟市: 'niigata', 静岡市: 'shizuoka-shi',
  浜松市: 'hamamatsu', 名古屋市: 'nagoya', 京都市: 'kyoto', 大阪市: 'osaka-shi',
  堺市: 'sakai', 神戸市: 'kobe', 岡山市: 'okayama', 広島市: 'hiroshima-shi',
  北九州市: 'kitakyushu', 福岡市: 'fukuoka-shi', 熊本市: 'kumamoto',
};
const canonical = new Map();
for (const it of items) {
  if (!SEIREI.includes(it.f.area.city) || !it.f.area.ward) continue;
  if (!canonical.has(it.f.area.city)) canonical.set(it.f.area.city, it.citySlug);
}
const slugOf = (city) => canonical.get(city) ?? citySlug(city) ?? FALLBACK[city] ?? null;

// --- 区の slug。定義に書くために要る。ローマ字が無ければ連番で振る -----------
const wardSlugs = new Map(); // `${city}|${ward}` -> slug

let moved = 0;
const plan = [];
for (const it of items) {
  const raw = it.f.area.city;
  const city = SEIREI.find((c) => raw !== c && raw.startsWith(c) && raw.endsWith('区'));
  if (!city) continue;
  const ward = raw.slice(city.length);
  const slug = slugOf(city);
  if (!slug) { console.log(`市の slug が引けない: ${city}`); continue; }
  plan.push({ it, city, ward, slug });
  moved++;
}

// 区の slug を決める（市ごとに通し番号。読める名前は romaji から）
for (const { city, ward } of plan) {
  const k = `${city}|${ward}`;
  if (wardSlugs.has(k)) continue;
  const s = citySlug(ward);
  const used = new Set([...wardSlugs].filter(([kk]) => kk.startsWith(`${city}|`)).map(([, v]) => v));
  let v = s && !used.has(s) ? s : null;
  if (!v) { let n = 0; do { n += 1; v = `w${String(n).padStart(2, '0')}`; } while (used.has(v)); }
  wardSlugs.set(k, v);
}

for (const { it, city, ward, slug } of plan) {
  const old = it.citySlug;
  const id = it.f.id.startsWith(`${old}-`) ? `${slug}-${it.f.id.slice(old.length + 1)}` : it.f.id;
  const to = join(FEST, it.prefSlug, slug, `${id}.yml`);
  console.log(`${it.f.area.city} → ${city} / ${ward}　（${it.prefSlug}/${old} → ${it.prefSlug}/${slug}）`);
  if (!APPLY) continue;
  it.f.area.city = city;
  it.f.area.ward = ward;
  it.f.id = id;
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, stringify(it.f, { lineWidth: 0 }), 'utf8');
  if (existsSync(it.path) && it.path !== to) unlinkSync(it.path);
}

// --- エリア定義に市と区を登録する -------------------------------------------
// これをやらないと、次の取り込みが「此花区」を市として作り直す
if (APPLY) {
  const byCity = new Map();
  for (const { city, ward, slug } of plan) {
    if (!byCity.has(city)) byCity.set(city, { slug, wards: new Map() });
    byCity.get(city).wards.set(ward, wardSlugs.get(`${city}|${ward}`));
  }
  const file = join(AREAS, 'nationwide.yml');
  const docs = parseAllDocuments(readFileSync(file, 'utf8')).map((d) => d.toJS());
  for (const [city, info] of byCity) {
    const pref = plan.find((p) => p.city === city).it.f.area.pref;
    const ps = byName(pref)?.slug;
    let doc = docs.find((d) => (d.slug ?? byName(d.pref)?.slug) === ps);
    if (!doc) { doc = { pref, cities: [] }; docs.push(doc); }
    doc.cities = doc.cities ?? [];
    // 区を市として登録してしまっていた行を消す
    doc.cities = doc.cities.filter((c) => !(c.name.startsWith(city) && c.name !== city && c.name.endsWith('区')));
    const wards = [...info.wards].map(([name, slug]) => ({ name, slug }));
    const hit = doc.cities.find((c) => c.name === city);
    if (hit) { hit.slug = info.slug; hit.wards = wards; }
    else doc.cities.push({ name: city, slug: info.slug, wards });
  }
  const sep2 = `---${'\n'}`;
  writeFileSync(file, docs.map((d) => stringify(d, { lineWidth: 0 })).join(sep2), 'utf8');
}

console.log(`\n${APPLY ? '直した' : '直す候補'}: ${moved} 件`
  + `${APPLY ? '' : '\n（--apply で実行）'}`);
