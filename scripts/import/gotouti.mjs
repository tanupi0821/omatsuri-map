/**
 * 名鑑（news.gotouti.jp）経由で集めた地域メディアの記事 → 祭りデータ
 *
 *   node scripts/import/gotouti.mjs
 *
 * 号外NET・レアリア・つーしん系と同じ形の WordPress 記事なので、
 * 名前・日付・会場の取り出しは `_article.mjs` をそのまま使う。
 *
 * **この入口の強みは市区町村の判定**。名鑑が媒体ごとに「行政区域」を
 * 県名つきの市区町村名で持っている（「千葉県山武市・千葉県東金市」）ので、
 * 題名や本文から市名を推測する必要がない。
 *
 *  - 媒体の守備範囲が 1 市なら、その市に決まる
 *  - 複数市なら、**題名 → 本文の頭**の順に市名を探す。見つからなければ捨てる。
 *    ここで適当に 1 つ目を選ぶと、同じ記事が別の市の祭りとして入ってしまう
 *  - 行政区域が県までしか無い媒体（「静岡県」だけ）は市が決められないので使わない
 *
 * 出典の格は media。主催者の公式が見つかったら enrich で格上げする。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emit, ROOT } from './_lib.mjs';
import { loadAreaList } from '../lib/areas.mjs';
import { byName, PREFS } from '../lib/prefs.mjs';
import { citySlug } from '../lib/romaji.mjs';
import { writeNationwideAreas } from './_nationwide.mjs';
import {
  IS_FESTIVAL, NOT_FESTIVAL, KIND, hasStalls, pickDates, pickVenue, pickName, usableName,
} from './_article.mjs';

const CHECKED = '2026-08-06';
const RAW = join(ROOT, 'data', 'raw', 'gotouti', 'media');

if (!existsSync(RAW)) {
  console.error('data/raw/gotouti/media がない。先に scripts/crawl/gotouti-media.mjs を回すこと');
  process.exit(1);
}

const PREF_NAMES = PREFS.map((p) => p.name);

// ---------------------------------------------------------------------------
// エリア解決（goguynet と同じ考え方）
// ---------------------------------------------------------------------------

const byCity = new Map();
const add = (name, rec) => {
  if (!byCity.has(name)) byCity.set(name, []);
  byCity.get(name).push(rec);
};
for (const a of loadAreaList(ROOT)) {
  add(a.city, { pref: a.pref, city: a.city, citySlug: a.slug });
  for (const w of a.wards ?? []) {
    add(w.name, { pref: a.pref, city: a.city, citySlug: a.slug, ward: w.name, wardSlug: w.slug });
  }
}

const generated = new Map();
const seq = new Map();

function lookup(city, pref) {
  const cands = byCity.get(city) ?? [];
  if (!cands.length) return null;
  const hit = cands.filter((a) => a.pref === pref);
  if (hit.length === 1) return hit[0];
  if (cands.length === 1 && !pref) return cands[0];
  return null;
}

function create(city, pref) {
  if (!/[市区町村]$/.test(city)) return null;
  const p = byName(pref);
  if (!p) return null;
  const used = new Set([...byCity.values()].flat().map((r) => r.citySlug));
  let slug = citySlug(city);
  if (!slug || used.has(slug)) {
    do {
      const n = (seq.get(p.slug) ?? 0) + 1;
      seq.set(p.slug, n);
      slug = `${p.slug}-${String(700 + n).padStart(3, '0')}`;
    } while (used.has(slug));
  }
  const rec = { pref: p.name, city, citySlug: slug };
  add(city, rec);
  if (!generated.has(p.slug)) generated.set(p.slug, { pref: p.name, cities: [] });
  generated.get(p.slug).cities.push({ name: city, slug });
  return rec;
}

/**
 * 名鑑の「行政区域」1 つを {pref, city} に割る。
 *   「千葉県山武市」        → 千葉県 / 山武市
 *   「千葉県山武郡横芝光町」→ 千葉県 / 横芝光町（郡は落とす）
 *   「神戸市長田区」        → 兵庫県 / 神戸市長田区（政令市は区まで）
 *   「静岡県東部」          → 市が決まらないので null
 */
function parseArea(raw) {
  const pref = PREF_NAMES.find((p) => raw.startsWith(p));
  if (!pref) return null;
  let rest = raw.slice(pref.length).replace(/[（(].*$/, '').trim();
  if (!rest) return { pref, city: null };
  // 郡は行政区画だが住所の一部でしかない。市区町村名だけにする
  rest = rest.replace(/^.+?郡/, '');
  const m = rest.match(/^(.+?[市区町村])/);
  if (!m) return { pref, city: null };
  let city = m[1];
  // 政令市は「大阪市西淀川区」まで見る（区ごとにデータを分けてあるため）
  const w = rest.slice(city.length).match(/^(.+?区)/);
  if (w && /市$/.test(city)) city = { city, ward: w[1] };
  return { pref, city };
}

/** 媒体の守備範囲を {pref, city, ward} の配列にする */
function coverage(areas) {
  const out = [];
  for (const a of areas) {
    const p = parseArea(a);
    if (!p?.city) continue;
    if (typeof p.city === 'string') out.push({ pref: p.pref, name: p.city, full: p.city });
    else out.push({ pref: p.pref, name: p.city.ward, full: p.city.city + p.city.ward, cityOnly: p.city.city });
  }
  // 同じ市が何度も出るのを落とす
  const seen = new Set();
  return out.filter((x) => (seen.has(x.full) ? false : (seen.add(x.full), true)));
}

/** 守備範囲の 1 件をエリア定義に結びつける */
function resolve(cov) {
  // 政令市の区は区名で引く（横浜市・川崎市・大阪市などは area ファイルに区がある）
  const asWard = lookup(cov.name, cov.pref);
  if (asWard) return asWard;
  // area ファイルに無い政令市の区は「神戸市長田区」という 1 つの市として登録する
  //（つーしん系の取り込みと同じ扱い。あとで区に割り直せる）
  const key = cov.cityOnly ? cov.full : cov.name;
  const asCity = lookup(key, cov.pref);
  if (asCity) return asCity;
  return create(key, cov.pref);
}

// ---------------------------------------------------------------------------
// 時刻・住所・主催（記事から取れるものは取り込み時に入れておく）
// ---------------------------------------------------------------------------

const han = (s) => s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
const HH = (h, m) => `${String(Number(h)).padStart(2, '0')}:${String(Number(m ?? 0)).padStart(2, '0')}`;

/** enrich/article-refill.mjs と同じ直し方。「午後4時～9時」を 4:00 と読まないため */
function normalizeClock(seg) {
  return seg
    .replace(/(\d{1,2})\s*時\s*半/g, (_, h) => `${h}時30分`)
    .replace(/午前\s*(\d{1,2})\s*時/g, (_, h) => `${Number(h) === 12 ? 0 : Number(h)}時`)
    .replace(/午後\s*(\d{1,2})\s*時/g, (_, h) => `${Number(h) < 12 ? Number(h) + 12 : Number(h)}時`);
}

function scanRange(rawSeg) {
  const seg = normalizeClock(han(rawSeg)).replace(/[〜～]/g, '~');
  const pm = /午後/.test(rawSeg);
  const out = [];
  const push = (h1, m1, h2, m2) => {
    const a = Number(h1); let b = Number(h2);
    if (pm && a >= 12 && b < 12) b += 12;
    if (a > 23 || b > 23 || a >= b) return;
    if (Number(m1 ?? 0) > 59 || Number(m2 ?? 0) > 59) return;
    out.push({ start: HH(h1, m1), end: HH(b, m2) });
  };
  for (const m of seg.matchAll(/(\d{1,2})\s*:\s*(\d{2})\s*~\s*(\d{1,2})\s*:\s*(\d{2})/g)) push(m[1], m[2], m[3], m[4]);
  for (const m of seg.matchAll(/(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?\s*~\s*(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?/g)) push(m[1], m[2], m[3], m[4]);
  for (const m of seg.matchAll(/(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?\s*から\s*(\d{1,2})\s*時\s*(?:(\d{1,2})\s*分)?\s*まで/g)) push(m[1], m[2], m[3], m[4]);
  return out;
}

/** 日付の直後 70 字から時刻を取る。**候補が食い違ったら入れない**（まとめ記事対策） */
function pickTime(text, dates) {
  const t = han(text);
  const cands = [];
  for (const d of dates) {
    const mm = Number(d.slice(5, 7)); const dd = Number(d.slice(8, 10));
    for (const m of t.matchAll(new RegExp(`${mm}\\s*月\\s*${dd}\\s*日`, 'g'))) {
      const seg = t.slice(m.index, m.index + 70)
        .split(/雨天|順延|中止|予備|昨年|去年|受付|開場|問い合わせ|申込/)[0];
      const r = scanRange(seg);
      if (r.length) cands.push(r[0]);
    }
  }
  // 「時間：18:00〜21:00」のラベル付きが本文にあればそれも見る
  for (const m of t.matchAll(/(?:時\s*間|開催時間|時刻)\s*[：:]\s*([^\s、。]{4,30})/g)) {
    const r = scanRange(m[1]);
    if (r.length) cands.push(r[0]);
  }
  if (!cands.length) return null;
  const u = [...new Set(cands.map((c) => `${c.start}-${c.end}`))];
  return u.length === 1 ? cands[0] : null;
}

/**
 * 住所。**掲載市区町村と突き合わせないと地の文を住所にしてしまう**
 * （「印西市大森にある六軒厳島神社の…」を住所にしていた例がある）。
 */
function pickAddress(body, pref, cityName) {
  const pats = [
    /住所は[、,]?\s*(.{6,60}?)\s*です[。、]?/,
    /[［\[]住所[］\]]\s*([^\s、。\n]{6,60})/,
    /住\s*所\s*[:：]\s*([^\s、。\n]{6,60})/,
    /所在地\s*[:：]\s*([^\s、。\n]{6,60})/,
  ];
  for (const re of pats) {
    const m = body.match(re);
    if (!m) continue;
    const a = m[1].replace(/〒?\d{3}-?\d{4}\s*/, '').replace(/です[。、]?$/, '').trim();
    if (!a.startsWith(pref)) continue;
    const rest = a.slice(pref.length);
    if (!rest.startsWith(cityName)) continue; // 別の市の住所は入れない
    const tail = rest.slice(cityName.length).trim();
    // 末尾が番地らしいものだけ。これが無いと「◯◯市は6月5日」を住所にする
    if (!/[0-9０-９]/.test(tail)) continue;
    return tail || null;
  }
  return null;
}

const ORG_TAIL = /(町会|町内会|自治会|連合会|実行委員会|委員会|協議会|振興会|商店会|商店街|青年会|子ども会|こども会|保存会|奉賛会|神社|神宮|大社|寺|組合|協会|連盟|商工会|商工会議所|観光協会|振興組合|の会|部会|支部|実行委)$/;

function pickOrganizer(body) {
  for (const m of body.matchAll(/主\s*催\s*[：:は]?\s*([^\s、。（(]{3,30})/g)) {
    const v = m[1].replace(/[」』】]+$/, '').trim();
    if (!/[ぁ-んァ-ヶ一-鿿]/.test(v)) continue;
    if (/^(者|様|側|する|による|により|後援|協力|の|は|が|を|に|で|と|も)/.test(v)) continue;
    if (ORG_TAIL.test(v)) return v;
  }
  return null;
}

// ---------------------------------------------------------------------------

/**
 * 記事本文が祭りの告知でないものを落とす。
 * `_article.mjs` の NOT_FESTIVAL に加えて、この入口で実際に混ざったものを足す。
 */
// 後半（ビアホール〜）は店の企画。「納涼ビアホール」「流しそうめん大会」は地域の祭りではない
const NOT_FESTIVAL_EXTRA = /マラソン|駅伝|清掃|イルミネーション|カラオケ|ライブ|物産展|献血|講演|セミナー|説明会|表彰|選挙|募集|求人|クーポン|プレゼントキャンペーン|福袋|初売り|婚活|献花|追悼|慰霊祭|供養|法要|プロ野球|ボートレース|競馬|パチンコ|閉館|リニューアル|ビアホール|ビアガーデン|流しそうめん|ファッションショー|ビュッフェ|バイキング|フリーマーケット|マルシェ|謎解き|eスポーツ|婚礼/;

/**
 * 「国立市内の盆踊り」「名古屋駅前・レジャック跡地で盆踊り」のように、
 * **まとめ記事の見出しをそのまま名前にしてしまったもの**を落とす。
 * どの祭りを指すのか決まらないので、載せると利用者が現地に行けない。
 */
const ROUNDUP_NAME = /[市区町村]内(の|で)|情報まとめ|まとめ$|一覧$|[はがで]\s*(盆踊り|夏祭り|夏まつり|縁日)$|特集/;

/**
 * まとめ記事か。**1 記事に祭りが 3 つ以上並ぶと、日付・時刻・会場が混ざる**。
 * ばらばらの日付が 4 つ以上出るものはまとめ記事とみなして丸ごと捨てる
 * （1 件目の会場を全部に付けるより、落とすほうがまし）。
 */
function isRoundup(body) {
  const t = han(body.slice(0, 2500));
  const days = new Set([...t.matchAll(/(\d{1,2})月\s*(\d{1,2})日/g)].map((m) => `${m[1]}/${m[2]}`));
  return days.size >= 4;
}

/**
 * 日付が離れすぎているものは読み違い（「7月18日…8月31日」を 1 つの祭りにしていた）。
 * 先頭から 14 日以内のものだけ残す。連日開催の祭りはこの幅に収まる。
 */
function tightenDates(dates) {
  const sorted = [...dates].sort();
  const t0 = new Date(sorted[0]).getTime();
  return sorted.filter((d) => (new Date(d).getTime() - t0) / 86400000 <= 14);
}

const rowsByArea = new Map();
let noCity = 0; let noDate = 0; let notFestival = 0; let ambiguous = 0;
let otherCity = 0; let roundup = 0;
let usedMedia = 0; let skippedMedia = 0;
const skipReasons = new Map();
const perMedia = new Map();

for (const file of readdirSync(RAW).filter((f) => f.endsWith('.json'))) {
  const j = JSON.parse(readFileSync(join(RAW, file), 'utf8'));
  if (j.skipped) {
    skippedMedia++;
    const key = j.skipped.replace(/\(.*\)/, '(…)').replace(/（.*）/, '（…）');
    skipReasons.set(key, (skipReasons.get(key) ?? 0) + 1);
    continue;
  }
  if (!j.items?.length) continue;

  const cov = coverage(j.areas ?? []);
  if (!cov.length) { skipReasons.set('行政区域が県までしか無い', (skipReasons.get('行政区域が県までしか無い') ?? 0) + 1); continue; }
  // 守備範囲が広すぎる媒体は市の判定を誤りやすい（県内全市など）
  if (cov.length > 12) { skipReasons.set('守備範囲が広すぎる（13市以上）', (skipReasons.get('守備範囲が広すぎる（13市以上）') ?? 0) + 1); continue; }

  const hostKey = j.host.replace(/\.(co\.)?(jp|com|net|org|info|tokyo|link|life|city|work)$/, '').replace(/[^a-z0-9-]/gi, '-');
  let n = 0;

  for (const it of j.items) {
    // --- 市区町村を決める ---
    let hit = null;
    if (cov.length === 1) {
      hit = cov[0];
    } else {
      // 題名 → 本文の頭 300 字の順に、守備範囲の市名を探す。
      // 長い名前（政令市の区）から見る
      const ordered = [...cov].sort((a, b) => b.full.length - a.full.length);
      const inTitle = ordered.filter((c) => it.title.includes(c.full) || it.title.includes(c.name));
      const head = it.body.slice(0, 300);
      const inBody = ordered.filter((c) => head.includes(c.full) || head.includes(c.name));
      if (inTitle.length === 1) hit = inTitle[0];
      else if (!inTitle.length && inBody.length === 1) hit = inBody[0];
    }
    if (!hit) { ambiguous++; continue; }
    const area = resolve(hit);
    if (!area) { noCity++; continue; }

    /**
     * **地域メディアは隣の市の祭りも記事にする**。船橋つうしんの
     * 「市川市民納涼花火大会」を船橋市の祭りとして入れていた。
     * 題名に実在する別の市区町村名が出ていて、自分の市の名前が出ていなければ捨てる。
     */
    const own = hit.full;
    const others = [...it.title.matchAll(/([一-鿿ぁ-んァ-ヶヵヶー]{2,6}[市区町村])/g)]
      .map((m) => m[1])
      .filter((c) => byCity.has(c) && c !== hit.name && c !== own && !own.includes(c));
    if (others.length && !it.title.includes(hit.name)) { otherCity++; continue; }

    // まとめ記事は日付・時刻・会場が混ざるので丸ごと捨てる
    if (isRoundup(it.body)) { roundup++; continue; }

    // --- 祭りかどうか ---
    const name = pickName(it.body, it.title);
    if (!usableName(name) || !IS_FESTIVAL.test(name) || NOT_FESTIVAL.test(name)) { notFestival++; continue; }
    if (NOT_FESTIVAL_EXTRA.test(name) || ROUNDUP_NAME.test(name)) { notFestival++; continue; }
    // 店舗の集客企画。商店街・町内会・神社のものは残す
    if (/来店|ご来店|店舗限定|開店記念|新装開店/.test(it.body)
      && !/商店街|町内会|自治会|神社|公園|小学校|中学校|八幡|稲荷/.test(name + it.body.slice(0, 200))) {
      notFestival++; continue;
    }

    // --- 日付 ---
    const raw = pickDates(it.body, it.title, it.date);
    if (!raw.length) { noDate++; continue; }
    const dates = tightenDates(raw);
    const year = Number(dates[0].slice(0, 4));
    if (dates.some((d) => Number(d.slice(0, 4)) !== year)) { noDate++; continue; }
    // 記事の掲載日より 1 年以上先／2 年以上前は読み違い
    if (year < 2025 || year > 2027) { noDate++; continue; }

    // 会場に括弧が開いたまま残ることがある（「…ふれあい広場（玉川3-24-16先」）
    const venue = pickVenue(it.body)?.replace(/[（(][^）)]*$/, '').trim() || null;
    const t = pickTime(it.body, dates);
    const cityLabel = area.ward ? area.ward : area.city;
    // 住所は「千葉県船橋市西習志野1-47-1」の形。政令市は区まで突き合わせる
    const address = pickAddress(it.body, area.pref, area.ward ? area.city + area.ward : area.city);

    const key = `${area.pref}|${area.citySlug}|${area.wardSlug ?? ''}`;
    if (!rowsByArea.has(key)) rowsByArea.set(key, { area, rows: [] });
    rowsByArea.get(key).rows.push({
      city: area.city,
      citySlug: area.citySlug,
      ...(area.ward ? { ward: area.ward, wardSlug: area.wardSlug } : {}),
      slug: `gotouti-${hostKey}-${it.id}`,
      name,
      kind: KIND(name),
      venue: venue ?? `${cityLabel}内`,
      address,
      scale: '地区',
      organizer: pickOrganizer(it.body),
      stalls: hasStalls(it.body) ? 'yes' : 'unknown',
      dates,
      ...(t ? { start: t.start, end: t.end } : {}),
      year,
      source: it.url,
      sourceName: j.name,
      sourceType: 'media',
    });
    n++;
  }
  if (n) { usedMedia++; perMedia.set(j.name, n); }
}

// --dry のときは書かずに中身を見せるだけ（誤りを混ぜる前に確かめるため）
if (process.argv.includes('--dry')) {
  const all = [...rowsByArea.values()].flatMap(({ area, rows }) => rows.map((r) => ({ area, r })));
  console.log(`\n[dry] ${all.length} 件`);
  for (const { area, r } of all.slice(0, 60)) {
    console.log(`  ${area.pref}${r.ward ?? r.city} | ${r.name} | ${r.kind} | ${r.venue} | ${r.dates.join(',')} | ${r.start ?? '-'}-${r.end ?? '-'} | 屋台${r.stalls} | ${r.organizer ?? '-'} | ${r.address ?? '-'}`);
  }
  console.log(`  市が絞れない ${ambiguous} / 別の市の記事 ${otherCity} / まとめ記事 ${roundup} / 市区町村不明 ${noCity} / 日付なし ${noDate} / 祭りでない ${notFestival}`);
  console.log('  歩留まり:', [...perMedia].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${k}:${v}`).join(' / '));
  console.log('  使わなかった理由:', [...skipReasons].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(' / '));
  process.exit(0);
}

writeNationwideAreas(generated);

let total = 0;
for (const [, { area, rows }] of rowsByArea) {
  const r = emit(rows, {
    pref: area.pref,
    prefSlug: byName(area.pref)?.slug,
    label: `名鑑（${area.ward ?? area.city}）`,
    checkedAt: CHECKED,
    year: 2026,
  });
  total += r.written;
}

console.log(`\n媒体 ${usedMedia} 件から ${total} 件を新規書き出し（触らなかった媒体 ${skippedMedia}）`);
console.log(`  市が絞れない ${ambiguous} / 別の市の記事 ${otherCity} / まとめ記事 ${roundup} / 市区町村不明 ${noCity} / 日付なし ${noDate} / 祭りでない ${notFestival}`);
console.log('  歩留まりの良かった媒体:');
for (const [k, v] of [...perMedia].sort((a, b) => b[1] - a[1]).slice(0, 20)) console.log(`    ${k}: ${v}`);
console.log('  使わなかった理由:');
for (const [k, v] of [...skipReasons].sort((a, b) => b[1] - a[1])) console.log(`    ${k}: ${v}`);
