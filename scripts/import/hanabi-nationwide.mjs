/**
 * 全国の「屋台が出る花火大会」→ 祭りデータ
 *
 *   node scripts/import/hanabi-nationwide.mjs
 *
 * data/raw/hanabi/<pref>.json を読んで取り込む。
 * この一覧は出典が屋台の有無を属性として持っているので **stalls: yes** で入れられる。
 *
 * 市区町村の slug は全国 1700 超あって手で表を書けない。
 * ここは **JIS の市区町村コードの代わりに、都道府県ごとの連番**を使う。
 * 読めるローマ字ではなくなるが、当て字を機械生成して間違えるよりはよい。
 * 既に romaji.mjs に表がある市区町村（関東）はそちらを優先して使う。
 *
 * エリア定義（data/areas/nationwide.yml）もここで生成する。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emit, ROOT } from './_lib.mjs';
import { citySlug } from '../lib/romaji.mjs';
import { PREFS } from '../lib/prefs.mjs';
import { loadAreaList } from '../lib/areas.mjs';
import { writeNationwideAreas } from './_nationwide.mjs';

const CHECKED = '2026-08-03';
const RAW = join(ROOT, 'data', 'raw', 'hanabi');

if (!existsSync(RAW)) {
  console.error('data/raw/hanabi がない。先に scripts/crawl/hanabi-nationwide.mjs を回すこと');
  process.exit(1);
}

// 既に定義済みの市区町村（関東など手で整えたもの）は、その slug をそのまま使う
const known = new Map();
for (const a of loadAreaList(ROOT)) known.set(`${a.pref}|${a.city}`, a.slug);

const KIND = (name) => {
  if (/盆踊|盆おどり/.test(name)) return '盆踊り';
  if (/納涼祭|納涼大会/.test(name)) return '納涼祭';
  if (/花火/.test(name)) return '花火';
  if (/祭|まつり|フェス/.test(name)) return '夏祭り';
  return '花火';
};

const generated = new Map(); // prefSlug -> [{name, slug}]
const rowsByPref = new Map();
let skippedNoCity = 0;
let skippedNoDate = 0;
let skippedCancelled = 0;
// 出典が去年の日程のまま更新していないもの。載せるが、今年の日程ではないと断る
const THIS_YEAR = 2026;

for (const file of readdirSync(RAW).filter((f) => f.endsWith('.json'))) {
  const j = JSON.parse(readFileSync(join(RAW, file), 'utf8'));
  const pref = PREFS.find((p) => p.slug === j.slug);
  if (!pref) continue;

  const cities = new Map();
  let seq = 0;

  for (const it of j.items) {
    // 出典側の都道府県が一覧の県と食い違うもの（他県の広告枠）は入れない
    if (it.pref && it.pref !== j.pref) continue;
    // 出典が名前に「【2026年中止】」と書いているものは載せない
    if (/中止|開催されません/.test(it.name)) { skippedCancelled++; continue; }
    if (!it.city) { skippedNoCity++; continue; }
    if (!it.startDate) { skippedNoDate++; continue; }

    if (!cities.has(it.city)) {
      const slug = known.get(`${j.pref}|${it.city}`)
        ?? citySlug(it.city)
        ?? `${pref.slug}-${String(++seq).padStart(3, '0')}`;
      cities.set(it.city, slug);
    }
    const cSlug = cities.get(it.city);

    const dates = [it.startDate];
    if (it.endDate && it.endDate !== it.startDate) dates.push(it.endDate);
    // 一覧には前年開催のものも混ざる。年は日付から取る（決め打ちにしない）
    const year = Number(it.startDate.slice(0, 4));
    if (dates.some((d) => Number(d.slice(0, 4)) !== year)) {
      // 年をまたぐ期間は初日の年に寄せられないので入れない
      skippedNoDate++;
      continue;
    }

    const id = (it.url?.match(/\/detail\/([a-z0-9]+)\//) ?? [])[1] ?? `${dates[0]}-${cSlug}`;

    if (!rowsByPref.has(pref.slug)) rowsByPref.set(pref.slug, []);
    rowsByPref.get(pref.slug).push({
      city: it.city,
      citySlug: cSlug,
      slug: `hanabi-${id}`,
      name: it.name,
      kind: KIND(it.name),
      venue: it.venue ?? `${it.city}内`,
      // emit() は住所に市区町村名を前置するので、出典側の「愛知県東海市中央町…」
      // から都道府県＋市区町村を削っておく。でないと「東海市愛知県東海市…」になる
      address: it.address
        ? it.address.replace(new RegExp(`^${j.pref}\\s*${it.city}\\s*`), '') || null
        : null,
      scale: '市',
      stalls: 'yes',
      tags: ['花火'],
      dates,
      year,
      note: [
        dates.length === 2 && dates[0] !== dates[1] ? '掲載の2日付は期間の初日と最終日' : null,
        year < THIS_YEAR
          ? `出典は${year}年の日程のまま。${THIS_YEAR}年の開催は発表されていない`
          : null,
      ].filter(Boolean).join('／') || undefined,
      source: it.url ?? `https://hanabi.walkerplus.com/list/${pref.ar}/yatai/`,
      sourceName: '花火大会2026（ウォーカープラス）',
      sourceType: 'aggregator',
    });
  }

  if (cities.size) {
    generated.set(pref.slug, {
      pref: j.pref,
      cities: [...cities].map(([name, slug]) => ({ name, slug })),
    });
  }
}

// ---- エリア定義（夏祭り側と共通。上書きせず併合する）----
writeNationwideAreas(generated);

// ---- 祭りを書き出す ----
for (const [prefSlug, rows] of rowsByPref) {
  const pref = PREFS.find((p) => p.slug === prefSlug);
  emit(rows, {
    pref: pref.name,
    prefSlug,
    label: `${pref.name}（花火・屋台あり）`,
    checkedAt: CHECKED,
    year: 2026,
  });
}

console.log(`  市区町村不明で除外 ${skippedNoCity} / 日付なしで除外 ${skippedNoDate} / 中止で除外 ${skippedCancelled}`);
