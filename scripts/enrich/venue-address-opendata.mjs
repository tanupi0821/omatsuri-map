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

/** HTML の <table> を行の配列にする。列は見出し行の並びで読むこと */
function tableRows(name) {
  const p = join(OD, `${name}.html`);
  if (!existsSync(p)) return null;
  const html = decode(p);
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)]
    .map((m) => [...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)]
      .map((c) => c[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()));
}

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
/** 「主催（町会名）＋会場名」で引く表。同名の会場が同じ区に複数あるときの決め手にする */
const orgVenueAddr = new Map();
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

// 名古屋市 都市公園一覧。見出し行が 3 行あるので列位置で読む。
// 所在地が「名東区にじが丘３丁目」の形なので、そこから区を取る（他区の行を拾わない）
for (const [file, ward] of [['nagoya-meito-koen', '名東区'], ['nagoya-midori-koen', '緑区']]) {
  const rows = csvOrNull(file);
  if (!rows) continue;
  for (const r of rows) {
    const [, name, addr] = r;
    if (!addr?.startsWith(ward)) continue;
    add(ward, name, `名古屋市${addr}`, '名古屋市 都市公園一覧');
  }
}

/**
 * wagmap 系（大阪市「マップナビおおさか」・神戸市）の施設 CSV を読む。
 * どちらも同じ地図基盤なので列の形が揃っている:
 *   施設名称 or 施設名 / 所在地 or 住所 / 経度 / 緯度
 * 住所は「大阪市阿倍野区…」と「住之江区…」のように市名の有無が混在するので、
 * 区名を取り出したうえで「<市><区>…」の形に揃える（既存データの書き方に合わせる）。
 */
function loadWagmap(file, city, label) {
  const rows = csvOrNull(file);
  if (!rows) return;
  const h = rows[0];
  const col = (...names) => {
    for (const n of names) { const i = h.indexOf(n); if (i >= 0) return i; }
    return -1;
  };
  const iName = col('施設名称', '施設名');
  const iAddr = col('所在地', '住所');
  const iLat = col('緯度');
  const iLng = col('経度');
  if (iName < 0 || iAddr < 0) return;

  for (const r of rows.slice(1)) {
    const name = r[iName];
    const loc = (r[iAddr] ?? '').replace(new RegExp(`^${city}`), '');
    const ward = loc.match(/^(\S+?区)/)?.[1];
    if (!name || !ward) continue;
    const lat = Number(r[iLat]);
    const lng = Number(r[iLng]);
    add(ward, name, `${city}${loc}`, label,
      Number.isFinite(lat) && lat ? lat : null, Number.isFinite(lng) && lng ? lng : null);
  }
}

// 大阪市。**児童遊園・広場・地域集会所まで入っている**ので町内会規模の会場に効く
for (const f of ['osaka-mapnavi-gakko', 'osaka-mapnavi-koen', 'osaka-mapnavi-kaikan']) {
  loadWagmap(f, '大阪市', 'マップナビおおさか');
}

// 神戸市。学校の住所は**指定避難所の一覧**に入っている（市は学校一覧を
// オープンデータにしていないが、小中学校はほぼ全部が避難所になっている）
for (const f of ['kobe-hinanjo-indoor', 'kobe-hinanjo-outdoor', 'kobe-fukushi-center']) {
  loadWagmap(f, '神戸市', '神戸市オープンデータ');
}

// 東京都防災マップ（避難所・避難場所）。**23区市町村を横断**していて、
// 小中学校・公園・広場が施設名と所在地住所つきで入っている。
// 区ごとに公園一覧を探して回るより、これ 1 本の方が広く効く。
// 見出し行がファイルの先頭に無い（1 行目が空のカンマ列）ので、
// 「所在地住所」を含む行を見出しとして探す
for (const file of ['tokyo-hinanjo', 'tokyo-hinanbasho']) {
  const rows = csvOrNull(file);
  if (!rows) continue;
  const hi = rows.findIndex((r) => r.some((c) => c.includes('所在地住所')));
  if (hi < 0) continue;
  const h = rows[hi];
  const idx = (...names) => {
    for (const n of names) {
      const i = h.findIndex((c) => c.replace(/\s/g, '').includes(n));
      if (i >= 0) return i;
    }
    return -1;
  };
  const iName = idx('施設名称', '施設名');
  const iMuni = idx('指定市区町村名', '区市町村');
  const iAddr = idx('所在地住所');
  const iLat = idx('緯度');
  const iLng = idx('経度');
  if (iName < 0 || iMuni < 0 || iAddr < 0) continue;

  for (const r of rows.slice(hi + 1)) {
    const name = r[iName];
    const muni = (r[iMuni] ?? '').trim();
    const addr = (r[iAddr] ?? '').trim();
    if (!name || !muni || !addr) continue;
    const lat = Number(r[iLat]);
    const lng = Number(r[iLng]);
    // 住所が「東京都江戸川区…」なら都を落とす。既存データの書き方に合わせる
    add(muni, name, addr.replace(/^東京都/, ''), '東京都防災マップ',
      Number.isFinite(lat) && lat ? lat : null, Number.isFinite(lng) && lng ? lng : null);
  }
}

// 北九州市。避難場所・避難所（名称／住所表記）と公共施設一覧（名称／所在地_連結表記）。
// 住所が「福岡県北九州市門司区東新町一丁目10-1」の形なので、そこから区を取る
for (const [file, nameCol, addrCol] of [
  ['kitakyushu-hinanbasho', '名称', '住所表記'],
  ['kitakyushu-shisetsu', '名称', '所在地_連結表記'],
]) {
  const rows = csvOrNull(file);
  if (!rows) continue;
  const h = rows[0];
  const iName = h.indexOf(nameCol);
  const iAddr = h.indexOf(addrCol);
  const iLat = h.indexOf('緯度');
  const iLng = h.indexOf('経度');
  if (iName < 0 || iAddr < 0) continue;
  for (const r of rows.slice(1)) {
    const name = r[iName];
    const full = (r[iAddr] ?? '').replace(/^福岡県/, '');
    const ward = full.match(/^北九州市(\S+?区)/)?.[1];
    if (!name || !ward) continue;
    const lat = Number(r[iLat]);
    const lng = Number(r[iLng]);
    add(ward, name, full, '北九州市オープンデータ',
      Number.isFinite(lat) && lat ? lat : null, Number.isFinite(lng) && lng ? lng : null);
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

// 足立区「あだちの盆踊り・あだちのまつり」の一覧。
// 表が 開催日 / 開始時間 / 町会・自治会名 / 会場 / 住所 / 問い合わせ の 6 列で、
// **会場と住所が同じ行に並んでいる**。取り込みのときは会場名しか拾っていなかった。
// 住所は「西綾瀬2-1-8（外部サイトへリンク）」の形なので注記を落とす
{
  const rows = tableRows('adachi-bonfes2026');
  if (rows) {
    const head = rows.find((r) => r.includes('会場'));
    if (head) {
      const iVenue = head.indexOf('会場');
      const iAddr = head.findIndex((c) => c.startsWith('住所'));
      const iOrg = head.findIndex((c) => c.startsWith('町会'));
      for (const r of rows) {
        if (r.length !== head.length || r === head) continue;
        const name = r[iVenue];
        const addr = (r[iAddr] ?? '').replace(/（外部サイトへリンク）/g, '').trim();
        // 「未定」「町会内」のような住所でないものを入れない。番地らしさを求める
        if (!name || !/\d/.test(addr)) continue;
        add('足立区', name, `足立区${addr}`, '足立区 あだちの盆踊り一覧');

        // **同じ会場を複数の町会が別の入口で使うことがある**（東綾瀬公園は 3 か所）。
        // 会場名だけでは決められないが、この表は町会名も持っているので
        // 「町会名＋会場」でも引けるようにしておく。祭りの organizer と突き合わせる。
        // 表の町会名は「綾瀬三丁目自治会 (納涼盆踊り大会)」の形なので括弧を落とす
        const org = (r[iOrg] ?? '').replace(/[（(].*$/, '').trim();
        if (org) orgVenueAddr.set(`${norm(org)}|${norm(name)}`, `足立区${addr}`);
      }
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

// 名古屋市の小・中学校。CSV では出ていないので、市の「◯区の小・中学校一覧」から
// 住所だけを写した。出典が市の公式ページで、区も一致しているので同名の別校を掴む余地が無い。
// 緑区: https://www.city.nagoya.jp/kodomo/schools/1015850/1015852/1015868.html
for (const [name, addr] of [
  ['鳴海小学校', '鳴海町矢切98'], ['平子小学校', '平子が丘236'], ['鳴海東部小学校', '平手北二丁目901'],
  ['東丘小学校', '鳴海町有松裏9'], ['鳴子小学校', '鳴子町2-69'], ['有松小学校', '有松2803'],
  ['大高小学校', '大高台三丁目2601'], ['緑小学校', '鳴海町前之輪24'], ['片平小学校', '鳴海町片平18'],
  ['戸笠小学校', '相川三丁目60'], ['太子小学校', '太子二丁目242'], ['旭出小学校', '旭出一丁目101'],
  ['浦里小学校', '浦里一丁目77'], ['黒石小学校', '黒沢台二丁目1533'], ['神の倉小学校', '神の倉二丁目198'],
  ['長根台小学校', '古鳴海二丁目161-1'], ['桶狭間小学校', '桶狭間巻山1908'], ['相原小学校', '若田一丁目301'],
  ['桃山小学校', '桃山四丁目327'], ['南陵小学校', '桶狭間森前1348'], ['大高北小学校', '大高町町屋川1'],
  ['大高南小学校', '南大高一丁目1004'], ['徳重小学校', '徳重二丁目801'], ['滝ノ水小学校', '滝ノ水一丁目1901'],
  ['大清水小学校', '大清水西901'], ['常安小学校', '乗鞍一丁目2101'], ['小坂小学校', '小坂一丁目1001-2'],
  ['熊の前小学校', '亀が洞一丁目901'],
  ['鳴海中学校', '六田二丁目96'], ['有松中学校', '有松町桶狭間高根39-83'], ['大高中学校', '森の里一丁目107'],
  ['鳴子台中学校', '鳴子町3-40'], ['東陵中学校', '東陵1353'], ['千鳥丘中学校', '鳴海町山ノ神108'],
  ['神沢中学校', '神沢二丁目1201'], ['扇台中学校', '徳重一丁目1201'], ['滝ノ水中学校', '滝ノ水三丁目602'],
  ['左京山中学校', '左京山1407'], ['鎌倉台中学校', '鎌倉台二丁目402'], ['神の倉中学校', '白土1201'],
]) {
  add('緑区', name, `名古屋市緑区${addr}`, '名古屋市 緑区の小・中学校一覧');
}

// 名東区: https://www.city.nagoya.jp/kodomo/schools/1015850/1015852/1015867.html
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

// 大阪府神社庁（`scripts/crawl/jinjacho-osaka.mjs`）。鎮座地は「此花区島屋」のように
// 町名まで。番地は無いが、既存データにも町丁目までの住所は多いので実用になる。
// **通称名でも引けるようにする**（こちらのデータは「四貫島住吉神社」＝通称で持っている）
{
  const dir = join(ROOT, 'data', 'raw', 'jinjacho', 'osaka');
  if (existsSync(dir)) {
    for (const e of readdirSync(dir)) {
      if (!e.endsWith('.json')) continue;
      let j;
      try { j = JSON.parse(readFileSync(join(dir, e), 'utf8')); } catch { continue; }
      for (const s of j.shrines ?? []) {
        const ward = s.address.match(/^(\S+?区)/)?.[1];
        if (!ward) continue;
        add(ward, s.name, `大阪市${s.address}`, '大阪府神社庁');
        if (s.alias) add(ward, s.alias, `大阪市${s.address}`, '大阪府神社庁');
      }
    }
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

  // まず「主催（町会名）＋会場名」で引く。ここで決まれば同名の会場でも取り違えない
  if (f.organizer) {
    const byOrg = orgVenueAddr.get(`${norm(f.organizer)}|${norm(raw)}`);
    if (byOrg) hit = { address: byOrg, lat: null, lng: null };
  }

  for (const c of hit ? [] : candidates) {
    const list = index.get(`${ward}|${c}`);
    if (!list) continue;
    // 同じ会場が何度も出ることがある（1 つの公園を複数の町会が使う）。
    // **候補が指す住所が全部同じなら曖昧ではない**ので採る。
    // 違う住所を指しているときだけ「同名の別の場所」なので捨てる
    const addrs = new Set(list.map((x) => x.address));
    if (addrs.size > 1) { ambiguous.push(`${f.id} / ${c}（${addrs.size}通りの住所）`); continue; }
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
