/**
 * 付けてしまった写真を今の基準で見直す
 *
 *   node scripts/enrich/photos-audit.mjs [--apply]
 *
 * 判定を厳しくするたびに、過去に採った写真も同じ物差しで測り直す必要がある。
 * --apply を付けない限り、外す候補を並べるだけで書き換えない。
 *
 * 外す条件は 2 つ。
 *  1. 今の isRelevant を通らない（ありふれた社号だけで市区町村が一致しない等）
 *  2. **同じ写真が別の祭りにも付いている** — 一般的すぎる証拠なので両方から外す
 */
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ROOT, patch } from '../import/_lib.mjs';
import { distinctiveTokens, isRelevant } from '../crawl/commons-photos.mjs';
import { PREFS, byName } from '../lib/prefs.mjs';
import { loadAreaList } from '../lib/areas.mjs';

const APPLY = process.argv.includes('--apply');
const RAW = join(ROOT, 'data', 'raw', 'commons');

// 判定に使う材料（題名・説明・カテゴリ）。commons-meta.mjs が取り直したものを使う
const META = join(ROOT, 'data', 'raw', 'commons-meta');
const hayOf = new Map(); // url -> 判定用の文字列
if (existsSync(META)) {
  for (const f of readdirSync(META).filter((x) => x.endsWith('.json'))) {
    const m = JSON.parse(readFileSync(join(META, f), 'utf8'));
    hayOf.set(m.url, m.hay);
  }
}
// 題名しか無い古い候補ファイルは補助的に使う
for (const f of readdirSync(RAW).filter((x) => x.endsWith('.json'))) {
  const c = JSON.parse(readFileSync(join(RAW, f), 'utf8'));
  for (const p of c.photos ?? []) if (p.title && !hayOf.has(p.url)) hayOf.set(p.url, p.title);
}

const withPhotos = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;
    const f = parse(readFileSync(p, 'utf8'));
    if (f.photos?.length) withPhotos.push(f);
  }
})(join(ROOT, 'data', 'festivals'));

// 使い回されている写真を数える
const useCount = new Map();
for (const f of withPhotos) {
  for (const p of f.photos) useCount.set(p.url, (useCount.get(p.url) ?? 0) + 1);
}

/**
 * 神社の祭りかどうか。社号は全国で重複するので、名前が一致しても別の神社のことが多い。
 * 大田区の三輪神社に岐阜の揖斐祭、新宿の赤城神社に群馬の赤城大沼の橋が付いた。
 */
/** 祭りを写した写真なら、題名・説明・カテゴリのどこかにこれらの語が出る */
const FESTIVAL_WORD = /祭|まつり|マツリ|踊り|おどり|花火|山車|神輿|みこし|屋台|露店|灯籠|ねぶた|ねぷた|七夕|Festival|Matsuri|Odori|Hanabi|Firework|Bon[- ]?odori|Parade|Dance/i;

const isShrineFestival = (f) => Boolean(f.shrine)
  || /(神社|神宮|八幡宮|天満宮|稲荷|大社|水天宮)/.test(f.name);

/**
 * 「桜まつり」「駅前夏祭り」「天王祭」「summer festival」のように、
 * **祭りの種類しか言っていない名前**。全国に同名がいくらでもある。
 * 袋井市の「summer festival」にイタリアの音楽祭、東久留米市の「天王祭」に
 * 品川の荏原神社の写真が付いた。神社の祭りと同じく地名の裏づけを要る。
 */
const TYPE_ONLY_NAME = /^(第?\d*回?\s*)?(春|夏|秋|冬|桜|駅前|天王|祇園|七夕|花火|納涼|盆|縁日|海の|山の)*\s*(祭り?|まつり|大会|フェスタ|フェス|summer\s*festival|festival)\s*(（[^）]*）|\([^)]*\))?$/i;

/** 名前がその祭りを一意に指せるか（地名や固有名を含むか） */
const hasOwnName = (f) => !TYPE_ONLY_NAME.test(f.name.trim());

// 実在の市区町村名。3 文字以上に限る（「岬町」のような短い名前は誤爆する）
const KNOWN_CITIES = [...new Set(loadAreaList(ROOT).map((a) => a.city))]
  .filter((c) => c.length >= 3);

/**
 * 説明に別の都道府県・市区町村の名前が出ていないか。
 * 出ていて、その祭りの土地と食い違うなら、別の場所の写真。
 * 返り値は見つかった地名（外した理由の表示に使う）。
 */
function mentionsElsewhere(hay, f) {
  const myPref = f.area?.pref ?? '';
  const myCity = f.area?.city ?? '';
  const lower = hay.toLowerCase();

  // 自分の土地の名前が出ているなら、他県が出ていても構わない。
  // 県境の花火大会は両岸の市が共催する（市川市民納涼花火大会＝江戸川区と共催、
  // 関門海峡花火大会＝下関市と門司区、猪名川花火大会＝川西市と池田市）。
  const myRomaji = byName(myPref)?.slug ?? '';
  const bareCity = myCity.replace(/[市区町村]$/, '');
  if (myCity && (hay.includes(myCity) || (bareCity.length >= 2 && hay.includes(bareCity)))) return null;
  if (myPref && hay.includes(myPref)) return null;
  if (myRomaji && new RegExp(`\\b${myRomaji}\\b`, 'i').test(lower)) return null;

  for (const p of PREFS) {
    if (p.name === myPref) continue;
    const bare = p.name.replace(/[都道府県]$/, '');
    if (hay.includes(p.name) || hay.includes(bare)
      || new RegExp(`\\b${p.slug}\\b`, 'i').test(lower)) return p.name;
  }

  // 県が書かれていないときは市区町村名で見る。
  // ただし**実在の市区町村に限る**。素朴に「◯◯市」を拾うと
  //「サギ草市」「錦糸町」を市区町村だと思ってしまう。
  for (const c of KNOWN_CITIES) {
    if (c !== myCity && hay.includes(c)) return c;
  }
  return null;
}

// 「このデータの中で 1 社しか無い社号なら通す」も試したが、駄目だった。
// 富士見市の榛名神社に群馬の榛名神社の写真が、新宿の赤城神社に赤城大沼の写真が通る。
// **一意なのはこのデータの中だけで、日本全国では違う。**
// 写真は無くても困らないが、間違った写真は害になる。地名の裏づけを必須のままにする。

let dropped = 0; let changed = 0;
for (const f of withPhotos) {
  const { place } = distinctiveTokens(f);
  // 神社の住所からも地名の錨を作る（「厚木市及川624」→「及川」）
  const town = (f.venue?.address ?? '').replace(/^.*?[市区町村]/, '').replace(/[0-9０-９\-ー－].*$/, '');
  // コモンズの題名はローマ字のことも多い（"Gosyo Hachimangu, Nakai, Kanagawa"）。
  // 市区町村の slug をそのまま地名の錨に足す
  const romaji = (f.id.split('-')[0] ?? '').replace(/\d+$/, '');
  const anchors = [
    ...place,
    ...(town.length >= 2 ? [town] : []),
    ...(romaji.length >= 3 ? [romaji] : []),
  ];

  const keep = [];
  for (const p of f.photos) {
    const hay = hayOf.get(p.url) ?? '';
    const shown = decodeURIComponent(p.url.split('/').pop());

    // (1) 別の祭りにも付いている写真は、その祭りを指していない
    const shared = (useCount.get(p.url) ?? 1) > 1;

    // (2) 神社の祭りは、市区町村名か鎮座地の町名が出ていないと採らない。
    //     社号だけの一致は同名の別の神社をつかむ。
    // 神社の祭り、および種類しか言っていない名前は、地名の裏づけを必須にする
    const noPlace = (isShrineFestival(f) || !hasOwnName(f))
      && !anchors.some((c) => hay.toLowerCase().includes(c.toLowerCase()));

    // (3) **祭りの写真であること**
    const notFestivalPhoto = !FESTIVAL_WORD.test(hay);

    // (4) 説明に**別の土地の名前**が書いてあるなら、その祭りの写真ではない。
    //     札幌の狸まつりに「阿波の狸まつり（徳島）」の写真、
    //     平塚市岡崎神社に「岡崎市 矢作神社例祭」の写真が付いた。
    const elsewhere = mentionsElsewhere(hay, f);

    if (!shared && !noPlace && !notFestivalPhoto && !elsewhere) { keep.push(p); continue; }
    dropped++;
    const why = shared ? '他の祭りにも使われている'
      : noPlace ? '名前が祭りの種類だけで地名の裏づけがない'
        : notFestivalPhoto ? '祭りの写真に見えない'
          : `別の土地の写真（${elsewhere}）`;
    console.log(`外す: ${f.name}（${f.area?.city ?? ''}） ← ${shown} [${why}]`);
  }
  if (keep.length === f.photos.length) continue;
  changed++;
  if (APPLY) patch(f.id, { photos_set: keep });
}

console.log(`\n${APPLY ? '外した' : '外す候補'}: ${dropped} 枚 / 対象 ${changed} 件`
  + `${APPLY ? '' : '\n（--apply を付けると実際に外す）'}`);
void writeFileSync;
