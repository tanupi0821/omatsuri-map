/**
 * 市区町村とディレクトリを 1 対 1 にする（第 3 段・収束させる）
 *
 *   node scripts/fix-slug-collisions3.mjs [--apply]
 *
 * 第 2 段（`fix-slug-collisions2.mjs`）は**同居しているディレクトリを割る**が、
 * **同じ市が複数のディレクトリに散っている**ほうは解かない。
 * 連番の振り直しは 1 つずれると玉突きになるので、実際には両方が同時に起きている:
 *
 *   /a/gunma/gunma-001/ → 伊勢崎市:7, 邑楽郡千代田町:1
 *   /a/gunma/gunma-002/ → 邑楽郡千代田町:1, 邑楽郡明和町:1
 *   /a/gunma/gunma-003/ → 邑楽郡明和町:1, 邑楽郡大泉町:1
 *
 * 千代田町を 002 から出しても、001 にも千代田町が残るので終わらない。
 * ここでは**市区町村ごとに置き場所を 1 つに決めてから全部そこへ寄せる**。
 *
 * 決め方:
 *  1. ディレクトリの「持ち主」は、そこに最も多くファイルがある市区町村
 *  2. 市区町村の「家」は、自分が持ち主になっているディレクトリのうち最大のもの
 *  3. 持ち主になれなかった市区町村には、空いている番号を新しく振る
 *  4. 決めた家をエリア定義（nationwide.yml）にも登録する。
 *     **登録しないと次の取り込みがまた別の番号を作る**
 *
 * 政令市の区はディレクトリを市と共有する設計なので、`area.city` で数える
 * （区は `<pref>/<city>/<ward>/` の 3 階層目に入っている）。
 */
import { readdirSync, readFileSync, writeFileSync, statSync, unlinkSync, mkdirSync, rmdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { parse, parseAllDocuments, stringify } from 'yaml';
import { byName } from './lib/prefs.mjs';
import { ROOT } from './import/_lib.mjs';

const APPLY = process.argv.includes('--apply');
const FEST = join(ROOT, 'data', 'festivals');
const AREAS = join(ROOT, 'data', 'areas');

// --- 祭りを全部読む ---------------------------------------------------------
const items = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;
    const rel = relative(FEST, p).split(sep);
    items.push({
      path: p,
      f: parse(readFileSync(p, 'utf8')),
      prefSlug: rel[0],
      citySlug: rel[1],
      // 政令市の区はもう 1 階層下にある。移すときも保つ
      wardSlug: rel.length > 3 ? rel[2] : null,
    });
  }
}(FEST));

// --- いま誰がどこにいるか ---------------------------------------------------
/** `${prefSlug}|${city}` -> Map<citySlug, 件数> */
const where = new Map();
/** `${prefSlug}/${citySlug}` -> Map<city, 件数> */
const inDir = new Map();
for (const it of items) {
  const city = it.f.area?.city;
  if (!city) continue;
  const wk = `${it.prefSlug}|${city}`;
  if (!where.has(wk)) where.set(wk, new Map());
  where.get(wk).set(it.citySlug, (where.get(wk).get(it.citySlug) ?? 0) + 1);
  const dk = `${it.prefSlug}/${it.citySlug}`;
  if (!inDir.has(dk)) inDir.set(dk, new Map());
  inDir.get(dk).set(city, (inDir.get(dk).get(city) ?? 0) + 1);
}

// --- 1. 各ディレクトリの持ち主を決める --------------------------------------
/** `${prefSlug}/${citySlug}` -> city */
const owner = new Map();
for (const [dk, m] of inDir) {
  // 件数が同じときは名前順にして、実行のたびに結果が変わらないようにする
  const best = [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  owner.set(dk, best[0]);
}

// --- 使用済み slug（ディレクトリとエリア定義の両方） -------------------------
const used = new Set([...inDir.keys()]);
const docs = new Map();
for (const f of readdirSync(AREAS).filter((x) => x.endsWith('.yml'))) {
  docs.set(f, parseAllDocuments(readFileSync(join(AREAS, f), 'utf8')).map((d) => d.toJS()));
}
for (const list of docs.values()) {
  for (const p of list) {
    const ps = p.slug ?? byName(p.pref)?.slug;
    for (const c of p.cities ?? []) used.add(`${ps}/${c.slug}`);
  }
}

// --- 2. 各市区町村の「家」を決める ------------------------------------------
/** `${prefSlug}|${city}` -> citySlug */
const home = new Map();
const fresh = [];
for (const [wk, m] of [...where].sort()) {
  const [prefSlug] = wk.split('|');
  const ownDirs = [...m].filter(([slug]) => owner.get(`${prefSlug}/${slug}`) === wk.split('|')[1]);
  if (ownDirs.length) {
    home.set(wk, ownDirs.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0]);
    continue;
  }
  fresh.push(wk);
}
// 3. 持ち主になれなかったものに空き番号を振る（名前順で決めるので毎回同じ結果）
for (const wk of fresh) {
  const [prefSlug] = wk.split('|');
  let n = 0;
  let slug;
  do {
    n += 1;
    slug = `${prefSlug}-${String(n).padStart(3, '0')}`;
  } while (used.has(`${prefSlug}/${slug}`));
  used.add(`${prefSlug}/${slug}`);
  home.set(wk, slug);
}

// --- 移す -------------------------------------------------------------------
let moved = 0;
const movedCities = new Set();
const register = new Map(); // `${prefSlug}|${city}` -> {prefSlug, pref, city, slug}
const lines = [];
for (const it of items) {
  const city = it.f.area?.city;
  if (!city) continue;
  const wk = `${it.prefSlug}|${city}`;
  const want = home.get(wk);
  register.set(wk, { prefSlug: it.prefSlug, pref: it.f.area.pref, city, slug: want });
  if (want === it.citySlug) continue;

  const old = it.citySlug;
  // id の頭は「区があれば区の slug、無ければ市の slug」。市の slug のときだけ直す
  const id = it.f.id?.startsWith(`${old}-`) ? `${want}-${it.f.id.slice(old.length + 1)}` : it.f.id;
  const to = it.wardSlug
    ? join(FEST, it.prefSlug, want, it.wardSlug, `${id}.yml`)
    : join(FEST, it.prefSlug, want, `${id}.yml`);

  moved++;
  if (!movedCities.has(wk)) {
    movedCities.add(wk);
    lines.push(`  ${city}: ${it.prefSlug}/${old} → ${it.prefSlug}/${want}`);
  }
  if (!APPLY) continue;
  it.f.id = id;
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, stringify(it.f, { lineWidth: 0 }), 'utf8');
  unlinkSync(it.path);
  try { rmdirSync(dirname(it.path)); } catch { /* 空でなければ残る。それでよい */ }
}

// --- エリア定義に登録する ---------------------------------------------------
// 登録しないと、次の取り込みが同じ市にまた別の番号を作る
if (APPLY) {
  const list = docs.get('nationwide.yml') ?? [];
  const defined = new Set();
  for (const [f, l] of docs) {
    if (f === 'nationwide.yml') continue;
    for (const p of l) for (const c of p.cities ?? []) defined.add(`${p.pref}|${c.name}`);
  }
  for (const r of register.values()) {
    // 手で整えた area ファイルで定義済みのものはそちらが正。触らない
    if (defined.has(`${r.pref}|${r.city}`)) continue;
    let doc = list.find((d) => (d.slug ?? byName(d.pref)?.slug) === r.prefSlug);
    if (!doc) { doc = { pref: r.pref, cities: [] }; list.push(doc); }
    doc.cities = doc.cities ?? [];
    const hit = doc.cities.find((c) => c.name === r.city);
    if (hit) hit.slug = r.slug;
    else doc.cities.push({ name: r.city, slug: r.slug });
  }
  writeFileSync(
    join(AREAS, 'nationwide.yml'),
    `${list.map((d) => stringify(d, { lineWidth: 0 })).join('---\n')}`,
    'utf8',
  );
}

console.log(lines.slice(0, 60).join('\n'));
console.log(`\n${APPLY ? '寄せた' : '寄せる候補'}: ${movedCities.size} 市区町村 / ${moved} 件`);
if (!APPLY) console.log('（--apply で実行）');
