/**
 * 出典の格（source_type）が入っていない開催回を、出典 URL のドメインから機械的に埋める。
 *
 *   node scripts/enrich/backfill-source-type.mjs
 *
 * すでに source_type が入っているものには触らない（手で裏を取った結果を潰さないため）。
 * 分類できないドメインは media 扱いにせず、警告を出して未設定のままにする。
 * 「よく分からないから真ん中」にしてしまうと、格上げの進捗が見えなくなるから。
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// 神社・寺・町内会・実行委員会など、主催者そのものが出している情報
const OFFICIAL = [
  'kanagawa-jinja.or.jp', 'takemikatsuchi.net', 'kotohirajinja.com', 'mizonokuchijinjya.org',
  'takaishijinja.com', 'takatsu-suwa.jp', 'sugiyamajinja.or.jp', 'izumi-sugajinja.jp',
  'honmoku.or.jp', 'kannai-matsuri.jp', 'shinyokohama.info', 'kashimada-chonaikai.net',
  'nagasawa-jichikai.org', 'hananodai.localinfo.jp', 'kawasakidaishi.com', 'sojiji.jp',
  'pacifico.co.jp',
];
// 行政・行政が運営しているもの
const GOV = [
  'city.kawasaki.jp', 'city.yokohama.lg.jp', 'miyamae-gokinjosan.com',
  'kawasaki-shiminplaza.jp', 'k-kankou.jp', 'yokohama-kanazawakanko.com',
];
// 地域メディア・地域情報サイト
const MEDIA = [
  'goguynet.jp', 'townnews.co.jp', 'mutsuki.yokohama', 'asahi-sanpo.com',
  'note.com', 'page.yokohama', 'tsurumi-watchers.com', 'voyvoi.com',
];
// 全国規模のイベントまとめ
const AGGREGATOR = ['kanagawa-sumai-labo.com', 'rarea.events', 'matsuri-no-hi.com', 'walkerplus.com'];

function classify(url) {
  if (!url) return null;
  const has = (list) => list.some((d) => url.includes(d));
  if (has(OFFICIAL)) return 'official';
  if (has(GOV)) return 'gov';
  if (has(MEDIA)) return 'media';
  if (has(AGGREGATOR)) return 'aggregator';
  return null;
}

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (e.endsWith('.yml')) out.push(p);
  }
  return out;
}

let filled = 0;
let kept = 0;
const unknown = new Set();

for (const path of walk(join(ROOT, 'data', 'festivals'))) {
  const f = parse(readFileSync(path, 'utf8'));
  let changed = false;

  for (const o of f.occurrences ?? []) {
    if (o.source_type) {
      kept++;
      continue;
    }
    const t = classify(o.source_url);
    if (t) {
      o.source_type = t;
      filled++;
      changed = true;
    } else {
      unknown.add(new URL(o.source_url).hostname);
    }
  }

  if (changed) writeFileSync(path, stringify(f, { lineWidth: 0 }), 'utf8');
}

console.log(`出典の格: ${filled} 件を補完 / ${kept} 件は設定済みのため据え置き`);
for (const host of unknown) console.warn(`  ! 分類できないドメイン: ${host}（このファイルのリストに足す）`);
