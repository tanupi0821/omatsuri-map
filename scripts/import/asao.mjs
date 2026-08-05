/**
 * 麻生区インポーター
 *
 * 出典: 柿生隠者「【川崎市麻生区】今年も盆踊り三昧！『2026年夏祭り』私のお薦め6会場」(note)
 *       https://note.com/kakio_ja/n/n1bd9616420fc
 *
 * 麻生区は町内会の夏祭り日程がまとまって公開される数少ない区。
 * ただし出典は個人の記事なので、主催者の告知で裏を取れたものから source を差し替えていく。
 */
import { emit } from './_lib.mjs';

const SRC = 'https://note.com/kakio_ja/n/n1bd9616420fc';

const ROWS = [
  { slug: 'kamiasao-higashi-bonodori', name: '上麻生東町内会 納涼盆踊り大会', kind: '盆踊り',
    organizer: '上麻生東町内会', venue: '麻生水処理センター グラウンド', station: '柿生',
    dates: ['2026-07-18'], start: '16:00',
    links: ['https://voyvoi.com/event/kamiasao-higashi-cool-breeze-dance-festival/'] },

  { slug: 'chiyogaoka-natsumatsuri', name: 'ちよがおかなつまつり', kind: '夏祭り',
    organizer: '千代ヶ丘4町内会', venue: '千代ヶ丘小学校', scale: '地区',
    dates: ['2026-07-18'], start: '16:00' },

  { slug: 'okagami-nishi-bonodori', name: '岡上西町会 納涼大会盆踊り', kind: '盆踊り',
    organizer: '岡上西町会', venue: '和光大学 第二グラウンド', station: '鶴川',
    dates: ['2026-07-25'], start: '18:00' },

  { slug: 'gorikida-festa', name: '五力田フェスタ', kind: '夏祭り',
    organizer: '五力田町内会', venue: '白鳥保育園',
    dates: ['2026-07-25'], start: '16:00' },

  { slug: 'kakio-ekimae-noryosai', name: '柿生駅前町内会 納涼祭', kind: '納涼祭',
    organizer: '柿生駅前町内会', venue: 'JAセレサ柿生 駐車場',
    dates: ['2026-07-25'], start: '17:30' },

  { slug: 'lions-garden-yurigaoka-natsumatsuri', name: 'ライオンズガーデン百合ヶ丘 夏祭・花火大会', kind: '夏祭り',
    organizer: 'ライオンズガーデン百合ヶ丘自治会', venue: 'ライオンズガーデン百合ヶ丘 敷地内公園・多目的広場',
    dates: ['2026-07-26'], start: '17:00', tags: ['花火'],
    note: '雨天等の場合は集会場' },

  { slug: 'mycity-shinyuri-natsumatsuri', name: 'マイシティ新ゆり町内会 夏まつり', kind: '夏祭り',
    organizer: 'マイシティ新ゆり町内会', venue: '麻生小学校', station: '新百合ヶ丘',
    dates: ['2026-08-01'], start: '16:30' },

  { slug: 'manpukuji-bonodori', name: '万福寺町内会 夏祭り盆踊り大会', kind: '盆踊り',
    organizer: '万福寺町内会', venue: '万福寺おやしろ公園',
    dates: ['2026-08-01'], start: '16:00' },

  { slug: 'takaishi-natsumatsuri', name: '高石町会 夏まつり', kind: '夏祭り',
    organizer: '高石町会', venue: '高石神社', shrine: '高石神社',
    dates: ['2026-08-01'], start: '16:00' },

  { slug: 'okagami-noryo-natsumatsuri', name: '岡上町内会 納涼夏祭り', kind: '夏祭り',
    organizer: '岡上町内会', venue: '岡上小学校',
    dates: ['2026-08-01'], start: '17:00' },

  { slug: 'shinpukuji-bonodori', name: '真福寺町内会 盆踊り大会', kind: '盆踊り',
    organizer: '真福寺町内会', venue: '白山神社', shrine: '白山神社',
    dates: ['2026-08-01'], start: '17:00' },

  { slug: 'higashiyurigaoka-bonodori', name: '東百合丘町会 納涼盆踊り大会', kind: '盆踊り',
    organizer: '東百合丘町会', venue: '東百合丘町内会館',
    dates: ['2026-08-01'], start: '17:00' },

  { slug: 'katahira-bonodori', name: '片平町内会 夏祭り納涼盆踊り大会', kind: '盆踊り',
    organizer: '片平町内会', venue: '片平小学校',
    dates: ['2026-08-01'], start: '17:30' },

  { slug: 'hayano-noryosai', name: '早野町会 納涼祭', kind: '納涼祭',
    organizer: '早野町会', venue: '子ノ神社', shrine: '子ノ神社',
    dates: ['2026-08-01'], start: '18:00' },

  { slug: 'ozenji-noryosai', name: '王禅寺町会 納涼祭', kind: '納涼祭',
    organizer: '王禅寺町会', venue: '琴平神社 駐車場', shrine: '琴平神社',
    dates: ['2026-08-01'], start: '18:00' },

  { slug: 'haruhino-natsufes', name: 'はるひ野夏フェス', kind: '夏祭り',
    organizer: 'はるひ野町内会', venue: 'はるひ野小中学校', station: 'はるひ野',
    dates: ['2026-08-15'], start: '16:00' },

  { slug: 'yamaguchidai-natsumatsuri', name: '山口台夏まつり', kind: '夏祭り',
    organizer: '山口台自治会', venue: '麻生中学校', station: '新百合ヶ丘',
    dates: ['2026-08-15'], start: '17:00' },

  { slug: 'hakusan-noryosai', name: '白山納涼祭', kind: '納涼祭',
    organizer: 'グリーンタウン連絡協議会', venue: '日本映画大学 白山キャンパス',
    station: '柿生・新百合ヶ丘', scale: '地区',
    dates: ['2026-08-22', '2026-08-23'], start: '16:00' },

  { slug: 'mizukigai-noryomatsuri', name: 'みずき街納涼まつり', kind: '納涼祭',
    organizer: '百合ヶ丘みずき街自治会', venue: '百合ヶ丘みずき街集会所',
    dates: ['2026-08-22'], start: '17:00' },
];

emit(ROWS, {
  pref: '神奈川県', city: '川崎市', ward: '麻生区',
  prefSlug: 'kanagawa', citySlug: 'kawasaki', wardSlug: 'asao',
  source: SRC,
  sourceName: '柿生隠者（note）',
  checkedAt: '2026-08-02',
  year: 2026,
});
