/**
 * REST API が開いていない地域メディアを RSS から取る
 *
 *   node scripts/crawl/gotouti-rss.mjs [--workers 8] [--limit 50]
 *
 * 名鑑の 1,324 媒体のうち **353 は REST が閉じている**（WordPress でない、
 * セキュリティプラグインが塞いでいる、移転済みなど）。その多くは RSS を出している。
 *
 * **RSS には検索が無い。それがむしろ都合がよい。**
 * REST の `search` は「無意味語でも全件返す媒体がある」という落とし穴があったが、
 * RSS は新着をそのまま返すだけなので、**祭りかどうかの判定は全部こちら側**でやる。
 * 相手の検索実装を信用しなくてよくなる。
 *
 * 代わりに取れるのは**新着 10〜50 件だけ**。夏場は地域メディアの新着が
 * 祭りの記事で埋まるので、この時期なら歩留まりは悪くない。
 *
 * 出力は `data/raw/gotouti/rss/<host>.json`。**media/ と同じ形**にしてあるので
 * `scripts/import/gotouti.mjs` がそのまま読める。
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { strip } from '../import/_article.mjs';
import { robots, fetchMaybeHttp, UA } from './_robots.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(ROOT, 'data', 'raw', 'gotouti');
const OUT = join(DIR, 'rss');

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const WORKERS = Number(arg('--workers', 8));
const LIMIT = Number(arg('--limit', 0));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** よくある RSS の場所。上から順に試す */
const FEEDS = ['/feed/', '/rss', '/index.rdf', '/feed', '/atom.xml', '/rss.xml', '/?feed=rss2', '/feed/rss2'];

/**
 * 祭りの記事かどうか。**REST の検索語に相当するものを自分で持つ。**
 * ここで落としても取り込み側でもう一度判定するので、ここは広めでよい。
 */
const FESTIVAL = /盆踊り|盆おどり|夏祭り|夏まつり|納涼|縁日|例大祭|祭礼|秋祭り|秋まつり|夜店|夜市|花火大会|大祭|神輿|祇園祭|天王祭|まつり|祭り/;

const dec = (s) => String(s ?? '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
  .replace(/&amp;/g, '&');

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? dec(m[1]) : '';
};

/** RSS 2.0 / RDF / Atom のどれでも item を取り出す */
function parseFeed(xml) {
  const blocks = [
    ...xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi),
    ...xml.matchAll(/<entry[\s>][\s\S]*?<\/entry>/gi),
  ].map((m) => m[0]);
  return blocks.map((b) => {
    // Atom は <link href="…"/>、RSS は <link>…</link>
    const href = (b.match(/<link[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["']/i)
      ?? b.match(/<link[^>]*href=["']([^"']+)["']/i) ?? [])[1];
    const link = href ?? tag(b, 'link') ?? '';
    const date = tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date');
    const body = tag(b, 'content:encoded') || tag(b, 'content') || tag(b, 'description') || tag(b, 'summary');
    return {
      title: strip(tag(b, 'title')),
      url: link.trim(),
      date: date ? new Date(date).toISOString().slice(0, 10) : null,
      body: strip(body).slice(0, 4000),
    };
  }).filter((x) => x.title && x.url);
}

// ---------------------------------------------------------------------------

const mediaDir = join(DIR, 'media');
const targets = [];
for (const f of readdirSync(mediaDir)) {
  const j = JSON.parse(readFileSync(join(mediaDir, f), 'utf8'));
  // REST が塞がっている媒体だけ。REST で取れているものは二重に叩かない
  if (typeof j.skipped !== 'string') continue;
  if (!/^REST 不可|^search が効かない/.test(j.skipped)) continue;
  targets.push(j);
}
console.log(`REST が使えない媒体 ${targets.length} 件`);

mkdirSync(OUT, { recursive: true });
const fileOf = (host) => join(OUT, `${host.replace(/[^a-z0-9.-]/gi, '_')}.json`);

let todo = targets.filter((t) => !existsSync(fileOf(t.host)));
if (LIMIT) todo = todo.slice(0, LIMIT);
console.log(`今回 ${todo.length} 媒体（並列 ${WORKERS}）`);

function save(t, extra) {
  writeFileSync(fileOf(t.host), JSON.stringify({
    host: t.host, name: t.name, areas: t.areas, prefs: t.prefs, url: t.url, via: 'rss', ...extra,
  }, null, 1), 'utf8');
}

async function one(t) {
  const host = (() => { try { return new URL(t.url).host; } catch { return t.host; } })();

  const rb = await robots(host, '/feed/');
  if (rb.aiTrainNo) { save(t, { skipped: 'Content-Signal ai-train=no', items: [] }); return 'ai-train=no'; }
  if (!rb.allowed) { save(t, { skipped: rb.err ?? 'robots で feed が Disallow', items: [] }); return 'robots'; }
  const delay = rb.delayMs;
  await sleep(delay);

  for (const path of FEEDS) {
    let xml;
    try {
      const r = await fetchMaybeHttp(`https://${host}${path}`, 15000);
      await sleep(delay);
      if (!r.ok) continue;
      const ct = r.headers.get('content-type') ?? '';
      const text = await r.text();
      // HTML を 200 で返す媒体が多い。XML の宣言かルート要素で確かめる
      if (!/xml|rss|atom/i.test(ct) && !/^\s*<\?xml|<rss|<feed|<rdf:RDF/i.test(text)) continue;
      xml = text;
    } catch { continue; }

    const items = parseFeed(xml)
      // **祭りの記事だけに絞るのはこちらの仕事**（RSS には検索が無い）
      .filter((x) => FESTIVAL.test(x.title) || FESTIVAL.test(x.body))
      // 記事 id は URL から作る。数字が無ければ URL のハッシュ代わりに末尾を使う
      .map((x, i) => ({ id: (x.url.match(/(\d{3,})/) ?? [])[1] ?? `r${i}`, ...x }));

    save(t, { feed: path, terms: ['(RSS 新着)'], items });
    return `${items.length} 記事`;
  }
  save(t, { skipped: 'RSS が見つからない', items: [] });
  return 'RSSなし';
}

let done = 0;
const stats = new Map();
async function worker(list) {
  for (const t of list) {
    let r;
    try { r = await one(t); } catch (e) { r = `失敗 ${e.message}`; save(t, { skipped: `失敗 ${e.message}`, items: [] }); }
    const key = /^\d+ 記事$/.test(r) ? '取得' : r;
    stats.set(key, (stats.get(key) ?? 0) + 1);
    done++;
    if (done % 20 === 0) console.log(`${done}/${todo.length} … ${[...stats].map(([k, v]) => `${k}:${v}`).join(' ')}`);
  }
}

const buckets = Array.from({ length: WORKERS }, () => []);
todo.forEach((t, i) => buckets[i % WORKERS].push(t));
await Promise.all(buckets.map(worker));

console.log(`完了 ${done} 媒体`);
console.log([...stats].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join('\n'));
void UA;
