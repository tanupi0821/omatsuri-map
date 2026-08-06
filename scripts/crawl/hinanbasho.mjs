/**
 * 国土地理院「指定緊急避難場所データ」を都道府県ごとに取り、
 * 会場の住所を起こすための施設一覧に落とす。
 *
 *   node scripts/crawl/hinanbasho.mjs            # 既定の都道府県
 *   node scripts/crawl/hinanbasho.mjs 13 27 23   # 都道府県コードを指定
 *
 * なぜこれが効くか:
 *   行政の祭り一覧は**会場名しか持っていない**（「◯◯小学校」「◯◯公園」）。
 *   指定緊急避難場所は**小中学校・公園・広場・公民館がほぼ網羅**されていて、
 *   施設名・所在地（番地まで）・緯度経度が揃っている。しかも**全国分が同じ形**で出ている。
 *   区ごとに公園一覧を探して回るより、これ 1 本の方が広く効く。
 *
 *   出典: G空間情報センター（国土地理院）／ライセンス: クリエイティブ・コモンズ 表示
 *
 * GeoJSON は 1 県で 2MB 前後あるので、**必要な列だけ抜いた CSV にして保存する**
 * （施設名・所在地・緯度・経度）。生の GeoJSON は残さない。
 *
 * 作法: 取得済みは作り直さない。1 県ごとに 3 秒あける。
 *
 * 出力: data/raw/opendata/hinanbasho-<都道府県コード>.csv
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'opendata');
const API = 'https://www.geospatial.jp/ckan/api/3/action/package_show?id=hinanbasho-';
const DELAY_MS = 3000;
// HTTP ヘッダは ASCII のみ
const UA = 'matsuri-map/0.1 (local festival directory; +https://omatsuri-map.com; polite crawler)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 全国 47 都道府県。**祭りは全国に増え続けるので、先に揃えておく方が安い**
// （1 県あたり 200〜400KB 程度の CSV になる）
const DEFAULT = Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, '0'));
const args = process.argv.slice(2).filter((a) => /^\d{1,2}$/.test(a)).map((a) => a.padStart(2, '0'));
const CODES = args.length ? args : DEFAULT;

/** CSV の 1 セル。カンマ・引用符・改行を含みうるので必ず括る */
const cell = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;

mkdirSync(OUT, { recursive: true });

let got = 0;
let cached = 0;
for (const code of CODES) {
  const path = join(OUT, `hinanbasho-${code}.csv`);
  if (existsSync(path)) { cached++; continue; }

  let pkg;
  try {
    const r = await fetch(`${API}${code}`, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error(String(r.status));
    pkg = (await r.json()).result;
  } catch (e) {
    console.warn(`  ! ${code}: カタログを引けない（${e.message}）`);
    await sleep(DELAY_MS);
    continue;
  }

  const res = (pkg.resources ?? []).find((x) => /geojson/i.test(x.format));
  if (!res) { console.warn(`  ! ${code}: GeoJSON が無い`); await sleep(DELAY_MS); continue; }

  let gj;
  try {
    const r = await fetch(res.url, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error(String(r.status));
    gj = await r.json();
  } catch (e) {
    console.warn(`  ! ${code}: 取得できない（${e.message}）`);
    await sleep(DELAY_MS);
    continue;
  }

  const rows = [['施設名', '所在地', '緯度', '経度'].map(cell).join(',')];
  for (const ft of gj.features ?? []) {
    const p = ft.properties ?? {};
    const name = p['指定緊急避難場所'] ?? p['名称'] ?? '';
    const addr = p['所在地'] ?? '';
    if (!name || !addr) continue;
    // GeoJSON の座標は [経度, 緯度]
    const [lng, lat] = ft.geometry?.coordinates ?? [];
    rows.push([name, addr, lat ?? '', lng ?? ''].map(cell).join(','));
  }

  writeFileSync(path, rows.join('\n'), 'utf8');
  console.log(`  ${code} ${pkg.title}: ${rows.length - 1} 件`);
  got++;
  await sleep(DELAY_MS);
}

console.log(`指定緊急避難場所: ${got} 県取得 / ${cached} 県キャッシュ済み`);
