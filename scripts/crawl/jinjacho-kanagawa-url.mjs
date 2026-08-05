/**
 * 神奈川県神社庁の神社ページから「公式サイト」の URL だけを取り直す。
 *
 *   node scripts/crawl/jinjacho-kanagawa-url.mjs [--limit N]
 *
 * なぜ取り直すか:
 *   最初のクロール（`jinjacho-kanagawa.mjs`）は住所と祭礼日だけを保存していて、
 *   ページに載っている **神社自身の公式サイトの URL を捨てていた**。
 *   神社庁から入れた祭りは `links` が空のまま（1100 件以上）で、
 *   詳細ページから他へ辿れない。例祭の時刻や当日の案内は神社自身のサイトにしか
 *   出ないので、ここが埋まると効く。
 *
 *   ページの形は `<div class="url">公式サイト： <a href="...">` で固定。
 *
 * **既に取り込んである祭りの出典 URL しか叩かない**（新しい神社は探さない）。
 * 取得済みはディスクに残して二度と取りにいかない。1 リクエストごとに 1 秒あける。
 *
 * 出力: data/raw/jinjacho/kanagawa-url/<id>.json
 */
import { writeFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'jinjacho', 'kanagawa-url');
const DELAY_MS = 1000;
// HTTP ヘッダは ASCII のみ。日本語を入れると fetch が落ちる
const UA = 'matsuri-map/0.1 (local festival directory; collecting public shrine site links; polite crawler)';

const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > 0 ? Number(process.argv[limitArg + 1]) : Infinity;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 既に取り込んである祭りが出典にしている神社ページの URL を集める */
function shrineUrls() {
  const urls = new Set();
  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!e.endsWith('.yml')) continue;
      const f = parse(readFileSync(p, 'utf8'));
      const o = f.occurrences?.[0];
      // 担当は official / gov のみ。media / aggregator には触れない
      if (!['official', 'gov'].includes(o?.source_type)) continue;
      const u = o.source_url ?? '';
      if (/^https:\/\/www\.kanagawa-jinja\.or\.jp\/shrine\/\d+-000\/$/.test(u)) urls.add(u);
    }
  };
  walk(join(ROOT, 'data', 'festivals'));
  return [...urls];
}

mkdirSync(OUT, { recursive: true });

const urls = shrineUrls();
console.log(`対象 ${urls.length} 社`);

let got = 0;
let cached = 0;
let withSite = 0;
let n = 0;

for (const url of urls) {
  if (n++ >= LIMIT) break;
  const id = url.match(/\/shrine\/(\d+)-000\/$/)[1];
  const path = join(OUT, `${id}.json`);
  if (existsSync(path)) {
    cached++;
    if (JSON.parse(readFileSync(path, 'utf8')).site) withSite++;
    continue;
  }

  let html;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error(String(r.status));
    html = await r.text();
  } catch (e) {
    console.warn(`  ! ${id}: ${e.message}`);
    await sleep(DELAY_MS);
    continue;
  }

  // <div class="url">公式サイト： <a href="http://...">
  const site = html.match(/<div class="url">[^<]*<a href="(https?:\/\/[^"]+)"/)?.[1] ?? null;
  const name = (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '')
    .replace(/\s*-\s*神奈川県神社庁\s*$/, '').trim();
  // 住所も一緒に残す。あとで「同名の別社ではないか」を確かめるのに要る
  const address = (html.match(/<div class="address">([\s\S]*?)<\/div>/)?.[1] ?? '')
    .replace(/<[^>]+>/g, '').replace(/^住所：\s*/, '').replace(/\s+/g, ' ').trim() || null;

  writeFileSync(path, JSON.stringify({ id, url, name, address, site }, null, 1), 'utf8');
  got++;
  if (site) withSite++;
  await sleep(DELAY_MS);
}

console.log(`公式サイトURL: ${got} 件取得 / ${cached} 件キャッシュ済み / うち公式サイトあり ${withSite} 件`);
