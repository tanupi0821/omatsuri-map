/**
 * すべてのインポーターを順に実行する。
 *   node scripts/import-all.mjs [--force]
 *
 * 既存ファイルは上書きしないので、何度流しても手を入れたデータは壊れない。
 */
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'scripts', 'import');

const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.mjs') && !f.startsWith('_'))
  .sort();

const args = process.argv.slice(2);

for (const f of files) {
  const r = spawnSync(process.execPath, [join(DIR, f), ...args], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
