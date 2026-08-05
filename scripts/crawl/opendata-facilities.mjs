/**
 * 自治体オープンデータの「施設一覧」を取ってくる（学校・公園・地域会館）。
 *
 *   node scripts/crawl/opendata-facilities.mjs
 *
 * なぜ要るか:
 *   区が出している祭りの一覧は **会場名しか持っていない**（「若松台小学校」「城山公園」）。
 *   住所が無いと地図が引けない。会場名から住所を起こす必要がある。
 *
 * なぜ「検索で住所を調べる」ではなく施設一覧なのか:
 *   国土地理院の地名検索を試したが、あれは**住所の前方一致**で、施設名では当たらない。
 *   「末若氷川神社」で兵庫県三田市が返り、「此花公園」で無関係な町丁目が返った。
 *   同名の別の場所を掴む事故そのものなので使わない。
 *   自治体が出している施設一覧なら、**その区の施設だけが載っている**ので取り違えない。
 *
 * 作法:
 *   - 取得済みはディスクに残して二度と取りにいかない（data/raw/opendata/）
 *   - 1 リクエストごとに 2 秒あける
 *   - User-Agent で素性と連絡先を名乗る
 *
 * 出典はいずれも自治体の公開オープンデータ（CC BY 相当）。ここでは加工しない。
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'opendata');
const DELAY_MS = 2000;
// HTTP ヘッダは ASCII のみ
const UA = 'matsuri-map/0.1 (local festival directory; +https://omatsuri-map.com; polite crawler)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 取りにいく一覧。
 * name は data/raw/opendata/<name>.csv になり、enrich 側がこの名前で読む。
 */
const SOURCES = [
  // --- 大阪府堺市 -----------------------------------------------------------
  // 南区の「区の行事」一覧は会場が小学校・公園ばかり。堺市は両方を出している
  {
    name: 'sakai-shogakko',
    url: 'https://data.bodik.jp/dataset/6698757a-43be-41ee-924b-678daf12b453/resource/8029d835-11d6-4709-ae26-ae0562e9b4d9/download/sakai_r4-4-1shougakkou.csv',
    note: '堺市 小学校一覧（住所・緯度経度つき）',
  },
  {
    name: 'sakai-koen',
    url: 'https://data.bodik.jp/dataset/62556471-e9f0-41e7-8001-1023a686df54/resource/6d0496fd-693a-42b0-ae81-e8aaf6555dea/download/.csv',
    note: '堺市 公園一覧',
  },
  // --- 愛知県名古屋市 -------------------------------------------------------
  // 名東区は「学区の夏まつり」型で、会場が小学校か区内の公園
  {
    name: 'nagoya-meito-koen',
    url: 'https://data.bodik.jp/dataset/a3b02650-8722-4555-b813-f07ba49d0c12/resource/86dd60b7-b3a2-4875-9f08-fe5d6358660c/download/15_meito_toshikouen20240401.csv',
    note: '名古屋市 都市公園一覧（名東区）',
  },
  // --- 東京都 ---------------------------------------------------------------
  {
    name: 'adachi-koen',
    url: 'https://www.opendata.metro.tokyo.lg.jp/adachi/131211_adachiku_toshitoritukouen.csv',
    note: '足立区 都市公園・都立公園一覧',
  },
  {
    name: 'edogawa-eventspace',
    url: 'https://www.opendata.metro.tokyo.lg.jp/edogawa/131237_edogawaku_chiikinoeventspace.csv',
    note: '江戸川区 地域のイベント会場（貸出可能施設）一覧',
  },
];

mkdirSync(OUT, { recursive: true });

let got = 0;
let skipped = 0;
for (const s of SOURCES) {
  const path = join(OUT, `${s.name}.csv`);
  if (existsSync(path)) {
    skipped++;
    continue;
  }
  const r = await fetch(s.url, { headers: { 'User-Agent': UA } });
  if (!r.ok) {
    console.warn(`  ! ${s.name}: ${r.status}`);
    await sleep(DELAY_MS);
    continue;
  }
  writeFileSync(path, Buffer.from(await r.arrayBuffer()));
  console.log(`  ${s.name} <- ${s.note}`);
  got++;
  await sleep(DELAY_MS);
}
console.log(`オープンデータ施設一覧: ${got} 件取得 / ${skipped} 件キャッシュ済み`);
