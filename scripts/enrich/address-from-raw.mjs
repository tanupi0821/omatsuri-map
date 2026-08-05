/**
 * 生データに住所があるのに、祭りデータに入っていないものを埋める
 *
 *   node scripts/enrich/address-from-raw.mjs [--apply]
 *
 * 取り込みは既存のファイルを上書きしないので（`emit` は skip する）、
 * 後から取り込み側に住所を足しても、**先に作られた分には入らない**。
 * ここで後追いする。
 *
 * 対象は住所を持っている出典だけ:
 *   夏祭りDB（summer）… JSON-LD に streetAddress がある
 *
 * **花火DB（hanabi）には住所が無い**。JSON-LD の PostalAddress は
 * addressRegion / addressLocality だけで、streetAddress を持たない。
 * 会場名に住所が埋まっているものも 9% しかなく、拾う価値が無かった。
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ROOT, patch } from '../import/_lib.mjs';
import { PREFS } from '../lib/prefs.mjs';

const PREF_NAMES = PREFS.map((p) => p.name);

const APPLY = process.argv.includes('--apply');

// 「id の末尾」→ 住所
const byId = new Map();
const base = join(ROOT, 'data', 'raw', 'summer');
if (existsSync(base)) {
  for (const f of readdirSync(base).filter((x) => x.endsWith('.json'))) {
    const j = JSON.parse(readFileSync(join(base, f), 'utf8'));
    for (const it of j.items ?? []) {
      if (!it.address) continue;
      const id = (it.url?.match(/detail(?:_e)?\/([a-zA-Z0-9]+)\//) ?? [])[1];
      if (!id) continue;
      // 出典の住所は「東京都港区六本木6-10-1」。都道府県から始まるので、
      // 表示では市区町村から出したい。県名だけ落とす。
      // **`^..[都道府県]` のような形で削ってはいけない。**「横浜市都筑区」の
      // 「都」に当たって「筑区茅ヶ崎中央」になった（14 件）。県名は列挙して消す
      const stripped = PREF_NAMES.reduce(
        (a, p) => (a.startsWith(p) ? a.slice(p.length) : a),
        it.address,
      ).trim();
      byId.set(`summer-${id}`, stripped);
    }
  }
}
console.log(`生データで住所を持つ項目 ${byId.size} 件`);

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

let hit = 0;
for (const f of targets) {
  const key = (f.id.match(/(summer-[a-zA-Z0-9]+)$/) ?? [])[1];
  const addr = key && byId.get(key);
  if (!addr) continue;
  hit++;
  console.log(`  ${f.name}（${f.area.city}） → ${addr}`);
  if (APPLY) patch(f.id, { venue: { address: addr } });
}

console.log(`\n${APPLY ? '住所を入れた' : '入れられる候補'}: ${hit} 件`
  + `${APPLY ? '' : '\n（--apply を付けると実際に書き込む）'}`);
