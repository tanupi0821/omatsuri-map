/**
 * 全国の「屋台が出る花火大会」を集める
 *
 *   node scripts/crawl/hanabi-nationwide.mjs [--pref aichi] [--pages 3]
 *
 * 花火大会DB は 47 都道府県が同じ URL 規則で取れ、しかも
 * **屋台の有無を属性として持っている**。「露店があるものだけ載せる」方針のまま
 * 全国に広げられる唯一の入口。
 *
 *   https://hanabi.walkerplus.com/list/<ar>/yatai/       1ページ目
 *   https://hanabi.walkerplus.com/list/<ar>/yatai/2.html  2ページ目
 *
 * 一覧は静的 HTML なので正規表現で読める。
 * 出力: data/raw/hanabi/<prefSlug>.json（生データ。加工は import 側）
 */
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PREFS } from '../lib/prefs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'hanabi');
// 1.2 秒で 47 都道府県を続けて叩いたら、2 県目以降が全部 404 になった。
// URL は正しく、時間を空けて叩き直すと 200 が返る。つまり本物の 404 ではなく
// 出しすぎの遮断。間隔を広げ、404 でも一度は待って叩き直す。
const DELAY_MS = 3000;
const RETRY_WAIT_MS = 60000;
const UA = 'matsuri-map/0.1 (local festival directory; polite crawler)';

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const ONLY = arg('--pref', null);
const PAGES = Number(arg('--pages', 4));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (h) =>
  String(h ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();

/**
 * @param retry404 404 を遮断とみなして待ち直すか。
 *   1 ページ目は遮断を疑う（URL は正しいはずなので）。
 *   2 ページ目以降の 404 は単に最終ページを越えただけなので待たない。
 */
async function get(url, retry404, attempt = 0) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (r.ok) return r.text();
  const retryable = [429, 503, ...(retry404 ? [404] : [])];
  if (attempt === 0 && retryable.includes(r.status)) {
    const ra = Number(r.headers.get('retry-after'));
    await sleep(Number.isFinite(ra) && ra > 0 ? ra * 1000 : RETRY_WAIT_MS);
    return get(url, 1);
  }
  throw new Error(`${r.status}`);
}

/**
 * 一覧ページから 1 件ずつ抜く。
 *
 * **ページに schema.org の Event 構造化データ（JSON-LD）が埋まっている。**
 * HTML の class 名を追うより遥かに正確で壊れにくいので、そちらを読む。
 * 名称・開催日・会場・市区町村・詳細ページ URL がそのまま入っている。
 */
function parseList(html) {
  const out = [];
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!m) return out;
  let doc;
  try { doc = JSON.parse(m[1]); } catch { return out; }

  // WebPage → mainEntity(ItemList) → itemListElement[].item(Event)
  for (const li of doc.mainEntity?.itemListElement ?? []) {
    const ev = li.item;
    if (ev?.['@type'] !== 'Event' || !ev.name) continue;
    const loc = ev.location ?? {};
    const addr = loc.address ?? {};
    out.push({
      name: String(ev.name).trim(),
      alt: ev.alternateName ?? null,
      url: ev.url ?? null,
      startDate: ev.startDate ?? null,
      endDate: ev.endDate ?? null,
      venue: loc.name ?? null,
      // **住所を捨てていた。** JSON-LD には streetAddress が入っている。
      // 会場名だけだと地図が引けず、「◯◯公園 盆踊り」の検索にも当たらない
      address: addr.streetAddress ?? null,
      pref: addr.addressRegion ?? null,
      city: addr.addressLocality ?? null,
      description: (ev.description ?? '').slice(0, 300),
    });
  }
  return out;
}

function save(p, items) {
  // 同じ祭りが複数ページに出ることがあるので URL で一意化
  const uniq = [...new Map(items.map((x) => [x.url, x])).values()];
  writeFileSync(
    join(OUT, `${p.slug}.json`),
    JSON.stringify({ pref: p.name, slug: p.slug, ar: p.ar, items: uniq }, null, 1),
    'utf8',
  );
  console.log(`${p.name.padEnd(5)} ${uniq.length} 件`);
}

mkdirSync(OUT, { recursive: true });

const targets = ONLY ? PREFS.filter((p) => p.slug === ONLY) : PREFS;
let done = 0;

for (const p of targets) {
  const path = join(OUT, `${p.slug}.json`);
  if (existsSync(path)) { continue; }

  const items = [];
  try {
    for (let page = 1; page <= PAGES; page++) {
      const url = page === 1
        ? `https://hanabi.walkerplus.com/list/${p.ar}/yatai/`
        : `https://hanabi.walkerplus.com/list/${p.ar}/yatai/${page}.html`;
      let html;
      try {
        html = await get(url, page === 1);
      } catch (e) {
        if (page > 1 && e.message === '404') break; // 最終ページを越えた
        throw e;
      }
      const got = parseList(html);
      items.push(...got);
      await sleep(DELAY_MS);
      if (got.length === 0) break; // 最終ページ
    }
    save(p, items);
    done++;
  } catch (e) {
    // 途中のページで落ちても、そこまでに取れた分は捨てない
    if (items.length) { save(p, items); done++; }
    console.warn(`${p.name}: ${e.message}${items.length ? '（取れた分だけ保存）' : ''}`);
  }
}

console.log(`完了: ${done} 都道府県`);
void readFileSync;
