/**
 * 別の市が同じ URL を共有している状態を解く
 *
 *   node scripts/fix-slug-collisions.mjs [--apply]
 *
 * `goguynet.mjs` の `create()` が、既に使われている連番を見ずに毎回 001 から
 * 振り直していたため、**147 組・1,059 件の祭りが別の市と同じ slug** を持って
 * いた。`/a/aichi/aichi-007/` に西尾市と岡崎市が混ざる、という状態。
 *
 * エリアページは市区町村ごとの入口なので、これは中身が間違っているのと同じ。
 * **掲載件数の多い市に元の slug を残し**、他の市へ空いている連番を振り直す
 * （移動するページ数を最小にするため）。
 *
 * 政令市の区は市の slug を共有するのが設計どおりなので、**市の名前で数える**。
 */
import { readdirSync, readFileSync, writeFileSync, statSync, unlinkSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parse, parseAllDocuments, stringify } from 'yaml';
import { byName } from './lib/prefs.mjs';
import { ROOT } from './import/_lib.mjs';

const APPLY = process.argv.includes('--apply');
const AREAS = join(ROOT, 'data', 'areas');

// --- エリア定義をすべて読む -------------------------------------------------
// **1 ファイルに複数の県が「---」で並ぶ形式**。しかも同じ県が 2 回出ることが
// ある（別々の実行が追記したため）。そこが衝突の温床になっていた
const files = readdirSync(AREAS).filter((f) => f.endsWith('.yml'));
const docs = new Map(); // ファイル名 -> [県ごとの素の JS オブジェクト]
for (const f of files) {
  docs.set(f, parseAllDocuments(readFileSync(join(AREAS, f), 'utf8')).map((d) => d.toJS()));
}

/** 定義の中の市区町村を、書き換えられる形で全部集める */
const entries = []; // {file, pref, prefSlug, node}
for (const [file, list] of docs) {
  for (const p of list) {
    const slug = p.slug ?? byName(p.pref)?.slug;
    if (!slug) { console.log(`県の slug が引けない: ${p.pref}`); continue; }
    for (const c of p.cities ?? []) entries.push({ file, pref: p.pref, prefSlug: slug, node: c });
  }
}
if (!entries.length) {
  console.error('エリア定義を読めなかった。構造を確認すること');
  process.exit(1);
}

// --- 祭りを数える（多い市に元の slug を残す） --------------------------------
const count = new Map(); // `${prefSlug}/${slug}|${city}` -> 件数
const fest = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith('.yml')) {
      const f = parse(readFileSync(p, 'utf8'));
      fest.push({ path: p, f });
    }
  }
})(join(ROOT, 'data', 'festivals'));

for (const { f } of fest) {
  const k = `${f.area.city}`;
  count.set(k, (count.get(k) ?? 0) + 1);
}

// --- 衝突を洗い出す ---------------------------------------------------------
const bySlug = new Map(); // `${prefSlug}/${slug}` -> [entry]
for (const e of entries) {
  const k = `${e.prefSlug}/${e.node.slug}`;
  if (!bySlug.has(k)) bySlug.set(k, []);
  bySlug.get(k).push(e);
}
const used = new Set(entries.map((e) => `${e.prefSlug}/${e.node.slug}`));

let moved = 0; const plan = [];
for (const [k, list] of bySlug) {
  const names = [...new Set(list.map((e) => e.node.name))];
  if (names.length < 2) continue;

  // 件数の多い市を残す。同数なら定義に先に出てくる方
  const sorted = [...list].sort((a, b) => (count.get(b.node.name) ?? 0) - (count.get(a.node.name) ?? 0));
  const keep = sorted[0];
  for (const e of sorted.slice(1)) {
    if (e.node.name === keep.node.name) continue; // 同じ市の重複定義は触らない
    let n = 0; let slug;
    do {
      n += 1;
      slug = `${e.prefSlug}-${String(n).padStart(3, '0')}`;
    } while (used.has(`${e.prefSlug}/${slug}`));
    used.add(`${e.prefSlug}/${slug}`);
    plan.push({ e, from: e.node.slug, to: slug });
    console.log(`${e.pref} ${e.node.name}: ${e.node.slug} → ${slug}`
      + `（${k} は ${keep.node.name} が使う）`);
    moved++;
  }
}

// --- 祭りのファイルを移す ---------------------------------------------------
let files2 = 0;
for (const { e, from, to } of plan) {
  for (const item of fest) {
    const { f, path } = item;
    if (f.area.city !== e.node.name) continue;
    // id は slug で始まる。先頭だけ差し替える
    const id = f.id.startsWith(`${from}-`) ? `${to}-${f.id.slice(from.length + 1)}` : f.id;
    const to2 = join(ROOT, 'data', 'festivals', e.prefSlug, to, `${id}.yml`);
    if (to2 === path) continue;
    files2++;
    if (!APPLY) continue;
    f.id = id;
    mkdirSync(dirname(to2), { recursive: true });
    writeFileSync(to2, stringify(f, { lineWidth: 0 }), 'utf8');
    unlinkSync(path);
  }
  if (APPLY) e.node.slug = to;
}

if (APPLY) {
  for (const [file, list] of docs) {
    const sep = `---${'\n'}`;
    writeFileSync(join(AREAS, file), list.map((d) => stringify(d, { lineWidth: 0 })).join(sep), 'utf8');
  }
}

console.log(`\n${APPLY ? '振り直した' : '振り直す候補'}: ${moved} 市区町村 / ${files2} 件のファイル`
  + `${APPLY ? '' : '\n（--apply で実行）'}`);
