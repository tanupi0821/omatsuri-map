/**
 * 祭りではないレコードを消す（第 2 弾）
 *
 *   node scripts/enrich/area-fix-04-nonfestival2.mjs
 *
 * 記事の題に「祭」が入っているだけで、実体が祭りでないものが取り込まれる。
 * 駅弁・ビアガーデンのドリンク名に続く型で、いずれも利用者が現地へ行っても
 * 祭りは無い。**`data/merged.json` に記録しないと次の取り込みで復活する**
 * （実際に 238 件が戻った前例がある）。
 */
import { readdirSync, readFileSync, writeFileSync, statSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ROOT } from '../import/_lib.mjs';

const DROP = {
  'edogawa-goguynet-58967': '祭りではない: トリミング・動物病院「Pets Tokyo」の開店告知',
  'shizuoka-010-goguynet-35068': '祭りではない: 小学生向け英語デイキャンプの記事',
  'chofu-goguynet-32611': '祭りではない: BRANCH調布のアプリ合同キャンペーン。日付はキャンペーン期間',
  'koto-tokyofesta-32343': 'レコードの取り違え: 出典記事は「KIBACO キッズウォーターフェス」（木場公園）',
};

const MERGED = join(ROOT, 'data', 'merged.json');
const merged = existsSync(MERGED) ? JSON.parse(readFileSync(MERGED, 'utf8')) : {};

let n = 0;
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;
    const f = parse(readFileSync(p, 'utf8'));
    if (!DROP[f.id]) continue;
    console.log(`消す: ${f.id} — ${DROP[f.id]}`);
    unlinkSync(p);
    n++;
  }
})(join(ROOT, 'data', 'festivals'));

for (const [id, why] of Object.entries(DROP)) merged[id] = why;
writeFileSync(MERGED, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
console.log(`\n消した: ${n} 件（記録は ${Object.keys(DROP).length} 件）`);
