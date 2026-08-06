/**
 * 号外NET 由来の祭りを、正しい市区町村に置き直す
 *
 *   node scripts/fix-goguynet-city.mjs [--apply]
 *
 * **題名の【】は版の名札であって、その記事の市区町村ではない。**
 * 帯広版は全記事が「【帯広市】」で始まるが、中身は大樹町・広尾町・更別村の祭りで、
 * それが全部「帯広市の祭り」として載っていた。同じ型が他の版にもある。
 *
 * `scripts/import/goguynet.mjs` は直したが、**既にある YAML は emit() が
 * 上書きしない**ので動かない。ここで置き直す。
 *
 * 消して取り込み直すのではなく**ファイルを移す**。取り込み後に enrich で
 * 入れた住所・時刻・主催・写真を捨てないため。
 */
import { readdirSync, readFileSync, writeFileSync, statSync, renameSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parse, stringify } from 'yaml';
import { ROOT } from './import/_lib.mjs';
import { loadAreaList } from './lib/areas.mjs';
import { byName, PREFS } from './lib/prefs.mjs';
import { buildGazetteer, actualCity } from './import/_gazetteer.mjs';

const APPLY = process.argv.includes('--apply');
const RAW = join(ROOT, 'data', 'raw', 'goguynet');

buildGazetteer(ROOT);

const areaMeta = new Map(JSON.parse(readFileSync(join(RAW, '_areas.json'), 'utf8')));

// goguynet.mjs と同じ表。複数県をまとめている版はここで県を決める
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
  // 四国の 5 版は見出しが「四国」としか書いていない。県を補わないと
  // 市区町村の照合が県で絞れず、同名の市を他県から拾う
  tokushima: '徳島県', takamatsu: '香川県', matsuyama: '愛媛県',
  'imabari-saijo': '愛媛県', kochi: '高知県',
};

// 市区町村名 → エリア定義
const byCity = new Map();
for (const a of loadAreaList(ROOT)) {
  const add = (n, r) => { if (!byCity.has(n)) byCity.set(n, []); byCity.get(n).push(r); };
  add(a.city, { pref: a.pref, city: a.city, citySlug: a.slug });
  for (const w of a.wards ?? []) {
    add(w.name, { pref: a.pref, city: a.city, citySlug: a.slug, ward: w.name, wardSlug: w.slug });
  }
}
function lookup(city, prefLabel) {
  const cands = byCity.get(city) ?? [];
  if (cands.length === 1) return cands[0];
  const hit = cands.filter((a) => prefLabel.includes(a.pref));
  if (hit.length === 1) return hit[0];
  return null;
}

// 記事 id → 正しいエリア
const want = new Map();
for (const f of readdirSync(RAW).filter((x) => x.endsWith('.json') && x !== '_areas.json')) {
  const j = JSON.parse(readFileSync(join(RAW, f), 'utf8'));
  const meta = areaMeta.get(j.area);
  if (!meta) continue;
  const prefLabel = AREA_PREF[j.area] ?? meta.pref;
  const prefName = byName(prefLabel)?.name
    ?? PREFS.map((p) => p.name).find((p) => prefLabel.includes(p)) ?? meta.pref;
  for (const it of j.items) {
    const edition = (it.title.match(/^【([^】]{2,10})】/) ?? [])[1];
    if (!edition) continue;
    const city = actualCity(edition, it.title, it.body, prefName);
    if (city === edition) continue; // 版のとおりでよい
    const area = lookup(city, prefLabel);
    // **エリア定義に無い町村は動かさない。** 勝手に slug を作ると
    // 取り込み側が作る slug とずれる。取り込み直しで自然に入る
    if (!area) { want.set(String(it.id), { unknown: city, edition, title: it.title }); continue; }
    want.set(it.url, { area, edition, city, title: it.title });
  }
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.yml')) out.push(p);
  }
  return out;
}

let moved = 0; let already = 0; let skippedUnknown = 0; let conflict = 0; let merged = 0;
const log = [];
for (const p of walk(join(ROOT, 'data', 'festivals'))) {
  const base = p.split(/[\\/]/).pop().replace(/\.yml$/, '');
  const m = base.match(/^(.+)-goguynet-(\d+)$/);
  if (!m) continue;

  const f = parse(readFileSync(p, 'utf8'));
  // **記事 id は版をまたいで重複する**（豊川版の 12345 と千葉版の 12345 は別記事）。
  // 出典 URL で引かないと、まったく関係のない市に飛ばしてしまう
  const w = want.get(f.occurrences?.[0]?.source_url);
  if (!w) continue;
  if (w.unknown) {
    if (f.area.city !== w.unknown) {
      skippedUnknown++;
      log.push(`  ? ${f.area.city} → ${w.unknown}（エリア定義に無いので動かさない）: ${f.name}`);
    }
    continue;
  }
  const targetCity = w.area.ward ?? w.area.city;
  const nowCity = f.area.ward ?? f.area.city;
  if (nowCity === targetCity) { already++; continue; }

  const prefSlug = byName(w.area.pref)?.slug;
  const dir = w.area.wardSlug
    ? join(ROOT, 'data', 'festivals', prefSlug, w.area.citySlug, w.area.wardSlug)
    : join(ROOT, 'data', 'festivals', prefSlug, w.area.citySlug);
  const newId = `${w.area.wardSlug ?? w.area.citySlug}-goguynet-${m[2]}`;
  const dest = join(dir, `${newId}.yml`);

  /**
   * **エリア定義の slug が重複している**ため、別の市なのに置き場所が同じことがある
   * （北海道は hokkaido-001 に札幌市中央区・余市町・旭川市近郊が同居している）。
   * その場合は移動ではなく、中身の市区町村名だけを直す。
   */
  const inPlace = dest === p;
  if (!inPlace && existsSync(dest)) {
    const other = parse(readFileSync(dest, 'utf8'));
    const sameArticle = other.occurrences?.[0]?.source_url === f.occurrences?.[0]?.source_url;
    if (!sameArticle) {
      conflict++;
      log.push(`  ! ${nowCity} → ${targetCity} 移動先に別の記事が同じ id で入っている: ${f.name}`);
      continue;
    }
    /**
     * **同じ記事が 2 つの市に入っている。** 正しい市の側が既にあるので、
     * 間違っている側は消す。ただし消す側にしか無い項目（enrich で入れた
     * 住所・緯度経度・時刻・主催・リンク・写真・屋台）は移してから消す。
     */
    merged++;
    log.push(`  ${nowCity} の重複を ${targetCity} にまとめる: ${f.name}`);
    if (!APPLY) continue;
    let changed = false;
    for (const k of ['organizer', 'shrine', 'station', 'description', 'recurrence', 'recurrence_source']) {
      if (other[k] == null && f[k] != null) { other[k] = f[k]; changed = true; }
    }
    if ((other.stalls ?? 'unknown') === 'unknown' && f.stalls && f.stalls !== 'unknown') { other.stalls = f.stalls; changed = true; }
    for (const k of ['address', 'lat', 'lng']) {
      if (other.venue?.[k] == null && f.venue?.[k] != null) { other.venue[k] = f.venue[k]; changed = true; }
    }
    if (f.photos?.length && !other.photos?.length) { other.photos = f.photos; changed = true; }
    if (f.links?.length) {
      const byUrl = new Map();
      for (const l of [...(other.links ?? []), ...f.links]) {
        const url = typeof l === 'string' ? l : l?.url;
        if (!url) continue;
        const prev = byUrl.get(url);
        if (!prev || (typeof prev === 'string' && typeof l === 'object')) byUrl.set(url, l);
      }
      if (byUrl.size !== (other.links ?? []).length) { other.links = [...byUrl.values()]; changed = true; }
    }
    const oc = other.occurrences?.[0]; const fc = f.occurrences?.[0];
    if (oc && fc) {
      for (const k of ['start_time', 'end_time', 'note', 'date_note']) {
        if (oc[k] == null && fc[k] != null) { oc[k] = fc[k]; changed = true; }
      }
    }
    if (changed) writeFileSync(dest, stringify(other, { lineWidth: 0 }), 'utf8');
    unlinkSync(p);
    continue;
  }

  log.push(`  ${nowCity} → ${targetCity}${inPlace ? '（置き場所は同じ）' : ''} : ${f.name}`);
  moved++;
  if (!APPLY) continue;

  f.id = newId;
  f.area = { pref: w.area.pref, city: w.area.city, ward: w.area.ward ?? null };
  // 会場が「◯◯市内」のままだと、動かした先で古い市名が残る
  if (f.venue?.name === `${nowCity}内`) f.venue.name = `${targetCity}内`;
  // 住所も市名から組み立てていた。移した先の市名に直せないので、
  // 古い市名で始まっていたら捨てる（誤った住所を残すより空のほうがよい）
  if (f.venue?.address && String(f.venue.address).startsWith(nowCity)) f.venue.address = null;

  mkdirSync(dir, { recursive: true });
  writeFileSync(dest, stringify(f, { lineWidth: 0 }), 'utf8');
  if (!inPlace) unlinkSync(p);
  void renameSync;
}

console.log(log.join('\n'));
console.log(`\n移す: ${moved} 件 / 既に正しい: ${already} 件 / 移動先に同じ id: ${conflict} 件 / エリア定義に無い町村: ${skippedUnknown} 件`);
if (!APPLY) console.log('（--apply を付けると実際に動かす）');
