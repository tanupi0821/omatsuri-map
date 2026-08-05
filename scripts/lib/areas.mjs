/**
 * data/areas/*.yml の読み込み（scripts 側の共通処理）
 *
 * area ファイルは 3 つの形をとれる:
 *   1. 1 ファイル 1 市（政令市。トップレベルに city_slug と wards）
 *   2. 1 ファイルに複数市町村（`cities:` の配列）
 *   3. 1 ファイルに複数都県（`---` 区切りの複数ドキュメント）
 * 読む側がそれを気にしなくていいように、ここで平らな配列に均す。
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseAllDocuments } from 'yaml';

export function loadAreaList(root) {
  const dir = join(root, 'data', 'areas');
  const out = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.yml'))) {
    for (const d of parseAllDocuments(readFileSync(join(dir, file), 'utf8'))) {
      const doc = d.toJS();
      if (!doc) continue;
      for (const c of doc.cities ?? [doc]) {
        out.push({
          file,
          pref: doc.pref,
          city: c.city ?? c.name,
          slug: c.city_slug ?? c.slug,
          wards: c.wards ?? [],
        });
      }
    }
  }
  return out;
}
