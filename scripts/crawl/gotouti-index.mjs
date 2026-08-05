/**
 * 全国ローカルニュースサイト名鑑（news.gotouti.jp）の索引を取る
 *
 *   node scripts/crawl/gotouti-index.mjs
 *
 * 1,886 の地域メディアが 1 記事 1 媒体で登録されている。記事本文が <dl> の
 * 定義リストで、**媒体の URL・行政区域・プラットフォームが構造化されている**。
 *
 *   <dt>URL</dt><dd><a href="https://arura-media.jp/">…</a></dd>
 *   <dt>行政区域</dt><dd>千葉県山武市・千葉県東金市・千葉県山武郡横芝光町</dd>
 *   <dt>プラットフォーム</dt><dd>WordPress</dd>
 *
 * ここが効くのは、**「プラットフォーム: WordPress」で絞れば REST API が
 * 開いている見込みの媒体だけを選べる**ことと、行政区域が県名つきの
 * 市区町村名で書かれていて市区町村判定をこちらで推測しなくてよいこと。
 *
 * 索引そのものは 1 サイトへの 19 リクエストで取り切れる（per_page=100）。
 *
 * 出力: data/raw/gotouti/index.json
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'gotouti');
const UA = 'matsuri-map/0.1 (local festival directory; polite crawler)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const dec = (s) =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();

/** <dl><dt>ラベル</dt><dd>値</dd>… を Map にする */
function defList(html) {
  const m = html.match(/<dl>([\s\S]*?)<\/dl>/);
  if (!m) return null;
  const out = new Map();
  const re = /<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g;
  let x;
  while ((x = re.exec(m[1]))) {
    const key = dec(x[1]);
    // URL 欄はリンク先そのものが欲しいので href を優先で見る
    const href = (x[2].match(/href="([^"]+)"/) ?? [])[1];
    out.set(key, { text: dec(x[2]), href });
  }
  return out;
}

mkdirSync(OUT, { recursive: true });
const path = join(OUT, 'index.json');

/**
 * 1 窓ぶん取る。**相手は本文が重いと PHP のエラー HTML を 200 で返す**ので、
 * JSON でなければ窓を半分に割って取り直す。
 * ページ番号ではなく offset で数えるのは、この割り直しをするため。
 */
async function fetchWindow(offset, count, depth = 0) {
  const url = `https://news.gotouti.jp/wp-json/wp/v2/posts?per_page=${count}&offset=${offset}`
    + '&_fields=id,link,title,content&orderby=id&order=asc';
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  await sleep(1400);
  const rows = r.ok ? await r.json().catch(() => null) : null;
  if (Array.isArray(rows)) return rows;
  if (count <= 1 || depth > 4) {
    console.warn(`  offset ${offset} (${count}) を諦めた`);
    return [];
  }
  const half = Math.ceil(count / 2);
  return [
    ...(await fetchWindow(offset, half, depth + 1)),
    ...(await fetchWindow(offset + half, count - half, depth + 1)),
  ];
}

// 総数はヘッダから取る（本文を返させないよう _fields=id で軽くする）
const head = await fetch('https://news.gotouti.jp/wp-json/wp/v2/posts?per_page=1&_fields=id', {
  headers: { 'User-Agent': UA },
});
const total = Number(head.headers.get('x-wp-total') ?? 0);
console.log(`総数 ${total}`);
await sleep(1400);

const items = [];
const STEP = 20;
for (let offset = 0; offset < total; offset += STEP) {
  for (const p of await fetchWindow(offset, STEP)) {
    const dl = defList(p.content?.rendered ?? '');
    if (!dl) continue;
    const site = dl.get('URL');
    if (!site?.href) continue;
    items.push({
      name: dec(p.title?.rendered ?? ''),
      url: site.href,
      // 「千葉県山武市・千葉県東金市」のように県名つきで並ぶ
      areas: (dl.get('行政区域')?.text ?? '').split(/[・、,]/).map((s) => s.trim()).filter(Boolean),
      platform: dl.get('プラットフォーム')?.text ?? '',
      operator: dl.get('運営者')?.text ?? '',
      operatorType: dl.get('運営者類型')?.text ?? '',
      freq: dl.get('更新頻度')?.text ?? '',
      indexUrl: p.link,
    });
  }
  if (offset % 200 === 0) console.log(`${offset}/${total}: ${items.length} 媒体`);
  // 途中で落ちても成果が消えないよう、こまめに書く
  writeFileSync(path, JSON.stringify({ items }, null, 1), 'utf8');
}

writeFileSync(path, JSON.stringify({ items }, null, 1), 'utf8');
console.log(`完了: ${items.length} 媒体 → ${path}`);

const byPlat = new Map();
for (const i of items) byPlat.set(i.platform, (byPlat.get(i.platform) ?? 0) + 1);
console.log([...byPlat].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k || '(空)'}: ${v}`).join(' / '));
