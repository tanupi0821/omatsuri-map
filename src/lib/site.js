/**
 * サイトの設定。**公開前に直すのはこのファイルだけ**でよいようにする。
 *
 * 公開先の URL は astro.config.mjs の `site`（環境変数 SITE_URL で上書き可）。
 */

/** 誤りの指摘を受け取る窓口。空にすると連絡先の行が出なくなる */
export const CONTACT = {
  // Cloudflare Email Routing で作って普段のメールに転送する
  email: 'info@omatsuri-map.com',
  // 予備の窓口。X のアカウントなど。無ければ空でよい
  url: '',
  urlLabel: '',
};

export const SITE_NAME = 'お祭りマップ';
export const TAGLINE = '全国｜町内会の盆踊りまで';
