/**
 * 「中身が空のページ」を埋めるための小さな適用ツール。
 *
 *   node scripts/apply-thin-patch.mjs <patches.json>
 *
 * patches.json は配列。各要素は
 *   { "ids": ["id1", "id2", ...], "ch": { venue: {...}, organizer: ..., links: [...], occurrence: {...}, stalls: ... } }
 * の形。ids に複数入れると、同じ出典を指す重複ファイル（例: 県番号ディレクトリと
 * 市名ディレクトリの両方にある同じ祭り）へ同じ内容をまとめて適用できる。
 *
 * 中身は scripts/import/_lib.mjs の patch() をそのまま使う。
 * - venue: {address, lat, lng} の部分上書き
 * - organizer: 文字列（上書き）
 * - links: [{title, url}, ...]（既存に追加、重複URLは除去）
 * - occurrence: {year, start_time, end_time, ...}（該当年を上書き、無ければ追加）
 * - stalls: 'yes' | 'no'
 */
import { readFileSync } from 'node:fs';
import { patch } from './import/_lib.mjs';

const file = process.argv[2];
if (!file) {
  console.error('使い方: node scripts/apply-thin-patch.mjs <patches.json>');
  process.exit(1);
}

const patches = JSON.parse(readFileSync(file, 'utf8'));
let ok = 0;
let miss = 0;
for (const { ids, ch } of patches) {
  for (const id of ids) {
    if (patch(id, ch)) ok++;
    else { miss++; console.warn(`  ! 見つからない: ${id}`); }
  }
}
console.log(`適用: ${ok} 件 / 見つからない: ${miss} 件`);
