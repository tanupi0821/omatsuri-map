/**
 * 屋台ありと分かっている出典と、名前の揺れで結びつかなかった祭りを照合する
 *
 *   node scripts/enrich/stalls-fuzzy.mjs [--apply]
 *
 * `dedupe.mjs` は名前を正規化して**完全一致**でまとめるので、
 * 「流山花火大会」と「令和7年度  流山花火大会」のように書き方が違うと残る。
 * こちらは**どちらかがどちらかを含む**まで許して、屋台の有無だけを写す。
 *
 * 祭りそのものはまとめない（別の祭りだった場合の被害が大きいため）。
 * 屋台の有無を yes にするだけなら、多少の取り違えでも実害は小さい。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ROOT, patch } from '../import/_lib.mjs';

const APPLY = process.argv.includes('--apply');

const norm = (s) => s
  .replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '')
  .replace(/第\d+回/g, '').replace(/20\d\d/g, '')
  .replace(/令和\d+年度?/g, '').replace(/平成\d+年度?/g, '')
  .replace(/[\s　・「」]/g, '')
  .trim();

// 屋台ありと分かっている出典（walkerplus の /yatai/ 絞り込み）を市区町村ごとに
const yes = new Map();
for (const dir of ['hanabi', 'summer']) {
  const base = join(ROOT, 'data', 'raw', dir);
  for (const f of readdirSync(base).filter((x) => x.endsWith('.json'))) {
    const j = JSON.parse(readFileSync(join(base, f), 'utf8'));
    for (const it of j.items ?? []) {
      if (!it.city || !it.name) continue;
      if (!yes.has(it.city)) yes.set(it.city, []);
      yes.get(it.city).push({ n: norm(it.name), raw: it.name, url: it.url });
    }
  }
}

const targets = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;
    const f = parse(readFileSync(p, 'utf8'));
    if (f.stalls === 'unknown') targets.push(f);
  }
})(join(ROOT, 'data', 'festivals'));

let hit = 0;
for (const f of targets) {
  const n = norm(f.name);
  // 短い名前は部分一致で誤爆する（「夏祭り」が何にでも当たる）
  if (n.length < 5) continue;

  const m = (yes.get(f.area?.city) ?? []).find(
    (x) => x.n === n || (x.n.length >= 5 && (x.n.includes(n) || n.includes(x.n))),
  );
  if (!m) continue;

  hit++;
  console.log(`  ${f.name}（${f.area.city}） ← ${m.raw}`);
  if (APPLY) {
    patch(f.id, {
      stalls: 'yes',
      ...(m.url ? { links: [{ title: '屋台が出ると出典に記載', url: m.url }] } : {}),
    });
  }
}

console.log(`\n${APPLY ? '屋台ありに更新' : '更新できる候補'}: ${hit} 件`
  + `${APPLY ? '' : '\n（--apply を付けると実際に更新する）'}`);
