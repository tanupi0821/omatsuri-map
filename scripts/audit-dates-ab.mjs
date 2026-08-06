/**
 * 日付の抽出規則を、旧実装と新実装で突き合わせる
 *
 *   node scripts/audit-dates-ab.mjs [--sample 40]
 *
 * `audit-dates.mjs` は**取り込み済みの YAML** と比べるが、そこには
 * enrich や手作業で直した日付が混ざっている（複数日開催を手で埋めたものなど）。
 * 規則そのものの良し悪しを見るには、**同じ記事に旧規則と新規則をかけて比べる**。
 *
 * 旧実装はここに写してある（`_article.mjs` は直してしまったため）。
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './import/_lib.mjs';
import { pickDates } from './import/_article.mjs';

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const SAMPLE = Number(arg('--sample', 40));

// --- 旧実装（2026-08-06 まで動いていたもの） --------------------------------
const han = (s) => s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
const toSeireki = (s) => han(s)
  .replace(/令和\s*(\d{1,2})\s*年/g, (_, n) => `${2018 + Number(n)}年`)
  .replace(/令和\s*元\s*年/g, '2019年');
function expandSameMonth(s) {
  const re = /(\d{1,2})月\s*(\d{1,2})日(?:[（(][^）)]*[）)])?\s*[・、と]\s*(\d{1,2})日/;
  let out = s;
  for (let i = 0; i < 6 && re.test(out); i++) out = out.replace(re, (_, m, d1, d2) => `${m}月${d1}日 ${m}月${d2}日`);
  return out;
}
function scanDatesOld(rawSeg, defaultYear = null) {
  const seg = expandSameMonth(toSeireki(rawSeg));
  const out = [];
  let year = defaultYear;
  for (const g of seg.matchAll(/(?:(20\d\d)年)?\s*(\d{1,2})月\s*(\d{1,2})日/g)) {
    if (g[1]) year = g[1];
    if (!year) continue;
    out.push(`${year}-${String(g[2]).padStart(2, '0')}-${String(g[3]).padStart(2, '0')}`);
  }
  return [...new Set(out)];
}
function pickDatesOld(body, title = '', pubDate = null) {
  const y = pubDate ? Number(String(pubDate).slice(0, 4)) : null;
  const m = body.match(/(?:開催)?日\s*時[：:]?[^0-9]{0,6}([\s\S]{0,80})/);
  if (m) {
    const d = scanDatesOld(m[1].split(/場\s*所|会\s*場|内\s*容|主\s*催|雨天|順延|中止|予備/)[0], y);
    if (d.length) return d;
  }
  const fromTitle = scanDatesOld(title.split(/雨天|順延/)[0], y);
  if (fromTitle.length) return fromTitle.slice(0, 4);
  return scanDatesOld(body.slice(0, 400).split(/昨年|去年|例年|過去/)[0], y).slice(0, 4);
}

// --- 記事を読む -------------------------------------------------------------
const items = [];
(function loadRaw(dir) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { loadRaw(p); continue; }
    if (!e.endsWith('.json')) continue;
    let j;
    try { j = JSON.parse(readFileSync(p, 'utf8')); } catch { return; }
    for (const it of j.items ?? []) if (it?.url) items.push(it);
  }
}(join(ROOT, 'data', 'raw')));

let same = 0;
const diff = [];
for (const it of items) {
  const a = pickDatesOld(it.body ?? '', it.title ?? '', it.date ?? null);
  const b = pickDates(it.body ?? '', it.title ?? '', it.date ?? null);
  if (a.join(',') === b.join(',')) { same++; continue; }
  diff.push({ a, b, title: (it.title ?? '').slice(0, 72) });
}

const span = (ds) => (ds.length === 2 ? Math.abs(new Date(ds[1]) - new Date(ds[0])) / 86400000 : 0);
const dropped = diff.filter((d) => d.a.length && !d.b.length);
const added = diff.filter((d) => !d.a.length && d.b.length);
const fewer = diff.filter((d) => d.b.length && d.b.length < d.a.length);
const more = diff.filter((d) => d.a.length && d.b.length > d.a.length);

for (const d of diff.slice(0, SAMPLE)) {
  console.log(`  旧: ${d.a.join(',') || '(なし)'}\n  新: ${d.b.join(',') || '(なし)'}\n  題: ${d.title}\n`);
}
console.log(`記事 ${items.length} / 同じ ${same} / 違う ${diff.length}`);
console.log(`  日付が消える: ${dropped.length}（＝怪しい日付を採らなくなった）`);
console.log(`  日付が付く:   ${added.length}`);
console.log(`  減る: ${fewer.length} / 増える: ${more.length}`);
console.log(`  飛んだ 2 日組: 旧 ${diff.filter((d) => span(d.a) >= 3).length} → 新 ${diff.filter((d) => span(d.b) >= 3).length}`);
const newSparse = diff.filter((d) => span(d.b) >= 3 && span(d.a) < 3);
console.log(`  新しくできた飛んだ 2 日組 ${newSparse.length} 件の例:`);
for (const d of newSparse.slice(0, 18)) console.log(`    ${d.a.join(',') || '(なし)'} → ${d.b.join(',')}  | ${d.title}`);
