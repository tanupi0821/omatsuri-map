/**
 * ウォーカープラス（花火・夏祭り）の**詳細ページ**を取る
 *
 *   node scripts/crawl/hanabi-detail.mjs [--kind hanabi|summer] [--limit 50]
 *
 * ## なぜ一覧の JSON-LD ではなく詳細ページなのか
 *
 * 一覧ページの JSON-LD には `addressRegion`（県）と `addressLocality`（市区町村）
 * しか入っていない。以前、そこに住所があると考えて全 47 都道府県を再クロールし、
 * **住所を 1 件も得られなかった**。同じ失敗を繰り返さないこと。
 *
 * 詳細ページを 1 枚だけ手で開いて確かめた結果（2026-08-05）:
 *
 * | ページ | 取れるもの |
 * |---|---|
 * | 花火 `/detail/<id>/map.html` | 会場・**会場アクセス（最寄駅）**・問い合わせ（主催）・公式サイト・**緯度経度**・開催時間 |
 * | 花火 `/detail/<id>/data.html` | 打ち上げ数・人出・荒天時。**スキーマに無いので取らない** |
 * | 夏祭 `/odekake/detail_e/<id>/map.html` | **住所**・交通アクセス・問い合わせ・緯度経度 |
 * | 夏祭 `/odekake/detail_e/<id>/data.html` | **開催時間**・公式サイト・屋台の内訳 |
 *
 * **花火の詳細ページに「住所」の欄は無い。** 代わりに地図の埋め込み URL
 * （Google Maps Embed の `q=<lat>,<lng>`）に打ち上げ場所の緯度経度が入っている。
 * 住所は enrich 側で国土地理院の逆ジオコーダに引かせる。
 *
 * 花火は開催時間がヘッダの `<dl class="detail_date_box">` にも出るので
 * **map.html 1 枚で足りる**。夏祭りだけ 2 枚要る。
 *
 * ## 行儀
 *
 * - robots.txt を確認済み。hanabi は Sitemap 行のみ、summer は `Disallow:`（全許可）。
 *   Content-Signal の宣言は無い（`ai-train=no` を掲げるサイトは使わない方針）
 * - **1.2 秒で回したら 47 都道府県中 46 が 404 になった**（本物の 404 ではなく遮断）。
 *   ここは 3.5 秒あけ、404/429/503 は一度 60 秒待って引き直す
 * - User-Agent は ASCII で連絡先入り
 * - 取った HTML は data/raw/walker-detail/ に置く。やり直しでも再取得しない
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'walker-detail');
const DELAY_MS = 3500;
const RETRY_WAIT_MS = 60000;
const UA = 'matsuri-map/0.1 (local festival directory; +mailto:tanupiyota@gmail.com; polite crawler, 3.5s delay)';

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const ONLY_KIND = arg('--kind', null);
const LIMIT = Number(arg('--limit', Infinity));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 取得対象の URL の形。花火と夏祭りで階層が違う */
const SITE = {
  hanabi: {
    url: (id, page) => `https://hanabi.walkerplus.com/detail/${id}/${page}.html`,
    // 花火は開催時間もヘッダに出るので map だけでよい
    pages: ['map'],
    re: /hanabi\.walkerplus\.com\/detail\/([a-z0-9]+)\//,
  },
  summer: {
    url: (id, page) => `https://summer.walkerplus.com/odekake/detail_e/${id}/${page}.html`,
    // 夏祭りは開催時間が data、住所が map と分かれている
    pages: ['map', 'data'],
    re: /summer\.walkerplus\.com\/odekake\/detail_e\/([a-z0-9]+)\//,
  },
};

/** 担当は id に -hanabi- / -summer- を含む祭りだけ。他は触らない */
export function inScopeFestivals(root = ROOT) {
  const walk = (d) => readdirSync(d).flatMap((e) => {
    const p = join(d, e);
    return statSync(p).isDirectory() ? walk(p) : (e.endsWith('.yml') ? [p] : []);
  });

  const out = [];
  for (const path of walk(join(root, 'data', 'festivals'))) {
    const id = basename(path, '.yml');
    const kind = id.includes('-hanabi-') ? 'hanabi' : id.includes('-summer-') ? 'summer' : null;
    if (!kind) continue;
    const f = parse(readFileSync(path, 'utf8'));
    // 出典 URL が walkerplus でないものが 12 件ある（別のインポータ由来で
    // slug にたまたま hanabi/summer が入っただけ）。詳細ページが無いので対象外
    const url = f.occurrences?.[0]?.source_url ?? '';
    const m = url.match(SITE[kind].re);
    if (!m) continue;
    out.push({ path, id, kind, eventId: m[1], f });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 取った HTML から項目を読む（enrich 側からも使う）
// ---------------------------------------------------------------------------

const strip = (h) => String(h ?? '')
  .replace(/<br\s*\/?>/g, ' ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ').trim();

export function cachePath(kind, eventId, page) {
  return join(OUT, `${kind}-${eventId}.${page}.html`);
}

/**
 * `<table class="s_table">` を 見出し→値 の Map にする。
 * 花火の map.html も夏祭りの map/data.html も同じ class を使っている。
 * 値の中の最初のリンク先も一緒に返す（公式サイトの href がそこにある）。
 */
function readTable(html) {
  const out = new Map();
  for (const t of html.matchAll(/<table class="s_table">([\s\S]*?)<\/table>/g)) {
    for (const r of t[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
      const th = (r[1].match(/<th[^>]*>([\s\S]*?)<\/th>/) ?? [])[1];
      const td = (r[1].match(/<td[^>]*>([\s\S]*?)<\/td>/) ?? [])[1];
      if (!th) continue;
      const href = (String(td ?? '').match(/href="(https?:\/\/[^"]+)"/) ?? [])[1] ?? null;
      out.set(strip(th), { text: strip(td), href });
    }
  }
  return out;
}

/** ヘッダの `開催期間` / `開催時間`。花火はここにしか開催時間が無い */
function readHeaderDl(html) {
  const out = new Map();
  const re = /<dt class="detail_date_icon"><span>([^<]*)<\/span><\/dt>\s*<dd class="detail_date_text">([\s\S]*?)<\/dd>/g;
  for (const m of html.matchAll(re)) out.set(strip(m[1]), strip(m[2]));
  return out;
}

/**
 * 「20:00～20:30」から始まり、後ろに注記が続くことが多い。
 *   20:00～(約5分間) / 20:30～20:55まつりは…18:00～ / 19:00～21:00(荒天時は…)
 * **先頭に錨を打って読む**。本文のどこかにある時刻を拾うと、
 * 「まつりは…18:00～」の側を開始時刻にしてしまう。
 * 範囲になっていないものは開始だけ入れる。
 */
export function parseTimeRange(s) {
  if (!s) return {};
  const t = String(s).replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).trim();
  const pad = (x) => x.replace(/^(\d):/, '0$1:');
  const both = t.match(/^(\d{1,2}:\d{2})\s*[～~〜ー―–—-]\s*(\d{1,2}:\d{2})/);
  if (both) return { start: pad(both[1]), end: pad(both[2]) };
  const one = t.match(/^(\d{1,2}:\d{2})/);
  if (one) return { start: pad(one[1]) };
  return {};
}

/**
 * 会場アクセスは「【電車】… 【車】…」の形。**最寄駅は【電車】の側だけ**。
 * 車の案内（IC 名）を最寄駅にすると意味が通らない。
 */
export function parseStation(s) {
  if (!s) return null;
  const m = String(s).match(/【電車】([\s\S]*?)(?=【|$)/);
  let v = (m ? m[1] : '').trim().replace(/\s+/g, ' ');
  // 注記（※…）と 2 文目以降は最寄駅の説明ではない
  v = v.replace(/\s*※[\s\S]*$/, '').replace(/。[\s\S]*$/, '').trim();
  if (!v || !/駅|停留所|バス停/.test(v)) return null;
  if (v.length > 60) v = v.slice(0, 60).replace(/[、,(（][^、,]*$/, '').trim();
  return v || null;
}

/**
 * 問い合わせ欄は「0562-32-5149 東海市観光協会事務局」の形。
 * 電話番号を落として団体名だけにする。
 * **これは「問い合わせ先」であって「主催」そのものではない**が、
 * この規模の花火は観光協会・実行委員会・商工会が実施主体を兼ねている。
 * 団体らしい語で終わるものだけを主催として採り、それ以外（個人名・
 * 案内所・コールセンター）は入れない。
 */
const ORG_RE = /(実行委員会|委員会|奉賛会|保存会|振興会|協賛会|協進会|観光協会|商工会|商工会議所|商店街|商店会|協同組合|組合|連合会|自治会|町内会|青年会議所|観光局|観光課|観光係|観光交流課|事務局|支所|役場|市役所|区役所|町役場|村役場|公社|財団|社団|協会|センター|株式会社|有限会社|神社|寺|宮|会|課|部|所|園|館|村|局)$/;
export function parseOrganizer(s) {
  if (!s) return null;
  let v = String(s)
    // 先頭の電話番号（0から始まるハイフン区切り／括弧書き）を落とす
    .replace(/^[\d\-()（）\s]*(?:0\d{1,4}[-(]\d{1,4}[)-]\d{3,4})?[\s]*/, '')
    .replace(/^[\d\-()（）\s]+/, '')
    .trim();
  // 末尾の受付時間・注記を落とす
  v = v.replace(/[（(][^）)]*[）)]\s*$/, '').replace(/\s*※[\s\S]*$/, '').trim();
  if (!v || v.length < 3 || v.length > 40) return null;
  // 日本語が入っていない（英字だけ）ものは団体名ではない
  if (!/[ぁ-んァ-ヶ一-龥]/.test(v)) return null;
  if (/案内所|インフォメーション|コールセンター|テレホン|ダイヤル|ダイアル/.test(v)) return null;
  if (ORG_RE.test(v)) return v;
  // 「渥美半島花火大会実行委員会((一社)渥美半島観光ビューロー)」のように
  // 括弧の中にもう一つ括弧が入ると、末尾の括弧だけを落とす処理では剥がれない。
  // 最初の括弧より前を団体名として見直す
  const head = v.split(/[（(]/)[0].trim();
  if (head.length >= 3 && ORG_RE.test(head)) return head;
  return null;
}

/**
 * ヘッダの「開催期間」に載っている日付。取り込み済みの日付と食い違っていないかの
 * 突き合わせにだけ使う（書き換えはしない。期間の表記が多様すぎて機械的に直せない）。
 *   2026年8月8日(土) / 7/25(土)・26(日)、8/1(土)～16(日) / 2026年8月8日(土)～16日(日)
 */
export function parseHeaderDates(s) {
  if (!s) return [];
  const out = new Set();
  let year = null;
  let month = null;
  // 「2026年8月8日」「8月8日」「8/8」を順に読む。年・月は直前の値を引き継ぐ
  const re = /(?:(\d{4})年)?(?:(\d{1,2})[月/])?(\d{1,2})日?(?=[^\d]|$)/g;
  for (const m of String(s).matchAll(re)) {
    if (m[1]) year = Number(m[1]);
    if (m[2]) month = Number(m[2]);
    if (!month) continue;
    const d = Number(m[3]);
    if (!(d >= 1 && d <= 31)) continue;
    if (year) out.add(`${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return [...out];
}

/** 地図の埋め込み URL に打ち上げ場所の緯度経度が入っている */
export function parseGeo(html) {
  const m = html.match(/maps\/embed[^"]*?[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  // 日本の範囲から外れた値は使わない
  if (!(lat > 20 && lat < 46 && lng > 122 && lng < 154)) return null;
  return { lat, lng };
}

/**
 * 1 イベント分のキャッシュを読んで、埋めたい項目だけを返す。
 * 取れなかった項目は undefined のままにする（null を入れると patch が消しに行く）。
 */
export function parseDetail(kind, eventId) {
  const mapFile = cachePath(kind, eventId, 'map');
  if (!existsSync(mapFile)) return null;
  const map = readFileSync(mapFile, 'utf8');
  const mt = readTable(map);
  const out = { geo: parseGeo(map) };

  // 会場
  const venue = mt.get('会場')?.text ?? mt.get('スポット名')?.text;
  if (venue) out.venue = venue;
  // 住所（夏祭りだけ欄がある。「愛知県 津島市宮川町1丁目地内外」）
  const addr = mt.get('住所')?.text;
  if (addr) out.address = addr;
  // 最寄駅
  const access = mt.get('会場アクセス')?.text ?? mt.get('交通アクセス')?.text;
  const st = parseStation(access);
  if (st) out.station = st;
  // 主催（問い合わせ欄から）
  const contact = mt.get('問い合わせ')?.text ?? mt.get('お問い合わせ1')?.text;
  if (contact) out.contact = contact;
  const org = parseOrganizer(contact);
  if (org) out.organizer = org;
  // 公式サイト
  const site = mt.get('公式サイト')?.href;
  if (site) out.official = site;

  // 開催時間: 花火は map.html のヘッダ、夏祭りは data.html の表
  out.headerPeriod = readHeaderDl(map).get('開催期間');
  const t = parseTimeRange(readHeaderDl(map).get('開催時間'));
  if (t.start) { out.start = t.start; if (t.end) out.end = t.end; }

  const dataFile = cachePath(kind, eventId, 'data');
  if (existsSync(dataFile)) {
    const dt = readTable(readFileSync(dataFile, 'utf8'));
    const t2 = parseTimeRange(dt.get('開催時間')?.text);
    if (!out.start && t2.start) { out.start = t2.start; if (t2.end) out.end = t2.end; }
    if (!out.official && dt.get('公式サイト')?.href) out.official = dt.get('公式サイト').href;
    out.rawTime = dt.get('開催時間')?.text ?? readHeaderDl(map).get('開催時間');
  } else {
    out.rawTime = readHeaderDl(map).get('開催時間');
  }
  return out;
}

/**
 * @param retry 404 を遮断とみなして待ち直すか。
 *   詳細ページの URL は一覧から得たものなので、404 はまず遮断を疑う。
 */
async function get(url, attempt = 0) {
  let r;
  try {
    r = await fetch(url, { headers: { 'User-Agent': UA } });
  } catch (e) {
    if (attempt === 0) { await sleep(RETRY_WAIT_MS); return get(url, 1); }
    throw e;
  }
  if (r.ok) return r.text();
  if (attempt === 0 && [404, 403, 429, 503].includes(r.status)) {
    const ra = Number(r.headers.get('retry-after'));
    await sleep(Number.isFinite(ra) && ra > 0 ? ra * 1000 : RETRY_WAIT_MS);
    return get(url, 1);
  }
  throw new Error(String(r.status));
}

// ---------------------------------------------------------------------------
// 逆ジオコーディング（国土地理院）
// ---------------------------------------------------------------------------
//
// **花火の詳細ページに住所の欄は無い。** 代わりに地図の緯度経度がある。
// 国土地理院の逆ジオコーダは緯度経度から市区町村コードと町丁目を返す。
// 出典が公的機関なので、まとめサイトの住所より格が上。
//
//   https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=&lon=
//   → {"results":{"muniCd":"23222","lv01Nm":"中央町三丁目"}}
//
// 市区町村コードの名前は地理院地図の muni.js（同じく国土地理院）から引く。
// **返ってきた市区町村が掲載市と違ったら捨てる**。以前、別の市の情報を
// 取り込む事故が何度も起きている。川の対岸に落ちた座標などがこれで弾かれる。

export const GSI_FILE = join(OUT, '_gsi.json');
const MUNI_FILE = join(OUT, '_muni.json');

/** muniCd -> {pref, name} の表を作る（1 回だけ取って保存） */
async function loadMuni() {
  if (existsSync(MUNI_FILE)) return JSON.parse(readFileSync(MUNI_FILE, 'utf8'));
  const js = await get('https://maps.gsi.go.jp/js/muni.js');
  const table = {};
  // GSI.MUNI_ARRAY["23222"] = '23,愛知県,23222,東海市';
  for (const m of js.matchAll(/MUNI_ARRAY\["(\d+)"\]\s*=\s*'([^']*)'/g)) {
    const [, prefName, code, muniName] = m[2].split(',');
    if (!muniName) continue;
    // '札幌市　中央区' のように全角空白が入る。データ側は空白なしなので揃える
    table[String(Number(m[1]))] = { pref: prefName, name: muniName.replace(/[\s　]/g, '') };
    void code;
  }
  writeFileSync(MUNI_FILE, JSON.stringify(table, null, 1), 'utf8');
  return table;
}

export function loadGsiCache() {
  return existsSync(GSI_FILE) ? JSON.parse(readFileSync(GSI_FILE, 'utf8')) : {};
}

async function runGeocode() {
  mkdirSync(OUT, { recursive: true });
  const muni = await loadMuni();
  const cache = loadGsiCache();
  if (!cache._muni) cache._muni = muni;

  const targets = inScopeFestivals().filter((t) => !ONLY_KIND || t.kind === ONLY_KIND);
  const jobs = [];
  for (const t of targets) {
    const d = parseDetail(t.kind, t.eventId);
    if (!d?.geo) continue;
    const key = `${d.geo.lat},${d.geo.lng}`;
    if (cache[key]) continue;
    if (!jobs.some((j) => j.key === key)) jobs.push({ key, ...d.geo });
  }
  console.log(`逆ジオコーディング: 未取得 ${jobs.length} 点`);

  let ok = 0;
  for (const [i, j] of jobs.entries()) {
    if (ok >= LIMIT) break;
    try {
      const url = `https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${j.lat}&lon=${j.lng}`;
      const r = JSON.parse(await get(url));
      cache[j.key] = r.results ?? null;
      ok++;
    } catch (e) {
      cache[j.key] = null; // 引けなかった点は覚えておいて再試行しない
      console.warn(`  ! ${j.key}: ${e.message}`);
    }
    // 公的機関の無償 API なので 1 秒はあける
    await sleep(1000);
    if (i % 100 === 99) writeFileSync(GSI_FILE, JSON.stringify(cache, null, 1), 'utf8');
  }
  writeFileSync(GSI_FILE, JSON.stringify(cache, null, 1), 'utf8');
  console.log(`逆ジオコーディング: ${ok} 点を取得`);
}

// enrich 側から inScopeFestivals() を import する。直接叩かれたときだけ取りに行く
const IS_MAIN = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (IS_MAIN && process.argv.includes('--geocode')) {
  await runGeocode();
} else if (IS_MAIN) {
  const targets = inScopeFestivals().filter((t) => !ONLY_KIND || t.kind === ONLY_KIND);
  mkdirSync(OUT, { recursive: true });

  // 同じイベント id が複数の祭りに割り当たることは無いが、念のため一意化
  const jobs = [];
  const seen = new Set();
  for (const t of targets) {
    for (const page of SITE[t.kind].pages) {
      const key = `${t.kind}/${t.eventId}.${page}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const file = join(OUT, `${t.kind}-${t.eventId}.${page}.html`);
      if (existsSync(file)) continue;
      jobs.push({ ...t, page, file, key });
    }
  }

  console.log(`対象 ${targets.length} 件 / 未取得 ${jobs.length} ページ（3.5秒間隔で約 ${Math.ceil(jobs.length * 3.5 / 60)} 分）`);

  let ok = 0;
  const failed = [];
  for (const [i, j] of jobs.entries()) {
    if (ok >= LIMIT) break;
    try {
      const html = await get(SITE[j.kind].url(j.eventId, j.page));
      writeFileSync(j.file, html, 'utf8');
      ok++;
    } catch (e) {
      failed.push(`${j.key}: ${e.message}`);
    }
    if (i % 25 === 24) console.log(`  ${i + 1}/${jobs.length}（成功 ${ok} / 失敗 ${failed.length}）`);
    await sleep(DELAY_MS);
  }

  console.log(`取得 ${ok} ページ / 失敗 ${failed.length}`);
  for (const f of failed.slice(0, 20)) console.warn(`  ! ${f}`);
}
