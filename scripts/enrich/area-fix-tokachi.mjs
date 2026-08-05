/**
 * 市区町村の取り違えを直す（号外NET 帯広版 → 十勝管内の町）
 *
 *   node scripts/enrich/area-fix-tokachi.mjs
 *
 * 号外NET は**「帯広市版」が十勝管内の全域を扱う**ため、記事から取り込んだ祭りの
 * `area.city` が一律で帯広市になってしまっていた。実際は
 *
 * - 歴舟川清流まつり … 広尾郡大樹町
 * - りくべつ鉄道まつり … 足寄郡陸別町
 *
 * が正しい。開催地が違うのは、祭り探しのサイトとしては致命的なので直す。
 * `area.city` だけでなく**置き場所（＝エリアページの URL）と id も変わる**ので、
 * ファイルごと動かしている。
 *
 * 注意（次に触る人へ）:
 *
 * - **`npm run collect` を流すと、号外NET のインポータが元の場所
 *   （`hokkaido/hokkaido-008/...`）に同じ祭りを作り直す。**
 *   `emit()` は「そのパスにファイルが無ければ書く」ので、移動した先は無事だが、
 *   帯広市の側に誤った複製がもう一度できる。根本的に直すには
 *   `scripts/import/goguynet.mjs` の市区町村の当て方（記事の版名ではなく
 *   本文から町名を拾う）を直す必要がある。ここは新規収集の担当範囲なので触っていない。
 * - このスクリプトは**冪等**。移動元が無ければ何もしない。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const F = join(ROOT, 'data', 'festivals');

/** @type {{from:string, toDir:string, toId:string, city:string, note:string}[]} */
const MOVES = [
  {
    // 大樹町には既に `hokkaido-048`（広尾郡大樹町）のディレクトリがある。
    // 同じ祭りの別データ（hokkaido-048-hanabi-ar0101e512147「歴舟川清流まつり・道新花火大会」）
    // がそこにあるので、隣に置けば dedupe が拾いやすくなる
    from: join(F, 'hokkaido', 'hokkaido-008', 'hokkaido-008-goguynet-57124.yml'),
    toDir: join(F, 'hokkaido', 'hokkaido-048'),
    toId: 'hokkaido-048-goguynet-57124',
    city: '広尾郡大樹町',
    note: '号外NET帯広版から取り込んだため area.city が帯広市になっていたのを大樹町に直した。同じ祭りが hokkaido-048-hanabi-ar0101e512147 にもある（重複）',
  },
  {
    // 陸別町のディレクトリはまだ無いので新しく作る。
    // ローマ字の slug は `scripts/lib/romaji.mjs` に無く、勝手に当て字を作ると
    // あとから直せなくなる（docs/kanto-plan.md）。既にある `hokkaido-70x` の
    // 手動採番にならって 703 を使う
    from: join(F, 'hokkaido', 'hokkaido-008', 'hokkaido-008-goguynet-57091.yml'),
    toDir: join(F, 'hokkaido', 'hokkaido-703'),
    toId: 'hokkaido-703-goguynet-57091',
    city: '足寄郡陸別町',
    note: '号外NET帯広版から取り込んだため area.city が帯広市になっていたのを陸別町に直した',
  },
];

let moved = 0;
for (const m of MOVES) {
  if (!existsSync(m.from)) continue; // 冪等（もう動かしてある）
  const f = parse(readFileSync(m.from, 'utf8'));
  f.id = m.toId;
  f.area = { ...f.area, city: m.city };
  const o = f.occurrences?.[0];
  if (o) o.note = o.note ? `${o.note}。${m.note}` : m.note;

  mkdirSync(m.toDir, { recursive: true });
  writeFileSync(join(m.toDir, `${m.toId}.yml`), stringify(f, { lineWidth: 0 }), 'utf8');
  unlinkSync(m.from);
  moved++;
  console.log(`  ${m.from.slice(F.length + 1)} → ${m.city}（${m.toId}）`);
}
console.log(`市区町村の取り違えを修正: ${moved} 件`);
