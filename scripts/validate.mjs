/**
 * データ検証。build の前に必ず走る。
 * 「出典がない」「最終確認日がない」情報を世に出さないための門番。
 *
 *   node scripts/validate.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FEST_DIR = join(ROOT, 'data', 'festivals');

const KINDS = ['盆踊り', '夏祭り', '納涼祭', '例大祭', '秋祭り', '春祭り', '区民祭', '市民祭', 'こどもまつり', '商店街', '花火', '縁日', '神事'];
const SCALES = ['町内会', '地区', '区', '市'];
const STATUSES = ['confirmed', 'estimated', 'unconfirmed', 'cancelled', 'postponed'];
// 出典の格。official（神社・主催者の公式発表）がいちばん強い
const SOURCE_TYPES = ['official', 'gov', 'media', 'aggregator'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// 屋台・露店の有無。おでかけ先を探す人にとって決定的なので独立項目
const STALLS = ['yes', 'no', 'unknown'];
const STALE_WARN_DAYS = 180;

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e.endsWith('.yml') || e.endsWith('.yaml')) out.push(p);
  }
  return out;
}

const errors = [];
const warnings = [];
const seen = new Map();
const files = walk(FEST_DIR);

for (const path of files) {
  const rel = path.slice(ROOT.length + 1);
  const err = (m) => errors.push(`${rel}: ${m}`);
  const warn = (m) => warnings.push(`${rel}: ${m}`);

  let f;
  try {
    f = parse(readFileSync(path, 'utf8'));
  } catch (e) {
    err(`YAML が壊れている: ${e.message}`);
    continue;
  }

  for (const key of ['id', 'name', 'kind', 'scale', 'area', 'venue', 'occurrences']) {
    if (f?.[key] == null) err(`必須項目 ${key} がない`);
  }
  if (!f?.id) continue;

  if (basename(path).replace(/\.ya?ml$/, '') !== f.id) err(`ファイル名と id が一致しない (id: ${f.id})`);
  if (seen.has(f.id)) err(`id が重複している（${seen.get(f.id)} と同じ）`);
  seen.set(f.id, rel);

  if (f.kind && !KINDS.includes(f.kind)) err(`kind が不正: ${f.kind}`);
  if (f.stalls && !STALLS.includes(f.stalls)) err(`stalls が不正: ${f.stalls}`);
  // 写真は出典・著作者・ライセンスが揃っていないものを載せない
  for (const [i, ph] of (f.photos ?? []).entries()) {
    for (const k of ['url', 'credit', 'license', 'source']) {
      if (!ph?.[k]) err(`photos[${i}]: ${k} がない（表示できない写真は載せない）`);
    }
  }
  if (f.scale && !SCALES.includes(f.scale)) err(`scale が不正: ${f.scale}`);
  if (!f.venue?.name) err('venue.name がない');
  // ward は政令市（横浜・川崎・相模原）だけ。それ以外の市町村は null
  for (const k of ['pref', 'city']) {
    if (!f.area?.[k]) err(`area.${k} がない`);
  }
  if (!('ward' in (f.area ?? {}))) err('area.ward がない（区がない市町村は null を入れる）');

  if (!Array.isArray(f.occurrences) || f.occurrences.length === 0) {
    err('occurrences が空');
    continue;
  }

  for (const [i, o] of f.occurrences.entries()) {
    const at = `occurrences[${i}]`;
    if (!o.year) err(`${at}: year がない`);
    if (!o.source_url) err(`${at}: source_url がない（出典なしの情報は載せない）`);
    if (!o.checked_at) err(`${at}: checked_at がない`);
    else if (!DATE_RE.test(o.checked_at)) err(`${at}: checked_at の形式が不正: ${o.checked_at}`);

    if (!STATUSES.includes(o.status)) err(`${at}: status が不正: ${o.status}`);
    if (o.source_type && !SOURCE_TYPES.includes(o.source_type)) {
      err(`${at}: source_type が不正: ${o.source_type}`);
    }

    const dates = o.dates ?? [];
    if (!Array.isArray(dates)) err(`${at}: dates は配列にする`);
    else {
      for (const d of dates) {
        if (!DATE_RE.test(d)) err(`${at}: 日付の形式が不正: ${d}`);
        else if (Number(d.slice(0, 4)) !== o.year) err(`${at}: 日付 ${d} が year ${o.year} と食い違う`);
      }
    }
    if (dates.length === 0 && !o.date_note) err(`${at}: dates が空なら date_note で「9月ごろ」等を書く`);
    if (dates.length === 0 && o.status === 'confirmed') {
      err(`${at}: 日程未定なのに status: confirmed になっている`);
    }

    const age = Math.floor((Date.now() - Date.parse(`${o.checked_at}T00:00:00Z`)) / 86400000);
    if (age > STALE_WARN_DAYS) warn(`${at}: 最終確認から ${age} 日経過。再確認が必要`);
  }
}

// 当年の開催回が無い祭りは、去年の日程をそのまま出さないよう注意喚起
const thisYear = new Date().getFullYear();
for (const [id, rel] of seen) {
  const f = parse(readFileSync(join(ROOT, rel), 'utf8'));
  if (!f.occurrences.some((o) => o.year === thisYear)) {
    warnings.push(`${rel}: ${thisYear}年の開催回がない。「今年は未確認」として表示される`);
  }
  void id;
}

for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

// 出典の格の内訳。official の比率が、一次情報まで遡れている度合いそのもの。
const tiers = new Map();
for (const [, rel] of seen) {
  const f = parse(readFileSync(join(ROOT, rel), 'utf8'));
  const o = [...f.occurrences].sort((a, b) => b.year - a.year)[0];
  const t = o?.source_type ?? '(未設定)';
  tiers.set(t, (tiers.get(t) ?? 0) + 1);
}
const LABEL = { official: '主催者の公式発表', gov: '行政', media: '地域メディア', aggregator: 'まとめサイト' };
console.log('\n出典の内訳:');
for (const [t, n] of [...tiers].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${(LABEL[t] ?? t).padEnd(10, '　')} ${String(n).padStart(4)} 件`);
}

console.log(`\n${files.length} 件を検証。エラー ${errors.length} / 警告 ${warnings.length}`);
if (errors.length > 0) process.exit(1);
