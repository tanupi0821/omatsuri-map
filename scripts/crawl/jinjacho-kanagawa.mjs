/**
 * 神奈川県神社庁クローラ
 *
 *   node scripts/crawl/jinjacho-kanagawa.mjs [--limit N]
 *
 * 県神社庁は県内全神社の「祭礼」を、日付とセットで構造化して公開している。
 * サイトマップに全神社ページが載っているので、そこから機械的に舐める。
 *
 * 作法:
 *  - robots.txt を確認済み（Disallow は /cms/wp-admin/ のみ、sitemap 公開）
 *  - 1 リクエストごとに間隔を空ける
 *  - User-Agent で素性と連絡先を名乗る
 *  - 取得済みはディスクにキャッシュして二度と取りにいかない（中断しても再開できる）
 *
 * 出力: data/raw/jinjacho/kanagawa/<id>.json（生データ。ここでは加工しない）
 */
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'jinjacho', 'kanagawa');
const BASE = 'https://www.kanagawa-jinja.or.jp';
const DELAY_MS = 700;
// HTTP ヘッダは ASCII のみ。日本語を入れると fetch が落ちる
const UA = 'matsuri-map/0.1 (local festival directory; collecting public reisai dates; polite crawler)';

const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > 0 ? Number(process.argv[limitArg + 1]) : Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

/** サイトマップから神社ページの URL を集める。境内社（-001 以降）は除き、本社のみ */
async function shrineUrls() {
  const urls = new Set();
  for (const s of ['shrine-sitemap.xml', 'shrine-sitemap2.xml']) {
    const xml = await get(`${BASE}/${s}`);
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      if (/\/shrine\/\d+-000\/$/.test(m[1])) urls.add(m[1]);
    }
    await sleep(DELAY_MS);
  }
  return [...urls];
}

const strip = (h) =>
  h
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** 1 神社ページから 神社名・住所・祭礼一覧 を抜く */
function parse(html, url) {
  const name = strip((html.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? '')
    .replace(/\s*-\s*神奈川県神社庁\s*$/, '')
    // まれに title に管理用の神社 ID が入っている（「皇大神宮 1206021000」）。
    // そのまま通すと祭り名・会場名・主催にまで ID が漏れて、ページの題名が
    // 「藤沢市 皇大神宮 1206021000 例大祭」になる（実際に 4 件出た）
    .replace(/\s*\d{7,}\s*/g, ' ').trim();

  const addrRaw = (html.match(/<div class="address">([\s\S]*?)<\/div>/) ?? [])[1] ?? '';
  const addr = strip(addrRaw).replace(/^住所：\s*/, '');
  const zip = (addr.match(/〒\s*(\d{3}-\d{4})/) ?? [])[1] ?? null;
  // 「〒216-0015 川崎市 宮前区 菅生2-8-1」→ 市・区・以降
  const rest = addr.replace(/〒\s*\d{3}-\d{4}\s*/, '').trim();
  const parts = rest.split(/\s+/);

  const festivals = [];
  for (const m of html.matchAll(
    /<div class="festival-item[^"]*">\s*<div class="date-column">([\s\S]*?)<\/div>\s*<div class="info-column">([\s\S]*?)<\/div>\s*<\/div>/g,
  )) {
    const date = strip(m[1]);
    const info = m[2];
    const fname = strip((info.match(/<div class="name">([\s\S]*?)<\/div>/) ?? [])[1] ?? '');
    const alias = strip((info.match(/<div class="alias02">([\s\S]*?)<\/div>/) ?? [])[1] ?? '');
    if (date && fname) festivals.push({ date, name: fname, alias: alias || null });
  }

  return {
    id: (url.match(/\/shrine\/(\d+)-000\//) ?? [])[1],
    url,
    name,
    zip,
    address: rest || null,
    addressParts: parts,
    festivals,
  };
}

mkdirSync(OUT, { recursive: true });

const urls = await shrineUrls();
console.log(`サイトマップから本社 ${urls.length} 社`);

let fetched = 0;
let cached = 0;
let failed = 0;

for (const url of urls.slice(0, LIMIT === Infinity ? urls.length : LIMIT)) {
  const id = (url.match(/\/shrine\/(\d+)-000\//) ?? [])[1];
  const path = join(OUT, `${id}.json`);
  if (existsSync(path)) {
    cached++;
    continue;
  }
  try {
    const html = await get(url);
    writeFileSync(path, JSON.stringify(parse(html, url), null, 1), 'utf8');
    fetched++;
    if (fetched % 50 === 0) console.log(`  ${fetched} 社取得（キャッシュ済み ${cached}）`);
  } catch (e) {
    failed++;
    console.warn(`  ! ${url}: ${e.message}`);
  }
  await sleep(DELAY_MS);
}

console.log(`完了: 新規 ${fetched} / キャッシュ ${cached} / 失敗 ${failed}`);
void readFileSync;
