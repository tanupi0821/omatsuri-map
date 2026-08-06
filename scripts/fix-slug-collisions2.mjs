/**
 * 同じディレクトリに別の市が同居している状態を解く（第 2 段）
 *
 *   node scripts/fix-slug-collisions2.mjs [--apply]
 *
 * `_citySlug` は**エリア定義ではなくファイルの置き場所**から決まる
 * （`src/lib/data.js` がパスの 2 階層目を使う）。そのため、定義に載っていない
 * 市の祭りが既存のディレクトリへ紛れ込むと、URL だけが共有されてしまう。
 * 第 1 段（`fix-slug-collisions.mjs`）は定義側しか見ないので、この分が残った。
 *
 * ここでは**ファイルを実際に走査して**、1 つのディレクトリに複数の市が
 * 入っているものを解く。件数の多い市をそこに残し、他を空き番号へ移す。
 * あわせて**エリア定義にも登録**する（登録しないと取り込みが次の実行で
 * また別の番号を作る）。
 *
 * 政令市の区は市の slug を共有するのが設計どおりなので、市の名前で数える。
 */
import { readdirSync, readFileSync, writeFileSync, statSync, unlinkSync, mkdirSync } from 'node:fs';
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
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith('.yml')) {
      const rel = relative(FEST, p).split(sep);
      items.push({ path: p, f: parse(readFileSync(p, 'utf8')), prefSlug: rel[0], citySlug: rel[1] });
    }
  }
})(FEST);

// --- 既に使われている slug（定義とディレクトリの両方） -----------------------
const used = new Set(items.map((x) => `${x.prefSlug}/${x.citySlug}`));
const areaFiles = readdirSync(AREAS).filter((f) => f.endsWith('.yml'));
const docs = new Map();
for (const f of areaFiles) {
  docs.set(f, parseAllDocuments(readFileSync(join(AREAS, f), 'utf8')).map((d) => d.toJS()));
}
for (const list of docs.values()) {
  for (const p of list) {
    const ps = p.slug ?? byName(p.pref)?.slug;
    for (const c of p.cities ?? []) used.add(`${ps}/${c.slug}`);
  }
}

// --- 同居しているディレクトリを洗い出す -------------------------------------
const byDir = new Map(); // `${prefSlug}/${citySlug}` -> Map(city -> [item])
for (const it of items) {
  const k = `${it.prefSlug}/${it.citySlug}`;
  if (!byDir.has(k)) byDir.set(k, new Map());
  const m = byDir.get(k);
  const city = it.f.area.city;
  if (!m.has(city)) m.set(city, []);
  m.get(city).push(it);
}

let cities = 0; let moved = 0;
const register = []; // {prefSlug, pref, city, slug}
for (const [k, m] of byDir) {
  if (m.size < 2) continue;
  const [prefSlug] = k.split('/');
  // 件数の多い市をそこに残す（移動するページ数を最小にする）
  const sorted = [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [city, list] of sorted.slice(1)) {
    let n = 0; let slug;
    do {
      n += 1;
      slug = `${prefSlug}-${String(n).padStart(3, '0')}`;
    } while (used.has(`${prefSlug}/${slug}`));
    used.add(`${prefSlug}/${slug}`);
    cities++;
    console.log(`${city}: ${k} → ${prefSlug}/${slug}（元の場所は ${sorted[0][0]} が使う / ${list.length} 件を移動）`);
    register.push({ prefSlug, pref: list[0].f.area.pref, city, slug });

    for (const it of list) {
      const old = it.citySlug;
      const id = it.f.id.startsWith(`${old}-`) ? `${slug}-${it.f.id.slice(old.length + 1)}` : it.f.id;
      const to = join(FEST, prefSlug, slug, `${id}.yml`);
      moved++;
      if (!APPLY) continue;
      it.f.id = id;
      mkdirSync(dirname(to), { recursive: true });
      writeFileSync(to, stringify(it.f, { lineWidth: 0 }), 'utf8');
      unlinkSync(it.path);
    }
  }
}

// --- エリア定義に登録する ---------------------------------------------------
// 登録しないと、次の取り込みが同じ市にまた別の番号を作る
if (APPLY && register.length) {
  const list = docs.get('nationwide.yml') ?? [];
  for (const r of register) {
    let doc = list.find((d) => (d.slug ?? byName(d.pref)?.slug) === r.prefSlug);
    if (!doc) { doc = { pref: r.pref, cities: [] }; list.push(doc); }
    doc.cities = doc.cities ?? [];
    if (!doc.cities.some((c) => c.name === r.city)) doc.cities.push({ name: r.city, slug: r.slug });
    else doc.cities.find((c) => c.name === r.city).slug = r.slug;
  }
  const sep2 = `---${'\n'}`;
  writeFileSync(join(AREAS, 'nationwide.yml'), list.map((d) => stringify(d, { lineWidth: 0 })).join(sep2), 'utf8');
}

console.log(`\n${APPLY ? '振り直した' : '振り直す候補'}: ${cities} 市区町村 / ${moved} 件`
  + `${APPLY ? '' : '\n（--apply で実行）'}`);
