/**
 * OGP 画像を SVG から PNG に焼く
 *
 *   node scripts/gen-ogp.mjs
 *
 * X も Facebook も SVG の og:image を表示しない。PNG が要る。
 * 元は public/ogp.svg。文字の位置を直したいときはそちらを編集して焼き直す。
 */
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(ROOT, 'public', 'ogp.svg');
const out = join(ROOT, 'public', 'ogp.png');

const png = await sharp(readFileSync(src), { density: 144 })
  .resize(1200, 630)
  .png({ compressionLevel: 9 })
  .toBuffer();

const { writeFileSync } = await import('node:fs');
writeFileSync(out, png);
console.log(`public/ogp.png を書き出し（${(png.length / 1024).toFixed(0)}KB）`);
