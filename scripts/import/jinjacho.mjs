/**
 * 神社庁クロール結果 → 祭りデータ
 *
 *   node scripts/import/jinjacho.mjs
 *
 * data/raw/jinjacho/<県>/*.json を読み、例祭日のルールを実日付に落として取り込む。
 *
 * 方針:
 *  - 参拝者が集まる祭りだけを入れる。月次祭・大祓・祈年祭・新嘗祭のような
 *    恒例の内向きの祭祀は、全神社にあって数だけ膨らむので入れない。
 *  - 日付は「10月第1日曜日」のようなルールから導いたものなので status: estimated。
 *    神社が今年の日程として発表したわけではない、と個別ページに明記される。
 *  - すでに手で入れてある祭り（同じ市区町村・同じ神社・同じ祭り名）は飛ばす。
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { emit, ROOT } from './_lib.mjs';
import { resolveFestivalDate, normalize } from '../lib/jpdate.mjs';
import { loadAreaList } from '../lib/areas.mjs';

const YEAR = 2026;
const CHECKED = '2026-08-02';

// 参拝者が集まる祭り
const INCLUDE = /例大祭|例祭|大祭|祭礼|天王祭|祇園|夏祭|春祭|秋祭|収穫祭|火祭|湯立|獅子舞|神幸祭|浜降|山王祭|酉の市|ど[んン]ど/;
// 恒例の内向きの祭祀。全神社にあって数だけ膨らむので入れない
const EXCLUDE = /月次|大祓|祈年|新嘗|除夜|元始|紀元|天長|明治祭|昭和祭|七五三|初詣|歳旦|節分/;

const KIND = (name) => {
  if (/浜降|神幸|例大祭|例祭|大祭|祭礼|山王祭/.test(name)) return '例大祭';
  if (/天王祭|祇園|夏祭/.test(name)) return '夏祭り';
  if (/春祭/.test(name)) return '春祭り';
  if (/秋祭|収穫祭|酉の市/.test(name)) return '秋祭り';
  return '神事';
};

// ---------------------------------------------------------------- エリア対応表
// 「茅ヶ崎市」と「茅ケ崎市」のように、出典によって大小のケが揺れる
const norm = (s) => String(s ?? '').replace(/[ケヵカ]/g, 'ヶ').trim();

function areaIndex() {
  const cities = new Map(); // 市町村名 -> {slug, wards: Map<区名, slug>}
  for (const a of loadAreaList(ROOT)) {
    cities.set(norm(a.city), {
      // エリア定義側の表記を正とする（出典が「茅ケ崎市」でも「茅ヶ崎市」で書き出す）
      name: a.city,
      slug: a.slug,
      wards: new Map(a.wards.map((w) => [norm(w.name), { name: w.name, slug: w.slug }])),
    });
  }
  return cities;
}

/** 「川崎市 宮前区 菅生2-8-1」→ {city, ward, rest} */
function splitAddress(parts) {
  if (!parts?.length) return null;
  if (parts[0].endsWith('郡')) {
    return { city: parts[1], ward: null, rest: parts.slice(2).join(' ') };
  }
  if (parts[0].endsWith('市') && parts[1]?.endsWith('区')) {
    return { city: parts[0], ward: parts[1], rest: parts.slice(2).join(' ') };
  }
  if (parts[0].endsWith('市') || parts[0].endsWith('町') || parts[0].endsWith('村')) {
    return { city: parts[0], ward: null, rest: parts.slice(1).join(' ') };
  }
  // 東京の特別区は、前に市がつかない「◯◯区」がそのまま自治体
  if (parts[0].endsWith('区')) {
    return { city: parts[0], ward: null, rest: parts.slice(1).join(' ') };
  }
  return null;
}

// ------------------------------------------------------ 既存データとの重複判定
/**
 * 手で入れた祭りとぶつからないようにするためのキー。
 *
 * 神社庁由来のファイル自身は入れない。「大田区の稲荷神社」のように
 * 同じ区に同名の神社がいくつもあるため、名前で弾くと 2 社目以降が丸ごと消える。
 * 神社庁由来どうしの重複は id（神社ごとに一意）で防いでいるので、ここは
 * 手入力データの保護だけに使う。
 */
function existingKeys() {
  const keys = new Set();
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (e.endsWith('.yml') && !e.includes('-jinjacho-')) {
        const f = parse(readFileSync(p, 'utf8'));
        if (f.shrine) keys.add(`${f.area.city}|${f.area.ward ?? ''}|${f.shrine}|${f.kind}`);
      }
    }
  };
  walk(join(ROOT, 'data', 'festivals'));
  return keys;
}

// ------------------------------------------------------------------------ 実行
const PREF_NAME = { kanagawa: '神奈川県', saitama: '埼玉県', tokyo: '東京都' };
const PREF_DIRS = readdirSync(join(ROOT, 'data', 'raw', 'jinjacho'));
const cities = areaIndex();
const skipKeys = existingKeys();

const stats = { files: 0, festivals: 0, kept: 0, noDate: 0, dupe: 0, noArea: 0 };
const perPref = {};
const unknownAreas = new Set();
const byPref = new Map(); // prefSlug -> rows
const seen = new Set();

for (const prefDir of PREF_DIRS) {
  const dir = join(ROOT, 'data', 'raw', 'jinjacho', prefDir);
  const pref = PREF_NAME[prefDir];
  if (!pref) continue;
  perPref[prefDir] = perPref[prefDir] ?? { files: 0, fest: 0, kept: 0, noDate: 0, dupe: 0, noArea: 0, seenDup: 0 };
  const PP = perPref[prefDir];
  const rows = byPref.get(prefDir) ?? [];
  byPref.set(prefDir, rows);

  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    stats.files++; PP.files++;
    const s = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    const area = splitAddress(s.addressParts);
    if (!area) continue;
    if (s.city) area.city = s.city; // 東京はページに自治体名が入っている

    const cityInfo = cities.get(norm(area.city));
    if (!cityInfo) {
      stats.noArea++; PP.noArea++;
      unknownAreas.add(area.city);
      continue;
    }
    const wardInfo = area.ward ? cityInfo.wards.get(norm(area.ward)) ?? null : null;
    const wardSlug = wardInfo?.slug ?? null;
    // 以降はエリア定義側の表記に揃える
    area.city = cityInfo.name;
    if (wardInfo) area.ward = wardInfo.name;

    // 同じ神社の中で、名前ごとに日付をまとめる（同名で別ルールの行が複数あることがある）
    const byName = new Map();
    for (const f of s.festivals) {
      stats.festivals++; PP.fest++;
      const fname = f.name.replace(/（[^）]*）/g, '').trim();
      if (!INCLUDE.test(fname) || EXCLUDE.test(fname)) continue;
      const r = resolveFestivalDate(f.date, YEAR);
      if (!r) continue;
      const cur = byName.get(fname) ?? { dates: new Set(), rules: new Set(), alias: f.alias };
      r.dates.forEach((d) => cur.dates.add(d));
      cur.rules.add(normalize(f.date));
      if (f.alias && !cur.alias) cur.alias = f.alias;
      byName.set(fname, cur);
    }

    for (const [fname, v] of byName) {
      const kind = KIND(fname);
      const key = `${area.city}|${area.ward ?? ''}|${s.name}|${kind}`;
      if (skipKeys.has(key)) {
        stats.dupe++; PP.dupe++;
        continue;
      }
      const dates = [...v.dates].sort();
      if (dates.length === 0) {
        stats.noDate++; PP.noDate++;
        continue;
      }
      const slug = `jinjacho-${s.id}-${[...byName.keys()].indexOf(fname)}`;
      const id = `${wardSlug ?? cityInfo.slug}-${slug}`;
      if (seen.has(id)) { PP.seenDup++; continue; }
      seen.add(id);

      // 祭り名は「神社名 + 祭礼名」。祭礼名に神社名が入っているならそのまま
      const title = fname.includes(s.name) ? fname : `${s.name} ${fname}`;

      rows.push({
        city: area.city, citySlug: cityInfo.slug,
        ward: area.ward, wardSlug,
        slug,
        name: title,
        kind,
        organizer: s.name,
        venue: s.name,
        address: area.rest || null,
        shrine: s.name,
        scale: '地区',
        station: s.station ?? null,
        recurrence: [...v.rules].join('／'),
        recurrenceSource: s.url,
        tags: v.alias ? [v.alias.replace(/[【】]/g, '').replace(/（[^）]*）/g, '')] : [],
        dates,
        status: 'estimated',
        note: `日付は神社庁が公開している例祭日「${[...v.rules].join('／')}」から導いたもので、神社が${YEAR}年の日程として発表したものではない`,
        source: s.url,
        sourceName: `${pref}神社庁`,
        sourceType: 'official',
      });
      stats.kept++; PP.kept++;
    }
  }
}

for (const [prefSlug, rows] of byPref) {
  if (!rows.length) continue;
  emit(rows, {
    pref: PREF_NAME[prefSlug],
    prefSlug,
    label: `神社庁（${PREF_NAME[prefSlug]}）`,
    checkedAt: CHECKED,
    year: YEAR,
  });
}

console.log(
  `  神社 ${stats.files} 社 / 祭礼 ${stats.festivals} 件 → 採用 ${stats.kept} ` +
  `（日付に落とせず ${stats.noDate} / 既存と重複 ${stats.dupe} / 市町村不明 ${stats.noArea}）`,
);
console.log('  内訳: '+Object.entries(perPref).map(([k,v])=>`${k} 社${v.files}/祭${v.fest}/採用${v.kept}/無日付${v.noDate}/重複${v.dupe}/id衝突${v.seenDup}/地域不明${v.noArea}`).join(' | '));
if (unknownAreas.size) console.warn(`  ! 未対応の市町村: ${[...unknownAreas].join(', ')}`);
