/**
 * 金沢区インポーター
 *
 * 出典: 横浜金沢観光協会「2026横浜金沢の夏祭り」
 *       https://yokohama-kanazawakanko.com/2026/07/01/202607event202/
 *
 * 金沢区は神社の例大祭が中心。観光協会が宵宮と例大祭の日程をまとめて出しているので、
 * 1 神社 = 1 祭りとして宵宮＋例大祭の 2 日をまとめて持つ。
 */
import { emit } from './_lib.mjs';

const YOIMIYA = '初日が宵宮、翌日が例大祭';

const ROWS = [
  { slug: 'nojima-inari-reitaisai', name: '野島稲荷神社 例大祭', kind: '例大祭',
    venue: '野島稲荷神社', address: '野島町23-1', shrine: '野島稲荷神社', scale: '地区',
    dates: ['2026-07-11', '2026-07-12'], note: YOIMIYA },

  { slug: 'susaki-jinja-reitaisai', name: '洲崎神社 例大祭', kind: '例大祭',
    venue: '洲崎神社', address: '洲崎町9-28', shrine: '洲崎神社', scale: '地区',
    dates: ['2026-07-11', '2026-07-12'], note: YOIMIYA },

  { slug: 'machiya-jinja-reitaisai', name: '町屋神社 例大祭', kind: '例大祭',
    venue: '町屋神社', address: '町屋町4-20', shrine: '町屋神社', scale: '地区',
    dates: ['2026-07-18', '2026-07-19'], note: YOIMIYA },

  { slug: 'tego-jinja-reitaisai', name: '手子神社 例大祭', kind: '例大祭',
    venue: '手子神社', address: '釜利谷南1-1-8', shrine: '手子神社', scale: '地区',
    dates: ['2026-07-18', '2026-07-19'], note: YOIMIYA },

  { slug: 'hachiman-jinja-reitaisai', name: '八幡神社 例大祭', kind: '例大祭',
    venue: '八幡神社', address: '寺前1-10-19', shrine: '八幡神社', scale: '地区',
    dates: ['2026-07-18', '2026-07-19'], note: YOIMIYA },

  { slug: 'kumano-jinja-reitaisai', name: '熊野神社 例大祭', kind: '例大祭',
    venue: '熊野神社', address: '柴町41', shrine: '熊野神社', scale: '地区',
    dates: ['2026-07-25', '2026-07-26'], note: YOIMIYA },

  { slug: 'toro-nagashi', name: '灯篭流し', kind: '夏祭り',
    organizer: '安立寺', venue: '金沢漁港', scale: '地区',
    dates: ['2026-08-16'], start: '18:00', tags: ['灯籠流し'],
    note: '18:00頃から' },

  { slug: 'sengen-jinja-reitaisai', name: '浅間神社 例大祭', kind: '例大祭',
    venue: '浅間神社', address: '谷津町432', shrine: '浅間神社', scale: '地区',
    dates: ['2026-09-05', '2026-09-06'], note: YOIMIYA },
];

emit(ROWS, {
  pref: '神奈川県', city: '横浜市', ward: '金沢区',
  prefSlug: 'kanagawa', citySlug: 'yokohama', wardSlug: 'kanazawa',
  source: 'https://yokohama-kanazawakanko.com/2026/07/01/202607event202/',
  sourceName: '横浜金沢観光協会',
  checkedAt: '2026-08-02',
  year: 2026,
});
