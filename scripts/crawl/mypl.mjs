/**
 * まいぷれ（地域情報サイト）の夏祭り特集を取ってくる
 *
 *   node scripts/crawl/mypl.mjs suginami koshigaya ...
 *
 * **robots.txt が Crawl-delay: 90 を宣言している。**必ず 90 秒あけること。
 * 速く回したくなるが、相手の指定を破ってまで取る価値のあるデータは無い。
 *
 * まいぷれは市区町村ごとに版があり、船橋版は町内会レベルの祭りが 8〜16 件／頁
 * 取れた（この種の媒体が町会レベルを拾える唯一の型）。
 *
 * 出力: data/raw/mypl/<area>.html（加工は import 側。HTML をそのまま残す）
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'mypl');
const CRAWL_DELAY_MS = 90000; // robots.txt の指定そのまま
const UA = 'matsuri-map/0.1 (local festival directory; polite crawler)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const areas = process.argv.slice(2);
if (!areas.length) {
  console.error('使い方: node scripts/crawl/mypl.mjs <area> [<area>...]');
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });

let first = true;
for (const area of areas) {
  const path = join(OUT, `${area}.html`);
  if (existsSync(path)) { console.log(`${area}: キャッシュ済み`); continue; }
  if (!first) await sleep(CRAWL_DELAY_MS);
  first = false;

  const url = `https://${area}.mypl.net/article/summer-fes_${area}`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) { console.warn(`${area}: ${r.status}`); continue; }
    const html = await r.text();
    writeFileSync(path, html, 'utf8');
    console.log(`${area}: ${html.length} バイト`);
  } catch (e) {
    console.warn(`${area}: ${e.message}`);
  }
}
console.log('完了');
