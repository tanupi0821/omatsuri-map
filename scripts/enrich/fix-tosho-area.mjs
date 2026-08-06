/**
 * 「島嶼」は自治体ではない
 *
 *   node scripts/enrich/fix-tosho-area.mjs [--apply]
 *
 * 東京都神社庁は伊豆諸島・小笠原の神社を「島嶼」という括りで出している。
 * それをそのまま `area.city` に入れていたため、**実在しない自治体のページ**が
 * できていた（/a/tokyo/tosho/「島嶼の祭り」）。
 *
 * 住所には本当の町村名が入っているので、そこから復元する。
 * 「八丈島八丈町大賀郷」のように島名が先に来る書き方があるので、
 * 先頭一致ではなく**含まれているか**で判定する。
 */
import { readdirSync, readFileSync, writeFileSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parse, stringify } from 'yaml';
import { ROOT } from '../import/_lib.mjs';
import { citySlug } from '../lib/romaji.mjs';

const APPLY = process.argv.includes('--apply');
const TOWNS = ['大島町', '利島村', '新島村', '神津島村', '三宅村', '御蔵島村', '八丈町', '青ヶ島村', '小笠原村'];

const dir = join(ROOT, 'data', 'festivals', 'tokyo', 'tosho');
if (!existsSync(dir)) { console.log('島嶼のディレクトリが無い'); process.exit(0); }

let n = 0;
for (const e of readdirSync(dir)) {
  if (!e.endsWith('.yml')) continue;
  const path = join(dir, e);
  const f = parse(readFileSync(path, 'utf8'));
  const addr = f.venue?.address ?? '';
  const town = TOWNS.find((t) => addr.includes(t));
  if (!town) { console.log(`町村が判らない: ${f.id} / ${addr}`); continue; }

  const slug = citySlug(town);
  if (!slug) { console.log(`slug が無い: ${town}`); continue; }
  f.area.city = town;
  const id = f.id.replace(/^tosho-/, `${slug}-`).replace(/-tosho-/, `-${slug}-`);
  f.id = id;
  const to = join(ROOT, 'data', 'festivals', 'tokyo', slug, `${id}.yml`);
  console.log(`${e} → ${town}（${slug}）`);
  n++;
  if (!APPLY) continue;
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, stringify(f, { lineWidth: 0 }), 'utf8');
  unlinkSync(path);
}
console.log(`\n${APPLY ? '直した' : '直す候補'}: ${n} 件${APPLY ? '' : '\n（--apply で実行）'}`);
