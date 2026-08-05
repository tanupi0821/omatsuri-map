/**
 * 町会いんふぉ（chokai.info）→ 祭りデータ
 *
 *   node scripts/import/chokai-info.mjs
 *
 * **町内会・自治会が自分で書いた一次情報**。出典の格としては最上位（official）。
 *
 * 新着情報の見出しが
 *   納涼盆踊り大会（令和8年8月2日）［五反野西町会］／足立区
 * という決まった形をしているので、そのまま構造化できる。
 * 角括弧の中が実際の主催団体（サイトの持ち主とは別のことがある。地域ニュースとして
 * 近隣の町会の告知も流れてくるため）、スラッシュのあとが市区町村。
 *
 * すでに区の公式一覧などから入っている祭りとぶつからないよう、
 * 「市区町村＋主催＋開催日」が一致するものは飛ばす。
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { emit, ROOT } from './_lib.mjs';
import { loadAreaList } from '../lib/areas.mjs';

const CHECKED = '2026-08-03';
const YEAR = 2026;
// 2026年の告知がまだ出ていない団体も多い。前年の実績は「2025年の情報です」と
// 明示したうえで残す（毎年やっている行事なので「例年この時期」の手がかりになる）
const MIN_YEAR = 2025;

// 令和 → 西暦
const wareki = (n) => 2018 + Number(n);

const KIND = (t) => (/盆踊|ぼんおどり|ぼん踊/.test(t) ? '盆踊り'
  : /納涼/.test(t) ? '納涼祭'
    : /縁日|えんにち/.test(t) ? '縁日'
      : /収穫祭|秋祭/.test(t) ? '秋祭り'
        : /神輿|例大祭|祭礼/.test(t) ? '例大祭'
          : '夏祭り');

// 「◯◯（令和8年7月18日・19日）［△△町会］／大田区」
// 角括弧は全角［］と半角[]の両方が使われている
const RE = /^(.+?)（令和(\d+)年(\d+)月(\d+)日(?:[・､、](\d+)日)?(?:[・､、](\d+)日)?[^）]*）\s*(?:[［[](.+?)[］\]])?\s*(?:／(.+))?$/;

const norm = (s) => String(s ?? '').replace(/[ケヵカ]/g, 'ヶ').trim();

// ---- エリア対応表 ----
const areaIdx = new Map();
for (const a of loadAreaList(ROOT)) {
  areaIdx.set(norm(a.city), { pref: a.pref, name: a.city, slug: a.slug, wards: a.wards });
}

// ---- 既存データとの重複判定（市区町村＋主催＋初日） ----
const existing = new Set();
(function walk(dir) {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith('.yml')) {
      const f = parse(readFileSync(p, 'utf8'));
      const o = [...(f.occurrences ?? [])].sort((a, b) => b.year - a.year)[0];
      if (f.organizer && o?.dates?.[0]) existing.add(`${f.area.city}|${f.organizer}|${o.dates[0]}`);
    }
  }
})(join(ROOT, 'data', 'festivals'));

// ---- 変換 ----
const dir = join(ROOT, 'data', 'raw', 'chokai');
const rows = [];
const seen = new Set();
const unknownCities = new Set();
const stats = { files: 0, items: 0, parsed: 0, oldYear: 0, dupe: 0, noArea: 0 };

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  stats.files++;
  const s = JSON.parse(readFileSync(join(dir, file), 'utf8'));
  if (/雛形/.test(s.title)) continue; // テンプレート用のダミー団体

  for (const item of s.items ?? []) {
    stats.items++;
    const m = item.match(RE);
    if (!m) continue;
    const [, rawTitle, wa, mo, d1, d2, d3, org, cityRaw] = m;
    const year = wareki(wa);
    if (year < MIN_YEAR || year > YEAR) { stats.oldYear++; continue; }

    // 市区町村は「／◯◯区」を優先し、無ければサイト側の所在地から拾う
    // 「埼玉県上尾市」のように都道府県が付くことがあるので先に落とす
    const cityText = (cityRaw ?? s.area ?? '')
      .replace(/^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/, '');
    const cityName = (cityText.match(/([^\s]{2,10}?[市区町村])$/) ?? [])[1] ?? cityText;
    const info = areaIdx.get(norm(cityName));
    if (!info) { stats.noArea++; unknownCities.add(cityName); continue; }

    const organizer = org ?? s.title;
    const dates = [d1, d2, d3].filter(Boolean)
      .map((d) => `${year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

    const key = `${info.name}|${organizer}|${dates[0]}`;
    if (existing.has(key) || seen.has(key)) { stats.dupe++; continue; }
    seen.add(key);

    const title = rawTitle.replace(/^令和\d+年/, '').trim();
    rows.push({
      city: info.name,
      citySlug: info.slug,
      pref: info.pref,
      slug: `chokai-${s.slug}-${dates[0].replace(/-/g, '')}-${rows.length}`,
      name: `${organizer} ${title}`,
      kind: KIND(title),
      organizer,
      // 見出しには会場が入っていない。町内会の行事なので地域名までは分かる
      venue: `${organizer} 地域内`,
      scale: '町内会',
      dates,
      year,
      status: 'confirmed',
      note: year === YEAR
        ? '町内会・自治会が自身のホームページで告知したもの。会場の詳細は出典元の告知を参照'
        : `${year}年の告知。${YEAR}年の日程は未確認。会場の詳細は出典元の告知を参照`,
      source: s.url,
      sourceName: `${s.title}（町会いんふぉ）`,
      sourceType: 'official',
    });
    stats.parsed++;
  }
}

// 都県ごとに emit
const byPref = new Map();
for (const r of rows) {
  const k = { 東京都: 'tokyo', 神奈川県: 'kanagawa', 埼玉県: 'saitama', 千葉県: 'chiba', 茨城県: 'ibaraki', 栃木県: 'tochigi', 群馬県: 'gunma' }[r.pref];
  if (!k) continue;
  if (!byPref.has(k)) byPref.set(k, []);
  byPref.get(k).push(r);
}
for (const [prefSlug, list] of byPref) {
  emit(list, {
    pref: list[0].pref,
    prefSlug,
    label: `町会いんふぉ（${list[0].pref}）`,
    checkedAt: CHECKED,
    year: YEAR,
  });
}

console.log(
  `  団体 ${stats.files} / 見出し ${stats.items} → 採用 ${stats.parsed} ` +
  `（他年 ${stats.oldYear} / 重複 ${stats.dupe} / 市区町村不明 ${stats.noArea}）`,
);
if (unknownCities.size) {
  console.warn(`  ! エリア定義に無い市区町村: ${[...unknownCities].slice(0, 20).join(', ')}`);
}
