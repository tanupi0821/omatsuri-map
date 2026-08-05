import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

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
        return item;
      },
    }),
  ],
});
