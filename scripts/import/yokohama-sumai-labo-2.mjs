/**
 * 横浜市 区別インポーター その2（神奈川すまいラボの区別ページ）
 *
 * 出典: https://kanagawa-sumai-labo.com/<区>-ku-natsumatsuri/
 *
 * 他のソースで薄かった区を埋める分。日付が明記されているものだけを取る。
 * 「例年8月上旬」のように月しか出ていないものは、誤情報になるので入れていない。
 */
import { emit } from './_lib.mjs';

const src = (slug) => `https://kanagawa-sumai-labo.com/${slug}-ku-natsumatsuri/`;

const ROWS = [
  // --- 鶴見区 ---
  { ward: '鶴見区', wardSlug: 'tsurumi', slug: 'sojiji-mitama-bonodori',
    name: '大本山總持寺 み霊祭り納涼盆踊り大会', kind: '盆踊り',
    organizer: '大本山總持寺', venue: '總持寺 大駐車場', scale: '市',
    dates: ['2026-07-17', '2026-07-18', '2026-07-19'], start: '17:30', end: '20:30',
    station: '鶴見', tags: ['屋台'], source: src('tsurumi') },

  // --- 港北区 ---
  { ward: '港北区', wardSlug: 'kohoku', slug: 'shin-yokohama-bonodori',
    name: '新横浜盆踊り（第24回）', kind: '盆踊り',
    organizer: '新横浜町内会（3町合同）', venue: '新横浜駅前西口広場', scale: '地区',
    dates: ['2026-07-24', '2026-07-25'], station: '新横浜', source: src('kohoku') },

  // --- 戸塚区 ---
  { ward: '戸塚区', wardSlug: 'totsuka', slug: 'totsuka-natsumatsuri',
    name: 'とつか夏まつり', kind: '商店街',
    organizer: '戸塚区商店街連合会', venue: '戸塚小学校前 近郊', scale: '区',
    dates: ['2026-07-11'], start: '12:00', end: '20:00', station: '戸塚',
    source: src('totsuka') },

  { ward: '戸塚区', wardSlug: 'totsuka', slug: 'yasaka-jinja-ofudamaki',
    name: '八坂神社 お札まき', kind: '例大祭',
    venue: '八坂神社・旧東海道沿い', shrine: '八坂神社', scale: '地区',
    dates: ['2026-07-14'], station: '戸塚', source: src('totsuka') },

  // --- 神奈川区 ---
  { ward: '神奈川区', wardSlug: 'kanagawa', slug: 'hightown-natsumatsuri',
    name: 'ハイタウン夏まつり', kind: '夏祭り',
    venue: '神大寺第一公園',
    dates: ['2026-07-18'], start: '17:00', end: '21:00', source: src('kanagawa') },

  { ward: '神奈川区', wardSlug: 'kanagawa', slug: 'katakuracho-bonodori',
    name: '片倉町自治会 盆踊り大会', kind: '盆踊り',
    organizer: '片倉町自治会', venue: '北公園',
    dates: ['2026-07-25'], start: '18:30', source: src('kanagawa') },

  { ward: '神奈川区', wardSlug: 'kanagawa', slug: 'rokkakubashi-noryokai',
    name: '六角橋連合自治会 納涼会', kind: '納涼祭',
    organizer: '六角橋連合自治会', venue: '神橋小学校', scale: '地区',
    dates: ['2026-08-22'], start: '17:00', source: src('kanagawa') },

  { ward: '神奈川区', wardSlug: 'kanagawa', slug: 'kandaiji-kitamachi-bonodori',
    name: '神大寺北町自治会 盆踊り大会', kind: '盆踊り',
    organizer: '神大寺北町自治会', venue: '三角地帯空地',
    dates: ['2026-08-29'], source: src('kanagawa') },

  // --- 保土ケ谷区 ---
  { ward: '保土ケ谷区', wardSlug: 'hodogaya', slug: 'tachibana-jinja-reitaisai',
    name: '橘樹神社 例大祭', kind: '例大祭',
    venue: '橘樹神社・天王町商店街', shrine: '橘樹神社', scale: '地区',
    dates: ['2026-06-13', '2026-06-14'], station: '天王町', source: src('hodogaya') },

  { ward: '保土ケ谷区', wardSlug: 'hodogaya', slug: 'hoshikawa-sugiyama-nagoshisai',
    name: '星川杉山神社 夏越祭', kind: '例大祭',
    venue: '星川杉山神社', address: '星川1丁目', shrine: '星川杉山神社', scale: '地区',
    dates: ['2026-06-27', '2026-06-28', '2026-06-29', '2026-06-30'],
    tags: ['花火'], note: '花火は27日夕方', station: '星川', source: src('hodogaya') },

  { ward: '保土ケ谷区', wardSlug: 'hodogaya', slug: 'yokohama-chuntonchi-noryosai',
    name: '横浜駐屯地 納涼祭', kind: '納涼祭',
    organizer: '陸上自衛隊', venue: '陸上自衛隊 横浜駐屯地', address: '岡沢町', scale: '地区',
    dates: ['2026-07-18'], start: '17:00', end: '20:30',
    note: '雨天のときは翌19日に順延', source: src('hodogaya') },

  // --- 旭区 ---
  { ward: '旭区', wardSlug: 'asahi', slug: 'tsurugamine-natsumatsuri',
    name: '鶴ヶ峰 夏祭り（盆踊り）', kind: '夏祭り',
    venue: '鶴ヶ峯小学校 校庭', station: '鶴ヶ峰',
    dates: ['2026-07-18'], start: '16:00', end: '18:00', source: src('asahi') },

  // --- 中区 ---
  { ward: '中区', wardSlug: 'naka', slug: 'kannai-matsuri',
    name: '関内まつり（厳島神社例大祭）', kind: '例大祭',
    organizer: '厳島神社', venue: '馬車道商店街 周辺', shrine: '厳島神社', scale: '地区',
    dates: ['2026-07-25'], start: '16:00', end: '18:30', station: '関内',
    source: src('naka') },

  // --- 西区 ---
  { ward: '西区', wardSlug: 'nishi', slug: 'yokohama-tanabata',
    name: '横浜七夕祭り 2026', kind: '夏祭り',
    venue: '臨港パーク・パシフィコ横浜 展示ホールB', scale: '市',
    dates: ['2026-07-04', '2026-07-05'], start: '10:00', end: '21:00',
    station: 'みなとみらい', source: src('nishi') },

  { ward: '西区', wardSlug: 'nishi', slug: 'yokohama-night-flowers',
    name: '横浜ナイトフラワーズ 2026', kind: '花火',
    venue: '新港ふ頭', scale: '市',
    dates: ['2026-07-04', '2026-07-07', '2026-07-18', '2026-07-25', '2026-08-09'],
    start: '19:30', end: '19:35',
    note: '各日5分間の打ち上げ。出典に載っていない開催日もある', source: src('nishi') },

  { ward: '西区', wardSlug: 'nishi', slug: 'minatomirai-festival',
    name: 'みなとみらいフェスティバル', kind: '花火',
    venue: '臨港パーク・カップヌードルミュージアムパーク・横浜ハンマーヘッドほか', scale: '市',
    dates: ['2026-08-24'], start: '18:30', end: '20:00',
    tags: ['花火'], note: '花火は19:10〜19:50予定', source: src('nishi') },

  { ward: '西区', wardSlug: 'nishi', slug: 'minatomirai-dai-bonodori',
    name: 'みなとみらい大盆踊り（第17回）', kind: '盆踊り',
    organizer: 'パシフィコ横浜', venue: '臨港パーク プラザ広場', scale: '市',
    dates: ['2026-08-28', '2026-08-29'], start: '16:30', end: '20:30',
    station: 'みなとみらい',
    note: '出典では中区の項にも載っているが、臨港パークの所在地は西区',
    links: ['https://www.pacifico.co.jp/event/MM_BonOdori'], source: src('nishi') },
];

emit(ROWS, {
  pref: '神奈川県', city: '横浜市',
  prefSlug: 'kanagawa', citySlug: 'yokohama',
  label: '横浜市（区別ページ その2）',
  sourceName: '神奈川すまいラボ',
  checkedAt: '2026-08-02',
  year: 2026,
});
