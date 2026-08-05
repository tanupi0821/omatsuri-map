/**
 * 町会いんふぉ（chokai.info）クローラ
 *
 *   node scripts/crawl/chokai-info.mjs [--limit N]
 *
 * chokai.info は町内会・自治会向けのホームページ作成サービス。
 * **町内会自身が書いた一次情報**がここにある。行政や地域メディアより格が上。
 *
 * 各団体のトップページに
 *   - 団体名（title）
 *   - 所在地（本文の「◯◯市◯◯区「△△自治会」のホームページ」）
 *   - 新着情報の見出し（「◯◯自治会盆踊り大会（令和8年7月24日・25日）」）
 * が入っているので、トップページ 1 枚で必要な情報がだいたい揃う。
 *
 * 作法:
 *  - robots.txt の Disallow を守る。**一部の町内会は明示的にクロールを拒否している**ので、
 *    そのディレクトリには一切アクセスしない
 *  - 1 リクエストごとに間隔を空け、User-Agent で素性を名乗る
 *  - 取得済みはディスクにキャッシュ
 *
 * 出力: data/raw/chokai/<slug>.json
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'chokai');
const BASE = 'https://www.chokai.info';
const DELAY_MS = 700;
const UA = 'matsuri-map/0.1 (local festival directory; polite crawler)';

const li = process.argv.indexOf('--limit');
const LIMIT = li > 0 ? Number(process.argv[li + 1]) : Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.text();
}

const strip = (h) =>
  String(h ?? '')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

// ---- robots.txt の Disallow を取得して守る ----
const robots = await get(`${BASE}/robots.txt`);
const DISALLOW = robots
  .split('\n')
  .filter((l) => /^Disallow:/i.test(l.trim()))
  .map((l) => l.slice(l.indexOf(':') + 1).trim())
  .filter(Boolean);
console.log(`robots.txt の Disallow ${DISALLOW.length} 件を尊重する`);

const blocked = (path) => DISALLOW.some((d) => path.startsWith(d));

// ---- サイトマップから団体ディレクトリを集める ----
const dirs = new Set();
for (const s of ['sitemap_main.xml', 'areanews/sitemap.xml', 'powerup/sitemap.xml']) {
  const xml = await get(`${BASE}/${s}`);
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const slug = (m[1].match(/chokai\.info\/([a-z0-9_-]+)\//) ?? [])[1];
    if (slug && !blocked(`/${slug}/`)) dirs.add(slug);
  }
  await sleep(DELAY_MS);
}
// 団体ではない共通ページを除く
for (const x of ['areanews', 'powerup', 'link', 'inc', 'form', 'log', 'thanks', 'chikyukai']) dirs.delete(x);
console.log(`団体ディレクトリ ${dirs.size} 件`);

mkdirSync(OUT, { recursive: true });

let fetched = 0; let cached = 0; let failed = 0;
for (const slug of [...dirs].slice(0, LIMIT === Infinity ? dirs.size : LIMIT)) {
  const path = join(OUT, `${slug}.json`);
  if (existsSync(path)) { cached++; continue; }
  try {
    const html = await get(`${BASE}/${slug}/`);
    const title = strip((html.match(/<title>([^<]*)<\/title>/) ?? [])[1]);
    const text = strip(html);

    // 「川崎市高津区「新作第二自治会」のホームページ」から所在地を拾う
    const loc = text.match(/([^\s。]{2,10}?[都道府県])?([^\s。]{2,12}?[市区町村])([^\s。]{0,8}?区)?\s*「/);
    const area = loc ? `${loc[1] ?? ''}${loc[2]}${loc[3] ?? ''}` : null;

    // 新着情報の見出しを拾う（リンクテキスト）
    const items = [...new Set(
      [...html.matchAll(/<a[^>]*href="[^"]*"[^>]*>([\s\S]{2,120}?)<\/a>/g)].map((m) => strip(m[1])),
    )].filter((t) => t.length > 4 && /祭|踊|納涼|えんにち|縁日/.test(t));

    writeFileSync(path, JSON.stringify({ slug, url: `${BASE}/${slug}/`, title, area, items }, null, 1), 'utf8');
    fetched++;
    if (fetched % 50 === 0) console.log(`  ${fetched} 団体取得`);
  } catch (e) {
    failed++;
  }
  await sleep(DELAY_MS);
}
console.log(`完了: 新規 ${fetched} / キャッシュ ${cached} / 失敗 ${failed}`);
