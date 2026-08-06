/**
 * 花火大会のうち屋台が出るもの（未収録分）
 *
 * 出典: 花火大会2026（ウォーカープラス）の県別一覧
 *       https://hanabi.walkerplus.com/list/<県>/
 *       屋台ありだけの絞り込み: https://hanabi.walkerplus.com/list/<県>/yatai/
 *
 * **花火大会のデータベースは屋台の有無を項目として持っている。**
 * 神社の例大祭では露店の有無がまず公開されないのに対し、花火大会は必ず書いてある。
 * 北関東で「露店ありのものだけ載せる」方針を満たせる数少ない入口。
 *
 * 花火大会の多くは地元の商工会・実行委員会が主催する地域の夏祭りでもある。
 */
import { emit } from './_lib.mjs';

const HB = (ar) => `https://hanabi.walkerplus.com/list/${ar}/yatai/`;

emit([
  { city: '取手市', citySlug: 'toride', slug: 'toride-tonegawa-hanabi',
    name: 'とりで利根川大花火（第71回）', kind: '花火',
    venue: '取手緑地運動公園', scale: '市', station: '取手',
    dates: ['2026-08-08'] },
  { city: '東海村', citySlug: 'tokai', slug: 'tokai-matsuri-hanabi',
    name: '東海まつり花火大会（第48回）', kind: '花火',
    venue: '阿漕ヶ浦公園', scale: '市',
    dates: ['2026-08-08'] },
  { city: '下妻市', citySlug: 'shimotsuma', slug: 'shimotsuma-matsuri',
    name: '下妻まつり2026', kind: '夏祭り',
    venue: '砂沼南岸および砂沼湖上', scale: '市', tags: ['花火'],
    dates: ['2026-08-22'] },
  { city: 'ひたちなか市', citySlug: 'hitachinaka', slug: 'hitachinaka-matsuri-hanabi',
    name: 'ひたちなか祭り花火大会（第32回）', kind: '花火',
    venue: '陸上自衛隊勝田駐屯地', scale: '市', station: '勝田',
    dates: ['2026-08-22', '2026-08-23'] },
  { city: '稲敷市', citySlug: 'inashiki', slug: 'inashiki-natsumatsuri-hanabi',
    name: 'いなしき夏まつり花火大会 2026', kind: '花火',
    venue: '江戸崎総合運動公園周辺', scale: '市',
    dates: ['2026-08-22'] },
  { city: '利根町', citySlug: 'tone', slug: 'tone-choumin-noryo-hanabi',
    name: '利根町民納涼花火大会（第49回）', kind: '花火',
    venue: '利根川 栄橋下河川敷', scale: '市',
    dates: ['2026-08-22'] },
  { city: '神栖市', citySlug: 'kamisu', slug: 'kirasse-matsuri-hanabi',
    name: 'きらっせ祭り花火大会（第40回）', kind: '花火',
    venue: '波崎海水浴場周辺', scale: '市',
    dates: ['2026-08-23'] },
  { city: '常総市', citySlug: 'joso', slug: 'joso-kinugawa-hanabi',
    name: '常総きぬ川花火大会（第59回）', kind: '花火',
    venue: '鬼怒川河畔・橋本運動公園', scale: '市',
    dates: ['2026-09-12'] },
].map((r) => ({ ...r, stalls: 'yes', tags: [...(r.tags ?? []), '花火'] })), {
  pref: '茨城県', prefSlug: 'ibaraki',
  label: '茨城県（花火・屋台あり）',
  source: HB('ar0308'), sourceName: '花火大会2026（ウォーカープラス）',
  sourceType: 'aggregator',
  checkedAt: '2026-08-03', year: 2026,
});

// ---- 群馬県 ----
emit([
  { city: '前橋市', citySlug: 'maebashi', slug: 'maebashi-hanabi-2',
    name: '前橋花火大会（第70回）', kind: '花火',
    venue: '利根川河畔 大渡橋南北河川緑地', scale: '市', station: '前橋',
    dates: ['2026-08-08'] },
  { city: '太田市', citySlug: 'ota-gunma', slug: 'nitta-matsuri-hanabi',
    name: '新田まつり花火大会（第37回）', kind: '花火',
    venue: '新田陸上競技場', scale: '市', dates: ['2026-08-08'] },
  { city: '甘楽町', citySlug: 'kanra', slug: 'kanra-hanabi',
    name: '甘楽町花火大会', kind: '花火',
    venue: '甘楽ふれあいの丘', scale: '市', dates: ['2026-08-14'] },
  { city: '桐生市', citySlug: 'kiryu', slug: 'nisato-matsuri-hanabi',
    name: '新里まつり花火大会（第42回）', kind: '花火',
    venue: '新里総合グラウンド', scale: '地区', dates: ['2026-08-15'] },
  { city: '安中市', citySlug: 'annaka', slug: 'isobe-onsen-matsuri-hanabi',
    name: '磯部温泉祭り花火大会', kind: '花火',
    venue: '磯部温泉 碓氷川河川敷', scale: '市', station: '磯部',
    dates: ['2026-08-15'] },
  { city: '千代田町', citySlug: 'chiyoda-gunma', slug: 'chiyoda-kawasegaki',
    name: '千代田の祭 川せがき', kind: '夏祭り',
    venue: '赤岩地先 利根川河畔', scale: '市', tags: ['灯籠流し'],
    dates: ['2026-08-18'] },
  { city: '高崎市', citySlug: 'takasaki', slug: 'takasaki-dai-hanabi',
    name: '高崎大花火大会（第52回）', kind: '花火',
    venue: '烏川 和田橋上流河川敷', scale: '市', station: '高崎',
    dates: ['2026-08-22'] },
  { city: '沼田市', citySlug: 'numata', slug: 'numata-hanabi',
    name: '沼田花火大会（第14回）', kind: '花火',
    venue: '沼田市運動公園', scale: '市', dates: ['2026-09-12'] },
  { city: '明和町', citySlug: 'meiwa', slug: 'meiwa-matsuri',
    name: '明和まつり', kind: '夏祭り',
    venue: '明和町ふるさとの広場', scale: '市', tags: ['花火'],
    dates: ['2026-09-12'] },
].map((r) => ({ ...r, stalls: 'yes', tags: [...(r.tags ?? []), '花火'] })), {
  pref: '群馬県', prefSlug: 'gunma',
  label: '群馬県（花火・屋台あり）',
  source: HB('ar0310'), sourceName: '花火大会2026（ウォーカープラス）',
  sourceType: 'aggregator',
  checkedAt: '2026-08-03', year: 2026,
});

// ---- 栃木県 ----
emit([
  { city: '宇都宮市', citySlug: 'utsunomiya', slug: 'utsunomiya-hanabi',
    name: 'うつのみや花火大会 2026', kind: '花火',
    venue: '宇都宮市道場宿緑地（鬼怒川河川敷）', scale: '市', dates: ['2026-08-08'] },
  { city: '日光市', citySlug: 'nikko', slug: 'nikko-hanabi',
    name: '日光花火大会', kind: '花火',
    venue: '日光だいや川公園・丸山公園', scale: '市', dates: ['2026-08-08'] },
  { city: '那須町', citySlug: 'nasu', slug: 'ashino-shoten-hanabi',
    name: '芦野聖天花火大会（第72回）', kind: '花火',
    venue: '芦野御殿山', scale: '市', dates: ['2026-08-19'] },
  { city: '壬生町', citySlug: 'mibu', slug: 'mibu-furusato-matsuri',
    name: '壬生ふるさとまつり', kind: '夏祭り',
    venue: '壬生町総合公園 陸上競技場', scale: '市', dates: ['2026-08-22'] },
  { city: '那須塩原市', citySlug: 'nasushiobara', slug: 'nasuno-furusato-hanabi',
    name: '那須野ふるさと花火大会', kind: '花火',
    venue: '那珂川河畔運動公園', scale: '市', dates: ['2026-09-19'] },
  { city: '小山市', citySlug: 'oyama', slug: 'oyama-no-hanabi',
    name: '小山の花火（第74回）', kind: '花火',
    venue: '観晃橋下流 思川河畔', scale: '市', station: '小山', dates: ['2026-10-03'] },
  { city: '大田原市', citySlug: 'otawara', slug: 'sakuyama-hanabi',
    name: '与一の里大田原 佐久山花火大会', kind: '花火',
    venue: '箒川岩井橋付近・佐久山運動公園', scale: '市', dates: ['2026-10-17'] },
  { city: '市貝町', citySlug: 'ichikai', slug: 'ichikai-aki-matsuri',
    name: 'ICHIKAI秋まつり', kind: '秋祭り',
    venue: '市貝町役場周辺 特設会場', scale: '市', tags: ['花火'], dates: ['2026-10-17'] },
  { city: '芳賀町', citySlug: 'haga', slug: 'haga-roman-hanabi',
    name: '芳賀町ロマン花火大会 2026', kind: '花火',
    venue: '道の駅はが 芳賀温泉ロマンの湯・芳賀町役場周辺', scale: '市',
    dates: ['2026-12-06'] },
].map((r) => ({ ...r, stalls: 'yes', tags: [...(r.tags ?? []), '花火'] })), {
  pref: '栃木県', prefSlug: 'tochigi',
  label: '栃木県（花火・屋台あり）',
  source: HB('ar0309'), sourceName: '花火大会2026（ウォーカープラス）',
  sourceType: 'aggregator',
  checkedAt: '2026-08-03', year: 2026,
});

// ---- 千葉県 ----
emit([
  { city: '館山市', citySlug: 'tateyama', slug: 'tateyama-wan-hanabi',
    name: '館山観光まつり 館山湾花火大会（第62回）', kind: '花火',
    venue: '汐入川河口導流堤・館山湾', scale: '市', station: '館山',
    dates: ['2026-08-08'] },
  { city: '東金市', citySlug: 'togane', slug: 'yassa-togane-sai',
    name: 'ヤッサ東金祭', kind: '夏祭り',
    venue: '東金中央公園', scale: '市', tags: ['花火'], dates: ['2026-08-08'] },
  { city: '鎌ケ谷市', citySlug: 'kamagaya', slug: 'kamagaya-hanabi',
    name: 'かまがやの花火（第7回）', kind: '花火',
    venue: '福太郎スタジアム・福太郎アリーナ', scale: '市', dates: ['2026-08-11'] },
  { city: '南房総市', citySlug: 'minamiboso', slug: 'chikura-bon-festa',
    name: 'ちくらBONフェスタ', kind: '盆踊り',
    venue: '千倉漁港・瀬戸浜海岸', scale: '市', tags: ['花火'],
    dates: ['2026-08-13', '2026-08-14', '2026-08-15'] },
  { city: '野田市', citySlug: 'noda', slug: 'sekiyado-matsuri-hanabi',
    name: '野田市関宿まつり花火大会（第33回）', kind: '花火',
    venue: '関宿ふれあい広場（江戸川河川敷）', scale: '市', dates: ['2026-08-22'] },
  { city: '八千代市', citySlug: 'yachiyo', slug: 'yachiyo-furusato-oyakosai',
    name: '八千代ふるさと親子祭（第52回）', kind: '市民祭',
    venue: '県立八千代広域公園周辺', scale: '市', tags: ['花火'], dates: ['2026-08-22'] },
  { city: '大網白里市', citySlug: 'oamishirasato', slug: 'oamishirasato-hanabi',
    name: 'おおあみしらさとの花火', kind: '花火',
    venue: '白里海岸', scale: '市', dates: ['2026-09-26'] },
].map((r) => ({ ...r, stalls: 'yes', tags: [...(r.tags ?? []), '花火'] })), {
  pref: '千葉県', prefSlug: 'chiba',
  label: '千葉県（花火・屋台あり）',
  source: HB('ar0312'), sourceName: '花火大会2026（ウォーカープラス）',
  sourceType: 'aggregator',
  checkedAt: '2026-08-03', year: 2026,
});

// ---- 東京都 ----
// アーティストの周年イベントや遊園地の常設ショーは地域の祭りではないので入れない
emit([
  { city: '奥多摩町', citySlug: 'okutama', slug: 'okutama-noryo-hanabi',
    name: '奥多摩納涼花火大会（第49回）', kind: '花火',
    venue: '愛宕山広場', scale: '市', station: '奥多摩', dates: ['2026-08-08'] },
  { city: '大島町', citySlug: 'oshima', slug: 'izuoshima-natsumatsuri-hanabi',
    name: '伊豆大島夏まつり花火大会（第46回）', kind: '夏祭り',
    venue: '元町港・元町港ロータリー付近', scale: '市', tags: ['花火'],
    dates: ['2026-08-08'] },
  { city: '八丈町', citySlug: 'hachijo', slug: 'hachijojima-noryo-hanabi',
    name: '八丈島納涼花火大会（第25回）', kind: '花火',
    venue: '底土港', scale: '市', dates: ['2026-08-11'] },
  { city: '昭島市', citySlug: 'akishima', slug: 'akishima-kujira-matsuri',
    name: '昭島市民くじら祭 夢花火（第54回）', kind: '市民祭',
    venue: '昭島市民球場', scale: '市', station: '昭島', tags: ['花火'],
    dates: ['2026-08-29'] },
  { city: '調布市', citySlug: 'chofu', slug: 'chofu-hanabi',
    name: '調布花火（第41回）', kind: '花火',
    venue: '調布市 多摩川周辺', scale: '市', station: '京王多摩川',
    dates: ['2026-09-12'] },
  { city: '世田谷区', citySlug: 'setagaya', slug: 'tamagawa-hanabi',
    name: '世田谷区たまがわ花火大会（第48回）', kind: '花火',
    venue: '区立二子玉川緑地運動場', scale: '区', station: '二子玉川',
    dates: ['2026-10-03'] },
].map((r) => ({ ...r, stalls: 'yes', tags: [...(r.tags ?? []), '花火'] })), {
  pref: '東京都', prefSlug: 'tokyo',
  label: '東京都（花火・屋台あり）',
  source: HB('ar0313'), sourceName: '花火大会2026（ウォーカープラス）',
  sourceType: 'aggregator',
  checkedAt: '2026-08-03', year: 2026,
});

// ---- 神奈川県（未収録分）----
emit([
  { city: '平塚市', citySlug: 'hiratsuka', slug: 'shonan-hiratsuka-hanabi',
    name: '湘南ひらつか花火大会（第74回）', kind: '花火',
    venue: 'ひらつかタマ三郎漁港（新港）', scale: '市', station: '平塚',
    dates: ['2026-08-28'] },
  { city: '相模原市', citySlug: 'sagamihara', ward: '中央区', wardSlug: 'sagamihara-chuo',
    slug: 'sagamihara-noryo-hanabi',
    name: '相模原納涼花火大会（第53回）', kind: '花火',
    venue: '相模川 高田橋上流', scale: '区', dates: ['2026-09-05'] },
].map((r) => ({ ...r, stalls: 'yes', tags: ['花火'] })), {
  pref: '神奈川県', prefSlug: 'kanagawa',
  label: '神奈川県（花火・屋台あり）',
  source: HB('ar0314'), sourceName: '花火大会2026（ウォーカープラス）',
  sourceType: 'aggregator',
  checkedAt: '2026-08-03', year: 2026,
});

// ---- 埼玉県 ----
// 遊園地・スタジアムの常設イベントは地域の祭りではないので入れない
emit([
  { city: 'さいたま市', citySlug: 'saitama', ward: '緑区', wardSlug: 'saitama-midori',
    slug: 'saitama-hanabi-omagi-midori',
    name: 'さいたま市花火大会 東浦和 大間木公園会場', kind: '花火',
    venue: '大間木公園周辺', scale: '市', dates: ['2026-08-08'] },
  { city: '熊谷市', citySlug: 'kumagaya', slug: 'kumagaya-hanabi',
    name: '熊谷花火大会（第74回）', kind: '花火',
    venue: '荒川河畔（荒川大橋下流）', scale: '市', station: '熊谷',
    dates: ['2026-08-08'] },
  { city: '春日部市', citySlug: 'kasukabe', slug: 'kasukabe-odako-hanabi',
    name: '春日部大凧花火大会', kind: '花火',
    venue: '庄和総合公園', scale: '市', dates: ['2026-08-22'] },
  { city: '伊奈町', citySlug: 'ina', slug: 'ina-matsuri',
    name: '伊奈まつり 2026', kind: '夏祭り',
    venue: '伊奈町制施行記念公園', scale: '市', tags: ['花火'],
    dates: ['2026-08-22'] },
  { city: '川口市', citySlug: 'kawaguchi', slug: 'tatara-matsuri',
    name: 'たたら祭り フィナーレ花火（第46回）', kind: '市民祭',
    venue: '川口オートレース場', scale: '市', station: '川口', tags: ['花火'],
    dates: ['2026-09-27'] },
  { city: '鴻巣市', citySlug: 'konosu', slug: 'konosu-hanabi',
    name: 'こうのす花火大会（第23回）', kind: '花火',
    venue: '糠田運動場および荒川河川敷', scale: '市', station: '鴻巣',
    dates: ['2026-10-10'] },
].map((r) => ({ ...r, stalls: 'yes', tags: [...(r.tags ?? []), '花火'] })), {
  pref: '埼玉県', prefSlug: 'saitama',
  label: '埼玉県（花火・屋台あり）',
  source: HB('ar0311'), sourceName: '花火大会2026（ウォーカープラス）',
  sourceType: 'aggregator',
  checkedAt: '2026-08-03', year: 2026,
});
