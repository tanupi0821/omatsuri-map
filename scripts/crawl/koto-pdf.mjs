/**
 * 江東区「盆踊り・夏まつり開催情報」PDF → JSON
 *
 *   node scripts/crawl/koto-pdf.mjs
 *
 * 区が町会・自治会単位で出している一覧。**イベント名称・実施団体・実施日・
 * 実施時間・実施会場・住所**の 6 欄が揃っていて、行政の一次情報としては最上級。
 * 葛飾区の PDF と並んで、住所まで入っているのはここだけ。
 *
 * `pdf-text.mjs` は y 座標だけで行に均すので、**日付が 2 行に折り返す行が壊れる**:
 *
 *   8月7日（金） 江東公園
 *   5 千田町会 納涼盆踊り大会 千田町会 19:00～12:00 千田16-5
 *   8月8日（土） （扇橋二丁目バス停前）
 *
 * そこで x 座標も使い、**見出し行の位置から列の境界を決めて**セルに割り戻す。
 * 行の切れ目は NO 欄の数字の y の中点にする（罫線は取れないため）。
 *
 * 出力: data/raw/koto/bonodori-<年>.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'koto');
const UA = 'matsuri-map/0.1 (local festival directory; polite crawler)';

const SRC = 'https://www.city.koto.lg.jp/101010/kurashi/komyunitei/chokai/jichikai/bonnodorinatsumatsuri/documents/20260708073059.pdf';
const PAGE = 'https://www.city.koto.lg.jp/101010/kurashi/komyunitei/chokai/jichikai/bonnodorinatsumatsuri/index.html';

mkdirSync(OUT, { recursive: true });
const pdfPath = join(OUT, 'bonodori-2026.pdf');
if (!existsSync(pdfPath)) {
  const r = await fetch(SRC, { headers: { 'User-Agent': UA } });
  if (!r.ok) { console.error(`PDF が取れない: ${r.status}`); process.exit(1); }
  writeFileSync(pdfPath, Buffer.from(await r.arrayBuffer()));
  console.log('PDF を取得');
}

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
const require = createRequire(import.meta.url);
const pdfjsRoot = dirname(require.resolve('pdfjs-dist/legacy/build/pdf.mjs'));
const u = (p) => `${pathToFileURL(join(pdfjsRoot, '..', '..', p)).href}/`;

const doc = await pdfjs.getDocument({
  data: new Uint8Array(readFileSync(pdfPath)),
  password: '',
  useSystemFonts: true,
  cMapUrl: u('cmaps'),
  cMapPacked: true,
  standardFontDataUrl: u('standard_fonts'),
}).promise;

/** 見出しの並び。x 座標を読んで列の境界にする */
const HEAD = ['NO', 'イベント名称', '実施団体', '実施日', '実施時間', '実施会場', '住所'];

const rows = [];
for (let p = 1; p <= doc.numPages; p++) {
  const page = await doc.getPage(p);
  const items = (await page.getTextContent()).items
    .filter((i) => i.str?.trim())
    .map((i) => ({ x: i.transform[4], y: i.transform[5], w: i.width ?? 0, s: i.str.trim() }));
  if (!items.length) continue;

  // --- 列の境界を見出しから決める ---
  const heads = [];
  for (const h of HEAD) {
    const hit = items.find((i) => i.s === h);
    if (hit) heads.push({ h, x: hit.x, y: hit.y });
  }
  if (heads.length < 5) { console.warn(`p${p}: 見出しが見つからない。飛ばす`); continue; }
  heads.sort((a, b) => a.x - b.x);
  const headY = heads[0].y;
  const body = items.filter((i) => i.y < headY - 2);

  /**
   * 列の境界は見出しの左端の中点でよい……が、**NO 欄だけは幅が狭く**、
   * 見出し「NO」と「イベント名称」の中点を取ると名称の本文（左寄せ）が
   * NO 側に落ちて、名称欄が丸ごと空になる。
   * NO 欄は中身が数字だけなので、**数字の右端**から境界を引く。
   */
  const nos = body
    .filter((i) => i.x < heads[1].x - 20 && /^\d{1,3}$/.test(i.s))
    .sort((a, b) => b.y - a.y);
  if (!nos.length) continue;
  const noRight = Math.max(...nos.map((i) => i.x + (i.w ?? 0)));

  const bounds = heads.map((h, i) => (i === 0 ? -Infinity
    : i === 1 ? noRight + 5
      : (heads[i - 1].x + h.x) / 2));
  const colOf = (x) => {
    let c = 0;
    for (let i = 1; i < bounds.length; i++) if (x >= bounds[i]) c = i;
    return c;
  };

  /**
   * 行の切れ目。NO の y の中点で割ると、**3 行に折り返したセルの最後の行**が
   * 次の行に食われる（「納涼こども花火まつ」で切れて「り」が落ちた）。
   * 2 つの NO の間で **y の間隔がいちばん空くところ**を境界にする。
   * 表の行間は行内の行送りより広いので、そこが本当の切れ目。
   */
  const ys = [...new Set(body.map((i) => Math.round(i.y)))].sort((a, b) => b - a);
  // 行内の行送り（中央値）。これより明らかに広いところだけを行の切れ目とみなす
  const spacings = ys.slice(0, -1).map((y, i) => y - ys[i + 1]).sort((a, b) => a - b);
  const median = spacings[Math.floor(spacings.length / 2)] || 12;
  const splitBetween = (yUpper, yLower) => {
    const mid = (yUpper + yLower) / 2;
    const inner = ys.filter((y) => y <= yUpper && y >= yLower);
    // 行送りより広い隙間の中で、**中点にいちばん近いもの**を選ぶ。
    // 単に最大の隙間を採ると、セル内の余白を行の切れ目と誤ってしまう
    let best = null; let dist = Infinity;
    for (let i = 0; i + 1 < inner.length; i++) {
      const g = inner[i] - inner[i + 1];
      if (g < median * 1.3) continue;
      const c = (inner[i] + inner[i + 1]) / 2;
      if (Math.abs(c - mid) < dist) { dist = Math.abs(c - mid); best = c; }
    }
    return best ?? mid;
  };

  for (let k = 0; k < nos.length; k++) {
    const top = k === 0 ? Infinity : splitBetween(nos[k - 1].y, nos[k].y);
    const bottom = k === nos.length - 1 ? -Infinity : splitBetween(nos[k].y, nos[k + 1].y);
    const cells = HEAD.map(() => []);
    for (const it of body) {
      if (it.y >= top || it.y < bottom) continue;
      cells[colOf(it.x)].push(it);
    }
    // セルの中は上から下、同じ行なら左から右
    const text = cells.map((cs) => cs
      .sort((a, b) => (Math.abs(a.y - b.y) <= 3 ? a.x - b.x : b.y - a.y))
      .map((c) => c.s).join(' ').replace(/\s+/g, ' ').trim());
    rows.push({
      no: Number(nos[k].s),
      name: text[1] ?? '',
      organizer: text[2] ?? '',
      dates: text[3] ?? '',
      time: text[4] ?? '',
      venue: text[5] ?? '',
      address: text[6] ?? '',
    });
  }
}

writeFileSync(join(OUT, 'bonodori-2026.json'), JSON.stringify({ source: PAGE, pdf: SRC, rows }, null, 1), 'utf8');
console.log(`${rows.length} 行`);
for (const r of rows.slice(0, 40)) {
  console.log(`${r.no} | ${r.name} | ${r.organizer} | ${r.dates} | ${r.time} | ${r.venue} | ${r.address}`);
}
