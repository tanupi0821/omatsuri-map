/**
 * 号外NET 由来の祭りを、版の県へ置き直す
 *
 *   node scripts/fix-goguynet-pref.mjs [--apply]
 *
 * 点検は `audit-goguynet-pref.mjs`。取り込み側（`import/goguynet.mjs` の
 * `lookup`）は**県を確かめずに 1 件だけの候補を返していた**ので直したが、
 * 既にできてしまったレコードは emit() が上書きしないので動かない。
 *
 * 移した先に同じ祭りが既にあるときは、消す側にしか無い項目
 * （写真・住所・時刻・主催・リンク）を移してから消す。
 */
import { readdirSync, readFileSync, writeFileSync, statSync, unlinkSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parse, stringify } from 'yaml';
import { ROOT } from './import/_lib.mjs';
import { byName, PREFS } from './lib/prefs.mjs';
import { makeSlugPool } from './import/_slug.mjs';
import { writeNationwideAreas } from './import/_nationwide.mjs';

const APPLY = process.argv.includes('--apply');
const PREF_NAMES = new Set(PREFS.map((x) => x.name));
const areaMeta = new Map(
  JSON.parse(readFileSync(join(ROOT, 'data', 'raw', 'goguynet', '_areas.json'), 'utf8')),
);
const pool = makeSlugPool(ROOT);

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.yml')) out.push(p);
  }
  return out;
}

const generated = new Map();
let moved = 0;
let mergedN = 0;
const lines = [];

for (const p of walk(join(ROOT, 'data', 'festivals'))) {
  if (!/-goguynet-\d+\.yml$/.test(p)) continue;
  const f = parse(readFileSync(p, 'utf8'));
  const host = (String(f.occurrences?.[0]?.source_url ?? '').match(/^https?:\/\/([^.]+)\.goguynet\.jp/) ?? [])[1];
  const meta = host ? areaMeta.get(host) : null;
  if (!meta || !PREF_NAMES.has(meta.pref)) continue;
  if (f.area?.pref === meta.pref) continue;

  const want = meta.pref;
  const city = f.area?.city;
  const p2 = byName(want);
  if (!city || !p2) continue;

  let slug = pool.get(want, city);
  if (!slug) {
    slug = pool.assign(want, city, p2.slug, 1);
    if (!generated.has(p2.slug)) generated.set(p2.slug, { pref: want, cities: [] });
    generated.get(p2.slug).cities.push({ name: city, slug });
  }

  const id = `${slug}-${f.id.replace(/^.*?-goguynet-/, 'goguynet-')}`;
  const to = join(ROOT, 'data', 'festivals', p2.slug, slug, `${id}.yml`);

  if (to === p) continue;
  lines.push(`  ${f.area.pref} → ${want}: ${city} / ${f.name}`);

  if (!APPLY) { moved++; continue; }

  f.area.pref = want;
  f.id = id;

  if (statSync(to, { throwIfNoEntry: false })) {
    // 移した先に同じ id が既にある。項目を寄せてから消す
    const other = parse(readFileSync(to, 'utf8'));
    let changed = false;
    for (const k of ['organizer', 'shrine', 'station', 'description']) {
      if (other[k] == null && f[k] != null) { other[k] = f[k]; changed = true; }
    }
    if ((other.stalls ?? 'unknown') === 'unknown' && f.stalls && f.stalls !== 'unknown') { other.stalls = f.stalls; changed = true; }
    for (const k of ['address', 'lat', 'lng']) {
      if (other.venue?.[k] == null && f.venue?.[k] != null) { other.venue[k] = f.venue[k]; changed = true; }
    }
    if (f.photos?.length && !other.photos?.length) { other.photos = f.photos; changed = true; }
    if (changed) writeFileSync(to, stringify(other, { lineWidth: 0 }), 'utf8');
    unlinkSync(p);
    mergedN++;
    continue;
  }

  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, stringify(f, { lineWidth: 0 }), 'utf8');
  unlinkSync(p);
  moved++;
}

if (APPLY && generated.size) writeNationwideAreas(generated);

console.log(lines.join('\n'));
console.log(`\n${APPLY ? '移した' : '移す候補'}: ${moved} 件${mergedN ? ` / 重複としてまとめた ${mergedN} 件` : ''}`);
if (!APPLY) console.log('（--apply で実行）');
