// 疎（名前・日付・会場名しか無い）祭りを洗い出す
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const ROOT = 'C:/Users/tanup/Documents/claude code/matsuri-map';
const base = join(ROOT, 'data', 'festivals');

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.yml') || e.endsWith('.yaml')) out.push(p);
  }
  return out;
}

const files = walk(base);
const sparse = [];
for (const f of files) {
  const d = parse(readFileSync(f, 'utf8'));
  const fes = d.festival ?? d;
  const occ = d.occurrences ?? [];
  const hasAddr = !!fes?.venue?.address;
  const hasTime = occ.some((o) => o.start_time);
  const hasOrg = !!fes?.organizer;
  const hasLinks = Array.isArray(fes?.links) && fes.links.length > 0;
  if (!hasAddr && !hasTime && !hasOrg && !hasLinks) {
    sparse.push({ f, id: fes.id, name: fes.name });
  }
}
console.log('total files', files.length, 'sparse', sparse.length);

const cat = (id) => {
  if (/-hanabi-/.test(id)) return 'hanabi';
  if (/-goguynet-|-rarea-|-tokyofesta-/.test(id)) return 'media';
  if (/-ward-/.test(id)) return 'ward';
  return 'other';
};
const g = {};
for (const s of sparse) (g[cat(s.id)] ??= []).push(s);
for (const k of Object.keys(g)) console.log(k, g[k].length);

import { writeFileSync } from 'node:fs';
writeFileSync(join(process.env.SCRATCH ?? '.', 'mine.json'), JSON.stringify([...(g.ward ?? []), ...(g.other ?? [])], null, 1));
