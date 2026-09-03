/**
 * クロール結果からエリア定義（data/areas/*.yml）を自動生成する。
 *
 *   node scripts/gen-areas.mjs <pref>
 *
 * 都県を足すたびに市区町村を手で書き並べるのは現実的でないので、
 * 神社庁の住所データに出てくる市区町村を集めて作る。
 * slug は scripts/lib/romaji.mjs の表を引く。表にないものは警告を出して落とす
 * （当て字の slug を勝手に作ると、あとから直せなくなるため）。
 *
 * すでにある area ファイル（神奈川の政令市など手で書いたもの）は上書きしない。
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { citySlug, wardSlug } from './lib/romaji.mjs';
import { loadAreaList } from './lib/areas.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const PREF = {
  saitama: { name: '埼玉県', file: 'saitama-cities.yml', source: 'https://www.saitama-jinjacho.or.jp/' },
  tokyo: { name: '東京都', file: 'tokyo-cities.yml', source: 'http://www.tokyo-jinjacho.or.jp/' },
  kanagawa: { name: '神奈川県', file: 'kanagawa-generated.yml', source: 'https://www.kanagawa-jinja.or.jp/' },
  // 愛知は nationwide.yml が 47 市区町村を先に定義しているので、
  // ここで作るのはそこに無かったぶんだけになる
  aichi: { name: '愛知県', file: 'aichi-cities.yml', source: 'https://www.aichi-jinjacho.or.jp/' },
  hiroshima: { name: '広島県', file: 'hiroshima-cities.yml', source: 'https://www.hiroshima-jinjacho.jp/hirosima_jinja/' },
  hyogo: { name: '兵庫県', file: 'hyogo-cities.yml', source: 'https://www.hyogo-jinjacho.com/' },
  hokkaido: { name: '北海道', file: 'hokkaido-cities.yml', source: 'https://hokkaidojinjacho.jp/jinja' },
};

const pref = process.argv[2];
const P = PREF[pref];
if (!P) {
  console.error(`使い方: node scripts/gen-areas.mjs <${Object.keys(PREF).join('|')}>`);
  process.exit(1);
}

// すでに area ファイルで定義済みの市町村は触らない。
// ただし自分の出力ファイルは除く（含めると実行のたびに中身が消えていく）
const defined = new Set();
for (const a of loadAreaList(ROOT)) {
  if (a.file !== P.file) defined.add(a.city);
}

const dir = join(ROOT, 'data', 'raw', 'jinjacho', pref);
if (!existsSync(dir)) {
  console.error(`${dir} がない。先に crawl を回すこと`);
  process.exit(1);
}

const found = new Map(); // 市町村名 -> Set<区名>
const hints = new Map(); // 市町村名 -> URL 由来の slug
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const s = JSON.parse(readFileSync(join(dir, f), 'utf8'));
  const p = s.addressParts ?? [];
  if (!p.length) continue;
  let city = null; let ward = null;
  if (p[0]?.endsWith('郡')) city = p[1];
  else if (p[0]?.endsWith('市') && p[1]?.endsWith('区')) { city = p[0]; ward = p[1]; }
  else city = p[0];
  if (!city) continue;
  if (s.city) city = s.city; // 東京はページに自治体名が入っている
  if (!found.has(city)) found.set(city, new Set());
  if (ward) found.get(city).add(ward);
  if (s.citySlugHint) hints.set(city, s.citySlugHint);
}

const cities = [];
const missing = [];
for (const [name, wards] of [...found].sort((a, b) => a[0].localeCompare(b[0], 'ja'))) {
  // エリア定義が郡を落とした形（「江差町」）で既に持っていることがある。
  // 郡付きで足すと同じ町が 2 つのエリアになるので、その場合は足さない
  if (defined.has(name)) continue;
  if (/^.{1,6}郡./.test(name) && defined.has(name.replace(/^.{1,6}郡/, ''))) continue;
  // URL に自治体のローマ字が入っている都県は、それをそのまま slug にする
  const slug = hints.get(name) ?? citySlug(name);
  if (!slug) { missing.push(name); continue; }
  const entry = { name, slug };
  if (wards.size) {
    const ws = [];
    for (const w of [...wards].sort((a, b) => a.localeCompare(b, 'ja'))) {
      const s = wardSlug(name, w);
      if (!s) { missing.push(`${name} ${w}`); continue; }
      ws.push({ name: w, slug: s });
    }
    if (ws.length) entry.wards = ws;
  }
  entry.sources = [{ name: `${P.name}神社庁`, url: P.source, type: 'official' }];
  cities.push(entry);
}

const out = join(ROOT, 'data', 'areas', P.file);
const doc = { pref: P.name, cities };
const header = `# ${P.name}のエリア定義。scripts/gen-areas.mjs が神社庁のクロール結果から生成する。\n` +
  `# 手で書いた area ファイルで定義済みの市町村は含めない。\n`;
writeFileSync(out, header + stringify(doc, { lineWidth: 0 }), 'utf8');

console.log(`${P.name}: ${cities.length} 市区町村を ${P.file} に書き出し`);
if (missing.length) {
  console.warn(`  ! romaji.mjs に slug がない（取り込まれない）: ${[...new Set(missing)].join(', ')}`);
}
