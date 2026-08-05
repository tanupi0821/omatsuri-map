/**
 * 神奈川県 横浜市・川崎市以外の 31 市町村インポーター
 *
 * 出典: 神奈川すまいラボ 各市町村の夏祭り・盆踊りガイド
 *       https://kanagawa-sumai-labo.com/<市町村>-natsumatsuri/
 *
 * 31市町村ぶんのページを全部見た結果、日付が確定して載っているのは市を代表する
 * 大きな祭りと花火大会だけだった。町内会・自治会の盆踊りについては、どのページにも
 * 「開催直前に告知が出ることも多い」と書いてあるだけで、一覧が存在しない。
 * 横浜・川崎で見つけた「区役所や地域メディアが町内会レベルをまとめている」構図が、
 * 県内の他の市町村にはほぼ無い。
 *
 * ここはあくまで骨組み。町内会レベルは市町村ごとに地域メディアと神社を当たって埋める。
 */
import { emit } from './_lib.mjs';

const src = (slug) => `https://kanagawa-sumai-labo.com/${slug}-natsumatsuri/`;
const c = (name, slug, ward = null, wardSlug = null) => ({ city: name, citySlug: slug, ward, wardSlug });

const ROWS = [
  // ---------------- 相模原市（政令市・区あり） ----------------
  { ...c('相模原市', 'sagamihara', '中央区', 'sagamihara-chuo'), slug: 'kamimizo-natsumatsuri',
    name: '上溝夏祭り', kind: '夏祭り', venue: '上溝商店街通り', scale: '地区',
    station: '上溝', tags: ['神輿', '山車'],
    dates: ['2026-07-25', '2026-07-26'], start: '18:00', end: '20:30',
    note: '7/25 宵宮 18:00〜20:30、7/26 本宮 14:00〜20:30。神輿と山車が商店街を巡行',
    source: src('sagamihara-chuo') },

  { ...c('相模原市', 'sagamihara', '緑区', 'sagamihara-midori'), slug: 'hashimoto-tanabata',
    name: '橋本七夕まつり（第74回）', kind: '夏祭り', venue: '橋本七夕通りほか（JR橋本駅北口）',
    scale: '区', station: '橋本',
    dates: ['2026-08-07', '2026-08-08', '2026-08-09'], start: '14:00', end: '21:00',
    note: '7〜8日は14:00〜21:00、9日は14:00〜20:30', source: src('sagamihara-midori') },

  { ...c('相模原市', 'sagamihara', '緑区', 'sagamihara-midori'), slug: 'tsukuiko-natsumatsuri',
    name: 'みんなの津久井湖夏祭り2026', kind: '夏祭り',
    venue: '県立津久井湖城山公園 水の苑地', address: '緑区城山2', scale: '地区',
    dates: ['2026-08-11'], start: '15:00', end: '20:00', source: src('sagamihara-midori') },

  { ...c('相模原市', 'sagamihara', '南区', 'sagamihara-minami'), slug: 'torinma-summer-warnival',
    name: '東林間サマーわぁ！ニバル', kind: '夏祭り',
    venue: '東林間駅前大通り（シャンテ大通り）', scale: '地区', station: '東林間',
    dates: ['2026-08-01', '2026-08-02'],
    note: '東林間の夏を彩る阿波おどりイベント。入場無料', source: src('sagamihara-minami') },

  // ---------------- 横須賀市 ----------------
  { ...c('横須賀市', 'yokosuka'), slug: 'kurihama-perry-hanabi',
    name: '久里浜ペリー祭 花火大会', kind: '花火', venue: '久里浜海岸周辺', scale: '市',
    station: '久里浜', tags: ['花火'],
    dates: ['2026-07-11'], start: '19:30', end: '20:00',
    note: '約7,000発。19:30から約30分', source: src('yokosuka-shi') },

  { ...c('横須賀市', 'yokosuka'), slug: 'yokosuka-kaikoku-hanabi',
    name: 'よこすか開国花火大会2026', kind: '花火',
    venue: '海辺つり公園・うみかぜ公園ほか', scale: '市', station: '横須賀中央', tags: ['花火'],
    dates: ['2026-09-27'], start: '18:00', end: '18:30',
    note: '三浦半島最大級の約1万発。時間は予定', source: src('yokosuka-shi') },

  // ---------------- 平塚市 ----------------
  { ...c('平塚市', 'hiratsuka'), slug: 'shonan-hiratsuka-tanabata',
    name: '湘南ひらつか七夕まつり（第74回）', kind: '夏祭り',
    venue: 'JR平塚駅北口商店街一帯（湘南スターモールほか）', scale: '市', station: '平塚',
    dates: ['2026-07-03', '2026-07-04', '2026-07-05'],
    note: '日本三大七夕のひとつ。3日・4日は20:30まで、5日は19:00まで',
    links: ['https://www.city.hiratsuka.kanagawa.jp/kanko/page-c_01099.html'],
    source: src('hiratsuka-shi') },

  // ---------------- 鎌倉市 ----------------
  { ...c('鎌倉市', 'kamakura'), slug: 'kamakura-hanabi',
    name: '鎌倉花火大会', kind: '花火', venue: '由比ヶ浜・材木座海岸', scale: '市', tags: ['花火'],
    dates: ['2026-07-10'], start: '19:20',
    note: '2026年は高波のため通常の打ち上げは中止となり、水中花火のみ実施', source: src('kamakura-shi') },

  { ...c('鎌倉市', 'kamakura'), slug: 'tsurugaoka-bonbori',
    name: '鶴岡八幡宮 ぼんぼり祭', kind: '例大祭',
    organizer: '鶴岡八幡宮', venue: '鶴岡八幡宮', shrine: '鶴岡八幡宮', scale: '市',
    station: '鎌倉',
    dates: ['2026-08-06', '2026-08-07', '2026-08-08', '2026-08-09'],
    note: '約400点のぼんぼりが夜の参道を照らす', source: src('kamakura-shi') },

  // ---------------- 藤沢市 ----------------
  { ...c('藤沢市', 'fujisawa'), slug: 'fujisawajuku-yugyo-no-bon',
    name: '藤沢宿・遊行の盆', kind: '盆踊り',
    venue: '藤沢駅北口・遊行寺ほか', scale: '市', station: '藤沢',
    dates: ['2026-07-25', '2026-07-26'], source: src('fujisawa-shi') },

  { ...c('藤沢市', 'fujisawa'), slug: 'kugenuma-kotai-jingu-reitaisai',
    name: '鵠沼皇大神宮 例大祭', kind: '例大祭',
    organizer: '皇大神宮（鵠沼神明）', venue: '皇大神宮', shrine: '皇大神宮', scale: '地区',
    station: '本鵠沼', tags: ['山車'],
    dates: ['2026-08-17'], source: src('fujisawa-shi') },

  { ...c('藤沢市', 'fujisawa'), slug: 'enoshima-toro',
    name: '江の島灯籠 2026', kind: '夏祭り',
    venue: '江の島島内各所', scale: '市', station: '片瀬江ノ島', tags: ['灯籠'],
    dates: ['2026-08-01', '2026-09-23'],
    note: '8/1〜9/23の期間、江の島島内をライトアップ。掲載の2日付は期間の初日と最終日',
    source: src('fujisawa-shi') },

  { ...c('藤沢市', 'fujisawa'), slug: 'fujisawa-enoshima-hanabi',
    name: 'ふじさわ江の島花火大会', kind: '花火',
    venue: '片瀬西浜海水浴場', scale: '市', station: '片瀬江ノ島', tags: ['花火'],
    dates: ['2026-10-17'], source: src('fujisawa-shi') },

  // ---------------- 小田原市 ----------------
  { ...c('小田原市', 'odawara'), slug: 'sakawagawa-hanabi',
    name: '小田原酒匂川花火大会（第37回）', kind: '花火',
    venue: '酒匂川スポーツ広場', scale: '市', station: '鴨宮', tags: ['花火'],
    dates: ['2026-08-01'], start: '18:30', end: '20:10', source: src('odawara-shi') },

  // ---------------- 茅ヶ崎市 ----------------
  { ...c('茅ヶ崎市', 'chigasaki'), slug: 'hamaorisai',
    name: '茅ヶ崎海岸 浜降祭', kind: '例大祭',
    venue: '茅ヶ崎西浜海岸（サザンビーチ）', scale: '市', station: '茅ケ崎', tags: ['神輿'],
    dates: ['2026-07-20'], start: '07:00',
    note: '茅ヶ崎・寒川の約40基の神輿が暁の海でみそぎ。未明に各神社を出発し7:00から合同祭。寒川神社ほか多数の神社が参加',
    source: src('chigasaki-shi') },

  { ...c('茅ヶ崎市', 'chigasaki'), slug: 'southern-beach-hanabi',
    name: 'サザンビーチちがさき花火大会（第52回）', kind: '花火',
    venue: 'サザンビーチちがさき', scale: '市', station: '茅ケ崎', tags: ['花火'],
    dates: ['2026-08-01'], start: '19:30', end: '20:10', source: src('chigasaki-shi') },

  // ---------------- 逗子市 ----------------
  { ...c('逗子市', 'zushi'), slug: 'kameoka-hachimangu-reitaisai',
    name: '亀岡八幡宮 例大祭', kind: '例大祭',
    organizer: '亀岡八幡宮', venue: '亀岡八幡宮および周辺商店街', shrine: '亀岡八幡宮',
    scale: '市', station: '逗子', tags: ['神輿'],
    dates: ['2026-07-15', '2026-07-16'], note: '7/15 宵宮、7/16 本宮', source: src('zushi-shi') },

  { ...c('逗子市', 'zushi'), slug: 'zushi-kaigan-hanabi',
    name: '逗子海岸花火大会（第69回）', kind: '花火',
    venue: '逗子海岸', scale: '市', station: '逗子', tags: ['花火'],
    dates: ['2026-05-21'], note: '逗子の花火は春開催', source: src('zushi-shi') },

  // ---------------- 三浦市 ----------------
  { ...c('三浦市', 'miura'), slug: 'miurakaigan-noryo-hanabi',
    name: '三浦海岸納涼まつり花火大会（第46回）', kind: '花火',
    venue: '三浦海岸沿岸', scale: '市', station: '三浦海岸', tags: ['花火'],
    dates: ['2026-08-07'], start: '19:30', end: '20:00', source: src('miura-shi') },

  // ---------------- 秦野市 ----------------
  { ...c('秦野市', 'hadano'), slug: 'moalove-natsumatsuri',
    name: '秦野駅前通り商店街 モアラブ夏祭り', kind: '商店街',
    organizer: '秦野駅前通り商店街', venue: '秦野駅北口・水無川沿い市道（歩行者天国）',
    scale: '地区', station: '秦野',
    dates: ['2026-06-27', '2026-06-28'], start: '11:00', end: '20:00', source: src('hadano-shi') },

  // ---------------- 厚木市 ----------------
  { ...c('厚木市', 'atsugi'), slug: 'atsugi-ayu-matsuri',
    name: 'あつぎ鮎まつり大花火大会（第80回）', kind: '花火',
    venue: '相模川三川合流点', scale: '市', station: '本厚木', tags: ['花火'],
    dates: ['2026-10-10', '2026-10-11'], source: src('atsugi-shi') },

  // ---------------- 大和市 ----------------
  { ...c('大和市', 'yamato'), slug: 'yamato-awaodori',
    name: '神奈川大和阿波おどり（第50回）', kind: '夏祭り',
    venue: '大和駅周辺の商店街', scale: '市', station: '大和',
    dates: ['2026-07-25', '2026-07-26'], source: src('yamato-shi') },

  { ...c('大和市', 'yamato'), slug: 'yamatomachi-hachiman-bonodori',
    name: '大和町八幡神社 大盆踊り会', kind: '盆踊り',
    venue: '大和町八幡神社', shrine: '八幡神社', scale: '地区',
    dates: ['2026-07-18'], start: '15:00', end: '20:30',
    note: '雨天のときは翌日', source: src('yamato-shi') },

  { ...c('大和市', 'yamato'), slug: 'zomeki',
    name: '舞台演舞「ぞめき」', kind: '夏祭り',
    venue: '大和市文化創造拠点シリウス', scale: '市', station: '大和',
    dates: ['2026-07-12'], source: src('yamato-shi') },

  // ---------------- 海老名市 ----------------
  { ...c('海老名市', 'ebina'), slug: 'ebina-shimin-matsuri',
    name: 'えびな市民まつり', kind: '市民祭',
    venue: '海老名運動公園', scale: '市', station: '海老名', tags: ['花火'],
    dates: ['2026-11-15'], start: '10:00', end: '18:30',
    note: 'フィナーレの花火は17:30〜18:00', source: src('ebina-shi') },

  // ---------------- 座間市 ----------------
  { ...c('座間市', 'zama'), slug: 'zama-himawari-matsuri',
    name: '座間市ひまわりまつり（座間会場）', kind: '夏祭り',
    venue: '座架依橋周辺（座間・四ツ谷エリア）', scale: '市',
    dates: ['2026-08-14', '2026-08-15', '2026-08-16'], start: '09:30', end: '17:00',
    note: '相武台前駅から臨時直行バス', source: src('zama-shi') },

  // ---------------- 綾瀬市 ----------------
  { ...c('綾瀬市', 'ayase'), slug: 'ayase-hanabi',
    name: '綾瀬市花火大会（第49回）', kind: '花火',
    venue: 'オーエンス文化会館周辺', scale: '市', tags: ['花火'],
    dates: ['2026-08-22'], start: '19:30', end: '20:00', source: src('ayase-shi') },

  // ---------------- 葉山町 ----------------
  { ...c('葉山町', 'hayama'), slug: 'hayama-hanabi-isshiki',
    name: '葉山海岸HANABI2026（一色会場）', kind: '花火',
    venue: '一色海岸', scale: '市', tags: ['花火'],
    dates: ['2026-07-22'], source: src('hayama-machi') },

  { ...c('葉山町', 'hayama'), slug: 'hayama-hanabi-morito',
    name: '葉山海岸HANABI2026（森戸会場）', kind: '花火',
    venue: '森戸海岸（森戸神社そば）', scale: '市', tags: ['花火'],
    dates: ['2026-07-24'], start: '19:30', end: '19:40', source: src('hayama-machi') },

  // ---------------- 大磯町 ----------------
  { ...c('大磯町', 'oiso'), slug: 'oiso-weekly-hanabi',
    name: 'WEEKLY打ち上げ花火 in 大磯', kind: '花火',
    venue: '大磯港', scale: '市', station: '大磯', tags: ['花火'],
    dates: ['2026-07-25', '2026-08-07', '2026-08-23'], start: '19:30',
    note: '各回19:30頃から約15分', source: src('oiso-machi') },

  // ---------------- 湯河原町 ----------------
  { ...c('湯河原町', 'yugawara'), slug: 'yugawara-yassa-matsuri',
    name: '湯河原やっさまつり', kind: '夏祭り',
    venue: '湯河原小学校〜桜木公園、幕山公園通り', scale: '市', station: '湯河原',
    dates: ['2026-08-02', '2026-08-03'], start: '18:00', source: src('yugawara-machi') },

  { ...c('湯河原町', 'yugawara'), slug: 'yugawara-kaijo-hanabi',
    name: '湯河原温泉海上花火大会', kind: '花火',
    venue: '湯河原海水浴場沖', scale: '市', station: '湯河原', tags: ['花火'],
    dates: ['2026-08-03'], start: '20:00', end: '20:20',
    note: '予備日は8月23日', source: src('yugawara-machi') },

  { ...c('湯河原町', 'yugawara'), slug: 'izu-yugawara-noryo-hanabi',
    name: '伊豆湯河原温泉納涼花火大会', kind: '花火',
    venue: '湯河原海水浴場周辺', scale: '市', station: '湯河原', tags: ['花火'],
    dates: ['2026-07-25'], source: src('yugawara-machi') },

  // ---------------- 箱根町 ----------------
  { ...c('箱根町', 'hakone'), slug: 'ashinoko-natsumatsuri-week',
    name: '芦ノ湖夏まつりウィーク（6夜連続花火）', kind: '花火',
    venue: '芦ノ湖各所（元箱根湾・箱根園・湖尻・箱根湾）', scale: '市', tags: ['花火'],
    dates: ['2026-07-31', '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05'],
    source: src('hakone-machi') },

  { ...c('箱根町', 'hakone'), slug: 'gora-daimonjiyaki',
    name: '箱根強羅温泉 大文字焼（箱根強羅夏まつり）', kind: '夏祭り',
    venue: '明星ヶ岳・強羅駅周辺', scale: '市', station: '強羅',
    dates: ['2026-08-16'], start: '19:30', note: '点火は19:30', source: src('hakone-machi') },

  // ---------------- 真鶴町 ----------------
  { ...c('真鶴町', 'manazuru'), slug: 'manazuru-kibune-matsuri',
    name: '真鶴貴船まつり', kind: '例大祭',
    organizer: '貴船神社', venue: '貴船神社・真鶴港岸壁広場', shrine: '貴船神社',
    scale: '市', station: '真鶴', tags: ['神輿', '船'],
    dates: ['2026-07-24', '2026-07-25'], note: '7/24 宵宮、7/25 本祭', source: src('manazuru-machi') },

  // ---------------- 松田町 ----------------
  { ...c('松田町', 'matsuda'), slug: 'matsuda-kanko-matsuri',
    name: 'まつだ観光まつり（第46回）・あしがら花火大会（第25回）', kind: '夏祭り',
    organizer: '松田町', venue: '酒匂川町民親水広場', scale: '市', station: '新松田',
    tags: ['花火'],
    dates: ['2026-08-22'], note: '8月第4土曜日。花火は20:00から', source: src('matsuda-machi') },

  // ---------------- 開成町 ----------------
  { ...c('開成町', 'kaisei'), slug: 'kaisei-noryo-matsuri',
    name: '開成町納涼まつり・あしがら花火大会', kind: '納涼祭',
    venue: '開成水辺スポーツ公園', scale: '市', station: '開成', tags: ['花火'],
    dates: ['2026-08-22'], start: '15:30', end: '21:00',
    note: '荒天のときは順延', source: src('kaisei-machi') },

  // ---------------- 山北町 ----------------
  { ...c('山北町', 'yamakita'), slug: 'shasui-no-taki-matsuri',
    name: '洒水の滝まつり2026（第47回）', kind: '夏祭り',
    venue: '洒水の滝周辺', scale: '市', station: '山北',
    dates: ['2026-07-26'], source: src('yamakita-machi') },

  // ---------------- 大井町 ----------------
  { ...c('大井町', 'oi'), slug: 'oi-yosakoi-hyotan-matsuri',
    name: '大井よさこいひょうたん祭（第40回）', kind: '夏祭り',
    venue: '大井町役場周辺・中央通り', scale: '市', station: '上大井',
    dates: ['2026-08-08'], source: src('oi-machi') },
];

emit(ROWS, {
  pref: '神奈川県',
  prefSlug: 'kanagawa',
  label: '神奈川県 その他31市町村',
  sourceName: '神奈川すまいラボ',
  sourceType: 'aggregator',
  checkedAt: '2026-08-02',
  year: 2026,
});
