/**
 * 会場名しか無い祭りに、自治体オープンデータの施設一覧から住所を入れる。
 *
 *   node scripts/enrich/venue-address-opendata.mjs
 *
 * 取ってくるのは `scripts/crawl/opendata-facilities.mjs`。ここは通信しない。
 *
 * 対象は **occurrences[0].source_type が official / gov のものだけ**。
 * media / aggregator 由来には触れない（別の工程が出典の格上げを担当している）。
 *
 * --- 同名の別の場所を掴まないために ---
 *
 * 「城山公園」「西原公園」「南小学校」は全国にいくらでもある。だから:
 *
 *  1. **施設一覧は市区町村ごとに持ち、区までキーに含める**。
 *     堺市南区の祭りは堺市南区の施設としか突き合わせない
 *  2. **会場名が完全に一致したときだけ採る**。部分一致は使わない。
 *     「美木多上公園」と「美木多公園」は別の公園でありうる
 *  3. **候補が 2 つ以上あるものは捨てる**。同じ区に同名施設が並ぶことがある
 *
 * 国土地理院の地名検索で住所を起こす案は捨てた。あれは住所の前方一致なので
 * 「末若氷川神社」→ 兵庫県三田市末、「此花公園」→ 大阪市此花区春日出北一丁目 のように
 * **もっともらしい別の場所**を返す。推測で埋めるくらいなら空のまま残す方が正しい。
 *
 * 住所の書き方は既存データに合わせ、**都道府県を付けない**（2455/2495 件がこの形）。
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { patch, ROOT } from '../import/_lib.mjs';

const OD = join(ROOT, 'data', 'raw', 'opendata');

/** data/festivals 以下の祭りを全部読む（共有ライブラリを増やさないためここに置く） */
function loadFestivals() {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (e.endsWith('.yml')) out.push(parse(readFileSync(p, 'utf8')));
    }
  };
  walk(join(ROOT, 'data', 'festivals'));
  return out;
}

// --- CSV ------------------------------------------------------------------

/** 自治体の CSV は UTF-8 と Shift_JIS が混在する。化けたら振り直す */
function decode(path) {
  const b = readFileSync(path);
  const t = new TextDecoder('utf-8', { fatal: false }).decode(b);
  return /�/.test(t) ? new TextDecoder('shift_jis').decode(b) : t;
}

/** 引用符つきに対応した最小限の CSV 分解。住所に「,」が入ることがあるので必要 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cur += '"'; i++; } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (c !== '\r') cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const csvOrNull = (name) => {
  const p = join(OD, `${name}.csv`);
  return existsSync(p) ? parseCsv(decode(p)) : null;
};

// --- 名前の正規化 ----------------------------------------------------------

/**
 * 会場名と施設名を突き合わせるための正規化。
 * **ここで丸めすぎると別の施設に当たる**ので、字体の揺れだけに留める。
 */
const norm = (s) => (s ?? '')
  .replace(/[\s　]/g, '')
  .replace(/[ヶヵケ]/g, 'ケ')     // 「西一社ヶ丘」等の揺れ
  .replace(/[髙]/g, '高')
  .replace(/[﨑]/g, '崎')
  .replace(/蓬莱/g, '蓬来')        // 名古屋市の表記は「蓬来小学校」
  .replace(/[０-９]/g, (d) => '0123456789'['０１２３４５６７８９'.indexOf(d)])
  .trim();

/** 都道府県を落として「市区町村＋以下」にする（既存データの書き方に合わせる） */
const dropPref = (a) => (a ?? '').replace(/^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/, '').trim();

/**
 * 政令市は area.city に区まで入っていて area.ward は null（例「堺市南区」）。
 * 東京の特別区は area.city が「足立区」。どちらからも区名を取り出す。
 */
const wardOf = (f) =>
  f.area?.ward ?? (f.area?.city ?? '').match(/^.+?市(.+区)$/)?.[1] ?? f.area?.city ?? '';

// --- 施設表 ----------------------------------------------------------------

/** @type {{ward: string, name: string, address: string, lat: number|null, lng: number|null, src: string}[]} */
const facilities = [];
const add = (ward, name, address, src, lat = null, lng = null) => {
  if (!ward || !name || !address) return;
  facilities.push({ ward, name, address: dropPref(address), lat, lng, src });
};

// 堺市 小学校一覧（住所・緯度経度つき）
{
  const rows = csvOrNull('sakai-shogakko');
  if (rows) {
    const h = rows[0];
    const at = (r, k) => r[h.indexOf(k)];
    for (const r of rows.slice(1)) {
      const lat = Number(at(r, '緯度'));
      const lng = Number(at(r, '経度'));
      add(at(r, '区名'), at(r, '施設名'), at(r, '住所'), '堺市 小学校一覧',
        Number.isFinite(lat) && lat ? lat : null, Number.isFinite(lng) && lng ? lng : null);
    }
  }
}

// 堺市 公園一覧。所在地が「南区城山台１丁１９－１」の形なので区は所在地から取る
{
  const rows = csvOrNull('sakai-koen');
  if (rows) {
    const h = rows[0];
    const at = (r, k) => r[h.indexOf(k)];
    for (const r of rows.slice(1)) {
      const addr = at(r, '所在地');
      const ward = addr?.match(/^(\S+?区)/)?.[1];
      add(ward, at(r, '公園名称'), `堺市${addr}`, '堺市 公園一覧');
    }
  }
}

// 名古屋市 都市公園一覧（名東区）。見出し行が 3 行あるので列位置で読む
{
  const rows = csvOrNull('nagoya-meito-koen');
  if (rows) {
    for (const r of rows) {
      const [, name, addr] = r;
      if (!/^名東区/.test(addr ?? '')) continue;
      add('名東区', name, `名古屋市${addr}`, '名古屋市 都市公園一覧');
    }
  }
}

// 足立区 都市公園・都立公園一覧
{
  const rows = csvOrNull('adachi-koen');
  if (rows) {
    const h = rows[0];
    const at = (r, k) => r[h.indexOf(k)];
    for (const r of rows.slice(1)) {
      add('足立区', at(r, '名称'), at(r, '所在地_連結表記'), '足立区 都市公園一覧');
    }
  }
}

// 江戸川区 地域のイベント会場（貸出可能施設）。同じ会館が部屋ごとに何行も出るので畳む
{
  const rows = csvOrNull('edogawa-eventspace');
  if (rows) {
    const h = rows[0];
    const at = (r, k) => r[h.indexOf(k)];
    const seen = new Set();
    for (const r of rows.slice(1)) {
      const name = at(r, '施設名称');
      if (!name || seen.has(name)) continue;
      seen.add(name);
      add('江戸川区', name, at(r, '所在地_連結表記'), '江戸川区 地域のイベント会場一覧');
    }
  }
}

// 名古屋市名東区の小・中学校。
// CSV では出ていないので、名古屋市の「名東区の小・中学校一覧」から住所だけを写した。
// https://www.city.nagoya.jp/kodomo/schools/1015850/1015852/1015867.html
// 出典が市の公式ページで、区も一致しているので同名の別校を掴む余地が無い。
for (const [name, addr] of [
  ['猪高小学校', '丁田町32'], ['藤が丘小学校', '藤が丘54'], ['香流小学校', '香流二丁目1201'],
  ['猪子石小学校', '猪子石二丁目1201'], ['高針小学校', '高針二丁目1103'], ['西山小学校', '西山本通2-35'],
  ['名東小学校', '亀の井三丁目134'], ['梅森坂小学校', '梅森坂四丁目201'], ['蓬来小学校', 'よもぎ台一丁目501'],
  ['本郷小学校', '本郷一丁目237'], ['貴船小学校', '貴船三丁目2301'], ['上社小学校', '上社五丁目1002'],
  ['豊が丘小学校', '豊が丘1501'], ['引山小学校', '引山一丁目1105'], ['極楽小学校', '高針台三丁目901'],
  ['平和が丘小学校', '平和が丘一丁目1'], ['前山小学校', '牧の里二丁目1501'], ['北一社小学校', '上菅一丁目101'],
  ['牧の原小学校', '牧の原三丁目401'],
  ['猪高中学校', '丁田町33'], ['神丘中学校', '神丘町1-18'], ['高針台中学校', '勢子坊三丁目801'],
  ['藤森中学校', '小池町66'], ['牧の池中学校', '梅森坂一丁目2504'], ['上社中学校', '社が丘四丁目301'],
  ['香流中学校', '猪子石原二丁目1301'],
]) {
  add('名東区', name, `名古屋市名東区${addr}`, '名古屋市 名東区の小・中学校一覧');
}

// 県神社庁のクロール結果（data/raw/jinjacho/）も施設一覧として使う。
// 神社庁は県内全神社の鎮座地を持っている一次情報なので、会場が神社の祭りに効く。
// **社号は全国どころか同じ県内でも重複する**ので、住所に市区町村名が含まれることを
// 条件にして引く（区キーは wardOf と同じ粒度＝市区町村名）。
for (const pref of ['tokyo', 'kanagawa', 'saitama']) {
  const dir = join(ROOT, 'data', 'raw', 'jinjacho', pref);
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir)) {
    let s;
    try { s = JSON.parse(readFileSync(join(dir, entry), 'utf8')); } catch { continue; }
    if (!s.address) continue;
    // 社号に神社IDが付いたまま入っていることがある（「皇大神宮 1206021000」）
    const name = String(s.name ?? '').replace(/\s*\d{6,}\s*$/, '').trim();
    // 「足柄上郡 中井町 遠藤84」「足立区千住宮元町24-1」→ 市区町村名を切り出す
    const muni = s.address.match(/([^\s]+?[市区町村])(?![^\s]*[市区町村])/)?.[1]
      ?? s.address.match(/([^\s]+?[市区町村])/)?.[1];
    if (!muni) continue;
    add(muni, name, s.address.replace(/\s+/g, ''), '県神社庁');
  }
}

// 区＋施設名で引けるようにする。同じ区に同名が 2 つ以上あるものは使わない
const index = new Map();
for (const f of facilities) {
  const k = `${f.ward}|${norm(f.name)}`;
  if (!index.has(k)) index.set(k, []);
  index.get(k).push(f);
}

// --- 突き合わせ ------------------------------------------------------------

let filled = 0;
let latlng = 0;
const ambiguous = [];

for (const f of loadFestivals()) {
  const occ = f.occurrences?.[0];
  if (!['official', 'gov'].includes(occ?.source_type)) continue; // 担当範囲の外
  if (f.venue?.address) continue;
  const ward = wardOf(f);
  const raw = f.venue?.name ?? '';

  // 「本郷公園・ 本郷コミセン」「美木多上公園 美木多校区地域会館」のように
  // 会場が並記されることがある。全体で当たらなければ先頭の施設名で試す
  // 「川勾神社および町内・海岸」のように接続語でつながることもある
  const candidates = [raw, ...raw.split(/[・、,，\/／\s]+|および|及び|ならびに/)].map(norm).filter(Boolean);

  let hit = null;
  for (const c of candidates) {
    const list = index.get(`${ward}|${c}`);
    if (!list) continue;
    if (list.length > 1) { ambiguous.push(`${f.id} / ${c}（${list.length}件）`); continue; }
    hit = list[0];
    break;
  }
  if (!hit) continue;

  const venue = { address: hit.address };
  // 緯度経度は施設一覧が持っているときだけ。無い分を推測で足さない
  if (hit.lat && hit.lng && !f.venue?.lat) { venue.lat = hit.lat; venue.lng = hit.lng; latlng++; }
  if (patch(f.id, { venue })) filled++;
}

if (ambiguous.length) {
  console.log(`  同名が複数あって決められなかったもの: ${ambiguous.length} 件`);
  for (const a of ambiguous.slice(0, 10)) console.log(`    ${a}`);
}
console.log(`オープンデータの施設一覧から住所: ${filled} 件（うち緯度経度 ${latlng} 件）`);
