/**
 * 東京都府中市の祭りが広島県府中市にも作られる問題を片付ける
 *
 *   node scripts/enrich/area-fix-03-fuchu.mjs
 *
 * **`府中市` は東京都と広島県の両方にあり、スラッグがどちらも `fuchu` になる。**
 * そのため 号外NET 東京府中版（tokyofuchu.goguynet.jp）の記事から取り込んだ
 * 大國魂神社くらやみ祭が、広島県府中市にも同じ id で作られていて、
 * `scripts/validate.mjs` が「id が重複している」で 4 件のエラーを出していた。
 *
 * `data/merged.json` では消せない。**id が同じなので、記録すると
 * 正しい東京都側のファイルまで消える。** そこで
 * 「広島県府中市のディレクトリにある、出典が東京府中版のファイル」
 * という条件で消す。取り込みで作り直されても毎回同じ条件で消える。
 *
 * 根本的には `scripts/import/goguynet.mjs`（または id の作り方）で
 * **都道府県までを含めたスラッグにする**必要がある。
 * 号外NET 帯広版が十勝管内の町を帯広市にしてしまう問題と同じ根で、
 * **版名から市区町村を決める作りが限界に来ている。**
 */
import { readdirSync, readFileSync, unlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(ROOT, 'data', 'festivals', 'hiroshima', 'fuchu');
// 東京府中版の記事から作られたものだけを消す（広島の本物は残す）
const WRONG_HOST = 'tokyofuchu.goguynet.jp';

let removed = 0;
if (existsSync(DIR)) {
  for (const e of readdirSync(DIR)) {
    if (!e.endsWith('.yml')) continue;
    const p = join(DIR, e);
    let f;
    try {
      f = parse(readFileSync(p, 'utf8'));
    } catch {
      continue;
    }
    const url = f.occurrences?.[0]?.source_url || '';
    if (!url.includes(WRONG_HOST)) continue;
    unlinkSync(p);
    removed++;
    console.log(`  削除 hiroshima/fuchu/${e}（出典は東京府中版。東京都府中市の祭り）`);
  }
}
console.log(`広島県府中市に誤って作られた東京都府中市の祭り: ${removed} 件を削除`);
