/**
 * Search Console で「インデックス登録をリクエスト」する URL を、価値の高い順に並べる。
 * 1 日 10 件ほどで上限に当たるので、日ごとに切って出す。
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

import { ROOT } from './import/_lib.mjs';
const OUT = process.argv[2];
const SITE = 'https://omatsuri-map.com';
const FROM = '2026-10-04';
const TO = '2026-11-30';

const fests = [];
(function walk(dir, pref) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p, pref ?? e); continue; }
    if (!e.endsWith('.yml')) continue;
    const f = parse(readFileSync(p, 'utf8'));
    f._pref = pref;
    fests.push(f);
  }
})(join(ROOT, 'data', 'festivals'), null);

/** これから開催される最初の日 */
function upcoming(f) {
  let best = null;
  for (const o of f.occurrences ?? []) {
    for (const dt of o.dates ?? []) {
      const s = String(dt);
      if (s >= FROM && s <= TO && (!best || s < best.d)) best = { d: s, st: o.status };
    }
  }
  return best;
}

/** 検索需要の代わり。一次情報で入れた有名どころ > 市の規模 > 主催発表ずみ */
function rank(f, u) {
  let r = 0;
  if (/manual-aki/.test(f.id)) r += 100;
  if (f.scale === '市') r += 40;
  else if (f.scale === '区') r += 20;
  if (u.st === 'confirmed') r += 30;
  if (f.venue?.address) r += 5;
  if (f.start_time) r += 3;
  if ((f.links ?? []).length) r += 3;
  if (f.photos?.length) r += 5;
  return r;
}

const up = fests.map((f) => ({ f, u: upcoming(f) })).filter((x) => x.u);
up.sort((a, b) => rank(b.f, b.u) - rank(a.f, a.u) || a.u.d.localeCompare(b.u.d));

const byPref = new Map();
for (const x of up) byPref.set(x.f._pref, (byPref.get(x.f._pref) ?? 0) + 1);
const prefs = [...byPref].sort((a, b) => b[1] - a[1]).slice(0, 8);

const guides = ['', 'bon-odori-calendar', 'shrine-reisai-dates', 'hanabi-paid-seats', 'crowded-days',
  'stalls-data', 'cancelled-postponed', 'how-we-collect', 'find-local-bon-odori', 'first-bon-odori'];

const rows = [
  { url: `${SITE}/`, why: 'トップ' },
  ...guides.map((g) => ({ url: `${SITE}/guides/${g}`, why: g ? '読み物（独自の集計記事）' : '読み物の入口' })),
  ...prefs.map(([p, n]) => ({ url: `${SITE}/a/${p}/`, why: `県のページ（これから ${n} 件開催）` })),
  ...up.slice(0, 60).map((x) => ({
    url: `${SITE}/f/${x.f.id}/`,
    why: `${x.u.d.slice(5).replace('-', '/')} ${x.f.name}（${x.f.area?.city ?? ''}）`,
  })),
];

let md = `# インデックス登録をリクエストする URL（2026-10-04 作成）\n\n`
  + `Search Console の上部の検索窓に URL を貼る → 「インデックス登録をリクエスト」。\n`
  + `**1 日 10 件ほどで上限**に当たるので、上から順に消化してください。\n`
  + `秋の開催が終わると価値が落ちるので、**日付の早いものを優先**しています。\n\n`
  + `全 ${rows.length} 本。読み物を先頭に置いたのは、AdSense の審査で「独自の価値」を\n`
  + `示すのがこの 10 本だからです。\n`;
rows.forEach((r, i) => {
  if (i % 10 === 0) md += `\n## ${i / 10 + 1} 日目\n\n`;
  md += `- [ ] ${r.url}\n  - ${r.why}\n`;
});
writeFileSync(OUT, md, 'utf8');
console.log(`URL ${rows.length} 本 → ${OUT}`);
rows.slice(11, 20).forEach((r) => console.log('  ', r.url, '|', r.why));
