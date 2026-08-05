/**
 * ウィキメディア・コモンズから祭りの写真を探す
 *
 *   node scripts/crawl/commons-photos.mjs [--limit N] [--min-scale 市]
 *
 * **他サイトの画像を勝手に持ってくることはしない。**
 * コモンズは再利用を前提に運用されていて、CC ライセンスで著作者表示さえすれば使える。
 * ライセンス・著作者・出典ページが揃っている画像だけを候補にする。
 *
 * 検索語は祭りの名前をそのまま使い、ヒットしたら
 * data/raw/commons/<id>.json に候補を書く（採用はしない。目視の余地を残す）。
 *
 * 作法:
 *  - MediaWiki API の作法どおり User-Agent に連絡先を入れる
 *  - 1 リクエストごとに間隔を空ける
 *  - 取得済みはキャッシュ
 */
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'commons');
const API = 'https://commons.wikimedia.org/w/api.php';
// Wikimedia の API はレート制限が厳しく、詰めると 429 が返る。
// https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits
const DELAY_MS = 2000;
const UA = 'matsuri-map/0.1 (local festival directory; contact via site)';

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const LIMIT = Number(arg('--limit', Infinity));
// 町内会の盆踊りの写真はコモンズにまず無い。規模の大きいものから当たる
const MIN_SCALE = arg('--min-scale', '市');
const SCALE_RANK = { 町内会: 0, 地区: 1, 区: 2, 市: 3 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (h) => String(h ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// 再利用できるライセンスだけ通す（NoDerivatives / NonCommercial は使わない）
const OK_LICENSE = /^(CC BY(-SA)?[\d. ]*|CC0|Public domain|PD)/i;
const NG_LICENSE = /NC|ND|NonCommercial|NoDeriv|Fair use/i;

function collectFestivals() {
  const out = [];
  (function walk(dir) {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!e.endsWith('.yml')) continue;
      const f = parse(readFileSync(p, 'utf8'));
      if (f.photos?.length) continue;
      if ((SCALE_RANK[f.scale] ?? 0) < (SCALE_RANK[MIN_SCALE] ?? 3)) continue;
      out.push(f);
    }
  })(join(ROOT, 'data', 'festivals'));
  return out;
}

/** 「◯◯まつり（第52回）」→「◯◯まつり」。回数や年は検索の邪魔になる */
const searchTerm = (name) =>
  name.replace(/（[^）]*）/g, '').replace(/第\d+回/g, '').replace(/\s*20\d\d\s*/g, '').trim();

// 「祭」「花火」だけでは何にでも当たってしまう。地名や神社名など固有の部分を取り出す
const GENERIC = /^(祭|祭り|祭典|祭礼|まつり|夏祭り|夏まつり|花火|花火大会|大会|盆踊り|盆おどり|納涼|納涼祭|例大祭|例祭|神事|縁日|神社|神宮|八幡宮|商店会|商店街|町会|自治会|市民|区民|ふるさと|地区|会場|境内|渡御|神輿|の|と)$/;

/**
 * 全国に何千とある社号。これ単体では固有語にならない。
 *
 * 「八幡神社 例祭」で探すと、厚木市の八幡神社に蒲郡市の三谷八幡神社の写真が付いた。
 * 同じ写真が別々の祭りに割り当たっていたのがその証拠。
 * これらは**市区町村名の一致を伴って初めて**採用してよい。
 */
const COMMON_SHRINE = /^(八幡神社|八幡宮|稲荷神社|稲荷社|諏訪神社|神明社|神明神社|八坂神社|天満宮|天神社|熊野神社|春日神社|日枝神社|山王神社|白山神社|御嶽神社|御霊神社|厳島神社|水神社|愛宕神社|浅間神社|三島神社|杉山神社|氷川神社|香取神社|鹿島神社|住吉神社|若宮八幡宮|第六天神社|金刀比羅神社|貴船神社|八幡|稲荷|諏訪|神明|八坂|天満|熊野|春日|日枝|白山|御嶽|御霊|厳島|愛宕|浅間|三島|杉山|氷川|香取|鹿島|住吉)$/;

function tokenize(name) {
  return name
    .replace(/（[^）]*）/g, ' ')
    .split(/[\s・、（）()\/]+/)
    .flatMap((w) => {
      const out = [w];
      // 「甘楽町商工会夏まつり」→「甘楽町」なども拾えるよう、先頭の固有名詞部分も候補に
      const m = w.match(/^([一-鿿゠-ヿー]{2,6}?)(市|区|町|村|神社|八幡宮|稲荷)/);
      if (m) out.push(m[1] + m[2], m[1]);
      return out;
    })
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !GENERIC.test(w));
}

/**
 * 固有語を「強い」「弱い」に分ける。
 *  strong … その祭りを一意に指せる語（地名つきの社号、祭りの固有名）
 *  weak   … ありふれた社号。市区町村名との同時一致を条件に使う
 */
export function distinctiveTokens(f) {
  const all = [...new Set(tokenize(f.name))];
  const strong = all.filter((t) => !COMMON_SHRINE.test(t));
  const weak = all.filter((t) => COMMON_SHRINE.test(t));
  // 市区町村・町名は照合の錨にする（「厚木市」「及川」）
  const place = [f.area?.city, f.area?.ward]
    .filter(Boolean)
    .flatMap((c) => [c, c.replace(/[市区町村]$/, '')])
    .filter((c) => c.length >= 2);
  return { strong, weak, place };
}

/** 画像が本当にその祭りのものか、題名・説明・カテゴリに固有語が出るかで判断する */
export function isRelevant({ strong, weak, place }, page, ii) {
  const em = ii.extmetadata ?? {};
  const hay = [
    page.title,
    strip(em.ImageDescription?.value),
    strip(em.Categories?.value),
    strip(em.ObjectName?.value),
  ].join(' ');
  if (strong.some((t) => hay.includes(t))) return true;
  // ありふれた社号しかない祭りは、市区町村名も一致しないと採らない
  return weak.some((t) => hay.includes(t)) && place.some((c) => hay.includes(c));
}

async function search(term, attempt = 0) {
  const url = `${API}?action=query&format=json&generator=search`
    + `&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=4`
    + '&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1000';
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (r.status === 429) {
    if (attempt >= 4) throw new Error('429 が続くので中断');
    // Retry-After があれば従い、無ければ倍々に待つ
    const wait = Number(r.headers.get('retry-after') ?? 0) * 1000 || DELAY_MS * 2 ** (attempt + 1);
    console.log(`  429。${Math.round(wait / 1000)} 秒待って再試行`);
    await sleep(wait);
    return search(term, attempt + 1);
  }
  if (!r.ok) throw new Error(`${r.status}`);
  const j = await r.json();
  return Object.values(j.query?.pages ?? {});
}

// 判定（distinctiveTokens / isRelevant）は他からも使うので、
// 直接叩かれたときだけクロールする。import しただけで走らせない。
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();

async function main() {
mkdirSync(OUT, { recursive: true });

const targets = collectFestivals();
console.log(`写真を探す対象: ${targets.length} 件（規模 ${MIN_SCALE} 以上・写真なし）`);

let fetched = 0; let cached = 0; let hit = 0; let failed = 0;

for (const f of targets.slice(0, LIMIT === Infinity ? targets.length : LIMIT)) {
  const path = join(OUT, `${f.id}.json`);
  if (existsSync(path)) { cached++; continue; }

  const tokens = distinctiveTokens(f);
  // 固有語が取れない祭り（「夏祭り」だけ等）は誤爆するので照会しない
  if (!tokens.strong.length && !tokens.weak.length) { continue; }
  // ありふれた社号だけの祭りは、市区町村名を添えて検索する
  const term = tokens.strong.length
    ? searchTerm(f.name)
    : `${f.area?.city ?? ''} ${searchTerm(f.name)}`.trim();
  try {
    const pages = await search(term);
    const photos = [];
    for (const p of pages) {
      const ii = p.imageinfo?.[0];
      if (!ii) continue;
      // コモンズには PDF や DJVU も入っている。写真だけを対象にする
      if (!/\.(jpe?g|png|webp)$/i.test(p.title)) continue;
      const em = ii.extmetadata ?? {};
      const license = strip(em.LicenseShortName?.value);
      const credit = strip(em.Artist?.value);
      if (!license || !credit) continue;
      if (NG_LICENSE.test(license) || !OK_LICENSE.test(license)) continue;
      if (!isRelevant(tokens, p, ii)) continue;
      photos.push({
        url: ii.thumburl?.split('?')[0] ?? ii.url,
        width: ii.thumbwidth ?? null,
        height: ii.thumbheight ?? null,
        credit,
        license,
        license_url: strip(em.LicenseUrl?.value) || null,
        source: ii.descriptionurl,
        title: p.title,
      });
    }
    writeFileSync(path, JSON.stringify({ id: f.id, name: f.name, term, tokens, photos }, null, 1), 'utf8');
    fetched++;
    if (photos.length) hit++;
    if (fetched % 25 === 0) console.log(`  ${fetched} 件照会（写真あり ${hit}）`);
  } catch (e) {
    failed++;
  }
  await sleep(DELAY_MS);
}

console.log(`完了: 照会 ${fetched} / キャッシュ ${cached} / 写真候補あり ${hit} / 失敗 ${failed}`);
}
