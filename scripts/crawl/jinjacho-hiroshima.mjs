/**
 * 広島県神社庁クローラ
 *
 *   node scripts/crawl/jinjacho-hiroshima.mjs
 *
 * 「広島の神社」の一覧ページ（`hirosima_jinja/?search_area=<N>`）は、
 * **地図ポップアップ用の属性に神社の全項目を持っている**:
 *
 *   my_data="神社名,通称名,URL,電話番号,所在地,緯度,経度,例祭日,参拝時間"
 *
 * 表の見出しは 神社名／通称名／所在地／電話番号 までしか出ていないが、
 * **例祭日と緯度経度はこの属性にある**。一覧 30 枚で県内全社が取れるので、
 * 社ごとのページを開く必要が無い。
 *
 * 作法:
 *  - robots.txt を確認済み（Disallow は /wp-admin/ と /wp-includes/ のみ）
 *  - 1 リクエストごとに 1.5 秒空ける（30 枚しか取らないので十分にゆっくり）
 *  - User-Agent で素性を名乗る
 *  - 取得済みはディスクにキャッシュして二度と取りにいかない
 *
 * 出力: data/raw/jinjacho/hiroshima/<連番>.json
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'jinjacho', 'hiroshima');
const BASE = 'https://www.hiroshima-jinjacho.jp/hirosima_jinja/';
const DELAY_MS = 1500;
// HTTP ヘッダは ASCII のみ
const UA = 'matsuri-map/0.1 (local festival directory; collecting public reisai dates; polite crawler)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  let h = new TextDecoder('utf-8', { fatal: false }).decode(buf);
  if (/�/.test(h)) h = new TextDecoder('shift_jis').decode(buf);
  return h;
}

const decode = (s) =>
  String(s ?? '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();

/**
 * 「福山市鞆町後地1225番地」→ ["福山市","鞆町後地1225番地"]
 *
 * **市町村名は「最も短い 市／町／村 止まり」で切る。**
 * 欲張って切ると「尾道市瀬戸田町」「府中市土生町」を市町村名だと思ってしまう
 * （実データで 200 通り以上そうなった）。
 * ただしそれだけだと「廿日市市」が「廿日市」で切れるので、
 * **残りが 市／町／村 で始まっていたら 1 文字戻す**。
 *
 * 広島市の区は、エリア定義では「広島市中区」で 1 市区町村として扱う
 * （nationwide.yml がその形で持っている）ので市と区を分けない。
 */
const NEEDS_SUFFIX = new Set(['廿日市']);
const HIROSHIMA_WARDS = ['安佐南区', '安佐北区', '安芸区', '佐伯区', '中区', '東区', '南区', '西区'];
function splitParts(address) {
  const a = String(address ?? '').replace(/\s+/g, '').trim();
  for (const w of HIROSHIMA_WARDS) {
    if (a.startsWith(`広島市${w}`)) return [`広島市${w}`, a.slice(`広島市${w}`.length)].filter(Boolean);
  }
  const gun = a.match(/^(.{1,6}郡)(.{1,8}?[町村])(.*)$/);
  if (gun) return [gun[1], gun[2], gun[3]].filter(Boolean);
  const m = a.match(/^(.{1,8}?[市町村])(.*)$/);
  if (!m) return a ? [a] : [];
  let [, city, rest] = m;
  // 「廿日市市」だけは名前の中に「市」があるので短く切れてしまう。
  // 一般則にすると「庄原市市町」が「庄原市市」になるので、名指しで直す
  if (NEEDS_SUFFIX.has(city) && /^[市町村]/.test(rest)) { city += rest[0]; rest = rest.slice(1); }
  return [city, rest].filter(Boolean);
}

mkdirSync(OUT, { recursive: true });

/**
 * id は**神社名と所在地から作る**。
 * 行番号を使うと、出典側に 1 社増えただけで以降の id が全部ずれ、
 * 同じ祭りが二重に取り込まれる。並びに依らない形にしておく。
 */
const idOf = (name, address) =>
  createHash('sha1').update(`${name}|${address}`).digest('hex').slice(0, 12);

/**
 * **同じ神社が 2 回以上出てくる。**
 *  - 1 ページの中に PC 用と スマホ用の 2 つの my_data が並ぶ
 *  - area=10 は「広島市」全体で、area=11〜18 の区別一覧と中身が重なる
 * name+所在地 で一意にする（2,340 行 → 1,040 社）。
 */
const seen = new Set();

let areas = 0; let shrines = 0; let noDate = 0; let failed = 0;
for (let area = 1; area <= 32; area++) {
  let html;
  try {
    html = await get(`${BASE}?search_area=${area}`);
  } catch (e) {
    failed++;
    console.warn(`  ! area=${area}: ${e.message}`);
    await sleep(DELAY_MS);
    continue;
  }

  const rows = [...html.matchAll(/my_data="([^"]*)"/g)];
  if (!rows.length) { await sleep(DELAY_MS); continue; }
  areas++;

  let i = 0;
  for (const m of rows) {
    // 神社名,通称名,URL,電話番号,所在地,緯度,経度,例祭日,参拝時間
    const f = m[1].split(',').map(decode);
    const [name, nickname, site, tel, address, lat, lng, festivalDay] = f;
    if (!name || !address) continue;

    const id = idOf(name, address);
    if (seen.has(id)) continue;
    seen.add(id);
    i++;
    const rec = {
      id,
      // 一覧ページそのものが出典。神社ごとの URL は無い
      url: `${BASE}?search_area=${area}`,
      name,
      nickname: nickname || null,
      zip: null,
      address,
      addressParts: splitParts(address),
      lat: lat && Number.isFinite(Number(lat)) ? Number(lat) : null,
      lng: lng && Number.isFinite(Number(lng)) ? Number(lng) : null,
      site: site || null,
      tel: tel || null,
      festivals: festivalDay ? [{ date: festivalDay, name: '例祭', alias: null }] : [],
    };
    if (!rec.festivals.length) noDate++;
    writeFileSync(join(OUT, `${id}.json`), JSON.stringify(rec, null, 1), 'utf8');
    shrines++;
  }
  console.log(`  area=${area}: ${i} 社`);
  await sleep(DELAY_MS);
}

console.log(`完了: ${areas} エリア / ${shrines} 社（例祭日なし ${noDate} / 取得失敗 ${failed}）`);
