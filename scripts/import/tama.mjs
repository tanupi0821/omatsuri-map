/**
 * 多摩区インポーター
 *
 * 出典: 号外NET 川崎市多摩区（週末ごとの夏祭りまとめ記事）
 *       https://kawasakitama.goguynet.jp/
 *
 * 多摩区は行政の一覧がないので、地域メディアの記事から日時・場所・主催を拾っている。
 * 記事は週末ごとに出るため、夏のあいだは毎週このインポーターを更新する運用になる。
 */
import { emit } from './_lib.mjs';

const S1 = 'https://kawasakitama.goguynet.jp/2026/07/16/natsumatsuri2026_1/';
const S2 = 'https://kawasakitama.goguynet.jp/2026/07/23/natsumatsuri72526/';
const S3 = 'https://kawasakitama.goguynet.jp/2026/07/29/natsumatsuri2026-3/';
const S4 = 'https://kawasakitama.goguynet.jp/2026/08/01/post-52706/';

const ROWS = [
  { slug: 'minkaen-dori-natsumatsuri', name: '民家園通り商店会 夏まつり（第26回）', kind: '商店街',
    organizer: '民家園通り商店会', venue: '民家園通り商店会（向ヶ丘遊園駅周辺）',
    dates: ['2026-07-18'], start: '14:00', end: '20:15', scale: '地区', source: S1 },

  { slug: 'yakumo-jinja-natsumatsuri', name: '八雲神社 夏まつり', kind: '夏祭り',
    organizer: null, venue: '八雲神社（稲田堤）', shrine: '八雲神社',
    dates: ['2026-07-18', '2026-07-19'], start: '10:00', end: '21:30', scale: '地区', source: S1 },

  { slug: 'karigane-dai-noryokai', name: 'かりがね台自治会 納涼会', kind: '納涼祭',
    organizer: 'かりがね台自治会', venue: '生田広場（特別養護老人ホーム）',
    dates: ['2026-07-18'], start: '16:00', end: '18:30', source: S1 },

  { slug: 'shiroshita-kodomo-mikoshi', name: '城下子ども会 夏祭り（子ども神輿）', kind: '夏祭り',
    organizer: '城下子ども会', venue: '城下神酒所', address: '菅城下19-1前',
    dates: ['2026-07-18', '2026-07-19'], start: '12:20', end: null,
    tags: ['神輿', '子ども向け'], note: '18日は12:20〜、19日は9:00〜', source: S1 },

  { slug: 'kuriya-noryo-bonodori', name: '栗谷納涼盆踊り（第52回）', kind: '盆踊り',
    organizer: null, venue: '須賀神社 境内・下境内、錦が丘南公園', shrine: '須賀神社',
    dates: ['2026-07-25', '2026-07-26'], start: '18:30', end: '20:45', scale: '地区', source: S2 },

  { slug: 'daisaku-noryo-bonodori', name: '大作納涼盆踊り大会', kind: '盆踊り',
    organizer: null, venue: '杉山神社 境内', shrine: '杉山神社',
    dates: ['2026-07-25', '2026-07-26'], start: '18:00', end: '20:30', source: S2 },

  { slug: 'daiwa-bonodori', name: '台和町会 盆踊り大会', kind: '盆踊り',
    organizer: '台和町会', venue: '登戸小学校 グラウンド',
    dates: ['2026-07-25', '2026-07-26'], start: '19:00', end: '21:00', source: S2 },

  { slug: 'shukugawara-bonodori', name: '宿河原町会 盆踊り', kind: '盆踊り',
    organizer: '宿河原町会', venue: '稲田小学校 校庭',
    dates: ['2026-07-31', '2026-08-01'], start: '18:30', end: '20:30', source: S3 },

  { slug: 'noborito-chubu-bonodori', name: '登戸中部町会 納涼盆踊り大会', kind: '盆踊り',
    organizer: '登戸中部町会', venue: '丸山幼稚園 園庭',
    dates: ['2026-08-01', '2026-08-02'], start: '19:00', end: '21:00', source: S3 },

  { slug: 'seki-bonodori', name: '納涼 堰盆踊り', kind: '盆踊り',
    organizer: null, venue: '堰稲荷神社', shrine: '堰稲荷神社',
    dates: ['2026-08-01', '2026-08-02'], start: '19:00', end: '21:00',
    note: '踊りは19:00頃から', source: S3 },

  { slug: 'tsuchibuchi-natsumatsuri', name: '土渕自治会 夏祭り', kind: '夏祭り',
    organizer: '土渕自治会', venue: 'Ankerフロンタウン生田 多目的広場',
    dates: ['2026-08-01'], start: '16:30', end: '20:30',
    tags: ['屋台', '盆踊り'], note: '雨天時は8月2日に延期', source: S4 },
];

emit(ROWS, {
  pref: '神奈川県', city: '川崎市', ward: '多摩区',
  prefSlug: 'kanagawa', citySlug: 'kawasaki', wardSlug: 'tama',
  sourceName: '号外NET 川崎市多摩区',
  checkedAt: '2026-08-02',
  year: 2026,
});
