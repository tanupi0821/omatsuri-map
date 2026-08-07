/**
 * 政令市のファイルを市のディレクトリ 1 つに寄せる
 *
 *   node scripts/fix-seirei-dirs.mjs [--apply]
 *
 * `_citySlug` は置き場所から決まるので、区ごとのディレクトリに散っていると
 * 市のページが割れる。`area.city` の正規化（`src/lib/data.js`）だけでは
 * 置き場所は動かないので、ここで寄せる。
 */
import { readdirSync, readFileSync, writeFileSync, statSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { parse, stringify } from 'yaml';
import { citySlug } from './lib/romaji.mjs';
import { ROOT } from './import/_lib.mjs';

const APPLY = process.argv.includes('--apply');
const FEST = join(ROOT, 'data', 'festivals');
const SEIREI = ['札幌市','仙台市','さいたま市','千葉市','横浜市','川崎市','相模原市','新潟市','静岡市','浜松市','名古屋市','京都市','大阪市','堺市','神戸市','岡山市','広島市','北九州市','福岡市','熊本市'];
const FALLBACK = { 札幌市:'sapporo', 仙台市:'sendai', 新潟市:'niigata', 静岡市:'shizuoka-shi', 浜松市:'hamamatsu', 名古屋市:'nagoya', 京都市:'kyoto', 大阪市:'osaka-shi', 堺市:'sakai', 神戸市:'kobe', 岡山市:'okayama', 広島市:'hiroshima-shi', 北九州市:'kitakyushu', 福岡市:'fukuoka-shi', 熊本市:'kumamoto' };

const items = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;
    const rel = relative(FEST, p).split(sep);
    items.push({ path: p, f: parse(readFileSync(p, 'utf8')), prefSlug: rel[0], citySlug: rel[1] });
  }
})(FEST);

// 市名から区を割ってから判定する（YAML には区が埋まったままのものがある）
const cityOf = (raw) => SEIREI.find((c) => raw === c || (raw.startsWith(c) && raw.endsWith('区'))) ?? null;

let n = 0;
for (const it of items) {
  const city = cityOf(it.f.area?.city ?? '');
  if (!city) continue;
  const slug = citySlug(city) ?? FALLBACK[city];
  if (!slug || it.citySlug === slug) continue;
  const id = it.f.id.startsWith(`${it.citySlug}-`) ? `${slug}-${it.f.id.slice(it.citySlug.length + 1)}` : it.f.id;
  const to = join(FEST, it.prefSlug, slug, `${id}.yml`);
  console.log(`${city}: ${it.prefSlug}/${it.citySlug} → ${it.prefSlug}/${slug}`);
  n++;
  if (!APPLY) continue;
  // 区が埋まったままなら割っておく（読み込み側でも割るが、データも揃える）
  if (it.f.area.city !== city) { it.f.area.ward = it.f.area.ward ?? it.f.area.city.slice(city.length); it.f.area.city = city; }
  it.f.id = id;
  mkdirSync(dirname(to), { recursive: true });
  writeFileSync(to, stringify(it.f, { lineWidth: 0 }), 'utf8');
  if (existsSync(it.path) && it.path !== to) unlinkSync(it.path);
}
console.log(`\n${APPLY ? '寄せた' : '寄せる候補'}: ${n} 件${APPLY ? '' : '\n（--apply で実行）'}`);
