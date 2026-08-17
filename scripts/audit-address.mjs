/**
 * 住所の点検。**書き換えず、疑わしいものを並べるだけ。**
 *
 *   node scripts/audit-address.mjs            # 一覧
 *   node scripts/audit-address.mjs --type X   # 種別で絞る
 *
 * なぜ要るか:
 *   `足立区48-2`（町名が抜けている）のような住所は、地図で引くと**別の場所に落ちる**。
 *   **埋まっていないより悪い。** 同じ型の破損が他に無いかを機械的に洗う。
 *
 * 見ているもの:
 *   1. truncated   市区町村の直後がいきなり番地で、町名が抜けている
 *   2. dup-muni    市区町村名が二重に入っている（「足立区足立区…」）
 *   3. dup-pref    都道府県名が二重、または途中に都道府県名が出てくる
 *   4. muni-mismatch  掲載している市区町村と、住所の市区町村が食い違う
 *   5. no-muni     市区町村名で始まっていない（番地だけ・建物名だけ・地の文）
 *   6. junk        住所に混ざってはいけないもの（URL・「〒」・日付・時刻・句点）
 *
 * 出典の格は問わず全件を見る（担当外のものは報告だけして書き換えない）。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const typeArg = process.argv.indexOf('--type');
const ONLY = typeArg > 0 ? process.argv[typeArg + 1] : null;

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e.endsWith('.yml')) out.push(p);
  }
  return out;
}

const PREF = /^(東京都|北海道|(?:京都|大阪)府|..{1,2}県)/;

/** 住所の先頭の自治体名を返す。政令市は「◯◯市◯◯区」まで、郡部は「◯◯郡◯◯町」まで */
function muniOf(addr) {
  const a = (addr ?? '').replace(PREF, '');
  // 郡は自治体名ではないので、その次の町村まで取る
  const gun = a.match(/^(.+?郡.+?[町村])/);
  if (gun) return gun[1];
  const shiku = a.match(/^(.+?市.+?区)/);
  if (shiku) return shiku[1];
  const m = a.match(/^(.+?[市区町村])/);
  return m ? m[1] : null;
}

/** その祭りが載っている市区町村（政令市は city に区まで入っている） */
const areaMuni = (f) => {
  const city = f.area?.city ?? '';
  const ward = f.area?.ward;
  return ward ? `${city}${ward}` : city;
};

const findings = [];
const add = (type, f, addr, note) => findings.push({ type, id: f.id, addr, note, src: f.occurrences?.[0]?.source_type ?? '-' });

const files = walk(join(ROOT, 'data', 'festivals'));
let checked = 0;

for (const p of files) {
  let f;
  try { f = parse(readFileSync(p, 'utf8')); } catch { continue; }
  // 「加須市中央1-11-41（加須市商工会館前）」のように、括弧の中の施設名に
  // 市名が再登場するのは正当。二重判定の前に括弧の中身を外す
  const stripParen = (x) => x.replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '');
  const addr = f?.venue?.address;
  if (!addr) continue;
  checked++;

  const bare = addr.replace(PREF, '');

  // 6. 住所に混ざってはいけないもの
  if (/https?:\/\/|〒|[0-9]{1,2}月[0-9]{1,2}日|[0-9]{1,2}時|。|、\s*[0-9]{1,2}月/.test(addr)) {
    add('junk', f, addr, '住所以外のものが混ざっている');
    continue;
  }

  // 5. 市区町村で始まっていない
  const muni = muniOf(addr);
  if (!muni) {
    add('no-muni', f, addr, '市区町村名で始まっていない');
    continue;
  }

  // 3. 都道府県名が二重／途中に出てくる
  const prefHits = [...bare.matchAll(/(東京都|北海道|(?:京都|大阪)府|..{1,2}県)/g)];
  if (prefHits.length > 0) add('dup-pref', f, addr, `「${prefHits[0][1]}」が市区町村より後ろにある`);

  // 2. 市区町村名が二重
  if (bare.slice(muni.length).includes(muni)) add('dup-muni', f, addr, `「${muni}」が二重`);

  // 1. 町名が抜けている（市区町村の直後がいきなり数字）
  //
  // **市と区だけを見る。** 町村は大字を持たないところがあり、
  // 「利島村1」「神津島村41」は**それが正しい住所**（村全体で一つの大字）。
  // 元々見つけたかったのは「足立区48-2」のような区の住所の書き落とし。
  //
  // 北海道の「◯条◯丁目」も正しい住所なので除く（江別市3条5丁目11-1）。
  const rest = bare.slice(muni.length);
  if (/[市区]$/.test(muni) && /^[\d０-９]/.test(rest) && !/^[\d０-９]+条/.test(rest)) {
    add('truncated', f, addr, '市区町村の直後がいきなり番地');
  }

  // 7. 会場名がそのまま住所に入っている（取り込みの取り違え）
  if (f.venue?.name && addr === f.venue.name) {
    add('same-as-venue', f, addr, '会場名がそのまま住所に入っている');
  }

  // 8. 都道府県から始まっている。
  // **誤りではないが書き方が揃っていない。** このデータは市区町村から始めるのが決まりで、
  // 2400 件以上がその形。揃っていないと詳細ページで並びが不揃いに見える
  if (PREF.test(addr)) add('pref-prefix', f, addr, '住所が都道府県から始まっている');

  // 4. 掲載市区町村と食い違う
  const am = areaMuni(f);
  if (am) {
    // 郡を落とした形でも突き合わせる（「北設楽郡東栄町」と「東栄町」）
    const short = (s) => s.replace(/^.+?郡/, '');
    const okExact = muni === am || short(muni) === short(am);
    // 政令市は area.city に区まで入っているが、住所が市までのこともある
    const okLoose = am.startsWith(muni) || muni.startsWith(am);
    // **島名が自治体名の前に付く住所がある**（東京都八丈島八丈町大賀郷／
    // 鹿児島県奄美市…）。「八丈島八丈町」は「八丈町」で終わるので誤りではない
    const okIsland = muni.endsWith(am);
    if (!okExact && !okLoose && !okIsland) {
      add('muni-mismatch', f, addr, `掲載は「${am}」だが住所は「${muni}」`);
    }
  }
}

const order = ['truncated', 'muni-mismatch', 'dup-muni', 'dup-pref', 'no-muni', 'junk', 'same-as-venue', 'pref-prefix'];
const LABEL = {
  truncated: '町名が抜けている（地図が別の場所に落ちる）',
  'muni-mismatch': '掲載市区町村と住所が食い違う',
  'dup-muni': '市区町村名が二重',
  'dup-pref': '都道府県名が住所の途中にある',
  'no-muni': '市区町村名で始まっていない',
  junk: '住所以外のものが混ざっている',
  'same-as-venue': '会場名がそのまま住所に入っている',
  'pref-prefix': '住所が都道府県から始まっている（書き方が揃っていない）',
};

console.log(`住所のある祭り ${checked} 件を点検\n`);
for (const t of order) {
  const rows = findings.filter((x) => x.type === t);
  if (!rows.length) continue;
  if (ONLY && ONLY !== t) continue;
  const mine = rows.filter((r) => ['official', 'gov'].includes(r.src)).length;
  console.log(`## ${t} — ${LABEL[t]}: ${rows.length} 件（うち担当 official/gov ${mine} 件）`);
  for (const r of rows.slice(0, ONLY ? 200 : 12)) {
    console.log(`   [${r.src}] ${r.id}\n      ${r.addr}   ← ${r.note}`);
  }
  if (!ONLY && rows.length > 12) console.log(`   … 他 ${rows.length - 12} 件（--type ${t} で全部出る）`);
  console.log('');
}
console.log(`疑わしい住所 合計 ${findings.length} 件`);
