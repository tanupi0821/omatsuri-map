/**
 * 榛名ふるさと祭りを2026年の日程に更新する
 *
 *   node scripts/enrich/haruna-2026.mjs
 *
 * デジタル広報高崎の記事は令和6年（2024年）のもので、そのままでは
 * 「2024年の情報です」としか出せなかった。花火大会のデータベースに
 * 2026年の日程（8/15）と屋台ありが載っていたので更新する。
 */
import { patchAll } from '../import/_lib.mjs';

patchAll([
  ['takasaki-haruna-furusato-matsuri', {
    name: '榛名ふるさと祭り・商工祭花火大会（第43回）',
    stalls: 'yes',
    venue: { name: '烏川公園' },
    occurrence: {
      year: 2026,
      dates: ['2026-08-15'],
      start_time: '19:30',
      end_time: '21:00',
      status: 'confirmed',
      note: '花火の打ち上げは19:30〜21:00。屋台あり',
      source_url: 'https://hanabi.walkerplus.com/list/ar0310/yatai/',
      source_name: '花火大会2026（ウォーカープラス）',
      source_type: 'aggregator',
      checked_at: '2026-08-03',
    },
  }],
], '榛名ふるさと祭りを2026年の日程に更新');
