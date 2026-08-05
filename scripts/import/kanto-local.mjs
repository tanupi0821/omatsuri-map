/**
 * 千葉・茨城・栃木の町内会レベルの祭り（地域メディア経由）
 *
 * この 3 県は神社庁に神社データベースが無いので、横浜・川崎でやったのと同じ
 * 「地域メディアのまとめ記事から拾う」やり方に戻る。
 *
 * 千葉は「まいぷれ船橋市」が町内会・自治会単位まで載せていて、神奈川でいう
 * みやまえご近所さんに近い。千葉すまいラボは市町村ごとのページを持っているが、
 * 神奈川版と同じく確定日程は市を代表する祭りに偏る。
 *
 * 2026年の日程が未発表で 2025年の実績しか出ていないものは year: 2025 で入れる。
 * サイト側では「2025年の情報です／今年は未確認」と明示されて出る。
 */
import { emit } from './_lib.mjs';

const c = (pref, prefSlug, city, citySlug) => ({ pref, prefSlug, city, citySlug });
const FUNA = 'https://funabashi.mypl.net/article/odekake_funabashi/82605';
const CSL = (s) => `https://chiba-sumai-labo.com/${s}-natsumatsuri/`;

const ROWS = [
  // ==================== 千葉県 船橋市（町内会レベルが取れる） ====================
  { ...c('千葉県', 'chiba', '船橋市', 'funabashi'), slug: 'narashinodai-2-natsumatsuri',
    name: '習志野台2丁目町会 夏祭り', kind: '夏祭り',
    organizer: '習志野台2丁目町会', venue: '北習志野第五号公園',
    dates: ['2026-07-18', '2026-07-19'], start: '17:00', end: '21:00', source: FUNA },

  { ...c('千葉県', 'chiba', '船橋市', 'funabashi'), slug: 'funabashi-honcho-yasaka-reitaisai',
    name: '船橋本町 八坂神社 例大祭', kind: '例大祭',
    organizer: '船橋本町みこし会', venue: '船橋市本町一帯', shrine: '八坂神社',
    scale: '地区', tags: ['神輿'],
    dates: ['2026-07-18', '2026-07-19'], source: FUNA },

  { ...c('千葉県', 'chiba', '船橋市', 'funabashi'), slug: 'gyoda-natsumatsuri',
    name: '行田夏祭り（第46回）', kind: '夏祭り',
    organizer: '行田地域', venue: '行田公園 西側', scale: '地区',
    dates: ['2026-07-19'], start: '11:00', end: '18:30', source: FUNA },

  { ...c('千葉県', 'chiba', '船橋市', 'funabashi'), slug: 'innai-yasaka-reisai',
    name: '印内八坂神社 例祭', kind: '例大祭',
    organizer: '印内地域', venue: '印内八坂神社', shrine: '八坂神社', scale: '地区',
    dates: ['2026-07-22', '2026-07-23'], source: FUNA },

  { ...c('千葉県', 'chiba', '船橋市', 'funabashi'), slug: 'narashinodai-miyuki-bonodori',
    name: '習志野台みゆき町会 納涼盆踊り大会', kind: '盆踊り',
    organizer: '習志野台みゆき町会', venue: '北習志野台第八号公園',
    dates: ['2026-07-25', '2026-07-26'], start: '18:00', end: '21:00', source: FUNA },

  { ...c('千葉県', 'chiba', '船橋市', 'funabashi'), slug: 'narashino-chutonchi-natsumatsuri',
    name: '習志野駐屯地 夏まつり', kind: '夏祭り',
    organizer: '陸上自衛隊', venue: '陸上自衛隊 習志野駐屯地', scale: '地区',
    dates: ['2026-08-01'], start: '13:00', end: '21:00', source: FUNA },

  { ...c('千葉県', 'chiba', '船橋市', 'funabashi'), slug: 'motonakayama-bonodori',
    name: '本中山地区 納涼盆踊り大会', kind: '盆踊り',
    organizer: '本中山地域', venue: '小栗原小学校 校庭', scale: '地区',
    dates: ['2026-08-01'], start: '18:45', end: '20:30', source: FUNA },

  { ...c('千葉県', 'chiba', '船橋市', 'funabashi'), slug: 'misaki-inari-bonodori',
    name: '三咲稲荷神社 納涼盆踊り', kind: '盆踊り',
    organizer: '三咲本通り商店会', venue: '三咲稲荷神社', shrine: '三咲稲荷神社',
    scale: '地区',
    dates: ['2026-08-07', '2026-08-08'], start: '18:00', end: '21:00', source: FUNA },

  { ...c('千葉県', 'chiba', '船橋市', 'funabashi'), slug: 'amanuma-sai',
    name: '天沼祭（第4回）', kind: '夏祭り',
    organizer: 'チームマキオザビー', venue: '天沼弁天池公園',
    dates: ['2026-08-23'], start: '14:00', end: '20:00', source: FUNA },

  { ...c('千葉県', 'chiba', '船橋市', 'funabashi'), slug: 'takanedai-plaza-bonodori',
    name: '高根台プラザ 盆踊り', kind: '盆踊り',
    organizer: '高根台プラザ', venue: '高根台プラザ 中央広場',
    dates: ['2026-08-29', '2026-08-30'], start: '17:00', end: '21:00', source: FUNA },

  { ...c('千葉県', 'chiba', '船橋市', 'funabashi'), slug: 'funabashi-shijo-bonodori',
    name: '船橋市地方卸売市場 盆踊り', kind: '盆踊り',
    organizer: '船橋市場', venue: '船橋市地方卸売市場',
    dates: ['2026-09-12'], start: '17:00', end: '20:00', source: FUNA },

  { ...c('千葉県', 'chiba', '船橋市', 'funabashi'), slug: 'funabashi-shimin-matsuri',
    name: 'ふなばし市民まつり', kind: '市民祭',
    organizer: '船橋市', venue: '船橋・中山・習志野台・二和向台・津田沼の5会場', scale: '市',
    tags: ['神輿', '山車'],
    dates: ['2026-09-26', '2026-09-27'], source: FUNA },

  { ...c('千葉県', 'chiba', '船橋市', 'funabashi'), slug: 'mitakisan-konzoji-taisai',
    name: '御瀧不動尊金蔵寺 開山基（大祭）', kind: '神事',
    organizer: '御瀧不動尊金蔵寺', venue: '御瀧不動尊金蔵寺', scale: '地区',
    recurrence: '8月27日〜28日',
    recurrenceSource: FUNA,
    dates: ['2026-08-27', '2026-08-28'], status: 'estimated',
    note: '例年8月27〜28日。2026年の日程として発表されたものではない', source: FUNA },

  // ==================== 千葉県 その他の市 ====================
  { ...c('千葉県', 'chiba', '松戸市', 'matsudo'), slug: 'shin-matsudo-matsuri',
    name: '新松戸まつり（第40回）', kind: '夏祭り',
    venue: 'けやき通り・新松戸中央公園', scale: '地区',
    dates: ['2026-07-18', '2026-07-19'], source: CSL('matsudo') },

  { ...c('千葉県', 'chiba', '松戸市', 'matsudo'), slug: 'matsudo-hanabi',
    name: '松戸花火大会', kind: '花火',
    venue: '古ケ崎河川敷スポーツ広場', scale: '市', tags: ['花火'],
    dates: ['2026-08-01'], start: '19:15', end: '20:20',
    note: '約12,000発', source: CSL('matsudo') },

  { ...c('千葉県', 'chiba', '松戸市', 'matsudo'), slug: 'matsudojuku-sakagawa-kento',
    name: '松戸宿坂川献灯まつり（第20回）', kind: '夏祭り',
    venue: '坂川沿道', scale: '地区', tags: ['灯籠'],
    dates: ['2026-08-09', '2026-08-10'], source: CSL('matsudo') },

  { ...c('千葉県', 'chiba', '松戸市', 'matsudo'), slug: 'kogane-juku-matsuri',
    name: '小金宿まつり（第27回）', kind: '夏祭り',
    venue: '北小金駅前広場', scale: '地区',
    dates: ['2026-08-28', '2026-08-29', '2026-08-30'], source: CSL('matsudo') },

  { ...c('千葉県', 'chiba', '柏市', 'kashiwa'), slug: 'teganuma-hanabi',
    name: '手賀沼花火大会', kind: '花火',
    venue: '手賀沼湖畔（柏・我孫子会場）', scale: '市', tags: ['花火'],
    dates: ['2026-08-01'], start: '19:10', source: CSL('kashiwa') },

  { ...c('千葉県', 'chiba', '柏市', 'kashiwa'), slug: 'kashiwa-matsuri',
    name: '柏まつり', kind: '夏祭り',
    venue: '柏駅前', scale: '市', station: '柏',
    dates: ['2026-09-19', '2026-09-20'], source: CSL('kashiwa') },

  { ...c('千葉県', 'chiba', '市川市', 'ichikawa'), slug: 'ichikawa-noryo-hanabi',
    name: '市川市民納涼花火大会', kind: '花火',
    venue: '江戸川河川敷（大洲三丁目地先）', scale: '市', tags: ['花火'],
    dates: ['2026-08-01'], start: '19:15', end: '20:20', source: CSL('ichikawa') },

  { ...c('千葉県', 'chiba', '市川市', 'ichikawa'), slug: 'honshio-bonodori',
    name: '本塩 盆踊り大会', kind: '盆踊り',
    venue: '本塩上道公園',
    dates: ['2025-07-19'], year: 2025, start: '17:00', end: '21:00',
    note: '2025年の実績。2026年の日程は未発表', source: CSL('ichikawa') },

  { ...c('千葉県', 'chiba', '市川市', 'ichikawa'), slug: 'kitakokubun-natsumatsuri',
    name: '北国分駅前 夏祭り', kind: '夏祭り',
    venue: '堀之内公園',
    dates: ['2025-07-19', '2025-07-20'], year: 2025,
    note: '2025年の実績。2026年の日程は未発表', source: CSL('ichikawa') },

  { ...c('千葉県', 'chiba', '市川市', 'ichikawa'), slug: 'ainokawa-bonodori',
    name: '相之川 盆おどり', kind: '盆踊り',
    venue: '相之川公園',
    dates: ['2025-08-02', '2025-08-03'], year: 2025,
    note: '2025年の実績。2026年の日程は未発表', source: CSL('ichikawa') },

  { ...c('千葉県', 'chiba', '市川市', 'ichikawa'), slug: 'nakayama-hokekyoji-bonodori',
    name: '中山法華経寺 盆踊り大会', kind: '盆踊り',
    venue: '中山法華経寺 境内', scale: '地区',
    dates: ['2025-08-09', '2025-08-10'], year: 2025,
    note: '2025年の実績。2026年の日程は未発表', source: CSL('ichikawa') },

  { ...c('千葉県', 'chiba', '流山市', 'nagareyama'), slug: 'edogawadai-noryosai',
    name: '江戸川台 納涼祭', kind: '納涼祭',
    venue: '江戸川台駅東口ロータリー・商店街', scale: '地区', station: '江戸川台',
    dates: ['2026-08-01', '2026-08-02'], start: '15:00',
    note: 'ステージは15:00〜、納涼祭は19:00〜', source: CSL('nagareyama') },

  { ...c('千葉県', 'chiba', '流山市', 'nagareyama'), slug: 'komagi-suwa-jinja-taisai',
    name: '駒木 諏訪神社大祭・萬灯練行列', kind: '例大祭',
    organizer: '諏訪神社', venue: '駒木 諏訪神社ほか', shrine: '諏訪神社', scale: '市',
    tags: ['萬灯'],
    dates: ['2026-08-22', '2026-08-23'], source: CSL('nagareyama') },

  { ...c('千葉県', 'chiba', '流山市', 'nagareyama'), slug: 'nagareyama-hanabi',
    name: '流山花火大会', kind: '花火',
    venue: '流山1〜3丁目 江戸川堤', scale: '市', tags: ['花火'],
    dates: ['2026-10-03'], start: '18:00', end: '18:40', source: CSL('nagareyama') },

  // ==================== 茨城県 ====================
  { ...c('茨城県', 'ibaraki', '水戸市', 'mito'), slug: 'yoshida-jinja-andon',
    name: '常陸第三宮 吉田神社 あんどん祭・御田植祭・盆踊り大会', kind: '夏祭り',
    organizer: '吉田神社', venue: '吉田神社', shrine: '吉田神社', scale: '地区',
    tags: ['灯籠', '盆踊り'],
    dates: ['2026-07-17', '2026-07-18'],
    source: 'https://www.tour.ne.jp/matome/articles/j545/',
    sourceName: 'トラベルコ', sourceType: 'aggregator' },

  { ...c('茨城県', 'ibaraki', 'つくば市', 'tsukuba'), slug: 'sekai-no-tsukuba-bonodori',
    name: '世界のつくばで盆おどり', kind: '盆踊り',
    venue: 'デイズタウン 平面駐車場', scale: '市',
    dates: ['2026-07-25'],
    source: 'https://www.tour.ne.jp/matome/articles/j545/',
    sourceName: 'トラベルコ', sourceType: 'aggregator' },

  // ==================== 栃木県 ====================
  { ...c('栃木県', 'tochigi', '宇都宮市', 'utsunomiya'), slug: 'furusato-miya-matsuri',
    name: 'ふるさと宮まつり（第51回）', kind: '夏祭り',
    venue: '宇都宮市 大通り', scale: '市', station: '宇都宮',
    tags: ['神輿', '和太鼓', '郷土芸能'],
    recurrence: '8月の最初の土曜・日曜',
    recurrenceSource: 'https://www.utsunomiya-cvb.org/event/detail_20002.html',
    dates: ['2026-08-01', '2026-08-02'],
    note: '40基を超える神輿が大通りを練り歩く。和太鼓の競演、踊り、郷土芸能',
    source: 'https://www.utsunomiya-cvb.org/event/detail_20002.html',
    sourceName: '宇都宮観光ナビ（宇都宮観光コンベンション協会）', sourceType: 'gov' },
];

const byPref = new Map();
for (const r of ROWS) {
  if (!byPref.has(r.prefSlug)) byPref.set(r.prefSlug, []);
  byPref.get(r.prefSlug).push(r);
}
for (const [prefSlug, rows] of byPref) {
  emit(rows, {
    pref: rows[0].pref,
    prefSlug,
    label: `${rows[0].pref}（地域メディア）`,
    sourceName: prefSlug === 'chiba' ? '地域メディア（まいぷれ船橋／千葉すまいラボ）' : undefined,
    sourceType: 'media',
    checkedAt: '2026-08-03',
    year: 2026,
  });
}
