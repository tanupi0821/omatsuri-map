/**
 * 全国分のエリア定義（data/areas/nationwide.yml）の書き出し
 *
 * 花火と夏祭りの 2 つの取り込みが両方ここへ市区町村を足す。
 * 片方が丸ごと書き直すともう片方の市区町村が消えるので、**必ず併合する**。
 * slug は既に振ったものを変えない（URL が変わってしまう）。
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseAllDocuments, stringify } from 'yaml';
import { ROOT } from './_lib.mjs';
import { loadAreaList } from '../lib/areas.mjs';

const FILE = join(ROOT, 'data', 'areas', 'nationwide.yml');

const HEADER = '# 全国のエリア定義。scripts/import/*-nationwide.mjs が生成する。\n'
  + '# 関東など手で整えた都県は含めない（そちらの定義を使う）。\n'
  + '# slug は読めるローマ字ではなく県ごとの連番。当て字を機械生成して間違えるよりはよい。\n';

/** @param generated Map<prefSlug, {pref, cities:[{name,slug}]}> */
export function writeNationwideAreas(generated) {
  // 既にこのファイルにある分を読む（自分の前回出力＋もう一方の取り込み分）
  const current = new Map(); // pref -> Map<cityName, slug>
  if (existsSync(FILE)) {
    for (const doc of parseAllDocuments(readFileSync(FILE, 'utf8'))) {
      const d = doc.toJS();
      if (!d?.pref) continue;
      current.set(d.pref, new Map((d.cities ?? []).map((c) => [c.name, c.slug])));
    }
  }

  // 手で整えた都県（関東など）はこのファイルでは扱わない
  const handMade = new Set(
    loadAreaList(ROOT).filter((a) => a.file !== 'nationwide.yml').map((a) => a.pref),
  );

  let added = 0;
  for (const [, g] of generated) {
    if (handMade.has(g.pref)) continue;
    if (!current.has(g.pref)) current.set(g.pref, new Map());
    const m = current.get(g.pref);
    for (const c of g.cities) {
      if (m.has(c.name)) continue; // 既に振った slug は変えない
      m.set(c.name, c.slug);
      added++;
    }
  }

  if (!current.size) return;
  const docs = [...current].map(([pref, m]) => ({
    pref,
    cities: [...m].map(([name, slug]) => ({ name, slug })),
  }));
  writeFileSync(
    FILE,
    HEADER + docs.map((d) => stringify(d, { lineWidth: 0 })).join('---\n'),
    'utf8',
  );
  console.log(`エリア定義: ${current.size} 都道府県 / 市区町村 ${added} 件を追加`);
}
