/**
 * 号外NET 由来の祭りが「版の県」と違う県に置かれていないか点検する
 *
 *   node scripts/audit-goguynet-pref.mjs
 *
 * 市区町村名は県をまたいで重複する（府中市は東京都と広島県、太田市と大田区）。
 * 取り込みが県を取り違えると、**同じ市区町村名の別の県**にレコードができる。
 * 出典 URL のサブドメイン（`tokyofuchu.goguynet.jp`）から版が分かるので、
 * 版の県と `area.pref` を突き合わせれば見つかる。
 *
 * `祭りの id は <市の slug>-<出典の id>` なので、こうなると
 * **id が全国で重複して validate が落ちる**（fuchu-goguynet-32700 が 2 つ）。
 *
 * 書き換えはしない。直すのは `fix-goguynet-pref.mjs`。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ROOT } from './import/_lib.mjs';
import { PREFS } from './lib/prefs.mjs';

const PREF_NAMES = new Set(PREFS.map((x) => x.name));

const areaMeta = new Map(
  JSON.parse(readFileSync(join(ROOT, 'data', 'raw', 'goguynet', '_areas.json'), 'utf8')),
);

/** 複数県をまたぐ版は `import/goguynet.mjs` の AREA_PREF と同じ扱いにする */
const MULTI = /・/;

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.yml')) out.push(p);
  }
  return out;
}

const rows = [];
for (const p of walk(join(ROOT, 'data', 'festivals'))) {
  if (!/-goguynet-\d+\.yml$/.test(p)) continue;
  const f = parse(readFileSync(p, 'utf8'));
  const url = f.occurrences?.[0]?.source_url ?? '';
  const host = (url.match(/^https?:\/\/([^.]+)\.goguynet\.jp/) ?? [])[1];
  if (!host) continue;
  const meta = areaMeta.get(host);
  if (!meta) continue;
  // 見出しが複数県をまとめている版と、県ではなく地方名（「四国」）の版は
  // ここでは判定しない。県は `import/goguynet.mjs` の AREA_PREF が決めている
  if (MULTI.test(meta.pref) || !PREF_NAMES.has(meta.pref)) continue;
  if (f.area?.pref === meta.pref) continue;
  rows.push({ path: p, id: f.id, name: f.name, has: f.area?.pref, want: meta.pref, city: f.area?.city, host });
}

for (const r of rows) console.log(`  ${r.has} → ${r.want}（版 ${r.host}）: ${r.city} / ${r.name}`);
console.log(`\n版の県と違う県に置かれている: ${rows.length} 件`);
