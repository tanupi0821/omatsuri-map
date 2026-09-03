/**
 * 神社庁由来の開催日を、いまの jpdate.mjs でもう一度読み直して食い違いを出す
 *
 *   node scripts/audit-jinjacho-dates.mjs
 *
 * `scripts/audit-dates.mjs` は記事媒体の `_article.mjs` を見る点検で、
 * **jpdate.mjs は通らない**。例祭日のルール解釈を直したときは、こちらで
 * 「保存済みの日付が変わらないか」を確かめる。書き換えはしない。
 *
 * 生データ（data/raw/jinjacho/<県>/<id>.json）と、そこから作った YAML を
 * ファイル名の `-jinjacho-<id>-<n>.yml` で突き合わせる。
 *
 * 見るのは **日付が消えていないか**。増えるのは規則を足したときの狙いどおりなので、
 * 件数だけ出す。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ROOT } from './import/_lib.mjs';
import { resolveFestivalDate } from './lib/jpdate.mjs';

// import/jinjacho.mjs と同じ採否の規則
const INCLUDE = /例大祭|例祭|大祭|祭礼|天王祭|祇園|夏祭|春祭|秋祭|収穫祭|火祭|湯立|獅子舞|神幸祭|浜降|山王祭|酉の市|ど[んン]ど/;
const EXCLUDE = /月次|大祓|祈年|新嘗|除夜|元始|紀元|天長|明治祭|昭和祭|七五三|初詣|歳旦|節分/;
const YEAR = 2026;
// 生データのディレクトリのうち、取り込みに使っているもの
const PREFS = ['aichi', 'hiroshima', 'hokkaido', 'hyogo', 'kanagawa', 'saitama', 'tokyo'];

// 保存済み: 生データの id -> Set<日付>
const saved = new Map();
const walk = (dir) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml') || !e.includes('-jinjacho-')) continue;
    const m = e.match(/-jinjacho-(.+)-\d+\.yml$/);
    if (!m) continue;
    const f = parse(readFileSync(p, 'utf8'));
    if (!saved.has(m[1])) saved.set(m[1], new Set());
    for (const o of f.occurrences ?? []) for (const d of o.dates ?? []) saved.get(m[1]).add(d);
  }
};
walk(join(ROOT, 'data', 'festivals'));

let same = 0; let lost = 0; let gained = 0;
const examples = [];
for (const pref of PREFS) {
  const dir = join(ROOT, 'data', 'raw', 'jinjacho', pref);
  for (const file of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
    const s = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    const old = saved.get(String(s.id));
    if (!old) continue;
    const now = new Set();
    for (const x of s.festivals ?? []) {
      const name = String(x.name).replace(/（[^）]*）/g, '').trim();
      if (!INCLUDE.test(name) || EXCLUDE.test(name)) continue;
      const r = resolveFestivalDate(x.date, YEAR);
      if (r) r.dates.forEach((d) => now.add(d));
    }
    const missing = [...old].filter((d) => !now.has(d));
    const added = [...now].filter((d) => !old.has(d));
    if (!missing.length && !added.length) { same++; continue; }
    if (missing.length) {
      lost++;
      if (examples.length < 30) {
        examples.push(`${s.name} 例祭日「${(s.festivals ?? []).map((f) => f.date).join('／')}」`
          + ` 保存=${[...old].sort().join(',')} → いま=${[...now].sort().join(',')}  ${s.url}`);
      }
    } else gained++;
  }
}

console.log(`突き合わせ ${same + lost + gained} 社 / 一致 ${same} / 日付が消えた ${lost} / 増えた ${gained}`);
examples.forEach((x) => console.log(`  ! ${x}`));
