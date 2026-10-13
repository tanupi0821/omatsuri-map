/**
 * 「中止・延期」の記事と、これから開催予定の祭りを突き合わせる（書き換えない）
 *
 *   node scripts/audit-cancellations.mjs [--days 30] [--all]
 *
 * **このサイトで一番やってはいけないのは、中止になった祭りを「開催」と出すこと。**
 * 行ってみたら何もなかった、が最悪の体験で、日付の誤りより重い。
 *
 * ところが取り込みは「中止」の記事を普通の開催告知として読んでしまうか、
 * 日付が取れずに捨てるかのどちらかで、**既にあるレコードを中止にする経路が無い**。
 * 実際、媒体には中止・延期の記事が 25 本あるのに、データ上の
 * `status: cancelled / postponed` は 2 件しかなかった。
 *
 * 自動では直さない。祭りの名前は似たものが多く（「夏祭り」「秋祭り」）、
 * **別の町会の祭りを中止にする事故**のほうが怖いため、候補を出すだけにする。
 * 採用するときは記事を開いて、会場と主催が一致することを確かめてから
 * その開催回の `status` を `cancelled` / `postponed` にする。
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { parse } from 'yaml';
import { ROOT } from './import/_lib.mjs';

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const DAYS = Number(arg('--days', 30));
const ALL = process.argv.includes('--all');

const today = new Date().toISOString().slice(0, 10);
const since = new Date(Date.now() - DAYS * 864e5).toISOString().slice(0, 10);

// --- 中止・延期らしい記事を集める ---------------------------------------
const FEST = /祭|まつり|盆踊|盆おどり|花火|縁日|夜店|くんち|だんじり|例大祭/;
const STOP = /中止|延期|取りやめ|順延/;
const articles = [];
for (const src of ['goguynet', 'tsushin', 'rarea', 'gotouti']) {
  const dir = join(ROOT, 'data', 'raw', src);
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.json') || f.startsWith('_')) continue;
    let j;
    try { j = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { continue; }
    for (const it of j.items ?? []) {
      const text = `${it.title ?? ''} ${it.excerpt ?? ''}`;
      if (!STOP.test(text) || !FEST.test(text)) continue;
      if (!ALL && (it.date ?? '') < since) continue;
      articles.push({ src, date: it.date ?? '', title: it.title ?? '', url: it.url ?? '' });
    }
  }
}

// --- これから開催される祭り ---------------------------------------------
const fests = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;
    const f = parse(readFileSync(p, 'utf8'));
    const up = (f.occurrences ?? []).flatMap((o) => (o.dates ?? [])
      .map(String).filter((d) => d >= today).map((d) => ({ d, st: o.status })));
    if (up.length) fests.push({ f, next: up.sort((a, b) => a.d.localeCompare(b.d))[0], file: basename(p) });
  }
})(join(ROOT, 'data', 'festivals'));

/** 【◯◯市】を題名の頭から取る。媒体はほぼ必ず付けている */
const cityOf = (t) => (t.match(/^[【\[]([^】\]]+)[】\]]/) ?? [])[1] ?? null;
/** 祭りの名前のうち、総称でない部分だけを見る */
const GENERIC = /^(夏祭り|夏まつり|秋祭り|秋まつり|盆踊り|盆踊り大会|納涼祭|例大祭|例祭|縁日|花火大会)$/;

const hits = [];
for (const a of articles) {
  const city = cityOf(a.title);
  for (const x of fests) {
    const fc = `${x.f.area?.city ?? ''}${x.f.area?.ward ?? ''}`;
    if (city && fc && !fc.includes(city) && !city.includes(x.f.area?.city ?? '\u0000')) continue;
    // **名前の一部だけを見てはいけない。** 先頭を落としたら「2026」だけが残り、
    // 題名に 2026 が入っているだけで福岡県の記事が横浜・八尾・芳賀の祭りに当たった
    const name = String(x.f.name ?? '').replace(/\s*\d{4}\s*$/, '').trim();
    if (name.length < 4) continue;
    if (!/[ぁ-んァ-ヶ一-龥]{3,}/.test(name)) continue; // 数字や記号だけの名前では引かない
    // 総称だけの名前は題名に必ず出るので、それだけでは一致とみなさない
    if (GENERIC.test(name) && !a.title.includes(x.f.venue?.name ?? '\u0000')) continue;
    if (!a.title.includes(name)) continue;
    hits.push({ a, x });
  }
}

console.log(`中止・延期らしい記事 ${articles.length} 本（${ALL ? '全期間' : `直近 ${DAYS} 日`}）`);
console.log(`これから開催の祭り ${fests.length} 件`);
console.log(`\n突き合わせ候補 ${hits.length} 組`);
for (const h of hits) {
  console.log(`\n  記事 ${h.a.date} ${h.a.title.slice(0, 70)}`);
  console.log(`       ${h.a.url}`);
  console.log(`  祭り ${h.x.f.id}  ${h.x.f.name}（${h.x.f.area?.city ?? ''}）`);
  console.log(`       次の開催 ${h.x.next.d}（${h.x.next.st}） / 会場 ${h.x.f.venue?.name ?? '―'}`);
}
if (!hits.length) {
  console.log('  （これから開催の祭りに当たる中止・延期の記事は無い）');
}
console.log('\n※ 自動では直さない。記事を開いて会場と主催が一致することを確かめてから、');
console.log('   その開催回の status を cancelled / postponed にすること。');
