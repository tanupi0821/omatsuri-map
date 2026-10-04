import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadFestivals } from './src/lib/data.js';

/**
 * sitemap の `lastmod`（そのページを最後に直した日）。
 *
 * **Google がクロールの順番を決めるのに実際に使うと明言している唯一の項目**
 * （`priority` と `changefreq` は見ないと公言している）。入れていなかったので、
 * 14,354 本の URL が「いつ変わったか分からないもの」として並んでいた。
 * 秋の祭りを 8,600 件足したのに「検出 - インデックス未登録」が 1 万件で
 * 止まっているのは、ここで新しさを示せていないことも効いている。
 *
 * 値は**出典を最後に確かめた日**（occurrences の checked_at）。嘘の更新日を
 * 入れると Google は lastmod 自体を信用しなくなるので、毎回のビルド日ではなく
 * 中身が本当に変わった日を使う。根拠を出せないページ（運営者情報など）には付けない。
 */
let lastmods = null;
function lastmodIndex() {
  if (lastmods) return lastmods;
  const m = new Map();
  const bump = (key, day) => {
    const cur = m.get(key);
    if (!cur || day > cur) m.set(key, day);
  };
  for (const f of loadFestivals()) {
    const day = (f.occurrences ?? [])
      .map((o) => o.checked_at)
      .filter(Boolean)
      .sort()
      .pop();
    if (!day) continue;
    bump(`/f/${f.id}/`, day);
    bump(`/a/${f._prefSlug}/${f._citySlug}/`, day);
    bump(`/a/${f._prefSlug}/`, day);
    bump('/', day);
  }
  // 読み物は全部ビルド時にデータから数字を出しているので、データ全体の最終確認日
  const all = m.get('/');
  if (all) for (const g of ['/guides/']) bump(g, all);
  lastmods = m;
  return m;
}

// 全国展開したときも構成は変えず、data/ 配下が増えるだけにする。
export default defineConfig({
  // 公開先の URL。**ここを直せば sitemap・canonical・OGP がすべて追従する**。
  // 環境変数 SITE_URL があればそちらを使う（Cloudflare Pages などで差し替えられる）。
  site: process.env.SITE_URL ?? 'https://omatsuri-map.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  // ページが 4700 を超えた。検索側に見つけてもらうには sitemap が要る。
  // 祭りの詳細ページより、エリアのページを先に巡回してほしい。
  integrations: [
    sitemap({
      serialize(item) {
        const path = new URL(item.url).pathname;
        const depth = path.split('/').filter(Boolean).length;
        item.priority = depth === 0 ? 1.0 : path.startsWith('/a/') ? 0.8 : 0.5;
        item.changefreq = 'weekly';
        // 末尾の / の有無どちらでも引けるようにする。
        // **URL は日本語を %E8%9B%87… に変えて持つ**ので、戻してから引く
        // （「蛇池神社万灯流し大祭」のような id の 129 件が外れていた）
        const decoded = decodeURIComponent(path);
        const key = decoded.endsWith('/') ? decoded : `${decoded}/`;
        const index = lastmodIndex();
        const day = index.get(key) ?? (key.startsWith('/guides/') ? index.get('/guides/') : null);
        if (day) item.lastmod = new Date(`${day}T00:00:00Z`).toISOString();
        return item;
      },
    }),
  ],
});
