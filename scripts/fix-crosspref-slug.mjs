/**
 * 県をまたいで同じ slug を使っている市を分ける
 *
 *   node scripts/fix-crosspref-slug.mjs [--apply]
 *
 * **id は `<citySlug>-<出典>-<番号>` の形で、都道府県を含まない。**
 * そのため同じ slug の市が 2 県にあると、同じ出典・同じ番号のときに
 * **id が衝突して検証が落ちる**。実際に東京都府中市の「大國魂神社くらやみ祭」が
 * 広島県府中市にも同じ id で作られ、ビルドが止まった。
 *
 * 全国で該当するのは 2 組だけ（ota / fuchu）なので、**件数の少ない側に
 * 県名を足した slug** を与えて分ける。多い側を動かすと URL の変更が増える。
 */
import { readdirSync, readFileSync, writeFileSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parse, stringify } from 'yaml';
import { ROOT } from './import/_lib.mjs';

const APPLY = process.argv.includes('--apply');
// [県slug, 旧slug, 新slug]。件数の少ない側だけを動かす
const MOVES = [
  ['gunma', 'ota', 'ota-gunma'],
  ['hiroshima', 'fuchu', 'fuchu-hiroshima'],
];

let n = 0;
for (const [pref, from, to] of MOVES) {
  const dir = join(ROOT, 'data', 'festivals', pref, from);
  if (!existsSync(dir)) { console.log(`${pref}/${from} は無い`); continue; }
  for (const e of readdirSync(dir)) {
    if (!e.endsWith('.yml')) continue;
    const path = join(dir, e);
    const f = parse(readFileSync(path, 'utf8'));
    const id = f.id.startsWith(`${from}-`) ? `${to}-${f.id.slice(from.length + 1)}` : f.id;
    const dest = join(ROOT, 'data', 'festivals', pref, to, `${id}.yml`);
    console.log(`${pref}/${from}/${e} → ${pref}/${to}/${id}.yml（${f.area.city}）`);
    n++;
    if (!APPLY) continue;
    f.id = id;
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, stringify(f, { lineWidth: 0 }), 'utf8');
    unlinkSync(path);
  }
}
console.log(`\n${APPLY ? '移した' : '移す候補'}: ${n} 件${APPLY ? '' : '\n（--apply で実行）'}`);
