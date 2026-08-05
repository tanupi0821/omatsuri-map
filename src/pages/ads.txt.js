/**
 * ads.txt
 *
 * 広告枠が自分のものであることを示すファイル。**これが無いと AdSense の
 * 管理画面に警告が出て、配信単価が下がる**。
 * 中身は AdSense の管理画面が出す 1 行をそのまま `site.js` に入れる。
 */
import { ADS } from '../lib/site.js';

export function GET() {
  // 未設定のうちは 404 にする。空ファイルを置くと「不備あり」と判定される
  if (!ADS.adsTxt) return new Response('Not Found', { status: 404 });
  return new Response(`${ADS.adsTxt}\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
