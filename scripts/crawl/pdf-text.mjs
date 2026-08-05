/**
 * PDF からテキストを抜く
 *
 *   node scripts/crawl/pdf-text.mjs <file.pdf>
 *
 * 行政の祭り一覧は PDF で公開されていることが多く、しかも権限制限（印刷不可など）が
 * かかっていて普通のビューアでは開けても機械では読みにくい。
 * ユーザーパスワードは空なので、pdfjs にその旨を伝えれば中身は読める。
 *
 * 表形式の PDF なので、y 座標が近いものを同じ行としてまとめて出す。
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const path = process.argv[2];
if (!path) {
  console.error('使い方: node scripts/crawl/pdf-text.mjs <file.pdf>');
  process.exit(1);
}

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

// 日本語の PDF は CID フォントを使うので cMap が要る。渡さないと本文が空になり、
// 見出しだけが取れて「画像 PDF だ」と誤解する（荒川区の区報でそうなった）。
const require = createRequire(import.meta.url);
const pdfjsRoot = dirname(require.resolve('pdfjs-dist/legacy/build/pdf.mjs'));
const url = (p) => `${pathToFileURL(join(pdfjsRoot, '..', '..', p)).href}/`;

const doc = await pdfjs.getDocument({
  data: new Uint8Array(readFileSync(path)),
  password: '', // 権限制限のみでユーザーパスワードは無い
  useSystemFonts: true,
  cMapUrl: url('cmaps'),
  cMapPacked: true,
  standardFontDataUrl: url('standard_fonts'),
}).promise;

for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const content = await page.getTextContent();

  // y 座標でグループ化して行に戻す
  const lines = new Map();
  for (const item of content.items) {
    if (!item.str?.trim()) continue;
    const y = Math.round(item.transform[5]);
    const key = [...lines.keys()].find((k) => Math.abs(k - y) <= 3) ?? y;
    if (!lines.has(key)) lines.set(key, []);
    lines.get(key).push({ x: item.transform[4], s: item.str });
  }

  const out = [...lines.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, items]) => items.sort((a, b) => a.x - b.x).map((i) => i.s).join(' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  console.log(`--- p${p} ---`);
  console.log(out.join('\n'));
}
