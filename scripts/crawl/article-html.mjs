/**
 * 既に取り込んだ地域メディア記事の **HTML のまま** を取り直す
 *
 *   node scripts/crawl/article-html.mjs [--only tokyofesta.com] [--force]
 *
 * なぜ取り直すか:
 * crawl/goguynet.mjs と crawl/rarea.mjs・crawl/tokyofesta.mjs は
 * `strip()` でタグを落としてから保存している。そのため
 *
 *   - Google マップ埋め込みの iframe（**住所と緯度経度はここにしか無い**）
 *   - <a href> の外部リンク（主催者の公式サイト）
 *
 * が生データに残っていない。本文だけ見ても住所は 5% しか書かれていないが、
 * マップ埋め込みは大半の記事に付いている。ここを取るために HTML を保存し直す。
 *
 * 対象は **既にデータになっている記事だけ**（data/festivals の
 * `-goguynet-` / `-rarea-` / `-tokyofesta-` の id）。
 * 新しい記事は探さないので、WordPress の search は使わない
 *（`include=` で id 指定して引く。1 サイト 1 リクエストで済む）。
 *
 * robots.txt は 3 媒体とも /wp-admin/ のみ Disallow、Content-Signal の
 * 指定も無いことを確認済み（2026-08-05）。
 *
 * 出力: data/raw/article-html/<host>.json
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'article-html');
const DELAY_MS = 2100; // 2 秒以上あける
const UA = 'matsuri-map/0.1 (local festival directory; polite crawler)';

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const ONLY = arg('--only', null);
const FORCE = process.argv.includes('--force');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 対象の id。号外NET・レアリア・東京フェスタに加えて、
 * **名鑑（gotouti）とつーしん系**も通す。中身が空のページを減らすには
 * 新しい媒体こそ地図の埋め込みを読む必要がある。
 *
 * RSS から取った記事（id が `-r123` の形）は WordPress の記事 id が無いので
 * `include=` で引けない。`-\d+$` に当たらないので自然に外れる。
 *
 * robots.txt と Content-Signal は `crawl/gotouti-media.mjs` が
 * 同じ `/wp-json/` に対して確認済み。そこを通った媒体だけがデータになっている。
 */
const ARTICLE_ID = /-(?:goguynet|rarea|tokyofesta)-\d+$|-(?:gotouti|tsushin)-[a-z0-9._-]+-\d+$/;


function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e.endsWith('.yml')) out.push(p);
  }
  return out;
}

// 対象の記事 id をホストごとに集める。goguynet は地域版ごとに別サイトなので
// ホスト＝WordPress のインスタンス 1 個になる
const byHost = new Map();
for (const p of walk(join(ROOT, 'data', 'festivals'))) {
  const b = basename(p, '.yml');
  if (!ARTICLE_ID.test(b)) continue;
  const postId = b.match(/-(\d+)$/)[1];
  const f = parse(readFileSync(p, 'utf8'));
  const url = f.occurrences?.[0]?.source_url;
  if (!url) continue;
  let host;
  try { host = new URL(url).host; } catch { continue; }
  if (!byHost.has(host)) byHost.set(host, new Set());
  byHost.get(host).add(postId);
}

mkdirSync(OUT, { recursive: true });

const hosts = [...byHost.keys()].filter((h) => !ONLY || h === ONLY).sort();
console.log(`対象 ${hosts.length} サイト / 記事 ${[...byHost.values()].reduce((a, s) => a + s.size, 0)} 件`);

let fetched = 0; let cached = 0; let failed = 0;

for (const host of hosts) {
  const ids = [...byHost.get(host)];
  const path = join(OUT, `${host}.json`);

  // 取得済みなら飛ばす。ディスクのキャッシュを必ず先に見る
  if (!FORCE && existsSync(path)) {
    const prev = JSON.parse(readFileSync(path, 'utf8'));
    const have = new Set(prev.items.map((x) => String(x.id)));
    if (ids.every((i) => have.has(i))) { cached += ids.length; continue; }
  }

  const items = [];
  // per_page は 100 まで。1 サイトの対象はせいぜい十数件なので 1 回で足りる
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    /**
     * **`/wp-json/` を塞いでいても `?rest_route=` は開いている媒体がある**
     * （セキュリティプラグインが前者だけを弾く）。名鑑経由の媒体に多い。
     */
    const q = `include=${chunk.join(',')}&per_page=100&_fields=id,link,date,title,content`;
    const urls = [
      `https://${host}/wp-json/wp/v2/posts?${q}`,
      `https://${host}/?rest_route=/wp/v2/posts&${q}`,
    ];
    try {
      let rows = null;
      let last = '';
      for (const u of urls) {
        try {
          const r = await fetch(u, { headers: { 'User-Agent': UA } });
          if (!r.ok) { last = String(r.status); continue; }
          if (!/json/i.test(r.headers.get('content-type') ?? '')) { last = 'JSONでない'; continue; }
          const j = await r.json();
          if (Array.isArray(j)) { rows = j; break; }
          last = 'JSONでない';
        } catch (e) { last = e.message; }
        await sleep(DELAY_MS);
      }
      if (!rows) throw new Error(last || '取得できない');
      for (const p of rows) {
        items.push({
          id: p.id,
          url: p.link,
          date: p.date?.slice(0, 10) ?? null,
          title: p.title?.rendered ?? '',
          html: p.content?.rendered ?? '',
        });
      }
    } catch (e) {
      console.warn(`${host}: ${e.message}`);
      failed += chunk.length;
    }
    await sleep(DELAY_MS);
  }

  if (items.length) {
    writeFileSync(path, JSON.stringify({ host, items }, null, 1), 'utf8');
    fetched += items.length;
  }
}

console.log(`完了: 新規取得 ${fetched} / キャッシュ済み ${cached} / 失敗 ${failed}`);
