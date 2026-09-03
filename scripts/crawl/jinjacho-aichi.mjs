/**
 * 愛知県神社庁クローラ
 *
 *   node scripts/crawl/jinjacho-aichi.mjs [--refresh]
 *
 * `docs/kanto-plan.md` には愛知は「JS描画」で取れないと書いてあるが、
 * **描画しているのは公開の JSON API** で、そこを直接叩ける。
 *
 *   POST https://www.aichi-jinjacho.or.jp/index.php/search/shrine
 *   {"addr":"愛知県","limit":-1}
 *
 * 1 レコードが **`festival_day`（例祭日）を持っている**のがこの県の要点で、
 * 3,100 社ぶんの例祭日が 1 リクエストで取れる。しかも愛知の例祭は
 * 10 月に極端に偏っていて、秋の受け皿としては関東の神社庁より効く。
 *
 * 作法:
 *  - robots.txt を確認済み（Disallow は /shinsyoku/ のみ。AI 利用拒否の宣言も無い）
 *  - **一覧は 1 リクエストで済むので、社ごとに叩かない**（相手の負荷がいちばん小さい）
 *  - 取得した一覧はディスクに残し、--refresh を付けない限り取りにいかない
 *  - User-Agent で素性を名乗る
 *  - 書き出しは 1 社ずつ即座に行う（途中で落ちても成果が残る）
 *
 * 出力: data/raw/jinjacho/aichi/<id>.json（神奈川版と同じ形の生データ）
 *       data/raw/jinjacho/aichi-index/all.json（API 応答そのもの。再実行用のキャッシュ）
 */
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'jinjacho', 'aichi');
const CACHE_DIR = join(ROOT, 'data', 'raw', 'jinjacho', 'aichi-index');
const CACHE = join(CACHE_DIR, 'all.json');
const API = 'https://www.aichi-jinjacho.or.jp/index.php/search/shrine';
const DETAIL = 'https://www.aichi-jinjacho.or.jp/search_detail.html?id=';
// HTTP ヘッダは ASCII のみ。日本語を入れると fetch が落ちる
const UA = 'matsuri-map/0.1 (local festival directory; collecting public reisai dates; polite crawler)';

const REFRESH = process.argv.includes('--refresh');

// 名古屋市の区。長い名前から先に見ないと「中村区」が「中区」に食われる
const NAGOYA_WARDS = ['千種', '中村', '中川', '昭和', '瑞穂', '熱田', '守山', '名東', '天白',
  '東', '西', '南', '北', '港', '緑', '中'];

/**
 * 出典側の市町村名には揺れがある。**推測で別の市に振り替えることはしない**。
 * 直すのは、名古屋市の区が読み取れる形で壊れている 3 通りだけ。
 *   「名古屋市 瑞穂区」  … 空白が入っている
 *   「名古屋市昭和区広路町」… 町名まで市名の欄に入っている
 *   「名古屋市」＋ addr「西区城西5丁目」… 区が住所の側に入っている
 */
function fixCity(cityRaw, addrRaw) {
  let city = String(cityRaw ?? '').replace(/\s+/g, '');
  let addr = String(addrRaw ?? '').trim();
  for (const w of NAGOYA_WARDS) {
    const p = `名古屋市${w}区`;
    if (city.startsWith(p)) {
      const extra = city.slice(p.length);
      return { city: p, addr: extra + addr };
    }
  }
  if (city === '名古屋市') {
    for (const w of NAGOYA_WARDS) {
      if (addr.startsWith(`${w}区`)) return { city: `名古屋市${w}区`, addr: addr.slice(`${w}区`.length) };
    }
  }
  return { city, addr };
}

function cleanStation(v) {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  if (s.length > 24) return null;
  if (/徒歩|[０-９0-9]+分|車で|下車後|より|から/.test(s)) return null;
  return s;
}

async function fetchIndex() {
  if (!REFRESH && existsSync(CACHE)) {
    console.log('  一覧はキャッシュを使う（取り直すには --refresh）');
    return JSON.parse(readFileSync(CACHE, 'utf8'));
  }
  const r = await fetch(API, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
    body: JSON.stringify({ addr: '愛知県', limit: -1, orders: 'addr,kana' }),
    signal: AbortSignal.timeout(120000),
  });
  if (!r.ok) throw new Error(`${r.status} ${API}`);
  const j = await r.json();
  if (!Array.isArray(j.list)) throw new Error('list が無い（API の形が変わった可能性）');
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(CACHE, JSON.stringify(j), 'utf8');
  return j;
}

mkdirSync(OUT, { recursive: true });

const index = await fetchIndex();
console.log(`愛知県神社庁: ${index.list.length} 社`);

let wrote = 0;
let noFestival = 0;
for (const s of index.list) {
  if (!s.id) continue;
  const { city, addr } = fixCity(s.city, s.addr);
  const rest = `${addr}${s.house_num ?? ''}`.trim();
  const fd = String(s.festival_day ?? '').trim();
  if (!fd) noFestival++;

  // 祭りの id にそのまま入るので、UUID のハイフンだけ落として短くする。
  // **先頭を切り詰めてはいけない**（8 桁では 105 組がぶつかった。
  // このサイトの UUID は乱数ではなく、前半が揃っている組がある）
  const key = String(s.id).replace(/-/g, '');

  const rec = {
    id: key,
    uuid: s.id,
    url: DETAIL + s.id,
    name: String(s.name ?? '').trim(),
    kana: s.kana || null,
    nickname: s.nickname || null,
    zip: s.zip || null,
    city,
    address: [city, rest].filter(Boolean).join(''),
    // splitAddress（import/jinjacho.mjs）が読む形。愛知は政令市の区も
    // エリア定義では 1 つの市区町村として扱うので、市と区を分けない
    addressParts: [city, rest].filter(Boolean),
    // 交通手段の欄は大半が駅名だけだが、27 件は「◯◯駅・徒歩15分、若しくは…」
    // という道順の文。schema の station は最寄駅なので、文になっているものは捨てる
    station: cleanStation(s.station),
    // 神社庁が持っているのは例祭日 1 つだけで、祭礼名は付いていない
    festivals: fd ? [{ date: fd, name: '例祭', alias: null }] : [],
  };

  const path = join(OUT, `${key}.json`);
  writeFileSync(path, JSON.stringify(rec, null, 1), 'utf8');
  wrote++;
  if (wrote % 500 === 0) console.log(`  ${wrote} 社書き出し`);
}

console.log(`完了: ${wrote} 社（うち例祭日が無い ${noFestival} 社）`);
