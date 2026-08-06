/**
 * 別の市区町村が同じ URL（＝同じディレクトリ）を共有していないか点検する
 *
 *   node scripts/audit-slug-collisions.mjs
 *
 * `_citySlug` は**エリア定義ではなくファイルの置き場所**から決まる
 * （`src/lib/data.js` がパスの 2 階層目を使う）ので、
 * 1 つのディレクトリに 2 つの市が入っていると URL が共有されてしまう。
 *
 * 書き換えはしない。`npm run collect` の前後でこれを流し、
 * **衝突が増えないこと**を確かめるために使う。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { ROOT } from './import/_lib.mjs';

const FEST = join(ROOT, 'data', 'festivals');

const dirs = new Map(); // `<pref>/<city>` -> Map<市区町村名, 件数>
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;
    // YAML を全部パースすると遅いので「  city: ◯◯」の行だけ見る
    const m = readFileSync(p, 'utf8').match(/^ {2}city:\s*(.+)$/m);
    if (!m) continue;
    const rel = relative(FEST, p).split(sep);
    const key = `${rel[0]}/${rel[1]}`;
    if (!dirs.has(key)) dirs.set(key, new Map());
    const c = dirs.get(key);
    const city = m[1].trim();
    c.set(city, (c.get(city) ?? 0) + 1);
  }
}(FEST));

let bad = 0;
let files = 0;
const lines = [];
for (const [d, m] of [...dirs].sort()) {
  if (m.size < 2) continue;
  bad++;
  files += [...m.values()].reduce((a, b) => a + b, 0);
  lines.push(`  /a/${d}/ → ${[...m].map(([k, v]) => `${k}:${v}`).join(', ')}`);
}

// 逆向き（同じ市が複数のディレクトリに散っている）も見る。
// こちらは「同じ祭りが 2 つの URL で出る」形の被害になる
const byCity = new Map();
for (const [d, m] of dirs) {
  for (const [city] of m) {
    const pref = d.split('/')[0];
    const k = `${pref}|${city}`;
    if (!byCity.has(k)) byCity.set(k, new Set());
    byCity.get(k).add(d);
  }
}
const split = [...byCity].filter(([, v]) => v.size > 1);

console.log(lines.join('\n'));
console.log(`\n別の市が同じ URL: ${bad} ディレクトリ / ${files} 件`);
console.log(`同じ市が複数の URL に散っている: ${split.length} 市区町村`);
for (const [k, v] of split.slice(0, 20)) console.log(`  ${k} → ${[...v].join(', ')}`);
process.exitCode = 0;
