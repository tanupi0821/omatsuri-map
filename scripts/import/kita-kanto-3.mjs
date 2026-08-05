/**
 * 北関東の追加分（高崎市の支所別の祭り、栃木の花火）
 *
 * 出典:
 *  - デジタル広報高崎「高崎まつりと地域のお祭りを紹介」
 *    https://www.city.takasaki.gunma.jp/site/digital/44456.html
 *  - フラットローカル（栃木・群馬・茨城のイベント情報）
 *    https://www.flat-local.jp/event/
 *
 * 高崎の記事は曜日が 2024 年と一致するため **令和6年の記事**。
 * 2026 年として入れると誤情報になるので year: 2024 で入れ、
 * サイト側では「2024年の情報です／2026年は未確認」と出るようにしている。
 * 支所が毎年やっている行事なので「例年この時期」という情報としては生きる。
 */
import { emit } from './_lib.mjs';

const TAKASAKI = 'https://www.city.takasaki.gunma.jp/site/digital/44456.html';
const FLAT = 'https://www.flat-local.jp/event/';

const ROWS = [
  // ---- 高崎市（2024年の記事） ----
  { pref: '群馬県', prefSlug: 'gunma', city: '高崎市', citySlug: 'takasaki',
    slug: 'haruna-furusato-matsuri',
    name: '榛名ふるさと祭り・商工祭花火大会', kind: '夏祭り',
    organizer: '榛名支所産業観光課', venue: '烏川公園・多目的グラウンド', address: '下室田町',
    scale: '地区', tags: ['花火'],
    dates: ['2024-08-15'], start: '19:30', end: '21:00', year: 2024,
    recurrence: '8月15日',
    recurrenceSource: TAKASAKI,
    note: '2024年（令和6年）の記事。2026年の日程は未確認',
    source: TAKASAKI, sourceName: 'デジタル広報高崎', sourceType: 'gov' },

  { pref: '群馬県', prefSlug: 'gunma', city: '高崎市', citySlug: 'takasaki',
    slug: 'shinmachi-furusato-matsuri',
    name: '新町ふるさと祭り（花火大会・灯ろう流し・盆踊り大会）', kind: '夏祭り',
    organizer: '新町商工会・新町支所地域振興課', venue: '烏川総合グラウンド・温井川河畔',
    address: '新町', scale: '地区', tags: ['花火', '灯籠流し', '盆踊り'],
    dates: ['2024-08-16'], start: '18:00', end: '21:00', year: 2024,
    recurrence: '8月16日',
    recurrenceSource: TAKASAKI,
    note: '2024年（令和6年）の記事。2026年の日程は未確認',
    source: TAKASAKI, sourceName: 'デジタル広報高崎', sourceType: 'gov' },

  { pref: '群馬県', prefSlug: 'gunma', city: '高崎市', citySlug: 'takasaki',
    slug: 'yoshii-furusato-gion',
    name: '吉井ふるさと祇園祭り', kind: '夏祭り',
    organizer: '吉井支所産業課', venue: '文化会館周辺', address: '吉井町吉井', scale: '地区',
    dates: ['2024-08-17'], start: '13:30', end: '20:00', year: 2024,
    recurrence: '8月17日',
    recurrenceSource: TAKASAKI,
    note: '2024年（令和6年）の記事。2026年の日程は未確認',
    source: TAKASAKI, sourceName: 'デジタル広報高崎', sourceType: 'gov' },

  { pref: '群馬県', prefSlug: 'gunma', city: '高崎市', citySlug: 'takasaki',
    slug: 'haniwa-no-sato-natsumatsuri',
    name: 'ぐんま「はにわの里」夏まつり', kind: '夏祭り',
    organizer: '群馬支所産業課', venue: '上毛野はにわの里公園', address: '井出町・保渡田町',
    scale: '地区',
    dates: ['2024-08-18'], start: '13:00', end: '20:00', year: 2024,
    recurrence: '8月18日',
    recurrenceSource: TAKASAKI,
    note: '2024年（令和6年）の記事。2026年の日程は未確認',
    source: TAKASAKI, sourceName: 'デジタル広報高崎', sourceType: 'gov' },

  // ---- 栃木市・日光市（2026年） ----
  { pref: '栃木県', prefSlug: 'tochigi', city: '栃木市', citySlug: 'tochigi-shi',
    slug: 'watarase-yusuichi-hanabi',
    name: '渡良瀬遊水地花火大会（第4回）', kind: '花火',
    venue: '渡良瀬遊水地', address: '藤岡', scale: '市', tags: ['花火'],
    dates: ['2026-10-24'], start: '12:00',
    note: '花火の打ち上げは19:15から',
    source: FLAT, sourceName: 'フラットローカル', sourceType: 'media' },

  { pref: '栃木県', prefSlug: 'tochigi', city: '日光市', citySlug: 'nikko',
    slug: 'kinugawa-hyakka-ryoran-hanabi',
    name: '百華繚乱花火〜鬼怒川焔火〜', kind: '花火',
    venue: '鬼怒川温泉', scale: '市', tags: ['花火'],
    dates: ['2026-08-01', '2026-10-10'], start: '20:45',
    note: '8/1〜10/10のうち計15日間。掲載の2日付は期間の初日と最終日',
    source: FLAT, sourceName: 'フラットローカル', sourceType: 'media' },
];

const byPref = new Map();
for (const r of ROWS) {
  if (!byPref.has(r.prefSlug)) byPref.set(r.prefSlug, []);
  byPref.get(r.prefSlug).push(r);
}
for (const [prefSlug, list] of byPref) {
  emit(list, {
    pref: list[0].pref,
    prefSlug,
    label: `${list[0].pref}（追加分）`,
    checkedAt: '2026-08-03',
    year: 2026,
  });
}
