/**
 * 神社の公式サイト・神奈川県神社庁からの直接収集
 *
 * まとめサイトには載らない例大祭を、一次情報から直接拾う。
 * 神奈川県神社庁（https://www.kanagawa-jinja.or.jp/）は県内全神社の「例祭日」を
 * ルールの形（10月第1日曜日、9月15日に近い日曜日、など）で公開していて、
 * 横浜市776社・川崎市266社ぶんある。ここは掘りきれていない鉱脈。
 *
 * 日付をルールから機械的に導いたものは status: estimated にしてある
 * （神社が今年の日程として発表したわけではないので）。
 */
import { emit } from './_lib.mjs';

const JINJACHO = (id) => `https://www.kanagawa-jinja.or.jp/shrine/${id}/`;

const ROWS = [
  // --- 高津区 ---
  { ward: '高津区', wardSlug: 'takatsu', slug: 'mizonokuchi-jinja-reitaisai',
    name: '溝口神社 例大祭', kind: '例大祭',
    organizer: '溝口神社', venue: '溝口神社', address: '溝口2-25-1',
    shrine: '溝口神社', scale: '地区', tags: ['神輿', '屋台'],
    recurrence: '9月15日に近い日曜日',
    recurrenceSource: JINJACHO('1201059-000'),
    dates: ['2025-09-13', '2025-09-14'], year: 2025,
    note: '9/13 17:00 宵宮祭、18:00過ぎ マジックショー、19:00 抽選会。9/14 9:00 例祭、11:00 本社宮神輿 宮出し、18:40頃 宮入り。開門6:00／閉門21:00。2025年の日程',
    source: 'http://mizonokuchijinjya.org/reisai.html',
    sourceName: '溝口神社 公式', sourceType: 'official' },

  // --- 麻生区 ---
  { ward: '麻生区', wardSlug: 'asao', slug: 'kotohira-jinja-reitaisai',
    name: '武州柿生 琴平神社 例大祭', kind: '例大祭',
    organizer: '琴平神社', venue: '琴平神社', address: '王禅寺東5-46-15',
    shrine: '琴平神社', scale: '地区', tags: ['神輿', '子ども向け'],
    recurrence: 'スポーツの日（10月第2月曜日）',
    recurrenceSource: 'https://kotohirajinja.com/ritual',
    dates: ['2026-10-12'], status: 'estimated',
    note: '本殿祭儀、こども神輿、演芸会、浦安の舞奉納。日付は公式の「スポーツの日」という記載から導いたもので、神社が2026年の日程として発表したものではない',
    source: 'https://kotohirajinja.com/ritual',
    sourceName: '武州柿生 琴平神社 公式', sourceType: 'official' },

  // --- 中原区 ---
  { ward: '中原区', wardSlug: 'nakahara', slug: 'shinjo-jinja-reitaisai',
    name: '新城神社 例大祭（神幸祭）', kind: '例大祭',
    organizer: '新城神社', venue: '新城神社', address: '新城中町4-14',
    shrine: '新城神社', scale: '地区', tags: ['神輿'],
    recurrence: '10月第1日曜日',
    recurrenceSource: JINJACHO('1201044-000'),
    dates: ['2026-10-04'], status: 'estimated',
    note: '日付は神社庁の「10月第1日曜日」という例祭日から導いたもので、神社が2026年の日程として発表したものではない',
    source: JINJACHO('1201044-000'),
    sourceName: '神奈川県神社庁', sourceType: 'official' },

  { ward: '中原区', wardSlug: 'nakahara', slug: 'shinjo-jinja-harumatsuri',
    name: '新城神社 春祭り（例祭）', kind: '例大祭',
    organizer: '新城神社', venue: '新城神社', address: '新城中町4-14',
    shrine: '新城神社', scale: '地区',
    recurrence: '3月20日',
    recurrenceSource: JINJACHO('1201044-000'),
    dates: ['2026-03-20'], status: 'estimated',
    note: '日付は神社庁の例祭日（3月20日）から。神社が2026年の日程として発表したものではない',
    source: JINJACHO('1201044-000'),
    sourceName: '神奈川県神社庁', sourceType: 'official' },
];

emit(ROWS, {
  pref: '神奈川県', city: '川崎市',
  prefSlug: 'kanagawa', citySlug: 'kawasaki',
  label: '神社の一次情報（川崎市）',
  checkedAt: '2026-08-02',
  year: 2026,
});
