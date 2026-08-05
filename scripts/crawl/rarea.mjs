/**
 * レアリア（rarea.events）から祭りの記事を集める
 *
 *   node scripts/crawl/rarea.mjs
 *
 * 神奈川・東京を中心とした地域イベント媒体。号外NET と同じく WordPress の
 * REST API が開いている。**自治会・町内会が主催する祭り**を、
 * 縁日ブースやキッチンカーの記述つきで書いていることが多い。
 *
 * 題名に日付と市区町村が入っている:
 *   「2026年8月15日　厚木市　森の里若宮公園で夏祭り」
 *   「…8月16日は「富士見公園夏まつり」＠川崎市川崎区」
 *
 * 出力: data/raw/rarea/posts.json
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { strip } from '../import/_article.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'rarea');
const DELAY_MS = 1500;
const UA = 'matsuri-map/0.1 (local festival directory; polite crawler)';
const PER_PAGE = 50;

const TERMS = [
  '盆踊り', '夏祭り', '夏まつり', '縁日', '例大祭',
  '盆おどり', '祭礼', '秋祭り', '秋まつり', '夜店', '納涼', '花火大会',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, attempt = 0) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (r.ok) return { rows: await r.json(), total: Number(r.headers.get('x-wp-totalpages') ?? 1) };
  if (attempt === 0 && [429, 503].includes(r.status)) {
    await sleep(30000);
    return get(url, 1);
  }
  throw new Error(String(r.status));
}

mkdirSync(OUT, { recursive: true });
const path = join(OUT, 'posts.json');
const prev = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
const posts = new Map((prev?.items ?? []).map((x) => [x.id, x]));
const doneTerms = new Set(prev?.terms ?? []);

for (const term of TERMS) {
  if (doneTerms.has(term)) continue;
  let page = 1; let pages = 1;
  do {
    const url = 'https://rarea.events/wp-json/wp/v2/posts'
      + `?per_page=${PER_PAGE}&page=${page}&search=${encodeURIComponent(term)}`
      + '&after=2026-03-01T00:00:00';
    let res;
    try {
      res = await get(url);
    } catch (e) {
      console.warn(`${term} p${page}: ${e.message}`);
      break;
    }
    pages = res.total;
    for (const p of res.rows) {
      posts.set(p.id, {
        id: p.id,
        title: strip(p.title?.rendered),
        date: p.date?.slice(0, 10) ?? null,
        url: p.link,
        body: strip(p.content?.rendered).slice(0, 2500),
      });
    }
    await sleep(DELAY_MS);
    page++;
  } while (page <= pages && page <= 8);
  console.log(`${term.padEnd(6)} 累計 ${posts.size} 件`);
}

writeFileSync(path, JSON.stringify({ terms: TERMS, items: [...posts.values()] }, null, 1), 'utf8');
console.log(`完了: ${posts.size} 記事`);
