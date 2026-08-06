/**
 * 市区町村名 → slug（ローマ字）
 *
 * ディレクトリ名と祭り id に使う。読みが一意に決まらない地名が多いので、
 * 機械変換ではなく表で持つ。都県を足すときはここに追記する。
 * 表にない市区町村は import 側で警告を出し、取り込まずに残す
 * （勝手に当て字の slug を作ると、あとで直せなくなるため）。
 */
export const CITY_SLUG = {
  // ---- 東京都（23区は area ファイル側。市町村部はここ）----
  八王子市: 'hachioji', 福生市: 'fussa', 奥多摩町: 'okutama', 大島町: 'oshima',
  八丈町: 'hachijo',
  三宅村: 'miyake', 新島村: 'niijima', 神津島村: 'kozushima', 利島村: 'toshima-mura', 小笠原村: 'ogasawara', 昭島市: 'akishima', 調布市: 'chofu', あきる野市: 'akiruno',
  稲城市: 'inagi', 立川市: 'tachikawa', 町田市: 'machida', 府中市: 'fuchu',

  // ---- 神奈川県（政令市の区は area ファイル側で定義済み）----
  横浜市: 'yokohama', 川崎市: 'kawasaki', 相模原市: 'sagamihara',
  横須賀市: 'yokosuka', 平塚市: 'hiratsuka', 鎌倉市: 'kamakura', 藤沢市: 'fujisawa',
  小田原市: 'odawara', 茅ヶ崎市: 'chigasaki', 逗子市: 'zushi', 三浦市: 'miura',
  秦野市: 'hadano', 厚木市: 'atsugi', 大和市: 'yamato', 伊勢原市: 'isehara',
  海老名市: 'ebina', 座間市: 'zama', 南足柄市: 'minamiashigara', 綾瀬市: 'ayase',
  葉山町: 'hayama', 寒川町: 'samukawa', 大磯町: 'oiso', 二宮町: 'ninomiya',
  中井町: 'nakai', 大井町: 'oi', 松田町: 'matsuda', 山北町: 'yamakita',
  開成町: 'kaisei', 箱根町: 'hakone', 真鶴町: 'manazuru', 湯河原町: 'yugawara',
  愛川町: 'aikawa', 清川村: 'kiyokawa',

  // ---- 埼玉県 ----
  さいたま市: 'saitama', 川越市: 'kawagoe', 熊谷市: 'kumagaya', 川口市: 'kawaguchi',
  行田市: 'gyoda', 秩父市: 'chichibu', 所沢市: 'tokorozawa', 飯能市: 'hanno',
  加須市: 'kazo', 本庄市: 'honjo', 東松山市: 'higashimatsuyama', 春日部市: 'kasukabe',
  狭山市: 'sayama', 羽生市: 'hanyu', 鴻巣市: 'konosu', 深谷市: 'fukaya',
  上尾市: 'ageo', 草加市: 'soka', 越谷市: 'koshigaya', 蕨市: 'warabi',
  戸田市: 'toda', 入間市: 'iruma', 朝霞市: 'asaka', 志木市: 'shiki',
  和光市: 'wako', 新座市: 'niiza', 桶川市: 'okegawa', 久喜市: 'kuki',
  北本市: 'kitamoto', 八潮市: 'yashio', 富士見市: 'fujimi', 三郷市: 'misato',
  蓮田市: 'hasuda', 坂戸市: 'sakado', 幸手市: 'satte', 鶴ヶ島市: 'tsurugashima',
  日高市: 'hidaka', 吉川市: 'yoshikawa', ふじみ野市: 'fujimino', 白岡市: 'shiraoka',
  伊奈町: 'ina', 三芳町: 'miyoshi', 毛呂山町: 'moroyama', 越生町: 'ogose',
  滑川町: 'namegawa', 嵐山町: 'ranzan', 小川町: 'ogawa', 川島町: 'kawajima',
  吉見町: 'yoshimi', 鳩山町: 'hatoyama', ときがわ町: 'tokigawa', 横瀬町: 'yokoze',
  皆野町: 'minano', 長瀞町: 'nagatoro', 小鹿野町: 'ogano', 東秩父村: 'higashichichibu',
  美里町: 'misato-saitama', 神川町: 'kamikawa', 上里町: 'kamisato', 寄居町: 'yorii',
  宮代町: 'miyashiro', 杉戸町: 'sugito', 松伏町: 'matsubushi',

  // ---- 千葉県（神社庁に神社DBが無いので、祭りを入れた市町村から順に足す）----
  香取市: 'katori', 成田市: 'narita', 千葉市: 'chiba', 佐倉市: 'sakura-chiba',
  木更津市: 'kisarazu', 銚子市: 'choshi', 館山市: 'tateyama', 一宮町: 'ichinomiya',
  船橋市: 'funabashi', 松戸市: 'matsudo', 柏市: 'kashiwa', 市川市: 'ichikawa',
  流山市: 'nagareyama', 我孫子市: 'abiko',
  匝瑳市: 'sosa', 旭市: 'asahi-chiba', 勝浦市: 'katsuura', 富里市: 'tomisato',
  野田市: 'noda', 富津市: 'futtsu', 茂原市: 'mobara', 九十九里町: 'kujukuri',
  印西市: 'inzai', 浦安市: 'urayasu', 多古町: 'tako',
  東金市: 'togane', 鎌ケ谷市: 'kamagaya', 南房総市: 'minamiboso',
  八千代市: 'yachiyo', 大網白里市: 'oamishirasato',

  // ---- 茨城県 ----
  石岡市: 'ishioka', 鹿嶋市: 'kashima', 水戸市: 'mito', 笠間市: 'kasama',
  土浦市: 'tsuchiura', 大洗町: 'oarai', つくば市: 'tsukuba', 日立市: 'hitachi',
  つくばみらい市: 'tsukubamirai', 常総市: 'joso', 下妻市: 'shimotsuma',
  行方市: 'namegata', 潮来市: 'itako', かすみがうら市: 'kasumigaura',
  桜川市: 'sakuragawa', 龍ケ崎市: 'ryugasaki', 結城市: 'yuki', 筑西市: 'chikusei',
  稲敷市: 'inashiki', 北茨城市: 'kitaibaraki', 取手市: 'toride',
  東海村: 'tokai', 大子町: 'daigo', ひたちなか市: 'hitachinaka',
  利根町: 'tone', 神栖市: 'kamisu',

  // ---- 栃木県 ----
  日光市: 'nikko', 那須烏山市: 'nasukarasuyama', 鹿沼市: 'kanuma',
  宇都宮市: 'utsunomiya', 真岡市: 'moka', 大田原市: 'otawara', 小山市: 'oyama',
  下野市: 'shimotsuke', 栃木市: 'tochigi-shi', さくら市: 'sakura-tochigi',
  益子町: 'mashiko', 那須町: 'nasu', 壬生町: 'mibu', 那須塩原市: 'nasushiobara',
  市貝町: 'ichikai', 芳賀町: 'haga',

  // ---- 群馬県 ----
  桐生市: 'kiryu', 沼田市: 'numata', 前橋市: 'maebashi', 富岡市: 'tomioka',
  高崎市: 'takasaki', みどり市: 'midori-gunma', 太田市: 'ota',
  下仁田町: 'shimonita', 甘楽町: 'kanra', 安中市: 'annaka', 渋川市: 'shibukawa',
  館林市: 'tatebayashi', 藤岡市: 'fujioka', 草津町: 'kusatsu', 中之条町: 'nakanojo',
  千代田町: 'chiyoda-gunma', 明和町: 'meiwa',
};

/** 政令市の区（都県をまたいで同名の区があるので、市ごとに分ける） */
export const WARD_SLUG = {
  千葉市: {
    中央区: 'chiba-chuo', 花見川区: 'hanamigawa', 稲毛区: 'inage',
    若葉区: 'wakaba', 緑区: 'chiba-midori', 美浜区: 'mihama',
  },
  さいたま市: {
    西区: 'saitama-nishi', 北区: 'saitama-kita', 大宮区: 'omiya', 見沼区: 'minuma',
    中央区: 'saitama-chuo', 桜区: 'sakura', 浦和区: 'urawa', 南区: 'saitama-minami',
    緑区: 'saitama-midori', 岩槻区: 'iwatsuki',
  },
};

export function citySlug(name) {
  return CITY_SLUG[name] ?? null;
}

export function wardSlug(city, ward) {
  return WARD_SLUG[city]?.[ward] ?? null;
}
