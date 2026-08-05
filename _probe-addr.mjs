import { parse } from 'yaml';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = 'C:/Users/tanup/Documents/claude code/matsuri-map';
const D = join(ROOT, 'data/raw/article-html');
const strip = (h) => String(h ?? '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

const A = new Map();
for (const f of readdirSync(D)) {
  const j = JSON.parse(readFileSync(join(D, f), 'utf8'));
  for (const it of j.items) A.set(`${j.host}|${it.id}`, it);
}
function walk(d) {
  const o = [];
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) o.push(...walk(p));
    else if (e.endsWith('.yml')) o.push(p);
  }
  return o;
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let hit = 0; let tot = 0; const ex = [];
for (const p of walk(join(ROOT, 'data/festivals'))) {
  const b = basename(p, '.yml');
  if (!/-(goguynet|rarea|tokyofesta)-\d+$/.test(b)) continue;
  const f = parse(readFileSync(p, 'utf8'));
  if (f.venue?.address) continue;
  const u = f.occurrences?.[0]?.source_url;
  if (!u) continue;
  let h;
  try { h = new URL(u).host; } catch { continue; }
  const it = A.get(`${h}|${b.match(/-(\d+)$/)[1]}`);
  if (!it) continue;
  tot++;
  const t = strip(it.html);
  const needles = [f.area.ward, f.area.city, f.area.city.replace(/市.+区$/, '市')].filter(Boolean);
  let found = null;
  for (const n of needles) {
    const re = new RegExp(`${esc(n)}[一-鿿ぁ-んァ-ヶA-Za-z0-9０-９丁目番地\\-−ー]{2,25}`, 'g');
    for (const m of t.matchAll(re)) {
      if (/[0-9０-９]/.test(m[0]) && /[丁目番地\-−0-9０-９]/.test(m[0].slice(-3))) { found = m[0]; break; }
    }
    if (found) break;
  }
  if (found) { hit++; if (ex.length < 40) ex.push(`${f.area.city} | ${f.venue?.name ?? ''} → ${found}`); }
}
console.log('住所未設定', tot, '本文に市名+番地らしき文字列', hit);
console.log(ex.join('\n'));
