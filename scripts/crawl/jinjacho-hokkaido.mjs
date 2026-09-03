/**
 * 北海道神社庁クローラ
 *
 *   node scripts/crawl/jinjacho-hokkaido.mjs [--limit N] [--reparse]
 *
 * 支部ごとの一覧（`/jinja-area/<支部>/`、18 社ずつのページ送り）から神社ページを集め、
 * 神社ページの定義リストから **所在地・例祭日** を取る。
 *
 *   <dt>所在地</dt><dd><p class="zip-code">…</p><p class="address">…</p>…</dd>
 *   <dt>例祭日</dt><dd>7月15日</dd>
 *
 * 作法:
 *  - robots.txt を確認済み（Disallow は /wp/wp-admin/ のみ、sitemap 公開）
 *  - 1 リクエストごとに 900ms 空ける
 *  - User-Agent で素性を名乗る
 *  - 取得済みはディスクにキャッシュして二度と取りにいかない（中断しても再開できる）
 *  - **由緒・御朱印などの文章は取らない**
 *
 * 出力: data/raw/jinjacho/hokkaido/<slug>.json
 *       data/raw/jinjacho/hokkaido-index/urls.json（神社ページ URL の一覧）
 */
import { writeFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'jinjacho', 'hokkaido');
const CACHE_DIR = join(ROOT, 'data', 'raw', 'jinjacho', 'hokkaido-index');
const CACHE = join(CACHE_DIR, 'urls.json');
const BASE = 'https://hokkaidojinjacho.jp';
const DELAY_MS = 900;
// HTTP ヘッダは ASCII のみ
const UA = 'matsuri-map/0.1 (local festival directory; collecting public reisai dates; polite crawler)';

const AREAS = ['sapporo', 'dounan', 'hiyama', 'shiribeshi', 'sorachi', 'kamikawa', 'rumoi',
  'souya', 'abashiri', 'monbetsu', 'iburi', 'hidaka', 'tokachi', 'kushiro', 'nemuro'];

const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > 0 ? Number(process.argv[limitArg + 1]) : Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

const strip = (h) =>
  String(h ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * 「札幌市豊平区豊平4条13丁目1番18号」→ ["札幌市豊平区","豊平4条13丁目1番18号"]
 *
 * **市町村名は「最も短い 市／町／村 止まり」で切る。**
 * 欲張ると「北見市留辺蘂町」のような地名を市町村名だと思ってしまう。
 * 札幌市の区も郡部も、エリア定義が「札幌市豊平区」「余市郡余市町」の形で
 * 持っているので 1 つのまとまりにする。
 */
const SAPPORO_WARDS = ['中央区', '北区', '東区', '白石区', '豊平区', '南区', '西区',
  '厚別区', '手稲区', '清田区'];
function splitParts(address) {
  const a = String(address ?? '').replace(/\s+/g, '').replace(/^北海道/, '').trim();
  for (const w of SAPPORO_WARDS) {
    if (a.startsWith(`札幌市${w}`)) return [`札幌市${w}`, a.slice(`札幌市${w}`.length)].filter(Boolean);
  }
  const gun = a.match(/^(.{1,6}郡.{1,8}?[町村])(.*)$/);
  if (gun) return [gun[1], gun[2]].filter(Boolean);
  const m = a.match(/^(.{1,8}?[市町村])(.*)$/);
  if (!m) return a ? [a] : [];
  return [m[1], m[2]].filter(Boolean);
}

/** <dt>ラベル</dt><dd>値</dd> を引く */
function dd(html, label) {
  const m = html.match(new RegExp(`<dt>\\s*${label}\\s*</dt>\\s*<dd[^>]*>([\\s\\S]*?)</dd>`));
  return m ? m[1] : null;
}

function parse(html, url) {
  // 社名は <h3 class="type-02"><span>豊平神社</span></h3>。
  // title からも取れるが、そちらはサイト名が付く
  const name = strip((html.match(/<h3[^>]*class="type-02"[^>]*>([\s\S]*?)<\/h3>/i) ?? [])[1] ?? '')
    || strip((html.match(/<title>([^<]*?)\s*-\s*北海道神社庁/) ?? [])[1] ?? '');

  const addrBlock = dd(html, '所在地') ?? '';
  const zip = strip((addrBlock.match(/class="zip-code"[^>]*>([\s\S]*?)<\/p>/) ?? [])[1] ?? '') || null;
  const address = strip((addrBlock.match(/class="address"[^>]*>([\s\S]*?)<\/p>/) ?? [])[1] ?? '');

  const festivalDay = strip(dd(html, '例祭日') ?? '') || null;
  return {
    id: createHash('sha1').update(url).digest('hex').slice(0, 12),
    url,
    name,
    zip,
    address,
    addressParts: splitParts(address),
    // 交通機関は道順の文なので最寄駅としては使わない。取らない
    festivals: festivalDay ? [{ date: festivalDay, name: '例祭', alias: null }] : [],
  };
}

mkdirSync(OUT, { recursive: true });

if (process.argv.includes('--reparse')) {
  let n = 0;
  for (const f of readdirSync(OUT).filter((x) => x.endsWith('.json'))) {
    const p = join(OUT, f);
    const rec = JSON.parse(readFileSync(p, 'utf8'));
    const next = splitParts(rec.address);
    if (JSON.stringify(next) !== JSON.stringify(rec.addressParts)) {
      rec.addressParts = next;
      writeFileSync(p, JSON.stringify(rec, null, 1), 'utf8');
      n++;
    }
  }
  console.log(`addressParts を作り直した: ${n} 社`);
  process.exit(0);
}

/** 支部ごとの一覧を最後のページまでたどって、神社ページの URL を集める */
async function shrineUrls() {
  if (existsSync(CACHE)) return JSON.parse(readFileSync(CACHE, 'utf8'));
  const urls = new Set();
  for (const area of AREAS) {
    for (let page = 1; page <= 40; page++) {
      const url = page === 1 ? `${BASE}/jinja-area/${area}/` : `${BASE}/jinja-area/${area}/page/${page}/`;
      let html;
      try {
        html = await get(url);
      } catch {
        break; // 最終ページを越えた
      }
      const found = [...new Set(
        [...html.matchAll(/<a href="(https:\/\/hokkaidojinjacho\.jp\/%[^"]+\/)"/g)].map((m) => m[1]),
      )];
      found.forEach((u) => urls.add(u));
      await sleep(DELAY_MS);
      if (!/rel="next"/.test(html)) break;
    }
    console.log(`  ${area} まで: ${urls.size} 社`);
  }
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE, JSON.stringify([...urls], null, 1), 'utf8');
  return [...urls];
}

const urls = await shrineUrls();
console.log(`北海道神社庁: 神社ページ ${urls.length} 件`);

let fetched = 0; let cached = 0; let failed = 0; let noDate = 0;
for (const url of urls.slice(0, LIMIT === Infinity ? urls.length : LIMIT)) {
  const id = createHash('sha1').update(url).digest('hex').slice(0, 12);
  const path = join(OUT, `${id}.json`);
  if (existsSync(path)) { cached++; continue; }
  try {
    const rec = parse(await get(url), url);
    if (!rec.festivals.length) noDate++;
    writeFileSync(path, JSON.stringify(rec, null, 1), 'utf8');
    fetched++;
    if (fetched % 50 === 0) console.log(`  ${fetched} 社取得（キャッシュ ${cached} / 失敗 ${failed}）`);
  } catch (e) {
    failed++;
    console.warn(`  ! ${url}: ${e.message}`);
  }
  await sleep(DELAY_MS);
}

console.log(`完了: 新規 ${fetched} / キャッシュ ${cached} / 失敗 ${failed}（例祭日なし ${noDate}）`);
