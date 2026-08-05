/**
 * 川崎区インポーター
 *
 * 出典: 稲毛神社（川崎山王社）公式、川崎大師 公式
 *
 * 川崎区は神社・寺が主体。町内会単位の盆踊りはまだ拾えていない。
 */
import { emit } from './_lib.mjs';

const ROWS = [
  { slug: 'kawasaki-sanno-matsuri', name: '川崎山王祭（稲毛神社例大祭）', kind: '例大祭',
    organizer: '稲毛神社', venue: '稲毛神社および市役所通り', address: '宮本町7-7',
    shrine: '稲毛神社', scale: '市',
    dates: ['2026-08-01', '2026-08-02', '2026-08-03'],
    tags: ['神輿', '屋台'],
    note: '8/1 18:00 前夜祭（宵宮）、8/2 10:00 例祭・14:00 古式宮座式・13:00〜16:00頃 町内みこし連合渡御、8/3 6:00〜20:00頃 神幸祭・17:10〜19:00頃 山王ふぇすてぃばる',
    source: 'https://www.takemikatsuchi.net/',
    sourceName: '川崎山王社 稲毛神社' },

  { slug: 'kawasaki-daishi-kodomo-bonodori', name: '川崎大師 子ども盆踊り大会', kind: '盆踊り',
    organizer: '川崎大師 日曜教苑', venue: '川崎大師 薬師殿やすらぎ広場',
    scale: '地区',
    dates: ['2026-08-20', '2026-08-21', '2026-08-22'], start: '19:00', end: '20:30',
    tags: ['子ども向け', '屋台'],
    note: 'どなたでも参加できる',
    source: 'https://www.kawasakidaishi.com/event/aug/',
    sourceName: '川崎大師 公式' },
];

emit(ROWS, {
  pref: '神奈川県', city: '川崎市', ward: '川崎区',
  prefSlug: 'kanagawa', citySlug: 'kawasaki', wardSlug: 'kawasakiku',
  checkedAt: '2026-08-02',
  year: 2026,
});
