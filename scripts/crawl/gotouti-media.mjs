/**
 * 名鑑（gotouti-index）で見つけた地域メディアから祭りの記事を集める
 *
 *   node scripts/crawl/gotouti-media.mjs [--workers 6] [--limit 100] [--only <host>]
 *
 * 「◯◯つーしん」や号外NET を 1 件ずつ手で足していたのを、名鑑の
 * **プラットフォーム欄が WordPress の媒体**に対して機械的に広げる。
 *
 * 守ること（docs/kanto-plan.md）:
 *  - robots.txt を読み、`/wp-json/` が Disallow なら触らない
 *  - **Content-Signal に ai-train=no があれば使わない**
 *  - `search=zzzqqqxxx` で 0 件が返ることを確かめる。**search を無視する媒体があり、
 *    気づかず回すと全記事を祭りとして取り込む**
 *  - 同じホストへの間隔は 2 秒以上（Crawl-delay があればそちらに従う）
 *
 * 並列は**ホスト単位**。1 ホストの中は必ず直列で、間隔も守る。
 * 相手が違えば同時に叩いても相手の負荷にはならない。
 *
 * 出力: data/raw/gotouti/media/<host>.json（1 ホスト 1 ファイル。再開できる）
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { strip } from '../import/_article.mjs';
import { PREFS } from '../lib/prefs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(ROOT, 'data', 'raw', 'gotouti');
const OUT = join(DIR, 'media');
const UA = 'matsuri-map/0.1 (local festival directory; polite crawler)';

const TERMS = ['盆踊り', '夏祭り', '夏まつり', '縁日', '納涼', '例大祭', '秋祭り', '夜店'];
const MIN_DELAY = 2000;

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const WORKERS = Number(arg('--workers', 6));
const LIMIT = Number(arg('--limit', 0));
const ONLY = arg('--only', null);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 既に別の入口で取り込んでいる媒体。二重に叩かない。
 * 号外NET・レアリア・東京フェスタ・つーしん系・まいぷれ。
 */
const ALREADY = [
  'goguynet.jp', 'rarea.events', 'tokyofesta.com', 'mypl.net',
  'nishi2.jp', 'sumi2.jp', 'hira2.jp', 'ashi2.jp', 'sakai-news.jp',
  'p-mom.net', 'akashi-journal.com', 'budou-chan.jp', 'higashinada-journal.com',
  'hakodate-event.com', 'kurumefan.com', 'higashihiroshima-digital.com',
  'walkerplus.com', 'chokai.info',
];

/**
 * 使わないと決めた媒体（docs/kanto-plan.md）。
 * robots の Content-Signal でも弾けるが、名前でも落としておく。
 */
const BLOCKED = [
  'omatsurijapan.com', 'yaokami.jp', 'kisspress.jp', 'iko-yo.net',
  'fupo.jp', 'mainichi-michiko.jp', 'izu-sunto.jp',
];
const BLOCKED_NAMES = ['祭の日', '八百万の神', 'Kiss PRESS', 'いこーよ', 'ふーぽ', 'まいにちみちこ', '伊豆駿東まっぷ'];

const PREF_NAMES = PREFS.map((p) => p.name);

// ---------------------------------------------------------------------------
// robots.txt
// ---------------------------------------------------------------------------

/**
 * robots.txt を読んで {allowed, delayMs, aiTrainNo} を返す。
 * User-agent: * の塊と、自分を名指しした塊の両方を見る。
 * **Content-Signal は robots.txt の中にコメント風の行として書かれる**ので
 * ファイル全体から探す。
 */
async function robots(host) {
  let text = '';
  try {
    const r = await fetch(`https://${host}/robots.txt`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(20000),
    });
    // robots.txt が無い（404）＝制限なし
    if (r.status === 404) return { allowed: true, delayMs: MIN_DELAY, aiTrainNo: false };
    if (!r.ok) return { allowed: true, delayMs: MIN_DELAY, aiTrainNo: false };
    text = await r.text();
  } catch (e) {
    // **名鑑には既に消えた媒体が混ざっている**。DNS が引けないものは
    // 「robots が読めない」ではなく「媒体が無い」。理由を分けて記録する
    const code = e?.cause?.code ?? e?.name ?? '';
    const gone = code === 'ENOTFOUND' || code === 'ENOTFOUND' || /getaddrinfo/.test(String(e?.cause?.message ?? ''));
    return { allowed: false, delayMs: MIN_DELAY, aiTrainNo: false, err: gone ? '媒体が消えている（DNS不可）' : `robots取得不可 (${code})` };
  }
  // HTML が返ってきたら robots.txt ではない（SPA の 200 ページ）
  if (/<html/i.test(text)) return { allowed: true, delayMs: MIN_DELAY, aiTrainNo: false };

  const aiTrainNo = /content-signal[^\n]*ai-train\s*=\s*no/i.test(text)
    || /ai-train\s*=\s*no/i.test(text);

  const lines = text.split(/\r?\n/).map((l) => l.replace(/#.*$/, '').trim());
  // `User-agent: *` の塊だけを見る。自分の名前を名指しした塊は普通は無い
  let applies = false;
  const disallow = [];
  let delay = 0;
  for (const l of lines) {
    const m = l.match(/^([A-Za-z-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const val = m[2].trim();
    if (key === 'user-agent') { applies = val === '*'; continue; }
    if (!applies) continue;
    if (key === 'disallow' && val) disallow.push(val);
    if (key === 'crawl-delay') delay = Math.max(delay, Number(val) * 1000 || 0);
  }
  const blocked = disallow.some((d) => '/wp-json/'.startsWith(d) || d === '/');
  return { allowed: !blocked, delayMs: Math.max(MIN_DELAY, delay), aiTrainNo };
}

// ---------------------------------------------------------------------------
// 候補づくり
// ---------------------------------------------------------------------------

const index = JSON.parse(readFileSync(join(DIR, 'index.json'), 'utf8')).items;

const hostOf = (u) => {
  try { return new URL(u).host.replace(/^www\./, ''); } catch { return null; }
};
// 実際に接続するホストは**元の URL のまま**（www を落とすと引けない媒体がある）
const realHostOf = (u) => { try { return new URL(u).host; } catch { return null; } };

const candidates = [];
const seenHost = new Set();
for (const it of index) {
  if (!/wordpress/i.test(it.platform)) continue;
  const host = hostOf(it.url);
  if (!host) continue;
  if (seenHost.has(host)) continue;
  if (ALREADY.some((a) => host === a || host.endsWith(`.${a}`))) continue;
  if (BLOCKED.some((a) => host === a || host.endsWith(`.${a}`))) continue;
  if (BLOCKED_NAMES.some((n) => it.name.includes(n))) continue;
  // 行政区域から都道府県が読めないものは市区町村を決められないので後回し
  const prefs = [...new Set(it.areas.map((a) => PREF_NAMES.find((p) => a.startsWith(p))).filter(Boolean))];
  if (!prefs.length) continue;
  seenHost.add(host);
  candidates.push({ host, realHost: realHostOf(it.url), name: it.name, areas: it.areas, prefs, url: it.url, operator: it.operator });
}

console.log(`候補 ${candidates.length} 媒体（WordPress・行政区域あり・未取得）`);

mkdirSync(OUT, { recursive: true });
const fileOf = (host) => join(OUT, `${host.replace(/[^a-z0-9.-]/gi, '_')}.json`);

let todo = candidates.filter((c) => {
  if (ONLY) return c.host === ONLY;
  const f = fileOf(c.host);
  if (!existsSync(f)) return true;
  try {
    const prev = JSON.parse(readFileSync(f, 'utf8'));
    // 取得済みの語が揃っていれば飛ばす。語を増やしたときは足りない分だけ引く
    return TERMS.some((t) => !(prev.terms ?? []).includes(t));
  } catch { return true; }
});
if (LIMIT) todo = todo.slice(0, LIMIT);
console.log(`今回 ${todo.length} 媒体を回す（並列 ${WORKERS}）`);

// ---------------------------------------------------------------------------

async function getJson(url, timeout = 20000) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(timeout) });
  if (!r.ok) throw new Error(String(r.status));
  const total = Number(r.headers.get('x-wp-total') ?? -1);
  const pages = Number(r.headers.get('x-wp-totalpages') ?? 1);
  if (!/json/i.test(r.headers.get('content-type') ?? '')) throw new Error('JSONでない（HTMLが返った）');
  const rows = await r.json();
  if (!Array.isArray(rows)) throw new Error('JSONでない');
  return { rows, total, pages };
}

function save(c, extra) {
  writeFileSync(fileOf(c.host), JSON.stringify({
    host: c.host, name: c.name, areas: c.areas, prefs: c.prefs, url: c.url,
    ...extra,
  }, null, 1), 'utf8');
}

async function crawlOne(c) {
  const prev = existsSync(fileOf(c.host))
    ? (() => { try { return JSON.parse(readFileSync(fileOf(c.host), 'utf8')); } catch { return null; } })()
    : null;

  const H = c.realHost ?? c.host;
  const rb = await robots(H);
  if (rb.aiTrainNo) { save(c, { skipped: 'Content-Signal ai-train=no', terms: TERMS, items: [] }); return 'ai-train=no'; }
  if (!rb.allowed) { save(c, { skipped: rb.err ?? 'robots で /wp-json/ が Disallow', terms: TERMS, items: [] }); return 'robots'; }
  const delay = rb.delayMs;
  await sleep(delay);

  // search が本当に効くか。無意味語で 0 件でなければ使わない
  let sane;
  try {
    sane = await getJson(`https://${H}/wp-json/wp/v2/posts?per_page=1&search=zzzqqqxxx&_fields=id`);
  } catch (e) {
    save(c, { skipped: `REST 不可 (${e.message})`, terms: TERMS, items: [] });
    return 'REST不可';
  }
  if (sane.total !== 0) {
    save(c, { skipped: `search が効かない（無意味語で ${sane.total} 件）`, terms: TERMS, items: [] });
    return 'search無効';
  }
  await sleep(delay);

  const posts = new Map((prev?.items ?? []).map((x) => [x.id, x]));
  const done = new Set(prev?.terms ?? []);
  for (const term of TERMS) {
    if (done.has(term)) continue;
    let page = 1; let pages = 1;
    do {
      const url = ep(`per_page=30&page=${page}&search=${encodeURIComponent(term)}`
        + '&after=2026-03-01T00:00:00&_fields=id,link,title,content,date');
      let res;
      try { res = await getJson(url); } catch { break; }
      pages = res.pages;
      for (const p of res.rows) {
        posts.set(p.id, {
          id: p.id,
          title: strip(p.title?.rendered),
          date: p.date?.slice(0, 10) ?? null,
          url: p.link,
          body: strip(p.content?.rendered).slice(0, 4000),
        });
      }
      await sleep(delay);
      page++;
    } while (page <= pages && page <= 3);
    done.add(term);
  }

  save(c, { terms: [...done], items: [...posts.values()] });
  return `${posts.size} 記事`;
}

let done = 0;
const stats = new Map();
async function worker(list) {
  for (const c of list) {
    let r;
    try { r = await crawlOne(c); } catch (e) { r = `失敗 ${e.message}`; save(c, { skipped: `失敗 ${e.message}`, terms: TERMS, items: [] }); }
    const key = /^\d+ 記事$/.test(r) ? '取得' : r;
    stats.set(key, (stats.get(key) ?? 0) + 1);
    done++;
    if (done % 10 === 0) console.log(`${done}/${todo.length} … ${[...stats].map(([k, v]) => `${k}:${v}`).join(' ')}`);
  }
}

// ホストを順番に配って、同じホストが 2 つの worker に入らないようにする
const buckets = Array.from({ length: WORKERS }, () => []);
todo.forEach((c, i) => buckets[i % WORKERS].push(c));
await Promise.all(buckets.map(worker));

console.log(`完了 ${done} 媒体`);
console.log([...stats].