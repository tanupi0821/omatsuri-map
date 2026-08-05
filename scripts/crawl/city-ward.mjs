/**
 * 政令市の区が出す「区内の夏祭り・盆踊り一覧」を取ってくる
 *
 *   node scripts/crawl/city-ward.mjs
 *
 * 東京の足立区・江戸川区・葛飾区と同じ型が、大阪市・名古屋市にもあった。
 * **区（名古屋は学区）が町会レベルの一覧を作っている**。
 *
 * ただし**ページの URL は区ごとにばらばら**で規則から導けない。
 * 検索で見つけたものを PAGES に足していく。列の並びも区ごとに違うので、
 * 取り込み側（import/city-ward.mjs）で吸収する。
 *
 * 出力: data/raw/city-ward/<key>.html
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'city-ward');
const DELAY_MS = 2000;
const UA = 'matsuri-map/0.1 (local festival directory; polite crawler)';

export const PAGES = {
  // --- 大阪市。robots.txt は無い ---
  'osaka-nishiyodogawa': {
    pref: '大阪府',
    city: '大阪市西淀川区',
    url: 'https://www.city.osaka.lg.jp/nishiyodogawa/page/0000678487.html',
  },
  'osaka-konohana': {
    pref: '大阪府',
    city: '大阪市此花区',
    url: 'https://www.city.osaka.lg.jp/konohana/page/0000654633.html',
  },
  'osaka-sumiyoshi': {
    pref: '大阪府',
    city: '大阪市住吉区',
    url: 'https://www.city.osaka.lg.jp/sumiyoshi/page/0000471216.html',
  },
  // --- 名古屋市。robots.txt は /cgi-bin/ のみ禁止 ---
  'nagoya-meito': {
    pref: '愛知県',
    city: '名古屋市名東区',
    url: 'https://www.city.nagoya.jp/meito/kosodate/1025302/1025306/1036338.html',
  },
  // --- 千葉市。robots.txt は SEO 系ボットのみ禁止 ---
  'chiba-mihama': {
    pref: '千葉県',
    city: '千葉市美浜区',
    url: 'https://www.city.chiba.jp/mihama/chiikizukuri/tiikiibento_08.html',
  },
  // --- 北九州市。robots.txt は /soutatsu/ のみ禁止 ---
  'kitakyushu-yahatanishi': {
    pref: '福岡県',
    city: '北九州市八幡西区',
    url: 'https://www.city.kitakyushu.lg.jp/yahatanishi/w6200022.html',
  },
  'kitakyushu-moji': {
    pref: '福岡県',
    city: '北九州市門司区',
    url: 'https://www.city.kitakyushu.lg.jp/moji/w1100129.html',
  },
  // --- 堺市。robots.txt が無い＝制限なし ---
  // 1 ページに令和6・7・8年度が同居し、日程欄に年が無い。
  // 「校区防災訓練」の表も混ざるので取り込み側で弾く
  'sakai-minami': {
    pref: '大阪府',
    city: '堺市南区',
    url: 'https://www.city.sakai.lg.jp/minami/shokaimiryoku/chiiki/event.html',
  },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (process.argv[1]?.endsWith('city-ward.mjs')) {
  mkdirSync(OUT, { recursive: true });
  for (const [key, { url, city }] of Object.entries(PAGES)) {
    const path = join(OUT, `${key}.html`);
    if (existsSync(path)) { console.log(`${city}: キャッシュ済み`); continue; }
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!r.ok) { console.warn(`${city}: ${r.status}`); continue; }
    writeFileSync(path, await r.text(), 'utf8');
    console.log(`${city}: 取得`);
    await sleep(DELAY_MS);
  }
  console.log('完了');
}
