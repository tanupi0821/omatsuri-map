/**
 * 住所の書き方を揃える。**場所は変えない。**
 *
 *   node scripts/enrich/zz-normalize-address.mjs
 *
 * **ファイル名が `zz-` で始まっているのは、enrich-all がファイル名順に流すから。**
 * `normalize-address.mjs` という名前だったときは `primary-*.mjs` より先に走ってしまい、
 * あとから走る側が都道府県つきの住所を書いて元に戻っていた（238 件）。
 * **住所を書く工程より後に走る必要がある**ので、名前で最後尾に置いている。
 *
 * このデータの住所は **市区町村から始める**のが決まりで、2400 件以上がその形。
 * ところが一部に「愛知県知立市西町神田12」のように都道府県から始まるものが
 * 混ざっていて、詳細ページで並びが不揃いに見える。
 * 都道府県を落としても指す場所は変わらないので、ここで揃える。
 *
 * 対象は occurrences[0].source_type が official / gov のものだけ。
 * media / aggregator には触れない（別の工程が担当している）。
 *
 * **やらないこと**: 表記の揺れを直しにいかない。
 * 「◯丁目」を「-」にするような正規化は、元の出典の書き方を壊すうえ、
 * 直した先が正しい保証も無い。落とすのは頭の都道府県だけにする。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { patch, ROOT } from '../import/_lib.mjs';

// 「..{1,2}県」で 3〜4 文字の県名（神奈川県・和歌山県・鹿児島県を含む）に当たる
const PREF = /^(東京都|北海道|(?:京都|大阪)府|..{1,2}県)/;

let fixed = 0;
const walk = (dir) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;

    const f = parse(readFileSync(p, 'utf8'));
    if (!['official', 'gov'].includes(f.occurrences?.[0]?.source_type)) continue;

    const addr = f.venue?.address;
    if (!addr || !PREF.test(addr)) continue;

    const stripped = addr.replace(PREF, '').trim();
    // 落とした結果が市区町村で始まらないなら、それは都道府県名ではなかったかもしれない。
    // 安全側に倒して触らない
    if (!/^.+?[市区町村]/.test(stripped)) continue;

    if (patch(f.id, { venue: { address: stripped } })) fixed++;
  }
};
walk(join(ROOT, 'data', 'festivals'));

console.log(`住所の頭の都道府県を落として書き方を揃えた: ${fixed} 件`);
