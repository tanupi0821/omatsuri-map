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

/**
 * 広告の設定。**審査に通って ID をもらってから埋める**。
 *
 * `adsense` が空のあいだは広告のコードを一切出さない。
 * プライバシーポリシーの広告の節も出ない（使っていないことを書くと嘘になる）。
 *
 * 手順:
 *   1. https://www.google.com/adsense/ でサイトを登録する
 *   2. 「サイトにコードを追加」で出る `ca-pub-XXXXXXXXXXXXXXXX` を client に入れる
 *   3. 広告ユニットを作り、その `data-ad-slot` の数字を slot に入れる
 *   4. AdSense が出す ads.txt の 1 行を adsTxt に貼る
 */
export const ADS = {
  /** ca-pub-… を入れると広告が出る。空なら何も出さない */
  adsense: '',
  /** 記事下に出す広告ユニットの slot 番号 */
  slot: '',
  /** AdSense の管理画面に出る ads.txt の 1 行をそのまま */
  adsTxt: '',
};
