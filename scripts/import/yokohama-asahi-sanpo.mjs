/**
 * 横浜市 広域インポーター
 *
 * 出典: あさひさんぽ「【2026年夏】横浜市内の夏祭り・縁日まとめ」
 *       https://asahi-sanpo.com/yokohama-natsumatsuri-2026/
 *
 * 横浜市には行政の町内会祭り一覧が存在しない。この記事が市内を横断して
 * 随時更新される唯一のまとめなので、まずここを土台にする。
 * 区ごとの取りこぼしは各区のインポーターで足していく。
 */
import { emit } from './_lib.mjs';

const W = {
  tsurumi: '鶴見区', kanagawa: '神奈川区', nishi: '西区', naka: '中区',
  minami: '南区', hodogaya: '保土ケ谷区', asahi: '旭区', isogo: '磯子区',
  kohoku: '港北区', totsuka: '戸塚区', sakae: '栄区', seya: '瀬谷区',
};
const w = (slug) => ({ wardSlug: slug, ward: W[slug] });

const ROWS = [
  { ...w('minami'), slug: 'gyokusenji-yochien-natsumatsuri', name: '夏祭り at 玉泉寺幼稚園', kind: '夏祭り',
    venue: '玉泉寺幼稚園 園庭', dates: ['2026-07-31', '2026-08-01'],
    note: '7/31は前夜祭18:00〜20:00、8/1は夏祭り16:00〜19:00' },

  { ...w('isogo'), slug: 'softtown-negishi-bonodori', name: 'ソフトタウン根岸 盆踊り大会', kind: '盆踊り',
    venue: '東急根岸駅前広場', dates: ['2026-07-31'], start: '17:30' },

  { ...w('isogo'), slug: 'isogodai-2-natsumatsuri', name: '磯子台第2公園 夏祭り', kind: '夏祭り',
    organizer: 'レインボー自治会・山王台自治会・千代田自治会', venue: '磯子台第2公園',
    dates: ['2026-08-01'], start: '13:30', end: '20:30', scale: '地区' },

  { ...w('isogo'), slug: 'hitorizawa-natsumatsuri', name: '氷取沢公園 夏祭り', kind: '夏祭り',
    organizer: '磯子台パークハイツ自治会ほか', venue: '氷取沢公園',
    dates: ['2026-08-01'], start: '15:00', end: '20:30' },

  { ...w('isogo'), slug: 'sugita-nagasaku-natsumatsuri', name: '杉田長作町内会 夏祭り', kind: '夏祭り',
    organizer: '杉田長作町内会', venue: '杉田長作公園',
    dates: ['2026-08-01'], start: '16:00', end: '19:00' },

  { ...w('isogo'), slug: 'morinan-noryosai', name: '森南町内会 納涼祭', kind: '納涼祭',
    organizer: '森南町内会', venue: '森6丁目公園',
    dates: ['2026-08-02'], start: '18:00', end: '20:00' },

  { ...w('isogo'), slug: 'tanaka-bonodori', name: '田中町内会 夏の盆踊り大会', kind: '盆踊り',
    organizer: '田中町内会', venue: '左右手公園',
    dates: ['2026-08-02'], start: '18:00', end: '20:00' },

  { ...w('seya'), slug: 'ichodori-natsumatsuri', name: '瀬谷いちょう通り商店会 夏祭', kind: '商店街',
    organizer: '瀬谷いちょう通り商店会', venue: '横浜信用金庫 駐車場',
    dates: ['2026-08-02'], start: '11:00', end: '18:00', scale: '地区' },

  { ...w('naka'), slug: 'honmoku-omanagashi', name: '本牧和田 お馬流し祭り', kind: '例大祭',
    venue: '本牧神社 周辺', shrine: '本牧神社', scale: '地区',
    dates: ['2026-07-31', '2026-08-01', '2026-08-02'] },

  { ...w('seya'), slug: 'shirahime-matsuri', name: '白姫まつり', kind: '夏祭り',
    venue: '三ツ境駅南口周辺・白姫神社・三ツ境第三公園', shrine: '白姫神社', scale: '地区',
    dates: ['2026-08-01', '2026-08-02'] },

  { ...w('isogo'), slug: 'hie-daijin-natsumatsuri', name: '日枝大神 夏祭り', kind: '夏祭り',
    venue: '日枝大神', shrine: '日枝大神', scale: '地区',
    dates: ['2026-08-01', '2026-08-02'], start: '16:00', end: '21:00', tags: ['屋台'],
    note: '屋台16:00〜21:00、催事は1日17:00〜20:30／2日18:00〜20:30' },

  { ...w('tsurumi'), slug: 'tsukuno-shotengai-natsumatsuri', name: 'つくの商店街 夏祭り', kind: '商店街',
    organizer: 'レアールつくの商店街', venue: 'つくの商店街 アーケード内', scale: '地区',
    dates: ['2026-08-01', '2026-08-02'], note: '夕暮れスタート' },

  { ...w('seya'), slug: 'seya-2-furusato-matsuri', name: '瀬谷第二地区 ふるさと祭り', kind: '夏祭り',
    venue: '瀬谷第二小学校 校庭', scale: '地区',
    dates: ['2026-08-01'], start: '15:00', end: '20:00' },

  { ...w('totsuka'), slug: 'tomizuka-hachimangu-reitaisai', name: '富塚八幡宮 例大祭', kind: '例大祭',
    venue: '富塚八幡宮および周辺', shrine: '富塚八幡宮', scale: '地区',
    dates: ['2026-08-01', '2026-08-02'], tags: ['神輿'],
    note: '8/1は宵宮、8/2は例大祭・神輿渡御' },

  { ...w('minami'), slug: 'miharudai-noryokai', name: '三春台 納涼会', kind: '納涼祭',
    venue: '大光院', dates: ['2026-08-05'], start: '17:00', end: '19:30',
    note: '時間は予定' },

  { ...w('isogo'), slug: 'takigashira-fureai-bonodori', name: '滝頭ふれあい盆踊り大会', kind: '盆踊り',
    venue: '滝頭二丁目公園 多目的広場', scale: '地区',
    dates: ['2026-08-06', '2026-08-07'], start: '18:30', end: '20:30' },

  { ...w('totsuka'), slug: 'yoshida-bonodori', name: '吉田町内会 盆踊り大会', kind: '盆踊り',
    organizer: '戸塚駅東口ラピス商店会・吉田町内会', venue: '戸塚駅東口 ラピス商店会 遊歩スクエア',
    dates: ['2026-08-07', '2026-08-08'], start: '18:00', end: '21:00', tags: ['屋台'] },

  { ...w('kohoku'), slug: 'minowasho-oyaji-natsumatsuri', name: '箕輪小 おやじ夏祭り', kind: '夏祭り',
    organizer: '箕輪小学校区', venue: 'プラウドシティの広場',
    dates: ['2026-08-08'], start: '16:00', end: '18:00', tags: ['子ども向け'] },

  { ...w('isogo'), slug: 'maruyama-1-natsumatsuri', name: '丸山第一町内会 夏祭り', kind: '夏祭り',
    organizer: '丸山第一町内会', venue: '丸山第一町内会はらっぱ',
    dates: ['2026-08-08', '2026-08-09'], start: '18:30', end: '20:30' },

  { ...w('kohoku'), slug: 'tsunashima-bonodori', name: '綱島盆踊り大会（第14回）', kind: '盆踊り',
    organizer: '綱島地区', venue: '綱島小学校 校庭', scale: '地区',
    dates: ['2026-08-08', '2026-08-09'], start: '17:00', end: '20:00' },

  { ...w('sakae'), slug: 'ekibon', name: 'エキボン（第4回）', kind: '盆踊り',
    venue: '本郷台駅前広場', scale: '地区',
    dates: ['2026-08-11'], start: '15:00', end: '20:00' },

  { ...w('naka'), slug: 'basegate-bonodori', name: 'BASEGATE盆踊り', kind: '盆踊り',
    venue: 'BASEGATE横浜関内', scale: '地区',
    dates: ['2026-08-14', '2026-08-15'], start: '17:00', end: '20:00' },

  { ...w('naka'), slug: 'kannai-yoichi', name: '関内夜市', kind: '縁日',
    venue: 'BASEGATE横浜関内', scale: '地区',
    dates: ['2026-07-25', '2026-07-26', '2026-08-14', '2026-08-15'], start: '16:00', end: '21:00' },

  { ...w('kanagawa'), slug: 'nishisandori-natsumatsuri', name: '西三通町内会 夏まつり', kind: '夏祭り',
    organizer: '西三通町内会', venue: '西神奈川三丁目公園',
    dates: ['2026-08-15'], start: '18:30', end: '20:30' },

  { ...w('asahi'), slug: 'tsurugamine-inari-reitaisai', name: '鶴ケ峯稲荷神社 例大祭・夏祭り', kind: '例大祭',
    organizer: '鶴ケ峯稲荷神社', venue: '鶴ヶ峰公園', shrine: '鶴ケ峯稲荷神社', scale: '地区',
    dates: ['2026-08-22', '2026-08-23'], start: '17:00', end: '21:00',
    note: '盆踊りは19:00開始' },

  { ...w('isogo'), slug: 'sugita-tobu-natsumatsuri', name: '杉田東部町内会 夏祭り', kind: '夏祭り',
    organizer: '杉田東部町内会', venue: '杉田東部町内会館',
    dates: ['2026-08-23'], start: '10:00', end: '13:00', tags: ['昼開催'] },

  { ...w('isogo'), slug: 'sugita-matsuri', name: '杉田まつり', kind: '商店街',
    venue: '杉田商店街 周辺', scale: '地区',
    dates: ['2026-08-22', '2026-08-23'] },

  { ...w('tsurumi'), slug: 'nakadori-michijunee', name: '仲通り 道じゅねー（第24回）', kind: '夏祭り',
    venue: '仲通り 周辺', scale: '地区',
    dates: ['2026-08-23'], start: '17:00', end: '19:00' },

  { ...w('hodogaya'), slug: 'wada-jizo-matsuri', name: '和田地蔵まつり', kind: '夏祭り',
    organizer: '和田町商店街', venue: '和田町商店街 中央通り・中央会場', scale: '地区',
    dates: ['2026-08-23', '2026-08-24'], start: '16:30', end: '21:00' },

  { ...w('isogo'), slug: 'kuriki-bonodori', name: '栗木町内会 盆踊り', kind: '盆踊り',
    organizer: '栗木町内会', venue: '栗木スポーツ広場',
    dates: ['2026-08-29'], start: '17:00', end: '20:30' },

  { ...w('isogo'), slug: 'hachiman-jinja-reitaisai', name: '八幡神社 例大祭', kind: '例大祭',
    organizer: '滝頭岩瀬自治会', venue: '八幡神社 境内・滝頭公園', shrine: '八幡神社',
    dates: ['2026-09-05', '2026-09-06'], start: '09:00', end: '13:00' },

  { ...w('isogo'), slug: 'kaminakazato-danchi-natsumatsuri', name: '上中里団地地区自治会 夏祭り', kind: '夏祭り',
    organizer: '上中里団地地区自治会', venue: '上中里中央公園',
    dates: ['2026-09-19'], start: '16:00', end: '20:00' },

  // 以下は毎月決まった日に立つ縁日。日付を全部展開して持つ。
  { ...w('naka'), slug: 'honmoku-zero-ennichi', name: '本牧0縁日', kind: '縁日',
    venue: '本牧1丁目東町内・大鳥小学校通学路', scale: '地区',
    dates: ['2026-06-10', '2026-06-20', '2026-06-30', '2026-07-10', '2026-07-20', '2026-07-30',
      '2026-08-10', '2026-08-20', '2026-08-30'],
    note: '6〜8月の10日・20日・30日に開催' },

  { ...w('minami'), slug: 'gumyoji-sanpachi-ennichi', name: '弘明寺商店街 サンパチ縁日', kind: '縁日',
    organizer: '弘明寺かんのん通り商店街', venue: '弘明寺かんのん通り商店街', scale: '地区',
    dates: ['2026-07-18', '2026-07-23', '2026-07-28', '2026-08-03', '2026-08-08', '2026-08-13',
      '2026-08-18', '2026-08-23', '2026-08-28'],
    start: '17:00', end: '20:00',
    note: '7/18〜8/28 のうち「3」と「8」がつく日' },

  { ...w('nishi'), slug: 'fujidana-ennichisai', name: '藤棚商店街 縁日祭', kind: '縁日',
    organizer: '藤棚商店街', venue: '藤棚商店街', scale: '地区',
    dates: ['2026-06-04', '2026-06-14', '2026-06-24', '2026-07-04', '2026-07-14', '2026-07-24',
      '2026-08-04', '2026-08-14', '2026-08-24'],
    start: '17:00', end: '21:00',
    note: '6〜8月の4日・14日・24日に開催' },

  { ...w('naka'), slug: 'isezakicho-7-ichiroku-ennichi', name: '伊勢佐木町7丁目 一六縁日', kind: '縁日',
    organizer: '伊勢佐木町7丁目', venue: '伊勢佐木町7丁目 周辺', scale: '地区',
    dates: ['2026-06-01', '2026-06-06', '2026-06-16', '2026-06-26', '2026-07-01', '2026-07-06',
      '2026-07-16', '2026-07-26', '2026-08-01', '2026-08-06', '2026-08-16', '2026-08-26'],
    start: '17:00', end: '21:00',
    note: '6〜8月の1日・6日・16日・26日に開催' },
];

emit(ROWS, {
  pref: '神奈川県', city: '横浜市',
  prefSlug: 'kanagawa', citySlug: 'yokohama',
  label: '横浜市（広域まとめ）',
  source: 'https://asahi-sanpo.com/yokohama-natsumatsuri-2026/',
  sourceName: 'あさひさんぽ',
  checkedAt: '2026-08-02',
  year: 2026,
});
