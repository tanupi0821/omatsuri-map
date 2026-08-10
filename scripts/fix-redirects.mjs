/**
 * 生きているページを転送で潰していないか点検する
 *
 *   node scripts/fix-redirects.mjs [--apply]
 *
 * `public/_redirects` は、置き場所を直したときにできた古い URL の転送先を書く。
 * ところが**その後の作業で、古い slug が別の市に割り当て直されることがある**。
 * すると「いまは生きているページ」が転送規則に残ったままになり、
 * サイトマップに載っているのに 301 が返る。
 * Search Console はこれを「ページにリダイレクトがあります」として
 * インデックス未登録の理由に挙げる。
 *
 * サイトマップと突き合わせて、生きている URL への規則を落とす。
 * **`npm run build` のあとに流すこと**（サイトマップが要る）。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './import/_lib.mjs';

const APPLY = process.argv.includes('--apply');
const RED = join(ROOT, 'public', '_redirects');
const SITEMAP = join(ROOT, 'dist', 'sitemap-0.xml');

if (!existsSync(SITEMAP)) {
  console.error('dist/sitemap-0.xml が無い。先に npm run build を流すこと');
  process.exit(1);
}
const live = new Set(
  [...readFileSync(SITEMAP, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].replace('https://omatsuri-map.com', '')),
);

const lines = readFileSync(RED, 'utf8').split('\n');
const kept = []; let dropped = 0;
for (const l of lines) {
  if (!l.startsWith('/')) { kept.push(l); continue; }
  const [from] = l.split(/\s+/);
  if (live.has(from)) {
    console.log(`生きているので転送しない: ${from}`);
    dropped++;
    continue;
  }
  kept.push(l);
}
if (APPLY) writeFileSync(RED, kept.join('\n'), 'utf8');
console.log(`\n${APPLY ? '落とした' : '落とす候補'}: ${dropped} 本${APPLY ? '' : '\n（--apply で実行）'}`);
