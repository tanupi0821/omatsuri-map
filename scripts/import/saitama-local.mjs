/**
 * 埼玉県の町内会レベルの祭り（地域メディア経由）
 *
 * 出典:
 *  - トリコカワグチ（川口市）「川口市の地域まつり開催情報」
 *    https://trico-kawaguchi.jp/article/event_kawaguchi/98553
 *  - リプロ マヴィ（さいたま市南部）「さいたま市の花火大会・夏祭りまとめ」
 *    https://www.lipro-mavie.com/202506-summerfestival/
 *
 * 神社庁からは神社の例大祭しか取れない。町会・自治会が公園でやる盆踊りは
 * この手の市単位の地域メディアにしか載らない。
 *
 * トリコカワグチは町会名と公園の住所まで書いてあり、川崎の「みやまえご近所さん」、
 * 千葉の「まいぷれ船橋」と同じ型。この型の媒体を市ごとに見つけるのが最短。
 */
import { emit } from './_lib.mjs';

const TRICO = 'https://trico-kawaguchi.jp/article/event_kawaguchi/98553';
const LIPRO = 'https://www.lipro-mavie.com/202506-summerfestival/';

const kawaguchi = (extra) => ({
  city: '川口市', citySlug: 'kawaguchi', source: TRICO,
  sourceName: 'トリコカワグチ（川口市の地域情報サイト）', ...extra,
});
const saitama = (ward, wardSlug, extra) => ({
  city: 'さいたま市', citySlug: 'saitama', ward, wardSlug, source: LIPRO,
  sourceName: 'リプロ マヴィ（さいたま市の地域情報サイト）', ...extra,
});

const ROWS = [
  // ==================== 川口市（町会単位） ====================
  kawaguchi({ slug: 'kisoro-2-natsumatsuri',
    name: '木曽呂第二町会 夏祭り', kind: '夏祭り',
    organizer: '木曽呂第二町会', venue: '木曽呂の郷 こみやま公園', address: '木曽呂981',
    dates: ['2026-07-11'], start: '17:00', end: '19:30' }),

  kawaguchi({ slug: 'dewa-noryo-taikai',
    name: '出羽納涼大会', kind: '納涼祭',
    organizer: '出羽地区', venue: '安行出羽公園', address: '安行出羽4-13', scale: '地区',
    dates: ['2026-07-17', '2026-07-18'], start: '18:00', end: '21:00' }),

  kawaguchi({ slug: 'maekawa-1-bonodori',
    name: '前川第一町会 盆踊り大会', kind: '盆踊り',
    organizer: '前川第一町会', venue: '前川南公園', address: '南前川2-15-2',
    dates: ['2026-07-22', '2026-07-23'], start: '18:30', end: '21:00',
    note: '22日は18:30〜21:00、23日は18:30〜20:00' }),

  kawaguchi({ slug: 'asahi-5-bonodori',
    name: '朝日五丁目町会 納涼盆踊り大会', kind: '盆踊り',
    organizer: '朝日五丁目町会', venue: '朝日東第一公園', address: '朝日5-13-7',
    dates: ['2026-08-01'], start: '18:00', end: '20:30' }),

  kawaguchi({ slug: 'maekawa-3-bonodori',
    name: '前川3丁目町会 納涼盆踊り大会', kind: '盆踊り',
    organizer: '前川3丁目町会', venue: '前川第2公園', address: '前川3-22-2',
    dates: ['2026-08-01', '2026-08-02'], start: '18:30', end: '20:30' }),

  kawaguchi({ slug: 'shimotozuka-bunkasai',
    name: '下戸塚文化祭', kind: '秋祭り',
    organizer: '下戸塚地区', venue: '戸塚中台第二公園', address: '戸塚5-5', scale: '地区',
    dates: ['2026-08-22'], start: '14:00' }),

  kawaguchi({ slug: 'sue3-sai',
    name: '末3祭', kind: '秋祭り',
    organizer: '末広地区', venue: 'ロケット公園', address: '末広3-11', scale: '地区',
    dates: ['2026-09-27'], start: '10:30' }),

  kawaguchi({ slug: 'tsukabara-festival',
    name: 'Tsukabara Festival（ツカバラ フェスティバル）', kind: '秋祭り',
    organizer: '芝塚原地区', venue: '芝塚原第二公園', address: '芝塚原2-12', scale: '地区',
    dates: ['2026-11-22'], start: '11:00', end: '15:00' }),

  // ==================== さいたま市 ====================
  saitama('中央区', 'saitama-chuo', { slug: 'yono-natsumatsuri',
    name: '与野夏祭り', kind: '夏祭り', venue: '与野本町通り周辺', scale: '地区',
    dates: ['2026-07-18', '2026-07-19'], start: '16:00', end: '21:30' }),

  saitama('大宮区', 'omiya', { slug: 'nakasendo-miyahara-matsuri',
    name: '大宮夏まつり 中山道みやはらまつり2026（第35回）', kind: '夏祭り',
    venue: '宮原駅東口周辺', scale: '地区',
    dates: ['2026-07-19'], start: '15:00', end: '21:00' }),

  saitama('南区', 'saitama-minami', { slug: 'urawa-yosakoi',
    name: '浦和まつり 浦和よさこい（第21回）', kind: '夏祭り',
    venue: '南浦和駅東口駅前通り・弁天公園', scale: '地区',
    dates: ['2026-07-19'], start: '10:00', end: '17:30' }),

  saitama('大宮区', 'omiya', { slug: 'hanabi-owada',
    name: 'さいたま市花火大会 大和田公園会場', kind: '花火',
    venue: '大和田公園周辺', scale: '市', tags: ['花火'],
    dates: ['2026-07-25'], start: '19:30' }),

  saitama('浦和区', 'urawa', { slug: 'urawa-matsuri-mikoshi',
    name: '浦和まつり みこし渡御（第46回）', kind: '夏祭り',
    venue: '旧中山道（新浦和橋下〜調神社）', scale: '地区', tags: ['神輿'],
    dates: ['2026-07-26'], start: '14:15', end: '20:30' }),

  saitama('大宮区', 'omiya', { slug: 'omiya-nishiguchi-natsumatsuri',
    name: '大宮夏まつり 西口夏まつり', kind: '夏祭り',
    venue: '大宮駅西口周辺', scale: '地区',
    dates: ['2026-07-31'], start: '17:00', end: '21:00' }),

  saitama('大宮区', 'omiya', { slug: 'spark-carnival',
    name: '大宮夏まつり スパークカーニバル（第39回）', kind: '夏祭り',
    venue: '大宮駅西口周辺', scale: '地区',
    dates: ['2026-08-01'], start: '17:00', end: '22:00' }),

  saitama('大宮区', 'omiya', { slug: 'nakasendo-matsuri',
    name: '大宮夏まつり 中山道まつり2026', kind: '夏祭り',
    venue: '大宮駅東口周辺', scale: '地区',
    dates: ['2026-08-01', '2026-08-02'], start: '17:00', end: '22:00' }),

  saitama('北区', 'saitama-kita', { slug: 'nisshin-tanabata',
    name: '大宮夏まつり 大宮日進七夕まつり2026（第54回）', kind: '夏祭り',
    venue: '日進駅南口周辺', scale: '地区',
    dates: ['2026-08-06', '2026-08-07'], start: '15:00', end: '21:00' }),

  saitama('見沼区', 'minuma', { slug: 'higashiomiya-summer-festival',
    name: '大宮夏まつり 東大宮サマーフェスティバル（第30回）', kind: '盆踊り',
    venue: '東大宮中央公園', scale: '地区',
    dates: ['2026-08-07', '2026-08-08'], start: '16:00', end: '21:30' }),

  saitama('南区', 'saitama-minami', { slug: 'hanabi-omagi',
    name: 'さいたま市花火大会 東浦和大間木公園会場', kind: '花火',
    venue: '大間木公園周辺', scale: '市', tags: ['花火'],
    dates: ['2026-08-08'], start: '19:30' }),

  saitama('西区', 'saitama-nishi', { slug: 'sashiogi-matsuri',
    name: '大宮夏まつり 指扇まつり大会（第54回）', kind: '夏祭り',
    venue: '指扇中学校ほか', scale: '地区',
    dates: ['2026-08-22'], start: '09:30', end: '21:00',
    note: '9:30〜12:00と15:00〜21:00の二部制' }),

  saitama('岩槻区', 'iwatsuki', { slug: 'hanabi-iwatsuki',
    name: 'さいたま市花火大会 岩槻文化公園会場', kind: '花火',
    venue: '岩槻文化公園', scale: '市', tags: ['花火'],
    dates: ['2026-08-22'], start: '19:30' }),

  saitama('浦和区', 'urawa', { slug: 'urawa-odori',
    name: '浦和まつり 音楽パレード（第31回）・浦和おどり（第50回）', kind: '盆踊り',
    venue: '旧中山道周辺', scale: '地区',
    dates: ['2026-09-19'], start: '13:00', end: '19:15' }),

  saitama('浦和区', 'urawa', { slug: 'kitaurawa-awaodori',
    name: '浦和まつり 北浦和阿波おどり（第45回）', kind: '夏祭り',
    venue: '北浦和西口商店街', scale: '地区',
    dates: ['2026-09-26'], start: '13:00', end: '17:00' }),

  saitama('岩槻区', 'iwatsuki', { slug: 'iwatsuki-ningyo-matsuri',
    name: '人形のまち岩槻まつり2026', kind: '秋祭り',
    venue: '岩槻人形博物館駐車場ほか', scale: '地区',
    dates: ['2026-10-04'], start: '14:00', end: '20:30' }),
];

emit(ROWS, {
  pref: '埼玉県',
  prefSlug: 'saitama',
  label: '埼玉県（地域メディア：町内会レベル）',
  sourceType: 'media',
  checkedAt: '2026-08-03',
  year: 2026,
});
