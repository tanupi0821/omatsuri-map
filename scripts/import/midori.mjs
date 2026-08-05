/**
 * 緑区インポーター
 *
 * 出典: 号外NET 横浜市緑区・青葉区
 *       「【2026年最新】横浜市緑区の夏祭り・盆踊り・秋祭り日程まとめ」
 *       https://yokohamamidori-aoba.goguynet.jp/2026/07/18/midoriku-summer-festival/
 */
import { emit } from './_lib.mjs';

const ROWS = [
  { slug: 'takeyama-danchi-bonodori', name: '竹山団地盆踊り＆花火大会（第55回）', kind: '盆踊り',
    venue: '竹山中央商店街周辺・竹山池周辺', scale: '地区',
    dates: ['2026-07-19'], start: '11:00', tags: ['花火'],
    note: '花火は19:30頃から予定' },

  { slug: 'kamoi-bonodori', name: '鴨居納涼盆踊り大会', kind: '盆踊り',
    organizer: '鴨居連合自治会・鴨居商栄会', venue: '鴨居小学校 校庭', scale: '地区',
    dates: ['2026-07-24', '2026-07-25'], start: '18:00' },

  { slug: 'nakayama-shotengai-bonodori', name: '中山商店街協同組合 大盆踊り大会', kind: '盆踊り',
    organizer: '中山商店街協同組合', venue: '中山駅南口・中山商店街第一駐車場', scale: '地区',
    dates: ['2026-07-25'], start: '17:00', end: '21:00',
    note: '盆踊りは18:00〜21:00' },

  { slug: 'nakayamacho-bonodori', name: '中山町 盆踊り大会', kind: '盆踊り',
    venue: '中山自治会館 中庭',
    dates: ['2026-07-30', '2026-07-31'], start: '19:00', end: '21:00' },

  { slug: 'nagatsuta-shotengai-bonodori', name: '長津田商店街 納涼盆踊り大会', kind: '盆踊り',
    organizer: '長津田商店街協同組合', venue: '大林寺 山水閣広場', scale: '地区',
    dates: ['2026-08-23'], start: '18:00', end: '21:00' },

  { slug: 'nakayamacho-matsuri', name: '中山町まつり（宵宮・本宮）', kind: '秋祭り',
    venue: '中山自治会館',
    dates: ['2026-10-03', '2026-10-04'], start: '16:00', end: '21:00' },

  { slug: 'hachiman-jinja-reitaisai', name: '八幡神社 例大祭', kind: '例大祭',
    venue: '八幡神社', address: '台村町563', shrine: '八幡神社',
    dates: ['2026-10-16'] },

  { slug: 'midori-kumin-matsuri', name: '緑区民まつり2026 〜緑と森のフェスティバル〜', kind: '区民祭',
    venue: '県立四季の森公園', scale: '区',
    dates: ['2026-10-18'], start: '10:00', end: '15:00', tags: ['昼開催'] },

  { slug: 'nakayama-matsuri', name: '中山まつり（第45回）', kind: '秋祭り',
    venue: '中山駅南口ロータリー・商店街駐車場・商店街通り', scale: '地区',
    dates: ['2026-11-03'], start: '09:15', end: '16:00' },
];

emit(ROWS, {
  pref: '神奈川県', city: '横浜市', ward: '緑区',
  prefSlug: 'kanagawa', citySlug: 'yokohama', wardSlug: 'midori',
  source: 'https://yokohamamidori-aoba.goguynet.jp/2026/07/18/midoriku-summer-festival/',
  sourceName: '号外NET 横浜市緑区・青葉区',
  checkedAt: '2026-08-02',
  year: 2026,
});
