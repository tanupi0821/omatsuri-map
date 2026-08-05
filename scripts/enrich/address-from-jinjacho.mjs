/**
 * 神社庁のデータから、住所が空の祭りに住所を入れる
 *
 *   node scripts/enrich/address-from-jinjacho.mjs [--apply]
 *
 * 住所が入っているのは全体の 38%。**会場名だけでは地図が引けず**、
 * 「◯◯神社 祭り」で探す人にも当たらない。
 *
 * 神社庁は 2377 社ぶんの住所を持っているので、社号と市区町村が一致すれば移せる。
 * 記事媒体から取り込んだ祭りは会場名しか無いことが多く、そこを埋められる。
 *
 * **同じ市に同名の神社が複数あるときは入れない**。平塚市には八坂神社が 3 つあり、
 * どれの住所か決められない（祭りの名前や写真で何度も踏んだ落とし穴）。
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ROOT, patch } from '../import/_lib.mjs';

const APPLY = process.argv.includes('--apply');
const RAW = join(ROOT, 'data', 'raw', 'jinjacho');

if (!existsSync(RAW)) {
  console.error('data/raw/jinjacho がない');
  process.exit(1);
}

// 「市区町村|社号」→ 住所。同名が複数あるものは捨てる
const seen = new Map();
for (const pref of readdirSync(RAW)) {
  for (const f of readdirSync(join(RAW, pref))) {
    const j = JSON.parse(readFileSync(join(RAW, pref, f), 'utf8'));
    if (!j.name || !j.address) continue;
    const city = (j.address.match(/^(.+?[市区町村])/) ?? [])[1];
    if (!city) continue;
    const k = `${city}|${j.name}`;
    if (!seen.has(k)) seen.set(k, new Set());
    seen.get(k).add(j.address);
  }
}
const idx = new Map();
let ambiguous = 0;
for (const [k, addrs] of seen) {
  if (addrs.size === 1) idx.set(k, [...addrs][0]);
  else ambiguous++;
}
console.log(`神社庁の住所 ${idx.size} 件（同名が複数あって使えない社 ${ambiguous}）`);

const targets = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;
    const f = parse(readFileSync(p, 'utf8'));
    if (!f.venue?.address) targets.push(f);
  }
})(join(ROOT, 'data', 'festivals'));
console.log(`  住所が空の祭り ${targets.length} 件`);

let hit = 0;
for (const f of targets) {
  // shrine 欄が無ければ会場名から社号を拾う
  const shrine = f.shrine
    ?? (f.venue?.name?.match(/([^\s（(]+(?:神社|神宮|八幡宮|天満宮|大社|稲荷))/) ?? [])[1];
  if (!shrine) continue;

  const addr = idx.get(`${f.area.city}|${shrine}`);
  if (!addr) continue;

  hit++;
  console.log(`  ${f.name}（${f.area.city}） → ${addr}`);
  // 神社庁の住所は「伊勢原市 大山355」の形。市区町村から始まっているので
  // patch では venue.address にそのまま入れる（emit のような前置はしない）
  if (APPLY) patch(f.id, { venue: { address: addr.replace(/\s+/g, '') } });
}

console.log(`\n${APPLY ? '住所を入れた' : '入れられる候補'}: ${hit} 件`
  + `${APPLY ? '' : '\n（--apply を付けると実際に書き込む）'}`);
