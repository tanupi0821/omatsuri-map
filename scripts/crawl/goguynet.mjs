/**
 * 号外NET の地域版から町会レベルの祭りを集める
 *
 *   node scripts/crawl/goguynet.mjs [--limit 30] [--only arakawa]
 *
 * **地域版が 285 ある**（北関東や地方都市も含む）。しかも WordPress の
 * REST API が開いていて、検索語つきで記事を引ける。
 * 記事は「【荒川区】8月22日（土）、第三回南千住中央町会・盆踊り大会が…」のように
 * 題名に日付と町会名が入っていて、本文に屋台の有無まで書いてあることがある。
 *
 * ここまで調べた中で、**町内会レベルが全国規模で取れる唯一の入口**。
 * 行政の一覧（江戸川・足立・葛飾など）は区が作っている所にしか無い。
 *
 * 出力: data/raw/goguynet/<area>.json（生データ。選別と日付解釈は import 側）
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'goguynet');
const DELAY_MS = 1500;
const UA = 'matsuri-map/0.1 (local festival directory; polite crawler)';
// 祭りらしい記事だけを引く検索語
const TERMS = [
  '盆踊り', '夏祭り', '夏まつり', '縁日', '例大祭',
  // 増やした分。秋祭りや神社の祭礼は最初の 5 語では引けていなかった
  '盆おどり', '祭礼', '秋祭り', '秋まつり', '夜店', '納涼', '神社 祭',
  // さらに追加。神社の大祭と、北関東に多い天王祭・祇園祭は上の語では引けない
  '大祭', '天王祭', '祇園祭', '花火大会',
];

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const LIMIT = Number(arg('--limit', Infinity));
const ONLY = arg('--only', null);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (h) => String(h ?? '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim();

async function get(url, attempt = 0) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (r.ok) return r.json();
  if (attempt === 0 && [429, 503].includes(r.status)) {
    await sleep(30000);
    return get(url, 1);
  }
  throw new Error(String(r.status));
}

/**
 * 地域版の一覧はトップページのリンクから拾う。
 * 都道府県の見出しごとに区切られているので、その対応も一緒に取って保存する
 * （地域版の slug からは県が分からないため）。
 */
async function listAreas() {
  const r = await fetch('https://goguynet.jp/', { headers: { 'User-Agent': UA } });
  const t = await r.text();

  const map = new Map(); // area -> {pref, label}
  let pref = null;
  const re = /<div class="area-label"><span>([^<]+)<\/span>|<a href="https?:\/\/([a-z0-9-]+)\.goguynet\.jp[^"]*">([^<]*?)(?:<span|<\/a>)/g;
  for (const m of t.matchAll(re)) {
    if (m[1]) { pref = m[1].trim(); continue; }
    if (!m[2] || !pref) continue;
    if (!map.has(m[2])) map.set(m[2], { pref, label: m[3].trim() });
  }
  writeFileSync(join(OUT, '_areas.json'), JSON.stringify([...map], null, 1), 'utf8');
  return [...map.keys()];
}

mkdirSync(OUT, { recursive: true });

const areas = ONLY ? [ONLY] : await listAreas();
console.log(`地域版 ${areas.length} 件`);

let done = 0; let total = 0;
for (const area of areas.slice(0, LIMIT === Infinity ? areas.length : LIMIT)) {
  const path = join(OUT, `${area}.json`);

  // 検索語を増やしたときに全部取り直すと無駄なので、
  // 取得済みの語は飛ばして足りない分だけ引く
  const prev = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
  const doneTerms = new Set(prev?.terms ?? []);
  const todo = TERMS.filter((t) => !doneTerms.has(t));
  if (prev && !todo.length) continue;

  const posts = new Map((prev?.items ?? []).map((x) => [x.id, x]));
  try {
    for (const term of todo) {
      const url = `https://${area}.goguynet.jp/wp-json/wp/v2/posts`
        + `?per_page=30&search=${encodeURIComponent(term)}&after=2026-04-01T00:00:00`;
      for (const p of await get(url)) {
        posts.set(p.id, {
          id: p.id,
          title: strip(p.title?.rendered),
          date: p.date?.slice(0, 10) ?? null,
          url: p.link,
          excerpt: strip(p.excerpt?.rendered).slice(0, 400),
          // 屋台の有無は本文にしか書かれていないことが多い
          body: strip(p.content?.rendered).slice(0, 2000),
        });
      }
      await sleep(DELAY_MS);
    }
    const items = [...posts.values()];
    writeFileSync(path, JSON.stringify({ area, terms: TERMS, items }, null, 1), 'utf8');
    if (items.length) console.log(`${area.padEnd(28)} ${items.length} 件`);
    total += items.length;
    done++;
  } catch (e) {
    console.warn(`${area}: ${e.message}`);
  }
}

console.log(`完了: ${done} 地域 / 記事 ${total} 件`);
