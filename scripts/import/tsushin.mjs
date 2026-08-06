/**
 * 「◯◯つーしん」系の記事 → 祭りデータ
 *
 *   node scripts/import/tsushin.mjs
 *
 * この系統の強みは**住所が本文に必ず入る**こと。会場名を地の文から推測すると
 * 「全体が一体感に包まれる」のような断片を拾ってしまうが、ここでは
 * 住所を直接取れるので、その失敗が起きない。
 *
 *   住所は兵庫県西宮市六湛寺町7-25 六湛寺公園です。   （西宮つーしん）
 *   ［住所］大阪府和泉市太町５５２                     （さかにゅー）
 *   住所 〒833-0001 福岡県筑後市…                      （筑後いこい）
 *
 * 屋台も「夜店 ：17:00〜19:30」のようにラベル付きの独立項目なので、
 * 本文全体から推測しなくてよい。
 *
 * **1 記事に複数の祭りが入ることがある**（「きょうの夏祭りは4ヶ所」）。
 * 住所の出現数で判断し、2 つ以上あるものは今は取り込まない（誤って
 * 1 件目の住所を全部に付けるより、落とすほうがまし）。
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emit, ROOT } from './_lib.mjs';
import { SITES } from '../crawl/tsushin.mjs';
import { loadAreaList } from '../lib/areas.mjs';
import { byName, PREFS } from '../lib/prefs.mjs';
import { makeSlugPool } from './_slug.mjs';
import { writeNationwideAreas } from './_nationwide.mjs';
import {
  IS_FESTIVAL, NOT_FESTIVAL, KIND, pickDates, pickName, usableName,
} from './_article.mjs';

const CHECKED = '2026-08-05';
const RAW = join(ROOT, 'data', 'raw', 'tsushin');

if (!existsSync(RAW)) {
  console.error('data/raw/tsushin がない。先に scripts/crawl/tsushin.mjs を回すこと');
  process.exit(1);
}

const PREF_NAMES = PREFS.map((p) => p.name);

/** 「住所は兵庫県西宮市六湛寺町7-25 六湛寺公園です。」から住所を取る */
function pickAddress(body) {
  const pats = [
    // 「住所は兵庫県西宮市六湛寺町7-25 六湛寺公園です。」
    // 会場名まで含むので空白を許す。末尾の「です」は住所ではない
    /住所は[、,]?\s*(.{6,60}?)\s*です[。、]?/,
    /［住所］\s*([^\s、。\n]{6,60})/,
    /\[住所\]\s*([^\s、。\n]{6,60})/,
    /住所\s*[:：]\s*([^\s、。\n]{6,60})/,
  ];
  for (const re of pats) {
    const m = body.match(re);
    if (!m) continue;
    // 「〒833-0001 福岡県…」の郵便番号は落とす
    const a = m[1].replace(/〒?\d{3}-?\d{4}\s*/, '').replace(/です[。、]?$/, '').trim();
    if (PREF_NAMES.some((p) => a.startsWith(p))) return a;
  }
  return null;
}

/**
 * 「夜店 ：17:00〜19:30」のようなラベル付き項目があれば屋台は確実。
 * **本文は改行が空白に潰れて 1 行になっている**ので行頭では判定できない。
 * ラベルとコロンが隣り合う形で見る。
 */
const LABELLED_STALLS = /(?:夜店|屋台|模擬店|縁日ブース|露店)\s*[：:]/;

const byCity = new Map();
for (const a of loadAreaList(ROOT)) byCity.set(`${a.pref}|${a.city}`, a.slug);
const generated = new Map();
// slug の採り方は `_slug.mjs` に共通化した（別の市が同じ URL を共有するのを防ぐ）
const pool = makeSlugPool(ROOT);
function slugOf(pref, city) {
  const k = `${pref}|${city}`;
  if (byCity.has(k)) return byCity.get(k);
  const p = byName(pref);
  if (!p) return null;
  const slug = pool.assign(p.name, city, p.slug, 800);
  byCity.set(k, slug);
  if (!generated.has(p.slug)) generated.set(p.slug, { pref, cities: [] });
  generated.get(p.slug).cities.push({ name: city, slug });
  return slug;
}

const rowsByCity = new Map();
let noAddr = 0; let multi = 0; let noDate = 0; let notFestival = 0;

for (const file of readdirSync(RAW).filter((f) => f.endsWith('.json'))) {
  const j = JSON.parse(readFileSync(join(RAW, file), 'utf8'));
  const site = SITES[j.site];
  if (!site) continue;

  for (const it of j.items) {
    // 1 記事に複数の祭り（住所が 2 つ以上）は今は扱わない
    const addrCount = (it.body.match(/住所は|［住所］|住所\s*[:：]/g) ?? []).length;
    if (addrCount > 1) { multi++; continue; }

    const address = pickAddress(it.body);
    if (!address) { noAddr++; continue; }

    // 住所から市区町村を決める。媒体の守備範囲の外なら入れない
    const pref = PREF_NAMES.find((p) => address.startsWith(p));
    const rest = address.slice(pref.length);
    const city = (rest.match(/^(.+?[市区町村])/) ?? [])[1];
    if (!city) { noAddr++; continue; }
    // 政令市は「神戸市東灘区」のように区まで市区町村名にしている
    const ward = (rest.slice(city.length).match(/^(.+?区)/) ?? [])[1];
    const fullCity = ward ? city + ward : city;

    /**
     * この媒体は読者投稿を本文に混ぜる（「KAZUさんからの情報提供です」）。
     * また「きょうの夏祭り」「きょうのお祭り」という日次の見出しがあり、
     * どの祭りか分からない。どちらも名前として使えない。
     */
    const name = (pickName(it.body, it.title) ?? '')
      .replace(/\s*\S*さんからの情報提供です.*$/, '')
      .trim();
    if (!usableName(name) || !IS_FESTIVAL.test(name) || NOT_FESTIVAL.test(name)) {
      notFestival++; continue;
    }
    // 「きょうの夏祭り」「近所の夏祭り」はまとめ記事の見出しで、祭りの名前ではない
    if (/^(きょう|今日|本日|今週|明日|近所|ご近所)/.test(name)) { notFestival++; continue; }

    const dates = pickDates(it.body, it.title, it.date);
    if (!dates.length) { noDate++; continue; }
    const year = Number(dates[0].slice(0, 4));
    if (dates.some((d) => Number(d.slice(0, 4)) !== year)) { noDate++; continue; }

    const slug = slugOf(pref, fullCity);
    if (!slug) { noAddr++; continue; }

    const key = `${pref}|${fullCity}`;
    if (!rowsByCity.has(key)) rowsByCity.set(key, { pref, city: fullCity, rows: [] });
    rowsByCity.get(key).rows.push({
      city: fullCity,
      citySlug: slug,
      slug: `tsushin-${j.site}-${it.id}`,
      name,
      kind: KIND(name),
      // 会場は住所の末尾に付いていることが多い（「…六湛寺町7-25 六湛寺公園」）
      // 会場は住所の末尾に付く（「…六湛寺町7-25 六湛寺公園」）か、
      // 「納涼盆踊り大会 – 六湛寺公園」のようにダッシュの後ろにある
      venue: (address.match(/\s(\S{2,30}?(?:公園|神社|寺|小学校|中学校|広場|会館|センター|グラウンド|運動場|グランド))$/) ?? [])[1]
        ?? (it.body.match(/[–—-]\s*(\S{2,30}?(?:公園|神社|寺|小学校|中学校|広場|会館|センター|グラウンド|運動場))/) ?? [])[1]
        ?? `${fullCity}内`,
      address: address.slice(pref.length + fullCity.length).trim() || null,
      scale: '地区',
      // ラベル付きの項目があれば確実。無ければ本文からは推測しない
      stalls: LABELLED_STALLS.test(it.body) ? 'yes' : 'unknown',
      dates,
      year,
      source: it.url,
      sourceName: site.name,
      sourceType: 'media',
    });
  }
}

writeNationwideAreas(generated);

for (const [, { pref, city, rows }] of rowsByCity) {
  emit(rows, {
    pref,
    prefSlug: byName(pref)?.slug,
    label: `つーしん系（${city}）`,
    checkedAt: CHECKED,
    year: 2026,
  });
}

console.log(`  住所なし ${noAddr} / 1記事に複数 ${multi} / 日付なし ${noDate} / 祭りでない ${notFestival}`);
