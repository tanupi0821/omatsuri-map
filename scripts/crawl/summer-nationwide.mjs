/**
 * 全国の「屋台が出る夏祭り・盆踊り」を集める
 *
 *   node scripts/crawl/summer-nationwide.mjs [--pref tokyo] [--pages 8]
 *
 * 花火（hanabi-nationwide.mjs）と対になるもう一方の入口。
 * こちらは盆踊り・夏祭りそのもので、しかも**屋台の有無で絞り込める**。
 *
 *   https://summer.walkerplus.com/odekake/list/<ar>/sg0999/yatai/
 *   https://summer.walkerplus.com/odekake/list/<ar>/sg0999/yatai/2.html
 *
 * 花火側と違い JSON-LD は **Event の配列**（ItemList ではない）。1 ページ 10 件。
 *
 * 出力: data/raw/summer/<prefSlug>.json
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PREFS } from '../lib/prefs.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'summer');
// 花火側で 1.2 秒だと 2 県目以降が全部 404 になった。同じ運営なので同じだけ空ける
const DELAY_MS = 3000;
const RETRY_WAIT_MS = 60000;
const UA = 'matsuri-map/0.1 (local festival directory; polite crawler)';

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const ONLY = arg('--pref', null);
const PAGES = Number(arg('--pages', 8));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, attempt = 0) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (r.ok) return r.text();
  if (attempt === 0 && [429, 503].includes(r.status)) {
    const ra = Number(r.headers.get('retry-after'));
    await sleep(Number.isFinite(ra) && ra > 0 ? ra * 1000 : RETRY_WAIT_MS);
    return get(url, 1);
  }
  throw new Error(`${r.status}`);
}

/** ページ内の JSON-LD（Event の配列）を読む */
function parseList(html) {
  const m = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return [];
  let arr;
  try { arr = JSON.parse(m[1]); } catch { return []; }
  if (!Array.isArray(arr)) arr = [arr];

  return arr.flatMap((ev) => {
    if (ev?.['@type'] !== 'Event' || !ev.name) return [];
    const loc = ev.location ?? {};
    const addr = loc.address ?? {};
    return [{
      name: String(ev.name).trim(),
      url: ev.url ?? null,
      startDate: ev.startDate ?? null,
      endDate: ev.endDate ?? null,
      venue: loc.name ?? null,
      address: addr.streetAddress ?? null,
      pref: addr.addressRegion ?? null,
      city: addr.addressLocality ?? null,
      description: (ev.description ?? '').slice(0, 400),
    }];
  });
}

function save(p, items) {
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
  if (existsSync(join(OUT, `${p.slug}.json`))) continue;

  const items = [];
  try {
    for (let page = 1; page <= PAGES; page++) {
      const base = `https://summer.walkerplus.com/odekake/list/${p.ar}/sg0999/yatai/`;
      const got = parseList(await get(page === 1 ? base : `${base}${page}.html`));
      items.push(...got);
      await sleep(DELAY_MS);
      if (got.length === 0) break;
    }
    save(p, items);
    done++;
  } catch (e) {
    if (items.length) { save(p, items); done++; }
    console.warn(`${p.name}: ${e.message}${items.length ? '（取れた分だけ保存）' : ''}`);
  }
}

console.log(`完了: ${done} 都道府県`);
