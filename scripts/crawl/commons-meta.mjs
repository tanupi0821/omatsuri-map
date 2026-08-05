/**
 * 採用済みの写真について、コモンズの題名・説明・カテゴリを取り直す
 *
 *   node scripts/crawl/commons-meta.mjs
 *
 * 候補ファイルには題名しか残していなかったので、後から判定を見直すときに
 * 説明文とカテゴリが無く、正しい写真まで落としてしまった。
 * 判定に使った材料は残しておく必要がある。
 *
 * 出力: data/raw/commons-meta/<sha1(url)>.json
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { parse } from 'yaml';
import { ROOT } from '../import/_lib.mjs';

const OUT = join(ROOT, 'data', 'raw', 'commons-meta');
const API = 'https://commons.wikimedia.org/w/api.php';
const DELAY_MS = 2000;
const UA = 'matsuri-map/0.1 (local festival directory; contact via site)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (h) => String(h ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
export const keyOf = (url) => createHash('sha1').update(url).digest('hex').slice(0, 16);

/** サムネイル URL からファイル名を復元する（.../thumb/a/ab/名前.jpg/1280px-名前.jpg） */
export function fileTitleOf(url) {
  const m = url.match(/\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\/[^/]+$/)
    ?? url.match(/\/commons\/[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)/);
  return m ? `File:${decodeURIComponent(m[1])}` : null;
}

function collectUrls() {
  const urls = new Set();
  (function walk(dir) {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!e.endsWith('.yml')) continue;
      const f = parse(readFileSync(p, 'utf8'));
      for (const ph of f.photos ?? []) urls.add(ph.url);
    }
  })(join(ROOT, 'data', 'festivals'));
  return [...urls];
}

if (process.argv[1]?.endsWith('commons-meta.mjs')) {
  mkdirSync(OUT, { recursive: true });
  const urls = collectUrls();
  console.log(`採用済みの写真 ${urls.length} 枚の説明を取り直す`);
  let got = 0; let miss = 0;

  for (const url of urls) {
    const path = join(OUT, `${keyOf(url)}.json`);
    if (existsSync(path)) continue;
    const title = fileTitleOf(url);
    if (!title) { miss++; continue; }

    const q = `${API}?action=query&format=json&titles=${encodeURIComponent(title)}`
      + '&prop=imageinfo&iiprop=extmetadata';
    let r = await fetch(q, { headers: { 'User-Agent': UA } });
    // Wikimedia はレート制限が厳しい。429 は Retry-After に従って待ち直す
    for (let i = 0; r.status === 429 && i < 4; i++) {
      const wait = Number(r.headers.get('retry-after') ?? 0) * 1000 || DELAY_MS * 2 ** (i + 1);
      console.log(`  429。${Math.round(wait / 1000)} 秒待って再試行`);
      await sleep(wait);
      r = await fetch(q, { headers: { 'User-Agent': UA } });
    }
    if (!r.ok) { miss++; await sleep(DELAY_MS); continue; }
    const j = await r.json();
    const page = Object.values(j.query?.pages ?? {})[0];
    if (!page?.imageinfo?.[0]) { miss++; await sleep(DELAY_MS); continue; }
    const em = page.imageinfo[0].extmetadata ?? {};
    writeFileSync(path, JSON.stringify({
      url,
      title,
      hay: [
        title,
        strip(em.ImageDescription?.value),
        strip(em.Categories?.value),
        strip(em.ObjectName?.value),
      ].join(' '),
    }, null, 1), 'utf8');
    got++;
    await sleep(DELAY_MS);
  }
  console.log(`完了: 取得 ${got} / 取れず ${miss}`);
}
