/**
 * 会場名の点検。**書き換えず、疑わしいものを並べるだけ。**
 *
 *   node scripts/audit-venue.mjs            # 一覧
 *   node scripts/audit-venue.mjs --type X   # 種別で全部出す
 *
 * なぜ要るか:
 *   `venue.name` は詳細ページの一等地に出るうえ、**地図リンクの引数にもなる**。
 *   「】アルカサール中央広場」「取りなし」でゆったり観られるのは」のように
 *   記事から切り出し損ねたものが入っていると、地図が引けない。
 *   住所と同じで、埋まっていないより悪い。
 *
 * 見ているもの:
 *   1. sym-edge   記号で始まる／終わる（切り出しの取りこぼし）
 *   2. bracket    括弧の対応が取れていない
 *   3. prose      記事の地の文が混ざっている（述語・助詞）
 *   4. datetime   日付・時刻・料金が混ざっている（括弧の外に出ているもの）
 *   5. too-short  1 文字
 *   6. long       30 字超（**壊れとは限らない**。別枠で数える）
 *   7. area-only  「◯◯市内」だけ（**壊れではない**。会場が分からないだけ。別枠）
 *
 * 出典の格は問わず全件を見る（担当外のものは報告だけして書き換えない）。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const typeArg = process.argv.indexOf('--type');
const ONLY = typeArg > 0 ? process.argv[typeArg + 1] : null;

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e.endsWith('.yml')) out.push(p);
  }
  return out;
}

const PAIRS = [['（', '）'], ['(', ')'], ['【', '】'], ['「', '」'], ['『', '』'], ['〔', '〕']];
const count = (s, c) => [...s].filter((x) => x === c).length;

/** 括弧の外側だけを残す。括弧の中の注記は会場名の一部として正当なので見ない */
function outsideBrackets(s) {
  let depth = 0;
  let out = '';
  for (const c of s) {
    if ('（(【「『〔'.includes(c)) { depth++; continue; }
    if ('）)】」』〕'.includes(c)) { depth = Math.max(0, depth - 1); continue; }
    if (depth === 0) out += c;
  }
  return out;
}

const findings = [];
const add = (type, f, name, note) =>
  findings.push({ type, id: f.id, name, note, src: f.occurrences?.[0]?.source_type ?? '-' });

const files = walk(join(ROOT, 'data', 'festivals'));
let checked = 0;

for (const p of files) {
  let f;
  try { f = parse(readFileSync(p, 'utf8')); } catch { continue; }
  const name = f?.venue?.name;
  if (!name) continue;
  checked++;

  // --- 1. 記号で始まる／終わる -------------------------------------------
  // **先頭に来てよい記号はほぼ無い。** 閉じ括弧・中黒・三点リーダ・スラッシュで
  // 始まるものは、記事から切り出すときに前half を落とし損ねている
  if (/^[・…‥／：:）)】」』、。＞>]/.test(name)) {
    add('sym-edge', f, name, '記号で始まっている');
  } else if (/[・…‥／（(【「『、＋]$/.test(name)) {
    // 末尾の「〜前」「〜下」は正当。開き括弧・中黒で終わるものだけを見る
    add('sym-edge', f, name, '記号で終わっている');
  }

  // --- 2. 括弧の対応 ------------------------------------------------------
  const unbalanced = PAIRS.filter(([o, c]) => count(name, o) !== count(name, c));
  if (unbalanced.length) {
    add('bracket', f, name, `${unbalanced.map(([o, c]) => o + c).join('・')} の数が合わない`);
  }

  const outside = outsideBrackets(name);

  // --- 3. 記事の地の文 ----------------------------------------------------
  // **固有名詞に出てもおかしくない語は入れない**（「ふれあい」「おもてなし」など）。
  // 述語で終わる形と、明らかに文でしか使わない語だけを見る
  if (/(です|ました|ません|できます|しています|ください|でしょう|という|ならでは)/.test(outside)
    || /(のは|ことが|ですが|ますが)$/.test(outside)) {
    add('prose', f, name, '記事の地の文が混ざっている');
  }

  // --- 4. 日付・時刻・料金 ------------------------------------------------
  // **括弧の中は見ない。**「鬼怒楯岩大吊橋（10月3日・10日は鬼怒川温泉駅前広場）」の
  // ように、日によって会場が変わる注記は正当な書き方
  if (/\d{1,2}月\d{1,2}日|\d{1,2}時\d{0,2}分?[〜~]|\d+円|入場(は)?無料/.test(outside)) {
    add('datetime', f, name, '日付・時刻・料金が会場名に混ざっている');
  }

  // --- 5. 短すぎる --------------------------------------------------------
  if (name.trim().length <= 1) add('too-short', f, name, '1 文字しかない');

  // --- 6/7. 壊れではないが、会場として弱いもの ----------------------------
  if (name.length > 30) add('long', f, name, `${name.length} 字`);

  // 「北九州市門司区内」「南足柄市内」のように市区町村名＋「内」だけ
  if (/^.{2,12}[市区町村]内$/.test(name.trim())) {
    add('area-only', f, name, '市区町村名だけで会場が分からない');
  }
}

const BROKEN = ['sym-edge', 'bracket', 'prose', 'datetime', 'too-short'];
const INFO = ['long', 'area-only'];
const LABEL = {
  'sym-edge': '記号で始まる／終わる（切り出しの取りこぼし）',
  bracket: '括弧の対応が取れていない',
  prose: '記事の地の文が混ざっている',
  datetime: '日付・時刻・料金が混ざっている',
  'too-short': '1 文字しかない',
  long: '30 字超（壊れとは限らない）',
  'area-only': '「◯◯市内」だけ（壊れではない。会場が分からない）',
};

console.log(`会場名のある祭り ${checked} 件を点検\n`);
for (const t of [...BROKEN, ...INFO]) {
  const rows = findings.filter((x) => x.type === t);
  if (!rows.length || (ONLY && ONLY !== t)) continue;
  const mine = rows.filter((r) => ['official', 'gov'].includes(r.src)).length;
  console.log(`## ${t} — ${LABEL[t]}: ${rows.length} 件（うち担当 official/gov ${mine} 件）`);
  for (const r of rows.slice(0, ONLY ? 300 : 10)) {
    console.log(`   [${r.src}] ${r.id}\n      ${JSON.stringify(r.name)}   ← ${r.note}`);
  }
  if (!ONLY && rows.length > 10) console.log(`   … 他 ${rows.length - 10} 件（--type ${t} で全部出る）`);
  console.log('');
}

const broken = findings.filter((x) => BROKEN.includes(x.type));
const brokenMine = broken.filter((r) => ['official', 'gov'].includes(r.src));
console.log(`壊れている会場名 ${broken.length} 件（うち担当 ${brokenMine.length} 件）`
  + ` / 参考情報 ${findings.length - broken.length} 件`);
