/**
 * 「中身が空のページ」を数える
 *
 *   node scripts/audit-thin.mjs [--list]
 *
 * 名前と日付しか無いページは、来た人の役に立たないうえに
 * AdSense の審査でも弱点になる。**どの項目が足りないか**まで出す。
 *
 * 空とみなすのは、住所・緯度経度・開始時刻・主催・最寄駅・公式リンク・写真・
 * 説明・屋台の有無が**すべて無い**もの（会場名は「◯◯市内」だけのことが多いので
 * それ自体は中身に数えない）。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ROOT } from './import/_lib.mjs';

const LIST = process.argv.includes('--list');

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.yml')) out.push(p);
  }
  return out;
}

let total = 0;
let thin = 0;
const have = {
  住所: 0, 緯度経度: 0, 開始時刻: 0, 主催: 0, 最寄駅: 0, リンク: 0, 写真: 0, 説明: 0, 屋台: 0,
};
const bySource = new Map();
const thinList = [];

for (const p of walk(join(ROOT, 'data', 'festivals'))) {
  const f = parse(readFileSync(p, 'utf8'));
  total++;
  const o = f.occurrences?.[0] ?? {};
  const bits = {
    住所: !!f.venue?.address,
    緯度経度: f.venue?.lat != null && f.venue?.lng != null,
    開始時刻: !!o.start_time,
    主催: !!f.organizer,
    最寄駅: !!f.station,
    リンク: (f.links ?? []).length > 0,
    写真: (f.photos ?? []).length > 0,
    説明: !!f.description,
    屋台: f.stalls === 'yes' || f.stalls === true || f.stalls === 'no',
  };
  for (const [k, v] of Object.entries(bits)) if (v) have[k]++;
  // 会場名が「◯◯市内」でない実際の会場は、それだけで中身がある
  const realVenue = f.venue?.name && !/^.+[市区町村]内$/.test(f.venue.name);
  if (!realVenue && !Object.values(bits).some(Boolean)) {
    thin++;
    const s = o.source_name ?? '(不明)';
    bySource.set(s, (bySource.get(s) ?? 0) + 1);
    if (LIST) thinList.push(`  ${f.id}  ${f.name}  [${s}]`);
  }
}

if (LIST) console.log(thinList.join('\n'));
console.log(`\n全 ${total} 件 / 中身が空 ${thin} 件（${(thin / total * 100).toFixed(1)}%）`);
console.log('\n項目ごとの充足:');
for (const [k, v] of Object.entries(have)) {
  console.log(`  ${k.padEnd(6)} ${String(v).padStart(5)} 件（${(v / total * 100).toFixed(1)}%）`);
}
console.log('\n空のページが多い出典:');
for (const [k, v] of [...bySource].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  console.log(`  ${String(v).padStart(4)}  ${k}`);
}
