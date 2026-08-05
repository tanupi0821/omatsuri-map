/**
 * 「◯◯つーしん」系の地域メディアから祭りの記事を集める
 *
 *   node scripts/crawl/tsushin.mjs [--only nishi2]
 *
 * 西日本に散在するファミリー（枚方が本家、西宮・住吉・芦屋などが派生）。
 * WordPress の REST API が開いていて、号外NET と同じ手が使える。
 *
 * **この系統が優れているのは住所と屋台の書き方**:
 *
 *   納涼盆踊り大会 – 六湛寺公園
 *   時間 ：18:00〜20:40
 *   夜店 ：17:00〜19:30
 *   住所は兵庫県西宮市六湛寺町7-25 六湛寺公園です。
 *
 * 会場名を地の文から推測せずに**住所を直接取れる**。屋台も「夜店：」の
 * ラベル付きなので、本文全体から推測しなくてよい。
 *
 * 注意: `search` を無視して全記事を返す媒体が実在する（ふーぽ・まいにち
 * みちこ等）。**必ず無意味語で 0 件が返ることを確かめてから足すこと。**
 * ここに載せた媒体は確認済み。
 *
 * 出力: data/raw/tsushin/<key>.json
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { strip } from '../import/_article.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'data', 'raw', 'tsushin');
const UA = 'matsuri-map/0.1 (local festival directory; polite crawler)';

/** 媒体。robots.txt と Content-Signal に AI 向けの制限が無いことを確認済み */
export const SITES = {
  nishi2: { host: 'nishi2.jp', name: '西宮つーしん', pref: '兵庫県', cities: ['西宮市'] },
  sumi2: {
    host: 'sumi2.jp',
    name: '大阪住吉つーしん',
    pref: '大阪府',
    cities: ['大阪市住吉区', '大阪市東住吉区', '大阪市住之江区', '大阪市阿倍野区'],
  },
  hira2: { host: 'www.hira2.jp', name: '枚方つーしん', pref: '大阪府', cities: ['枚方市'] },
  ashi2: { host: 'ashi2.jp', name: '芦屋つーしん', pref: '兵庫県', cities: ['芦屋市'] },
  sakainews: {
    host: 'sakai-news.jp',
    name: 'さかにゅー',
    pref: '大阪府',
    cities: ['堺市', '和泉市', '泉大津市', '岸和田市', '高石市'],
  },
  shigamamma: { host: 'news.p-mom.net', name: 'シガマンマ', pref: '滋賀県', cities: null },
  akashi: { host: 'akashi-journal.com', name: '明石じゃーなる', pref: '兵庫県', cities: ['明石市'] },
  himeji: { host: 'budou-chan.jp', name: '姫路の種', pref: '兵庫県', cities: ['姫路市'] },
  higashinada: {
    host: 'higashinada-journal.com',
    name: '東灘ジャーナル',
    pref: '兵庫県',
    cities: ['神戸市東灘区'],
  },
  hakodate: {
    host: 'hakodate-event.com',
    name: '函館イベント情報局',
    pref: '北海道',
    cities: ['函館市'],
  },
  kurume: { host: 'kurumefan.com', name: '久留米ファン', pref: '福岡県', cities: ['久留米市'] },
  // Googlebot に Crawl-delay: 5 を宣言している。* には無いが合わせる
  higashihiroshima: {
    host: 'www.higashihiroshima-digital.com',
    name: '東広島デジタル',
    pref: '広島県',
    cities: ['東広島市'],
    delayMs: 5000,
  },
};

const TERMS = ['盆踊り', '夏祭り', '夏まつり', '縁日', '納涼', '例大祭', '秋祭り'];
const DEFAULT_DELAY = 1600;

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > 0 ? process.argv[i + 1] : d;
};
const ONLY = arg('--only', null);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, attempt = 0) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (r.ok) return { rows: await r.json(), pages: Number(r.headers.get('x-wp-totalpages') ?? 1) };
  if (attempt === 0 && [429, 503].includes(r.status)) {
    await sleep(30000);
    return get(url, 1);
  }
  throw new Error(String(r.status));
}

/**
 * `search` が効いているか確かめる。無意味語で件数が返る媒体があり、
 * それに気づかず取り込むと全記事を祭りとして扱ってしまう。
 */
async function searchWorks(host) {
  const r = await fetch(`https://${host}/wp-json/wp/v2/posts?per_page=1&search=zzzqqqxxx`, {
    headers: { 'User-Agent': UA },
  });
  if (!r.ok) return false;
  return Number(r.headers.get('x-wp-total') ?? -1) === 0;
}

mkdirSync(OUT, { recursive: true });

for (const [key, site] of Object.entries(SITES)) {
  if (ONLY && key !== ONLY) continue;
  const path = join(OUT, `${key}.json`);
  const prev = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
  const done = new Set(prev?.terms ?? []);
  const todo = TERMS.filter((t) => !done.has(t));
  if (prev && !todo.length) { console.log(`${site.name}: 取得済み`); continue; }

  const delay = site.delayMs ?? DEFAULT_DELAY;
  if (!(await searchWorks(site.host))) {
    console.warn(`${site.name}: search が効いていない（無意味語で件数が返る）。飛ばす`);
    continue;
  }
  await sleep(delay);

  const posts = new Map((prev?.items ?? []).map((x) => [x.id, x]));
  for (const term of todo) {
    let page = 1; let pages = 1;
    do {
      const url = `https://${site.host}/wp-json/wp/v2/posts`
        + `?per_page=50&page=${page}&search=${encodeURIComponent(term)}`
        + '&after=2026-04-01T00:00:00';
      let res;
      try {
        res = await get(url);
      } catch (e) {
        console.warn(`  ${site.name} ${term} p${page}: ${e.message}`);
        break;
      }
      pages = res.pages;
      for (const p of res.rows) {
        posts.set(p.id, {
          id: p.id,
          title: strip(p.title?.rendered),
          date: p.date?.slice(0, 10) ?? null,
          url: p.link,
          body: strip(p.content?.rendered).slice(0, 4000),
        });
      }
      await sleep(delay);
      page++;
    } while (page <= pages && page <= 5);
  }

  writeFileSync(path, JSON.stringify({ site: key, terms: TERMS, items: [...posts.values()] }, null, 1), 'utf8');
  console.log(`${site.name}: ${posts.size} 記事`);
}
console.log('完了');
