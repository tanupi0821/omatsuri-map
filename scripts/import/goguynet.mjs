/**
 * 号外NET の記事 → 祭りデータ
 *
 *   node scripts/import/goguynet.mjs
 *
 * 記事の本文が「～納涼盆踊り～ 日時 2026年8月1日（土）16時～21時 場所 都立汐入公園…」
 * という決まった形をしている。ここから名前・日付・会場を取る。
 *
 * 市区町村は**題名の【】**から取る（「【荒川区】8月22日（土）、…」）。
 * 地域版が複数の市をまとめていることがあるので、地域版名からは決められない。
 *
 * 屋台は本文に書いてあるときだけ yes。書いていなければ未確認のまま。
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
import { buildGazetteer, actualCity } from './_gazetteer.mjs';

const CHECKED = '2026-08-04';
const RAW = join(ROOT, 'data', 'raw', 'goguynet');

if (!existsSync(RAW)) {
  console.error('data/raw/goguynet がない。先に scripts/crawl/goguynet.mjs を回すこと');
  process.exit(1);
}

buildGazetteer(ROOT);

const areaMeta = new Map(
  existsSync(join(RAW, '_areas.json'))
    ? JSON.parse(readFileSync(join(RAW, '_areas.json'), 'utf8'))
    : [],
);

/**
 * 見出しが「青森県・岩手県・宮城県」のように複数県をまとめている地域版は、
 * 見出しからは県が決まらない。地域版ごとにどの県かを書いておく。
 * （42 地域。ここが埋まらないと東北・北陸・山陰・九州がまるごと落ちる）
 */
const AREA_PREF = {
  aomori: '青森県', hirosaki: '青森県', hachinohe: '青森県',
  morioka: '岩手県', 'hanamaki-kitakami-tono': '岩手県', 'oshu-ichinoseki': '岩手県',
  'sendaimiyaginoku-wakabayashiku': '宮城県', sendaitaihaku: '宮城県',
  'osaki-kurihara': '宮城県', 'ishinomaki-higashimatsushima': '宮城県',
  akitashi: '秋田県', yamagata: '山形県',
  koriyama: '福島県', iwaki: '福島県', aizu: '福島県',
  'niigatakita-higashi': '新潟県', 'niigatanishi-nishikan': '新潟県',
  'niigatakonan-akiha-minami': '新潟県', 'sanjo-tsubame-mitsuke': '新潟県',
  niigatanagaoka: '新潟県', 'joetsu-itoigawa-myoko': '新潟県',
  toyama: '富山県', takaoka: '富山県',
  kanazawa: '石川県', 'hakusan-nomi-nonoichi': '石川県', 'komatsu-kaga': '石川県',
  fukui: '福井県',
  kofu: '山梨県', nagano: '長野県', matsumoto: '長野県', ueda: '長野県',
  tottori: '鳥取県', yonago: '鳥取県', 'matsue-yasugi': '島根県', 'izumo-unnan': '島根県',
  nagasaki: '長崎県', saga: '佐賀県', 'kumamotochuo-higashi': '熊本県',
  ooita: '大分県', 'beppu-yufu-hita': '大分県',
  miyazaki: '宮崎県', 'kirishima-aira': '鹿児島県', 'satsumasendai-izumi': '鹿児島県',
};

// 市区町村名 → エリア定義。同名の市が複数県にある（府中市など）ので候補を全部持つ
const byCity = new Map();
const add = (name, rec) => {
  if (!byCity.has(name)) byCity.set(name, []);
  byCity.get(name).push(rec);
};
for (const a of loadAreaList(ROOT)) {
  add(a.city, { pref: a.pref, city: a.city, citySlug: a.slug });
  // 政令市の区も題名に出る（「【中原区】…」）。区として引けるようにする
  for (const w of a.wards ?? []) {
    add(w.name, {
      pref: a.pref, city: a.city, citySlug: a.slug,
      ward: w.name, wardSlug: w.slug,
    });
  }
}

/**
 * 地域版の見出しは「青森県・岩手県・宮城県」のように複数県をまとめていることがある。
 * 市名で引き、候補が複数なら見出しに出てくる県で絞る。
 */
// まだエリア定義に無い市区町村。ここで足す（全国の花火・夏祭りと同じ nationwide.yml）
const generated = new Map(); // prefSlug -> {pref, cities:[{name,slug}]}
const seq = new Map();

/**
 * **既に使われている slug を覚えておく。**
 *
 * これを見ずに毎回 001 から振り直していたため、実行のたびに別の市が同じ
 * 連番を取り、**147 組・1,059 件の祭りが別の市と同じ URL に同居していた**
 * （`/a/aichi/aichi-007/` に西尾市と岡崎市が混ざっていた）。
 */
const usedSlugs = new Set(loadAreaList(ROOT).map((a) => a.slug));

/**
 * 題名の【】は書き方が揺れる。
 *   「東京都北区」→「北区」、「川崎市多摩区」→ 区として引く
 */
function normalizeCity(raw) {
  const out = [raw];
  const noPref = raw.replace(/^(東京都|北海道|京都府|大阪府|..県)/, '');
  if (noPref && noPref !== raw) out.push(noPref);
  // 「川崎市多摩区」は区名で引けば既存のエリアに当たる
  const m = raw.match(/^(.+?[市])(.+[区])$/);
  if (m) out.push(m[2], m[1]);
  return out;
}

function resolveArea(rawCity, prefLabel) {
  for (const c of normalizeCity(rawCity)) {
    const hit = lookup(c, prefLabel);
    if (hit) return hit;
  }
  // 新しく登録するのは元の表記から（「東京都北区」ではなく「北区」を優先）
  return create(normalizeCity(rawCity).at(-1) ?? rawCity, prefLabel);
}

function lookup(city, prefLabel) {
  const cands = byCity.get(city) ?? [];
  if (cands.length === 1) return cands[0];
  const hit = cands.filter((a) => prefLabel.includes(a.pref));
  if (hit.length === 1) return hit[0];
  return null;
}

/** まだエリア定義に無い市区町村を足す */
function create(city, prefLabel) {
  // 題名の【】には「2026年最新」のような市区町村でないものも入る。
  // これを市として登録すると「号外NET（2026年最新）」ができてしまう
  if (!/[市区町村]$/.test(city)) return null;
  if (byCity.has(city)) return null;

  const p = byName(prefLabel);
  if (!p) return null;

  // 読める slug（romaji.mjs にあるもの）を優先する。
  // ただし他の市が既に使っていたら使えない（利島村と豊島区がどちらも
  // toshima になる、といった衝突が実在する）
  let slug = citySlug(city);
  if (!slug || usedSlugs.has(slug)) {
    let n = seq.get(p.slug) ?? 0;
    do {
      n += 1;
      slug = `${p.slug}-${String(n).padStart(3, '0')}`;
    } while (usedSlugs.has(slug));
    seq.set(p.slug, n);
  }
  usedSlugs.add(slug);
  const rec = { pref: p.name, city, citySlug: slug };
  add(city, rec);
  if (!generated.has(p.slug)) generated.set(p.slug, { pref: p.name, cities: [] });
  generated.get(p.slug).cities.push({ name: city, slug });
  return rec;
}

const rowsByArea = new Map(); // `${pref}|${city}` -> rows
let noCity = 0; let noDate = 0; let notFestival = 0;

for (const file of readdirSync(RAW).filter((f) => f.endsWith('.json') && f !== '_areas.json')) {
  const j = JSON.parse(readFileSync(join(RAW, file), 'utf8'));
  const meta = areaMeta.get(j.area);
  if (!meta) continue;

  for (const it of j.items) {
    const edition = (it.title.match(/^【([^】]{2,10})】/) ?? [])[1];
    if (!edition) { noCity++; continue; }
    // 見出しが複数県のときは地域版ごとの対応表を使う
    const prefLabel = AREA_PREF[j.area] ?? meta.pref;

    /**
     * **題名の【】は版の名札であって、その記事の市区町村とは限らない。**
     * 帯広版は全記事が「【帯広市】」で始まるが、中身は大樹町の歴舟川清流まつり・
     * 広尾町の十勝港まつり・更別村のすももの里まつりだった。
     * 本文と題名で実際に言及されている市町村を数えて決める（`_gazetteer.mjs`）。
     */
    const prefName = byName(prefLabel)?.name
      ?? PREFS.map((p) => p.name).find((p) => prefLabel.includes(p))
      ?? meta.pref;
    const city = actualCity(edition, it.title, it.body, prefName);

    const area = resolveArea(city, prefLabel);
    if (!area) { noCity++; continue; }

    const name = pickName(it.body, it.title);
    if (!usableName(name) || !IS_FESTIVAL.test(name) || NOT_FESTIVAL.test(name)) {
      notFestival++; continue;
    }
    // 店舗の集客企画は地域の祭りではない。商店街・町内会・神社のものは残す
    if (/来店|ご来店|店舗限定|開店記念/.test(it.body)
      && !/商店街|町内会|自治会|神社|公園|小学校|中学校/.test(name + (it.body.slice(0, 200)))) {
      notFestival++; continue;
    }

    const dates = pickDates(it.body, it.title, it.date);
    if (!dates.length) { noDate++; continue; }
    const year = Number(dates[0].slice(0, 4));
    if (dates.some((d) => Number(d.slice(0, 4)) !== year)) { noDate++; continue; }

    const venue = pickVenue(it.body);

    const key = `${area.pref}|${city}`;
    if (!rowsByArea.has(key)) rowsByArea.set(key, { area, rows: [] });
    rowsByArea.get(key).rows.push({
      city: area.city,
      citySlug: area.citySlug,
      ...(area.ward ? { ward: area.ward, wardSlug: area.wardSlug } : {}),
      slug: `goguynet-${it.id}`,
      name,
      kind: KIND(name),
      venue: venue ?? `${city}内`,
      scale: '町内会',
      // 屋台は本文に書いてあるときだけ。書いていなければ未確認
      stalls: hasStalls(it.body) ? 'yes' : 'unknown',
      dates,
      year,
      source: it.url,
      sourceName: `号外NET ${meta.label}`,
      sourceType: 'media',
    });
  }
}

writeNationwideAreas(generated);

for (const [key, { area, rows }] of rowsByArea) {
  emit(rows, {
    pref: area.pref,
    prefSlug: byName(area.pref)?.slug,
    label: `号外NET（${key.split('|')[1]}）`,
    checkedAt: CHECKED,
    year: 2026,
  });
}

console.log(`  市区町村不明 ${noCity} / 日付なし ${noDate} / 祭りでない ${notFestival}`);
