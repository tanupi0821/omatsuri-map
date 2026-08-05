/**
 * 神社庁のページに載っている「その神社自身の公式サイト」を links に足す。
 *
 *   node scripts/enrich/shrine-site-links.mjs
 *
 * 取ってくるのは `scripts/crawl/jinjacho-kanagawa-url.mjs`。ここは通信しない。
 *
 * なぜやるか:
 *   神社庁から入れた祭りは `links` が空のまま 1100 件以上あり、詳細ページが
 *   行き止まりになっている。例祭の時刻や当日の案内は**神社自身のサイトにしか出ない**ので、
 *   そこへ行けるようにするのがいちばん効く。
 *
 * 取り違えの心配が無い理由:
 *   突き合わせのキーが `occurrences[].source_url`（その祭りを取り込んだ神社庁ページ）
 *   そのものなので、社号の一致で引いていない。**同名の別の神社を掴む余地が無い**。
 *
 * 対象は occurrences[0].source_type が official / gov のものだけ。
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { patch, ROOT } from '../import/_lib.mjs';

const CACHE = join(ROOT, 'data', 'raw', 'jinjacho', 'kanagawa-url');

if (!existsSync(CACHE)) {
  console.log('神社の公式サイト: キャッシュが無いので何もしない');
  process.exit(0);
}

// 神社庁ページの URL -> { name, site }
const bySource = new Map();
for (const e of readdirSync(CACHE)) {
  if (!e.endsWith('.json')) continue;
  let j;
  try { j = JSON.parse(readFileSync(join(CACHE, e), 'utf8')); } catch { continue; }
  if (j.site) bySource.set(j.url, j);
}

let added = 0;
const walk = (dir) => {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;
    const f = parse(readFileSync(p, 'utf8'));
    const o = f.occurrences?.[0];
    if (!['official', 'gov'].includes(o?.source_type)) continue;

    const s = bySource.get(o.source_url);
    if (!s) continue;

    // 既に同じ URL が入っていれば足さない（patch 側でも URL で畳むが、数え違いを避ける）
    const have = (f.links ?? []).some((l) => (typeof l === 'string' ? l : l?.url) === s.site);
    if (have) continue;

    // 題は「<社号> 公式サイト」。素の文字列と混ぜると [object Object] になるので必ず {title,url}
    const title = `${f.shrine || s.name || '神社'} 公式サイト`;
    if (patch(f.id, { links: [{ title, url: s.site }] })) added++;
  }
};
walk(join(ROOT, 'data', 'festivals'));

console.log(`神社の公式サイトを links に追加: ${added} 件（公式サイトを持つ神社 ${bySource.size} 社）`);
