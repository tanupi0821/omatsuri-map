/**
 * 各都県の神社庁クローラ（県ごとのアダプタ方式）
 *
 *   node scripts/crawl/jinjacho.mjs <pref> [--limit N]
 *   node scripts/crawl/jinjacho.mjs kanagawa
 *
 * 県神社庁は県内全神社の「例祭日」を公開している。まとめサイトが扱わない
 * 秋の例大祭や冬の神事まで、一次情報として拾える唯一の入口。
 *
 * 作法:
 *  - robots.txt を確認したうえで、公開サイトマップからのみ辿る
 *  - 1 リクエストごとに間隔を空ける（DELAY_MS）
 *  - User-Agent で素性を名乗る（ASCII のみ。日本語を入れると fetch が落ちる）
 *  - 取得済みはディスクにキャッシュし二度と取りにいかない（中断しても再開できる）
 *
 * 出力: data/raw/jinjacho/<pref>/<id>.json（生データ。加工は import 側）
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DELAY_MS = 700;
const UA = 'matsuri-map/0.1 (local festival directory; collecting public reisai dates; polite crawler)';

const strip = (h) =>
  String(h ?? '')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ---------------------------------------------------------------- アダプタ定義
const ADAPTERS = {
  kanagawa: {
    base: 'https://www.kanagawa-jinja.or.jp',
    sitemaps: ['shrine-sitemap.xml', 'shrine-sitemap2.xml'],
    // 境内社（-001 以降）は除き、本社のみ
    accept: (u) => /\/shrine\/\d+-000\/$/.test(u),
    id: (u) => (u.match(/\/shrine\/(\d+)-000\//) ?? [])[1],
    parse(html, url) {
      const name = strip((html.match(/<title>([^<]*)<\/title>/) ?? [])[1]).replace(
        /\s*-\s*神奈川県神社庁\s*$/, '');
      const addr = strip((html.match(/<div class="address">([\s\S]*?)<\/div>/) ?? [])[1])
        .replace(/^住所：\s*/, '');
      const zip = (addr.match(/〒\s*(\d{3}-\d{4})/) ?? [])[1] ?? null;
      const rest = addr.replace(/〒\s*\d{3}-\d{4}\s*/, '').trim();

      const festivals = [];
      for (const m of html.matchAll(
        /<div class="festival-item[^"]*">\s*<div class="date-column">([\s\S]*?)<\/div>\s*<div class="info-column">([\s\S]*?)<\/div>\s*<\/div>/g,
      )) {
        const date = strip(m[1]);
        const fname = strip((m[2].match(/<div class="name">([\s\S]*?)<\/div>/) ?? [])[1]);
        const alias = strip((m[2].match(/<div class="alias02">([\s\S]*?)<\/div>/) ?? [])[1]);
        if (date && fname) festivals.push({ date, name: fname, alias: alias || null });
      }
      return { name, zip, address: rest || null, addressParts: rest.split(/\s+/), festivals };
    },
  },

  tokyo: {
    base: 'http://www.tokyo-jinjacho.or.jp',
    sitemaps: ['sitemap.xml'],
    // 神社ページは /<区市町村のローマ字>/<id>。URL に自治体名が入っているので slug 表が要らない
    accept: (u) => /^http:\/\/www\.tokyo-jinjacho\.or\.jp\/[a-z-]+\/\d+\/?$/.test(u),
    id: (u) => u.replace(/^https?:\/\/[^/]+\//, '').replace(/\/$/, '').replace(/\//g, '-'),
    parse(html, url) {
      const name = strip((html.match(/<div class="s_in_tl01">([\s\S]*?)<\/div>/) ?? [])[1]);
      const cityName = strip((html.match(/<h1 class="pagetitle_s">([\s\S]*?)<\/h1>/) ?? [])[1]);
      const citySlugHint = (url.match(/\/([a-z-]+)\/\d+/) ?? [])[1] ?? null;

      // <li class="s_ad">見出し</li><li class="s_ad_in|s_ad_in02">中身</li> の並び
      const kv = {};
      const items = [...html.matchAll(/<li class="s_ad">([\s\S]*?)<\/li>\s*<li class="s_ad_in[^"]*">([\s\S]*?)<\/li>/g)];
      for (const m of items) kv[strip(m[1])] = strip(m[2]);

      const addr = (kv['所在地'] ?? '').replace(/〒\s*\d{3}-\d{4}\s*/, '').replace(/^東京都/, '').trim();
      const zip = ((kv['所在地'] ?? '').match(/〒\s*(\d{3}-\d{4})/) ?? [])[1] ?? null;
      const festivals = kv['例祭日'] ? [{ date: kv['例祭日'], name: '例祭', alias: null }] : [];

      return {
        name,
        zip,
        address: addr || null,
        addressParts: splitJpAddress(addr),
        city: cityName || null,
        citySlugHint,
        station: kv['最寄り駅'] || null,
        festivals,
      };
    },
  },

  saitama: {
    base: 'https://www.saitama-jinjacho.or.jp',
    sitemaps: ['wp-sitemap-posts-shrine-1.xml'],
    accept: (u) => /\/shrine\/\d+\/$/.test(u),
    id: (u) => (u.match(/\/shrine\/(\d+)\//) ?? [])[1],
    parse(html, url) {
      const name = strip((html.match(/<caption id="shrine_name">([\s\S]*?)<\/caption>/) ?? [])[1])
        || strip((html.match(/<title>([^<]*)<\/title>/) ?? [])[1]).replace(/\s*｜\s*埼玉県の神社\s*$/, '');
      const addr = strip((html.match(/<span id="shrine_address">([\s\S]*?)<\/span>/) ?? [])[1]);

      // 「お祭り」行は自由記述:「５月３日 例祭 10月15日 神嘗祭 11月15日 新嘗祭」
      const table = (html.match(/<table class="data_shrine[\s\S]*?<\/table>/) ?? [])[0] ?? '';
      let raw = '';
      for (const tr of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
        const th = strip((tr[1].match(/<th[^>]*>([\s\S]*?)<\/th>/) ?? [])[1]);
        // 「御祭神」にも「祭」が入るので、見出しは厳密に見る
        if (th === 'お祭り' || th === '祭日' || th === '例祭日') {
          raw = strip((tr[1].match(/<td[^>]*>([\s\S]*?)<\/td>/) ?? [])[1]);
          break;
        }
      }
      // 書き方が 2 通りある。
      //   (a)「５月３日 例祭 10月15日 神嘗祭」   … 日付 → 祭名
      //   (b)「夏祭（７月２０日）、例大祭（１１月３日）」… 祭名（日付）
      // (b) を (a) の規則で読むと、日付に**次の**祭名が付き、名前も括弧ごと壊れる
      //（「）、例大祭（」という名前が出来ていた）。(b) を先に試す。
      // 祭名の前後に付く区切りや、括弧だけの断片を落とす
      const cleanName = (s) => {
        let t = s.trim().replace(/^[、,・:：\s]+|[、,・:：\s]+$/g, '');
        if (/^[（(].*[）)]$/.test(t)) t = t.slice(1, -1).trim(); // 「（例 祭）」→「例 祭」
        t = t.replace(/\s+/g, '');
        // 日付の言い回しや「（祝）」だけが残ったものは祭名ではない
        if (!t || /^(祝|近い日曜日|頃|日曜日|前後)$/.test(t)) return '例祭';
        return t;
      };

      const festivals = [];
      const paren = /([^（）()、,。\s]{1,20})[（(]([^（）()]{1,40})[）)]/g;
      for (const m of raw.matchAll(paren)) {
        const inner = m[2].trim();
        if (!/[０-９0-9]\s*月/.test(inner)) continue; // 括弧の中が日付でなければ対象外
        festivals.push({ date: inner.replace(/\s+/g, ''), name: cleanName(m[1]), alias: null });
      }

      if (!festivals.length) {
        const re = /([０-９0-9]{1,2}\s*月\s*[０-９0-9]{1,2}\s*日|[０-９0-9]{1,2}\s*月[第][０-９0-9一二三四五六七八九]+[日月火水木金土]曜日?)\s*([^0-9０-９]{0,20}?)(?=(?:[０-９0-9]{1,2}\s*月)|$)/g;
        for (const m of raw.matchAll(re)) {
          festivals.push({ date: m[1].replace(/\s+/g, ''), name: cleanName(m[2]), alias: null });
        }
      }
      // 祭名が取れず日付だけのときも、例祭として1件は残す
      if (!festivals.length && raw) festivals.push({ date: raw, name: '例祭', alias: null });

      // 「さいたま市見沼区東大宮7-36-11」→ 空白区切りに直す
      const parts = splitJpAddress(addr);
      return { name, zip: null, address: addr || null, addressParts: parts, festivals };
    },
  },
};

/** 空白のない日本語住所を [市区町村, ...] に割る */
export function splitJpAddress(addr) {
  const s = String(addr ?? '').trim();
  if (!s) return [];
  // 郡＋町村
  let m = s.match(/^(.+?郡)(.+?[町村])(.*)$/);
  if (m) return [m[1], m[2], m[3]].filter(Boolean);
  // 政令市＋区
  m = s.match(/^(.+?市)(.+?区)(.*)$/);
  if (m) return [m[1], m[2], m[3]].filter(Boolean);
  // 市／町／村
  m = s.match(/^(.+?[市町村])(.*)$/);
  if (m) return [m[1], m[2]].filter(Boolean);
  // 東京の特別区は、前に市がつかない「◯◯区」がそのまま自治体
  m = s.match(/^(.+?区)(.*)$/);
  if (m) return [m[1], m[2]].filter(Boolean);
  return [s];
}

// ------------------------------------------------------------------------ 実行
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

const pref = process.argv[2];
const A = ADAPTERS[pref];
if (!A) {
  console.error(`使い方: node scripts/crawl/jinjacho.mjs <${Object.keys(ADAPTERS).join('|')}> [--limit N]`);
  process.exit(1);
}
const li = process.argv.indexOf('--limit');
const LIMIT = li > 0 ? Number(process.argv[li + 1]) : Infinity;

const OUT = join(ROOT, 'data', 'raw', 'jinjacho', pref);
mkdirSync(OUT, { recursive: true });

const urls = new Set();
for (const s of A.sitemaps) {
  const xml = await get(`${A.base}/${s}`);
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) if (A.accept(m[1])) urls.add(m[1]);
  await sleep(DELAY_MS);
}
console.log(`${pref}: サイトマップから ${urls.size} 社`);

let fetched = 0; let cached = 0; let failed = 0;
for (const url of [...urls].slice(0, LIMIT === Infinity ? urls.size : LIMIT)) {
  const id = A.id(url);
  const path = join(OUT, `${id}.json`);
  if (existsSync(path)) { cached++; continue; }
  try {
    const html = await get(url);
    writeFileSync(path, JSON.stringify({ id, url, ...A.parse(html, url) }, null, 1), 'utf8');
    fetched++;
    if (fetched % 100 === 0) console.log(`  ${fetched} 社取得（キャッシュ ${cached}）`);
  } catch (e) {
    failed++;
    if (failed < 10) console.warn(`  ! ${url}: ${e.message}`);
  }
  await sleep(DELAY_MS);
}
console.log(`${pref} 完了: 新規 ${fetched} / キャッシュ ${cached} / 失敗 ${failed}`);
