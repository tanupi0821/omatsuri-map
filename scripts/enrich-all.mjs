/**
 * すべての enrich スクリプトを順に実行する。
 *   node scripts/enrich-all.mjs
 *
 * import は「まとめサイトから広く集める」、enrich は「一次情報で裏を取って上書きする」。
 * 必ず import → enrich の順で流すこと（enrich は既存ファイルを前提にしている）。
 */
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'scripts', 'enrich');

for (const f of readdirSync(DIR).filter((x) => x.endsWith('.mjs')).sort()) {
  const r = spawnSync(process.execPath, [join(DIR, f)], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
