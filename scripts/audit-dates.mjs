/**
 * 取り込み済みの開催日を、いまの抽出規則でもう一度読み直して食い違いを出す
 *
 *   node scripts/audit-dates.mjs [--only 十条銀座]
 *
 * `_article.mjs` の `pickDates` を直したときに、
 * **何が変わるのか・変えてよいのか**を目で見るために使う。書き換えはしない。
 *
 * 記事の生データ（`data/raw/**`）と、そこから作った YAML を出典 URL で突き合わせる。
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ROOT } from './import/_lib.mjs';
import { pickDates } from './import/_article.mjs';

const arg = (k) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : null;
};
const ONLY = arg('--only');

// --- 記事の生データを URL で引けるようにする -------------------------------
const byUrl = new Map();
function loadRaw(dir) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { loadRaw(p); continue; }
    if (!e.endsWith('.json')) continue;
    let j;
    try { j = JSON.parse(readFileSync(p, 'utf8')); } catch { continue; }
    for (const it of j.items ?? []) {
      if (it?.url && it.title != null) byUrl.set(it.url, it);
    }
  }
}
for (const d of ['goguynet', 'gotouti', 'rarea', 'tokyofesta', 'tsushin']) {
  loadRaw(join(ROOT, 'data', 'raw', d));
}
console.log(`記事 ${byUrl.size} 本を読み込み`);

// --- 祭りを走査 -------------------------------------------------------------
function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.yml')) out.push(p);
  }
  return out;
}

let checked = 0;
let same = 0;
const diff = [];
for (const p of walk(join(ROOT, 'data', 'festivals'))) {
  const f = parse(readFileSync(p, 'utf8'));
  const o = f.occurrences?.[0];
  const it = byUrl.get(o?.source_url);
  if (!it) continue;
  if (ONLY && !f.name.includes(ONLY)) continue;
  checked++;
  const now = pickDates(it.body ?? '', it.title ?? '', it.date ?? null);
  const had = o.dates ?? [];
  if (now.join(',') === had.join(',')) { same++; continue; }
  diff.push({ id: f.id, name: f.name, had, now, title: (it.title ?? '').slice(0, 60) });
}

for (const d of diff.slice(0, 80)) {
  console.log(`  ${d.name}\n    いま: ${d.had.join(',') || '(なし)'}\n    新規則: ${d.now.join(',') || '(なし)'}\n    題: ${d.title}`);
}
console.log(`\n突き合わせ ${checked} 件 / 一致 ${same} / 食い違い ${diff.length}`);
const lost = diff.filter((d) => d.had.length && !d.now.length).length;
const gained = diff.filter((d) => !d.had.length && d.now.length).length;
console.log(`  日付が取れなくなる: ${lost} / 取れるようになる: ${gained} / 中身が変わる: ${diff.length - lost - gained}`);

// **2 日だけで間隔が空いた組**は「複数日開催の端 2 日だけ」になっている疑いがある
const span = (ds) => {
  if (ds.length !== 2) return 0;
  return Math.abs(new Date(ds[1]) - new Date(ds[0])) / 86400000;
};
const worse = diff.filter((d) => span(d.now) >= 3 && !(span(d.had) >= 3));
const better = diff.filter((d) => span(d.had) >= 3 && !(span(d.now) >= 3));
console.log(`  飛んだ 2 日組が増える: ${worse.length} / 減る: ${better.length}`);
for (const d of worse.slice(0, 15)) console.log(`    ! ${d.name}: ${d.had.join(',')} → ${d.now.join(',')}`);
