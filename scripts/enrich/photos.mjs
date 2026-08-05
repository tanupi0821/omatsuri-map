/**
 * コモンズで見つかった写真を祭りデータに反映する
 *
 *   node scripts/enrich/photos.mjs [--max 2]
 *
 * data/raw/commons/<id>.json の候補のうち、ライセンス・著作者・出典が
 * 揃っているものだけを取り込む（クローラ側でも絞っているが二重に確認する）。
 *
 * 1 祭りにつき既定 2 枚まで。多すぎるとページが重くなるし、
 * 出典表示の欄も長くなるだけで役に立たない。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { patch, ROOT } from '../import/_lib.mjs';

const i = process.argv.indexOf('--max');
const MAX = i > 0 ? Number(process.argv[i + 1]) : 2;

const dir = join(ROOT, 'data', 'raw', 'commons');
if (!existsSync(dir)) {
  console.error('data/raw/commons がない。先に scripts/crawl/commons-photos.mjs を回すこと');
  process.exit(1);
}

let applied = 0;
let empty = 0;
let dropped = 0;

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const c = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  if (!c.photos?.length) { empty++; continue; }

  const photos = c.photos
    .filter((p) => {
      const ok = p.url && p.credit && p.license && p.source;
      if (!ok) dropped++;
      return ok;
    })
    .slice(0, MAX)
    .map(({ url, width, height, credit, license, license_url, source }) => ({
      url, width, height, credit, license, license_url, source,
    }));

  if (!photos.length) { empty++; continue; }
  if (patch(c.id, { photos })) applied++;
}

console.log(
  `写真を反映: ${applied} 件（候補なし ${empty} / 情報不足で除外 ${dropped} 枚）`,
);
