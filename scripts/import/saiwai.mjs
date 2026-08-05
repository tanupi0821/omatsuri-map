/**
 * 幸区インポーター
 *
 * 出典: 鹿島田町内会 公式サイト
 *
 * 幸区は川崎市で最も情報が出ていない区。区役所は区民祭しか告知しておらず、
 * 町内会が個別にサイトを持っているケースを拾うしかない。
 * まずは 2025 年の実績だけでも置いておき、2026 年の情報が出たら足す。
 */
import { emit } from './_lib.mjs';

const ROWS = [
  { slug: 'kashimada-bonodori', name: '鹿島田町内会 納涼盆踊り大会', kind: '盆踊り',
    organizer: '鹿島田町内会', venue: '鹿島大神', shrine: '鹿島大神',
    dates: ['2025-07-18', '2025-07-19'], start: '18:00', end: '20:30',
    year: 2025, tags: ['屋台'],
    note: '出店は17:30から。2025年の日程',
    source: 'https://kashimada-chonaikai.net/Blog/151316.html',
    sourceName: '鹿島田町内会 公式サイト' },
];

emit(ROWS, {
  pref: '神奈川県', city: '川崎市', ward: '幸区',
  prefSlug: 'kanagawa', citySlug: 'kawasaki', wardSlug: 'saiwai',
  checkedAt: '2026-08-02',
  year: 2026,
});
