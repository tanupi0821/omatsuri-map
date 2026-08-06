/**
 * 掲載している市区町村が間違っている祭りを、正しい市区町村へ移す。
 *
 *   node scripts/enrich/move-misfiled.mjs
 *
 * `area` と `id` と保存先のパスを付け替える。**URL も変わる**ので、
 * 気づいたら早いうちにやる方が安い（被リンクが増える前に）。
 *
 * ここに書くのは「会場の住所が、載せている市区町村と明らかに違う」ものだけ。
 * 県境の花火大会のように**両岸の市が共催するもの**は誤りではないので動かさない
 * （市川市民納涼花火大会は江戸川区と、関門海峡花火大会は下関市と門司区）。
 *
 * 何度流しても同じ結果になる（移動済みなら何もしない）。
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parse, stringify } from 'yaml';
import { ROOT } from '../import/_lib.mjs';

const FEST = join(ROOT, 'data', 'festivals');

/**
 * 移すもの。
 * from: いまの id / to: 移した先の id・都道府県・市区町村・保存先ディレクトリ
 */
const MOVES = [
  {
    from: 'yugawara-izu-yugawara-noryo-hanabi',
    to: 'shizuoka-005-izu-yugawara-noryo-hanabi',
    dir: join(FEST, 'shizuoka', 'shizuoka-005'),
    area: { pref: '静岡県', city: '熱海市', ward: null },
    // なぜ動かすのか。あとから見て分かるように残す
    why: '伊豆湯河原温泉は静岡県熱海市泉地区にあり、会場の泉公園も熱海市。'
      + '主催の伊豆湯河原温泉観光協会が会場を「静岡県熱海市泉字塩坪72-1」としている。'
      + '神奈川県湯河原町として載せていたのは誤り',
  },
];

/** 既存ファイルを id で探す */
function findByld(id) {
  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) { const r = walk(p); if (r) return r; }
      else if (e === `${id}.yml`) return p;
    }
    return null;
  };
  return walk(FEST);
}

let moved = 0;
let already = 0;

for (const mv of MOVES) {
  const dest = join(mv.dir, `${mv.to}.yml`);
  if (existsSync(dest)) { already++; continue; }

  const srcPath = findByld(mv.from);
  if (!srcPath) {
    console.warn(`  ! ${mv.from} が見つからない（既に移したか id を確認）`);
    continue;
  }

  const f = parse(readFileSync(srcPath, 'utf8'));
  f.id = mv.to;
  f.area = { ...f.area, ...mv.area };

  // 移した経緯を最新の開催回に残す。日付や時刻を触っているわけではないと分かるように
  const occ = f.occurrences?.[0];
  if (occ && !String(occ.note ?? '').includes('掲載市区町村を')) {
    occ.note = `${occ.note ? `${occ.note}。` : ''}掲載市区町村を修正: ${mv.why}`;
  }

  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, stringify(f, { lineWidth: 0 }), 'utf8');
  unlinkSync(srcPath);
  console.log(`  ${mv.from} → ${mv.to}（${mv.area.pref}${mv.area.city}）`);
  moved++;
}

console.log(`掲載市区町村の誤りを修正: ${moved} 件移動${already ? ` / ${already} 件は移動済み` : ''}`);
