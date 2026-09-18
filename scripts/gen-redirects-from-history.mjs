/**
 * 公開後に消えた URL の転送を、git の履歴から作る
 *
 *   node scripts/gen-redirects-from-history.mjs [--apply] [--max 1850]
 *
 * Search Console が「見つかりませんでした（404）」を 402 件出した。
 * 公開（2026-08-05）以降にサイトに載っていた祭りのページが、
 *
 *   - 重複の統合で消えた（`data/merged.json` に「消した id → 残した id」がある）
 *   - 置き場所（市の slug）を直したので id が変わった（出典の部分は同じまま）
 *
 * のどちらかで無くなったもの。**中身は別の URL に生きている**ので、
 * 404 のままにせず転送する。本当に削除した（祭りではなかった）ものは 404 が正しい。
 *
 * **Cloudflare Pages の `_redirects` は静的な転送を 2,000 本まで**しか読まない。
 * 超えた分は黙って無視される（デプロイは通る）ので、`--max` で上限を持つ。
 * 全部は入らないため、**同じ旧 slug から移った件数が多い順**に入れる
 * （その旧 slug の URL がまとまって検索結果に残っているため）。
 *
 * 畳んで `/f/hyogo-008-* → /f/kobe-:splat` と書くこともできるが、やらない。
 * 引退した slug は `_slug.mjs` が**別の市に振り直すことがある**ので、
 * その日から「新しい市の祭り」が神戸へ飛ぶ罠になる。1 行ずつ書けばこれは起きない。
 *
 * 書き込むのは `public/_redirects` の下の印の間だけ。何度流しても同じ結果になる。
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { ROOT } from './import/_lib.mjs';

const APPLY = process.argv.includes('--apply');
const maxArg = process.argv.indexOf('--max');
const MAX_TOTAL = maxArg > 0 ? Number(process.argv[maxArg + 1]) : 1850;
const LAUNCH = '2026-08-05'; // サイトを公開した日。これ以前の URL は外に出ていない
const BEGIN = '# >>> 公開後に消えた URL の転送（gen-redirects-from-history.mjs が書く）';
const END = '# <<< ここまで';

/**
 * **`-z` を付けないと日本語のファイル名が取りこぼれる。**
 * git は ASCII 以外を含むパスを 8 進数の並びで引用して出すので、`.yml` で
 * 終わらない行になり、129 件の祭り（「蛇池神社万灯流し大祭」など）が
 * 「存在しない」ことになっていた。`-z` は NUL 区切りで生のパスを出す。
 */
const raw = (...args) =>
  execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
/**
 * パスを出すコマンド用。`git log` には付けない（NUL 区切りにならない）。
 * **`-z` は末尾に足してはいけない。** `--` の後ろは全部パス指定として読まれるので、
 * `-- data/festivals -z` だと `-z` という名前のファイルを探して結果が空になる。
 */
const git = (cmd, ...args) => raw(cmd, '-z', ...args).split('\0').filter(Boolean);

// --- いま在る id --------------------------------------------------------
const idOf = (p) => basename(p).replace(/\.yml$/, '');
const now = new Set(git('ls-files', 'data/festivals').filter((l) => l.endsWith('.yml')).map(idOf));

// --- 公開後にどれかのコミットに在った id --------------------------------
const commits = raw('log', `--since=${LAUNCH}`, '--format=%H', '--', 'data/festivals')
  .split('\n')
  .filter(Boolean);
const past = new Set();
for (const c of commits) {
  for (const l of git('ls-tree', '-r', '--name-only', c, '--', 'data/festivals')) {
    if (l.endsWith('.yml')) past.add(idOf(l));
  }
}
const gone = [...past].filter((id) => !now.has(id)).sort();
console.log(`公開後に在った ${past.size} / いま ${now.size} → 消えた ${gone.length}`);

// --- 行き先を決める -----------------------------------------------------
const MERGED = join(ROOT, 'data', 'merged.json');
const merged = existsSync(MERGED) ? JSON.parse(readFileSync(MERGED, 'utf8')) : {};
/** 統合の連鎖（A→B→C）をたどって、いま在るものに着くまで */
function follow(id, seen = new Set()) {
  if (now.has(id)) return id;
  if (seen.has(id)) return null;
  seen.add(id);
  const t = merged[id];
  return typeof t === 'string' ? follow(t, seen) : null;
}
/**
 * id は `<市の slug>-<出典の id>`。出典の部分が同じで市の slug だけ違うものは、
 * **置き場所を直しただけの同じ祭り**。ただし候補が 2 つ以上あるときは
 * （同じ記事から 2 つの市に入ったなど）どちらか分からないので入れない。
 */
const KIND = /-((?:jinjacho|goguynet|gotouti|hanabi|summer|tsushin|rarea|tokyofesta|ward|chokai)-.+)$/;
const bySource = new Map();
for (const id of now) {
  const m = id.match(KIND);
  if (!m) continue;
  if (!bySource.has(m[1])) bySource.set(m[1], []);
  bySource.get(m[1]).push(id);
}

const moves = []; // { from, to, group }
let dead = 0;
for (const id of gone) {
  const m = id.match(KIND);
  const oldSlug = m ? id.slice(0, id.length - m[1].length - 1) : id;
  const byMerge = follow(id);
  const cand = m ? bySource.get(m[1]) : null;
  const to = byMerge ?? (cand && cand.length === 1 ? cand[0] : null);
  if (!to || to === id) { dead++; continue; }
  moves.push({ from: id, to, group: oldSlug });
}
console.log(`  転送できる ${moves.length} / 本当に削除（404 が正しい） ${dead}`);

// --- 何本入るか ---------------------------------------------------------
const src = join(ROOT, 'public', '_redirects');
const text = readFileSync(src, 'utf8');
const head = text.includes(BEGIN) ? text.slice(0, text.indexOf(BEGIN)).trimEnd() : text.trimEnd();
const kept = head.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#')).length;
const room = MAX_TOTAL - kept;
console.log(`  いまの転送 ${kept} 本 / 上限 ${MAX_TOTAL} → 入れられる ${room} 本`);

// 同じ旧 slug から移った件数が多い順。まとまって検索結果に残っているものを先に救う
const size = new Map();
for (const mv of moves) size.set(mv.group, (size.get(mv.group) ?? 0) + 1);
moves.sort((a, b) => size.get(b.group) - size.get(a.group) || a.from.localeCompare(b.from));
const take = moves.slice(0, Math.max(0, room));
const dropped = moves.length - take.length;

const lines = take.map((mv) => `/f/${mv.from}/ /f/${mv.to}/ 301`);
const body = [
  BEGIN,
  `# 重複の統合と置き場所の修正で消えた ${moves.length} 本のうち ${take.length} 本。`,
  '# 中身は行き先の URL に生きている。'
    + (dropped ? `上限に入らなかった ${dropped} 本は 404 のまま。` : ''),
  ...lines,
  END,
].join('\n');

if (!APPLY) {
  console.log(`\n書く行 ${lines.length} 本（--apply で実際に書く）`);
  console.log(lines.slice(0, 5).map((l) => `  ${l}`).join('\n'));
  if (dropped) console.log(`  … 上限で入らない ${dropped} 本は 404 のまま`);
} else {
  writeFileSync(src, `${head}\n\n${body}\n`, 'utf8');
  console.log(`\n${src} に ${lines.length} 本書いた（全体 ${kept + lines.length} 本）`);
  if (dropped) console.log(`上限に入らなかった ${dropped} 本は 404 のまま`);
}
