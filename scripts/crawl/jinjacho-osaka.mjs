/**
 * 大阪府神社庁の「大阪府内神社の紹介」から、大阪市各区の神社の鎮座地を取る。
 *
 *   node scripts/crawl/jinjacho-osaka.mjs
 *
 * `docs/kanto-plan.md` には大阪府神社庁は「接続不可」と書いてあるが、
 * **ホストが変わっていて `www.osaka-jinjacho.jp` は生きている**。
 * 区ごとに「神社名／通称名／鎮座地」の表があり、鎮座地は町名まで入っている
 * （例: 産土神社 → 此花区島屋）。番地までは無いが、
 * 既存データにも町丁目までの住所は多いので実用になる。
 *
 * ここで取るのは**既に載っている祭りの会場（神社）の住所を埋めるため**で、
 * 新しい祭りは作らない。
 *
 * 作法: 取得済みはディスクに残す。1 リクエストごとに 1.5 秒あける。
 *
 * 出力: data/raw/jinjacho/osaka/<区のローマ字>.json
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'jinjacho', 'osaka');
const BASE = 'https://www.osaka-jinjacho.jp/funai_jinja/';
const DELAY_MS = 1500;
// HTTP ヘッダは ASCII のみ
const UA = 'matsuri-map/0.1 (local festival directory; collecting public shrine locations; polite crawler)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 索引ページから拾った区ページ。増やすときはここに足す
const PAGES = [
  'dai4shibu/asahi-ku/asahi.html', 'dai4shibu/higashiyodogawa-ku/higashiyodogawa.html',
  'dai4shibu/joto-ku/joto.html', 'dai4shibu/miyakojima-ku/miyakojima.html',
  'dai4shibu/tsurumi-ku/tsurumi.html',
  'dai5shibu/fukushima-ku/fukushima.html', 'dai5shibu/kita-ku/kita.html',
  'dai5shibu/nishiyodogawa-ku/nishiyodogawa.html', 'dai5shibu/yodogawa-ku/yodogawa.html',
  'dai7shibu/chuo-ku/chuo.html', 'dai7shibu/higashinari-ku/higashinari.html',
  'dai7shibu/konohana-ku/konohana.html', 'dai7shibu/minato-ku/minato.html',
  'dai7shibu/nishi-ku/nishi.html',
  'dai8shibu/ikuno-ku/ikuno.html', 'dai8shibu/naniwa-ku/naniwa.html',
  'dai8shibu/nishinari-ku/nishinari.html', 'dai8shibu/taisho-ku/taisho.html',
  'dai8shibu/tennoji-ku/tennoji.html',
  'dai9shibu/abeno-ku/abeno.html', 'dai9shibu/higashisumiyoshi-ku/higashisumiyoshi.html',
  'dai9shibu/hirano-ku/hirano.html', 'dai9shibu/suminoe-ku/suminoe.html',
  'dai9shibu/sumiyoshi-ku/sumiyoshi.html',
];

const strip = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * 1 区ページから神社を抜く。表の形は
 *   <TD width="255"><a>神社名<BR>（かな）</a></TD>
 *   <TD width="418">[通称名]<BR>鎮座地</TD>
 * **タグが大文字**なので正規表現には i を付けること（付け忘れて 0 件になった）。
 */
function parse(html) {
  const out = [];
  for (const m of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const tds = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => c[1]);
    if (tds.length < 3) continue;

    // 神社名は「（かな）」の前まで
    const nameCell = strip(tds[1]);
    const name = nameCell.replace(/[（(].*$/, '').trim();
    if (!name || name === '神社名') continue;

    // 鎮座地は最後の行。その前に通称名が入ることがある（○ は加盟の印なので通称ではない）
    const lines = tds[2].split(/<br\s*\/?>/i).map(strip).filter(Boolean);
    const address = lines[lines.length - 1] ?? '';
    const aliasRaw = lines.length > 1 ? lines[lines.length - 2] : '';
    const alias = aliasRaw && aliasRaw !== '○' ? aliasRaw : null;
    if (!/区/.test(address)) continue;

    out.push({ name, alias, address });
  }
  return out;
}

mkdirSync(OUT, { recursive: true });

let got = 0;
let cached = 0;
let total = 0;
for (const page of PAGES) {
  const slug = page.split('/')[1].replace(/-ku$/, '');
  const path = join(OUT, `${slug}.json`);
  if (existsSync(path)) { cached++; continue; }

  let html;
  try {
    const r = await fetch(BASE + page, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error(String(r.status));
    // このサイトは Shift_JIS
    const buf = Buffer.from(await r.arrayBuffer());
    html = new TextDecoder('utf-8', { fatal: false }).decode(buf);
    if (/�/.test(html)) html = new TextDecoder('shift_jis').decode(buf);
  } catch (e) {
    console.warn(`  ! ${slug}: ${e.message}`);
    await sleep(DELAY_MS);
    continue;
  }

  const shrines = parse(html);
  writeFileSync(path, JSON.stringify({ slug, url: BASE + page, shrines }, null, 1), 'utf8');
  console.log(`  ${slug}: ${shrines.length} 社`);
  got++;
  total += shrines.length;
  await sleep(DELAY_MS);
}
console.log(`大阪府神社庁: ${got} 区取得（${total} 社） / ${cached} 区キャッシュ済み`);
