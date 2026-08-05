/**
 * 東京フェスタ（tokyofesta.com）から祭りの記事を集める
 *
 *   node scripts/crawl/tokyofesta.mjs
 *
 * 東京の祭り専門の媒体。WordPress の REST API が開いている。
 * 記事の書き方が号外NET・レアリアより整っていて、本文が箇条書きになっている:
 *
 *   日時：2026年8月28日(金)〜29日(土) 18:30～20:30
 *   会場：京橋中央ひろば（ガレリア）
 *   主催：京橋一の部連合町会
 *
 * **主催が町会名で書かれている**ので、町内会の祭りかどうかが判別できる。
 *
 * 出力: data/raw/tokyofesta/posts.json
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { strip } from '../import/_article.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'tokyofesta');
const DELAY_MS = 1500;
const UA = 'matsuri-map/0.1 (local festival directory; polite crawler)';
const PER_PAGE = 50;

const TERMS = [
  '盆踊り', '夏祭り', '夏まつり', '縁日', '例大祭',
  '盆おどり', '祭礼', '秋祭り', '納涼', '花火大会', '神社',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, attempt = 0) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (r.ok) return { rows: await r.json(), pages: Number(r.headers.get('x-wp-totalpages') ?? 1) };
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
    const url = 'https://tokyofesta.com/wp-json/wp/v2/posts'
      + `?per_page=${PER_PAGE}&page=${page}&search=${encodeURIComponent(term)}`
      + '&after=2026-03-01T00:00:00';
    let res;
    try {
      res = await get(url);
    } catch (e) {
      console.warn(`${term} p${page}: ${e.message}`);
      break;
    }
    pages = res.pages;
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
  } while (page <= pages && page <= 6);
  console.log(`${term.padEnd(6)} 累計 ${posts.size} 件`);
}

writeFileSync(path, JSON.stringify({ terms: TERMS, items: [...posts.values()] }, null, 1), 'utf8');
console.log(`完了: ${posts.size} 記事`);
