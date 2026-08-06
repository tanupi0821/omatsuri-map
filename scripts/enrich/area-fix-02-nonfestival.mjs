/**
 * 祭りではないレコードを消す／掲載地が違うレコードを動かす
 *
 *   node scripts/enrich/area-fix-02-nonfestival.mjs
 *
 * 消したものは `data/merged.json` に記録する。
 * **そうしないと次の `npm run collect` で取り込みが作り直す**
 * （`scripts/dedupe.mjs` が merged.json にある id のファイルを毎回片付ける仕組み）。
 *
 * 消す理由は2通り:
 *
 * 1. **記事のまとめ題名がそのまま1件の祭りになっている**
 *    … 「東武沿線 花火大会」「仙台市中心部の主要お祭り」のような、
 *      複数の祭りを紹介する記事の題名。祭りの実体がない
 * 2. **そもそも祭りではない**
 *    … 「海の大花火大会」は駅弁の商品名（越後柏崎「海の大花火大会」
 *      どーんと鯛めし弁当）で、日付は百貨店「大新潟展」の会期だった
 *
 * 冪等（すでに消えていれば何もしない）。
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FEST = join(ROOT, 'data', 'festivals');
const MERGED = join(ROOT, 'data', 'merged.json');

/** id からファイルの場所を探す（重複統合でパスが動くので毎回探す） */
const findById = (id) => {
  const stack = [FEST];
  while (stack.length) {
    const dir = stack.pop();
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) stack.push(p);
      else if (e === `${id}.yml`) return p;
    }
  }
  return null;
};

// 消すもの: id → merged.json に残す理由
const DELETE = {
  // 記事のまとめ題名がそのまま1件になっているもの
  'osaka-004-goguynet-100055': '祭りではない（記事のまとめ題名。複数の話題をまとめた記事の見出し）',
  'kasukabe-goguynet-82400': '祭りではない（記事のまとめ題名。東武沿線の花火大会を紹介する記事）',
  'ishioka-goguynet-33638': '祭りではない（記事のまとめ題名。石岡市の祭りを紹介する記事）',
  'miyagi-002-gotouti-sendai-tushin-520128': '祭りではない（記事のまとめ題名。仙台市中心部の祭りを紹介する記事）',
  'aomori-001-gotouti-aomori-join-40446': '祭りではない（記事のまとめ題名。県内イベントのまとめ記事）',
  'koshigaya-goguynet-50712': '祭りではない（花火大会に便乗した店舗のキャンペーン告知）',
  // そもそも祭りではないもの
  'konan-goguynet-57036': '祭りではない（駅弁の商品名「越後柏崎 海の大花火大会 どーんと鯛めし弁当」。日付は百貨店「大新潟展」の会期）',
  'aichi-013-hanabi-ar0623e528479': '祭りではない（2025年冬に終了したラグーナテンボスの花火ショー。2026年の開催情報がなく、冬季イベントなので夏の一覧に出す意味がない）',
  // 「海の大花火大会」＝駅弁と同じ型。**商品名を祭りとして取り込んでいる**
  'hyogo-003-goguynet-119584': '祭りではない（都ホテル尼崎のビアガーデンで出すオリジナルドリンクの名前「祭りスパーク」。日付はビアガーデンの営業期間 6/3〜9/26）',
};

const merged = existsSync(MERGED) ? JSON.parse(readFileSync(MERGED, 'utf8')) : {};
let deleted = 0;
for (const [id, reason] of Object.entries(DELETE)) {
  const p = findById(id);
  if (p) {
    unlinkSync(p);
    deleted++;
    console.log(`  削除 ${id}`);
  }
  merged[id] = reason; // ファイルが無くても記録は残す（取り込みで復活するのを防ぐ）
}

// ---------------------------------------------------------------------------
// 掲載地が違うレコードを動かす
// ---------------------------------------------------------------------------

// 七夕スカイランタン祭り2026。神戸ジャーナルの記事から取り込んだため
// 神戸市に置かれていたが、**会場は京都府城陽市の京都府立木津川運動公園**。
// 神戸では開催しないので、京都府城陽市（kyoto-004）へ動かす。
// 日付も端の2日しか持っていなかったので、8月7日〜16日の全日に直す
const MOVE = {
  from: 'hyogo-008-gotouti-kobe-journal-304637',
  toDir: join(FEST, 'kyoto', 'kyoto-004'),
  toId: 'kyoto-004-gotouti-kobe-journal-304637',
  patch: (f) => {
    f.area = { pref: '京都府', city: '城陽市', ward: null };
    f.venue = {
      ...f.venue,
      name: '京都府立木津川運動公園（城陽五里五里の丘）',
      address: '城陽市富野北角14-8',
    };
    const o = f.occurrences?.[0];
    if (o) {
      const days = [];
      for (let d = new Date('2026-08-07'); d <= new Date('2026-08-16'); d.setDate(d.getDate() + 1)) {
        days.push(d.toISOString().slice(0, 10));
      }
      o.dates = days;
      o.checked_at = '2026-08-06';
      o.note = '会場は京都府城陽市の京都府立木津川運動公園（城陽五里五里の丘）。神戸ジャーナルの記事から取り込んだため掲載地が神戸市になっていたが、神戸では開催しない。8月7日（金）〜16日（日）の期間で、データは端の2日しか持っていなかった';
    }
    return f;
  },
};

const fromPath = findById(MOVE.from);
if (fromPath) {
  const f = MOVE.patch(parse(readFileSync(fromPath, 'utf8')));
  f.id = MOVE.toId;
  mkdirSync(MOVE.toDir, { recursive: true });
  writeFileSync(join(MOVE.toDir, `${MOVE.toId}.yml`), stringify(f, { lineWidth: 0 }), 'utf8');
  unlinkSync(fromPath);
  merged[MOVE.from] = MOVE.toId;
  console.log(`  移動 ${MOVE.from} → ${MOVE.toId}（兵庫県神戸市 → 京都府城陽市）`);
}

writeFileSync(MERGED, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
console.log(`祭りではないレコードの削除: ${deleted} 件（merged.json に ${Object.keys(DELETE).length} 件を記録）`);
