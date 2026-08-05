/**
 * 神社庁由来の祭りで **町名が抜けた住所** を、クロール結果から直す。
 *
 *   node scripts/enrich/fix-jinjacho-address.mjs
 *
 * 何が起きていたか:
 *   東京の神社に「足立区48-2」「新宿区2-9-2」「大田区1丁目」のような住所が入っていた。
 *   市区町村のすぐ後ろが番地で、**町名がまるごと落ちている**。
 *   `data/raw/jinjacho/` の生データには「足立区千住仲町48-2」と正しく入っているので、
 *   取り込みのどこかで `addressParts` の前半を落としたものと思われる。
 *
 * なぜ直すのか:
 *   **空の住所より、間違った住所の方が悪い。** 「足立区48-2」は地図で引くと
 *   まったく別の場所に落ちる。`docs/kanto-plan.md` にも
 *   「町名が抜けた住所は別の場所を指すので捨てる」と書いてある。
 *
 * 取り違えないための条件:
 *   - 突き合わせのキーは **その祭りの出典 URL そのもの**（神社庁の神社ページ）。
 *     社号で引いていないので、同名の別の神社を掴む余地が無い
 *   - 生データの住所が、いま入っている住所を**末尾に含んでいる**ことを求める
 *     （「足立区千住仲町48-2」は「48-2」で終わる＝同じ場所の書き落としだと分かる）
 *   - 市区町村名が一致することも求める
 *
 * 対象は occurrences[0].source_type が official / gov のものだけ。
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { patch, ROOT } from '../import/_lib.mjs';

// 神社庁の生データを「神社ページの URL」で引けるようにする
const byUrl = new Map();
for (const pref of ['tokyo', 'kanagawa', 'saitama']) {
  const dir = join(ROOT, 'data', 'raw', 'jinjacho', pref);
  if (!existsSync(dir)) continue;
  for (const e of readdirSync(dir)) {
    if (!e.endsWith('.json')) continue;
    let j;
    try { j = JSON.parse(readFileSync(join(dir, e), 'utf8')); } catch { continue; }
    if (j.url && j.address) byUrl.set(j.url, j);
  }
}

/** 市区町村名（「足立区」「川崎市」など先頭の自治体名）を取り出す */
const muniOf = (a) => (a ?? '').replace(/\s+/g, '').match(/^(.+?[市区町村])/)?.[1] ?? null;

/** 市区町村のすぐ後ろが数字＝町名が抜けている */
const isTruncated = (a) => /^.+?[区市](?:\d|[０-９])/.test(a ?? '') || /^.+?区\d*丁目$/.test(a ?? '');

let fixed = 0;
const skipped = [];

const walk = (dir) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;
    const f = parse(readFileSync(p, 'utf8'));
    const occ = f.occurrences?.[0];
    if (!['official', 'gov'].includes(occ?.source_type)) continue;

    const cur = f.venue?.address;
    if (!cur || !isTruncated(cur)) continue;

    const src = byUrl.get(occ.source_url);
    if (!src) { skipped.push(`${f.id}（生データが見つからない）`); continue; }

    // 生データの住所には「〒東京都大田区石川町1丁目」のように郵便記号や
    // 都道府県が付いていることがある。既存データの書き方（市区町村から始める）に揃える
    const full = src.address
      .replace(/\s+/g, '')
      .replace(/^〒\s*\d{0,3}-?\d{0,4}/, '')
      .replace(/^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/, '');
    // 自治体名が一致し、いまの住所が生データの末尾になっていること
    const tail = cur.replace(muniOf(cur) ?? '', '');
    if (muniOf(full) !== muniOf(cur) || !full.endsWith(tail)) {
      skipped.push(`${f.id}（${cur} と ${full} が繋がらない）`);
      continue;
    }
    if (full === cur) continue;

    if (patch(f.id, { venue: { address: full } })) fixed++;
  }
};
walk(join(ROOT, 'data', 'festivals'));

if (skipped.length) {
  console.log(`  直せなかったもの: ${skipped.length} 件`);
  for (const s of skipped.slice(0, 10)) console.log(`    ${s}`);
}
console.log(`町名が抜けた住所を生データから復元: ${fixed} 件`);
