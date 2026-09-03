/**
 * 兵庫県神社庁クローラ
 *
 *   node scripts/crawl/jinjacho-hyogo.mjs [--limit N]
 *
 * 氏神さがしの地図が、**県内全神社の一覧を 1 本の XML で返す**:
 *   data/xml.php?ne_lat=&sw_lat=&ne_lng=&sw_lng=   → code / lat / lng / name / place
 * 神社の詳細（**例祭日**・例祭の通称・通称名・電話・HP）は
 *   data/<code>.html
 * にある。一覧に例祭日は無いので、社ごとに 1 枚ずつ取る。
 *
 * 作法:
 *  - robots.txt は無い（404 ＝ 制限なし）。AI 利用拒否の宣言も無い
 *  - 1 リクエストごとに 700ms 空ける
 *  - User-Agent で素性を名乗る
 *  - 取得済みはディスクにキャッシュして二度と取りにいかない（中断しても再開できる）
 *  - **由緒・祭記事の文章は取らない**（出典の文章は持ち込まない方針）
 *
 * 出力: data/raw/jinjacho/hyogo/<code>.json
 *       data/raw/jinjacho/hyogo-index/all.xml（一覧のキャッシュ）
 */
import { writeFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'jinjacho', 'hyogo');
const CACHE_DIR = join(ROOT, 'data', 'raw', 'jinjacho', 'hyogo-index');
const CACHE = join(CACHE_DIR, 'all.xml');
const BASE = 'https://www.hyogo-jinjacho.com';
// 県全体を含む矩形。ここを狭めると神社が漏れる
const INDEX = `${BASE}/data/xml.php?ne_lat=36.5&sw_lat=33.5&ne_lng=136.5&sw_lng=133.5`;
const DELAY_MS = 700;
// HTTP ヘッダは ASCII のみ
const UA = 'matsuri-map/0.1 (local festival directory; collecting public reisai dates; polite crawler)';

const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > 0 ? Number(process.argv[limitArg + 1]) : Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  let h = new TextDecoder('utf-8', { fatal: false }).decode(buf);
  if (/�/.test(h)) h = new TextDecoder('shift_jis').decode(buf);
  return h;
}

const strip = (h) =>
  String(h ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** 詳細ページの表は「<td>ラベル</td><td>値</td>」の並び。ラベルで引く */
function cell(html, label) {
  for (const m of html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)) {
    if (strip(m[1]).replace(/\s/g, '') === label) return m[2];
  }
  return null;
}

/**
 * 「神戸市東灘区住吉宮町7-1-2」→ ["神戸市東灘区","住吉宮町7-1-2"]
 *
 * **市町村名は「最も短い 市／町／村 止まり」で切る。**
 * 欲張って切ると「尼崎市西本町」「明石市大蔵天神町」を市町村名だと思ってしまう
 * （実データで 477 社がこれで市町村不明になった）。
 *
 * 神戸市は政令市として「神戸市」＋「◯区」に分ける（エリア定義の 神戸市=kobe に
 * 区の定義が無く、既存データも area.ward に区名を持つ形で入っているため）。
 * 郡部は「神崎郡福崎町」と郡付きで持っているので、そちらに合わせて 1 つにまとめる。
 */
const KOBE_WARDS = ['東灘区', '灘区', '兵庫区', '長田区', '須磨区', '垂水区', '北区', '中央区', '西区'];
function splitParts(address) {
  const a = String(address ?? '').replace(/\s+/g, '').trim();
  for (const w of KOBE_WARDS) {
    if (a.startsWith(`神戸市${w}`)) return ['神戸市', w, a.slice(`神戸市${w}`.length)].filter(Boolean);
  }
  const gun = a.match(/^(.{1,6}郡.{1,8}?[町村])(.*)$/);
  if (gun) return [gun[1], gun[2]].filter(Boolean);
  const m = a.match(/^(.{1,8}?[市町村])(.*)$/);
  if (!m) return a ? [a] : [];
  return [m[1], m[2]].filter(Boolean);
}

function parse(html, code, loc) {
  // 社名は赤帯の px18。ふりがなは px10 に別に入っている
  const name = strip((html.match(/class="px18"[^>]*>([\s\S]*?)<\/td>/i) ?? [])[1] ?? '');
  const kana = strip((html.match(/class="px10"[^>]*>([\s\S]*?)<\/td>/i) ?? [])[1] ?? '') || null;

  // 所在地は「郵便番号<br>住所」。住所は市区町村から始まり、県名は付かない
  const addrCell = strip(cell(html, '所在地') ?? '');
  const zip = (addrCell.match(/(\d{3}-?\d{4})/) ?? [])[1] ?? null;
  let address = addrCell.replace(/\d{3}-?\d{4}/, '').trim();
  if (!address) address = strip(loc.place ?? '');

  const festivalDay = strip(cell(html, '例祭日') ?? '') || null;
  const festivalAlias = strip(cell(html, '例祭の通称') ?? '') || null;
  const nickname = strip(cell(html, '通称名') ?? '') || null;

  const addressParts = splitParts(address);

  return {
    id: code,
    url: `${BASE}/data/${code}.html`,
    name,
    kana,
    nickname,
    zip,
    address,
    addressParts: addressParts.filter(Boolean),
    lat: loc.lat ? Number(loc.lat) : null,
    lng: loc.lng ? Number(loc.lng) : null,
    // 神社庁が持っているのは例祭日 1 つ。祭礼名は無いので「例祭」とする
    festivals: festivalDay ? [{ date: festivalDay, name: '例祭', alias: festivalAlias }] : [],
  };
}

async function index() {
  if (existsSync(CACHE)) return readFileSync(CACHE, 'utf8');
  const xml = await get(INDEX);
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE, xml, 'utf8');
  await sleep(DELAY_MS);
  return xml;
}

mkdirSync(OUT, { recursive: true });

// **--reparse: 取得済みの JSON の addressParts だけ作り直す**（通信しない）。
// 市町村の切り出しを直したときに、3,800 社を取り直さずに済ませるため
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

const xml = await index();
const locs = [...xml.matchAll(/<Locate>([\s\S]*?)<\/Locate>/g)].map((m) => ({
  code: (m[1].match(/<code>(\d+)<\/code>/) ?? [])[1],
  lat: (m[1].match(/<lat>([^<]*)<\/lat>/) ?? [])[1],
  lng: (m[1].match(/<lng>([^<]*)<\/lng>/) ?? [])[1],
  place: (m[1].match(/<place>([^<]*)<\/place>/) ?? [])[1],
})).filter((l) => l.code);

console.log(`兵庫県神社庁: 一覧 ${locs.length} 社`);

let fetched = 0; let cached = 0; let failed = 0; let noDate = 0;
for (const loc of locs.slice(0, LIMIT === Infinity ? locs.length : LIMIT)) {
  const path = join(OUT, `${loc.code}.json`);
  if (existsSync(path)) { cached++; continue; }
  try {
    const html = await get(`${BASE}/data/${loc.code}.html`);
    const rec = parse(html, loc.code, loc);
    if (!rec.festivals.length) noDate++;
    writeFileSync(path, JSON.stringify(rec, null, 1), 'utf8');
    fetched++;
    if (fetched % 50 === 0) console.log(`  ${fetched} 社取得（キャッシュ ${cached} / 失敗 ${failed}）`);
  } catch (e) {
    failed++;
    console.warn(`  ! ${loc.code}: ${e.message}`);
  }
  await sleep(DELAY_MS);
}

console.log(`完了: 新規 ${fetched} / キャッシュ ${cached} / 失敗 ${failed}（例祭日なし ${noDate}）`);
