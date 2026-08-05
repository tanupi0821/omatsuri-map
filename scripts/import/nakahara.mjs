/**
 * 中原区インポーター
 *
 * 出典: タウンニュース 中原区版（個別記事）
 *
 * 中原区は一覧を出している媒体がなく、タウンニュースが個別に記事にしたものを
 * 1件ずつ拾っている。取りこぼしが多い区なので、情報提供フォームの効果が
 * いちばん大きく出るはず。
 */
import { emit } from './_lib.mjs';

const ROWS = [
  { slug: 'tamagawa-bon-odori', name: '玉川地区BONおどり', kind: '盆踊り',
    organizer: '玉川地区子どもイベント実行委員会', venue: '中丸子神明大神 境内',
    address: '中丸子492', shrine: '神明大神', scale: '地区',
    dates: ['2026-07-18', '2026-07-19'], start: '17:00',
    tags: ['子ども向け', '屋台'],
    source: 'https://www.townnews.co.jp/0204/2026/07/24/845952.html',
    sourceName: 'タウンニュース 中原区版' },

  { slug: 'maruko-tamagawa-dai-bonodori', name: '丸子多摩川大盆おどり', kind: '盆踊り',
    organizer: '丸子多摩川大盆おどり実行委員会', venue: '丸子橋 河川敷広場',
    scale: '地区',
    dates: ['2026-07-18', '2026-07-19'],
    source: 'https://www.townnews.co.jp/0204/2026/07/31/846869.html',
    sourceName: 'タウンニュース 中原区版' },

  { slug: 'shinjo-jinja-bonodori', name: '新城神社 納涼盆踊り大会', kind: '盆踊り',
    organizer: null, venue: '新城神社', address: '新城中町', shrine: '新城神社',
    scale: '地区',
    dates: ['2026-08-01', '2026-08-02'], start: '18:30', end: '21:30',
    source: 'https://www.townnews.co.jp/0204/2026/07/24/845965.html',
    sourceName: 'タウンニュース 中原区版' },
];

emit(ROWS, {
  pref: '神奈川県', city: '川崎市', ward: '中原区',
  prefSlug: 'kanagawa', citySlug: 'kawasaki', wardSlug: 'nakahara',
  checkedAt: '2026-08-02',
  year: 2026,
});
