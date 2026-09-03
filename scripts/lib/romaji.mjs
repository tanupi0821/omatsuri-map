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
  // 同じ slug の市が 2 県にあると id が衝突する（id は県を含まない）。
  // 件数の少ない側に県名を足して分ける。東京都大田区・東京都府中市はそのまま
  太田市: 'ota-gunma',
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

  // ---- 愛知県（神社庁の神社DBに出てくるうち、nationwide.yml に無いものだけ）----
  // 名古屋市の区は、愛知のエリア定義では「名古屋市◯区」で 1 市区町村として扱う
  // （nationwide.yml がその形で持っているので合わせる）
  名古屋市中川区: 'nagoya-nakagawa',
  半田市: 'handa', 大府市: 'obu', 尾張旭市: 'owariasahi', 岩倉市: 'iwakura',
  日進市: 'nisshin', 清須市: 'kiyosu', 稲沢市: 'inazawa', 高浜市: 'takahama',
  長久手市: 'nagakute', 北名古屋市: 'kitanagoya',
  愛知郡東郷町: 'togo', 西春日井郡豊山町: 'toyoyama',
  丹羽郡大口町: 'oguchi', 丹羽郡扶桑町: 'fuso',
  海部郡大治町: 'oharu', 海部郡蟹江町: 'kanie', 海部郡飛島村: 'tobishima',
  知多郡阿久比町: 'agui', 知多郡東浦町: 'higashiura',
  額田郡幸田町: 'kota',
  北設楽郡設楽町: 'shitara', 北設楽郡豊根村: 'toyone',

  // ---- 広島県（神社庁の神社DBに出てくるうち、nationwide.yml に無いものだけ）----
  // 広島市の区も「広島市◯区」で 1 市区町村として扱う（nationwide.yml に合わせる）
  広島市東区: 'hiroshima-higashi', 広島市佐伯区: 'hiroshima-saeki',
  広島市安芸区: 'hiroshima-aki',
  安芸高田市: 'akitakata', 大竹市: 'otake',
  // nationwide.yml には「廿日市」（市が抜けている）で入っている。
  // 神社庁の住所は「廿日市市」なので、正しい名前の方をここで定義する
  廿日市市: 'hatsukaichi',
  // 郡が付かない町。出典が「安芸郡海田町」ではなく「海田町」と書いている
  海田町: 'kaita', 坂町: 'saka', 府中町: 'fuchucho', 北広島町: 'kitahiroshima',
  安芸太田町: 'akiota', 神石高原町: 'jinsekikogen', 大崎上島町: 'osakikamijima',

  // ---- 兵庫県（神社庁の神社DBに出てくるうち、nationwide.yml に無いものだけ）----
  // 神戸市は政令市として city=神戸市 / ward=◯区 で入れるので、区は書かない
  小野市: 'ono', 赤穂市: 'ako',
  多可郡多可町: 'taka', 赤穂郡上郡町: 'kamigori', 神崎郡市川町: 'ichikawa-cho',
  加古郡稲美町: 'inami', 加古郡播磨町: 'harima', 揖保郡太子町: 'taishi',

  // ---- 北海道（神社庁の神社DBに出てくるうち、nationwide.yml に無いものだけ）----
  // 住所は「桧山郡江差町」と郡付き。nationwide.yml が郡なしで持っている町
  // （江差町・乙部町・今金町・中札内村・更別村・枝幸町など）は import 側で
  // 郡を落として引き当てるので、ここには書かない
  札幌市西区: 'sapporo-nishi', 札幌市北区: 'sapporo-kita', 札幌市白石区: 'sapporo-shiroishi',
  札幌市厚別区: 'sapporo-atsubetsu', 札幌市手稲区: 'sapporo-teine', 札幌市清田区: 'sapporo-kiyota',
  士別市: 'shibetsu', 石狩市: 'ishikari', 歌志内市: 'utashinai', 夕張市: 'yubari',
  富良野市: 'furano',
  // 同じ読みが他県にある市町村は県名を足して分ける（id は県を含まないため）
  沙流郡日高町: 'hidaka-hokkaido', 上川郡清水町: 'shimizu-hokkaido',
  松前郡福島町: 'fukushima-hokkaido', 中川郡池田町: 'ikeda-hokkaido',
  上川郡上川町: 'kamikawa-cho', 釧路郡釧路町: 'kushiro-cho', 標津郡標津町: 'shibetsu-cho',
  中川郡豊頃町: 'toyokoro', 上川郡東神楽町: 'higashikagura', 天塩郡遠別町: 'embetsu',
  松前郡松前町: 'matsumae', 虻田郡豊浦町: 'toyoura', 野付郡別海町: 'betsukai',
  樺戸郡浦臼町: 'urausu', 奥尻郡奥尻町: 'okushiri', 様似郡様似町: 'samani',
  桧山郡上ノ国町: 'kaminokuni', 上川郡比布町: 'pippu', 天塩郡天塩町: 'teshio',
  岩内郡共和町: 'kyowa', 島牧郡島牧村: 'shimamaki', 夕張郡栗山町: 'kuriyama',
  留萌郡小平町: 'obira', 斜里郡清里町: 'kiyosato', 石狩郡当別町: 'tobetsu',
  浦河郡浦河町: 'urakawa', 利尻郡利尻富士町: 'rishirifuji', 古宇郡神恵内村: 'kamoenai',
  川上郡弟子屈町: 'teshikaga', 久遠郡せたな町: 'setana', 雨竜郡秩父別町: 'chippubetsu',
  苫前郡苫前町: 'tomamae', 夕張郡由仁町: 'yuni', 紋別郡雄武町: 'oumu',
  上川郡新得町: 'shintoku', 上川郡下川町: 'shimokawa', 桧山郡厚沢部町: 'assabu',
  夕張郡長沼町: 'naganuma', 苫前郡初山別村: 'shosanbetsu', 勇払郡安平町: 'abira',
  厚岸郡浜中町: 'hamanaka', 寿都郡寿都町: 'suttsu', 幌泉郡えりも町: 'erimo',
  古宇郡泊村: 'tomari', 寿都郡黒松内町: 'kuromatsunai', 増毛郡増毛町: 'mashike',
  余市郡仁木町: 'niki', 紋別郡西興部村: 'nishiokoppe', 樺戸郡月形町: 'tsukigata',
  磯谷郡蘭越町: 'rankoshi', 上川郡鷹栖町: 'takasu', 古平郡古平町: 'furubira',
  苫前郡羽幌町: 'haboro', 雨竜郡雨竜町: 'uryu', 紋別郡滝上町: 'takinoue',
  勇払郡占冠村: 'shimukappu', 枝幸郡浜頓別町: 'hamatonbetsu', 虻田郡留寿都村: 'rusutsu',
  樺戸郡新十津川町: 'shintotsukawa', 上川郡剣淵町: 'kembuchi', 余市郡赤井川村: 'akaigawa',
  枝幸郡中頓別町: 'nakatonbetsu', 空知郡上砂川町: 'kamisunagawa', 中川郡美深町: 'bifuka',
  上川郡東川町: 'higashikawa', 目梨郡羅臼町: 'rausu', 河東郡鹿追町: 'shikaoi',
  厚岸郡厚岸町: 'akkeshi', 天塩郡幌延町: 'horonobe', 礼文郡礼文町: 'rebun',
  網走郡津別町: 'tsubetsu', 常呂郡置戸町: 'oketo', 虻田郡京極町: 'kyogoku',
  河東郡上士幌町: 'kamishihoro', 紋別郡湧別町: 'yubetsu', 虻田郡倶知安町: 'kutchan',
  空知郡奈井江町: 'naie', 山越郡長万部町: 'oshamambe', 利尻郡利尻町: 'rishiri',
  斜里郡斜里町: 'shari', 上川郡和寒町: 'wassamu', 上川郡愛別町: 'aibetsu',
  有珠郡壮瞥町: 'sobetsu', 斜里郡小清水町: 'koshimizu', 雨竜郡妹背牛町: 'moseushi',
  空知郡南幌町: 'nanporo', 上川郡美瑛町: 'biei', 虻田郡真狩村: 'makkari',
  十勝郡浦幌町: 'urahoro', 空知郡上富良野町: 'kamifurano', 雨竜郡北竜町: 'hokuryu',
  雨竜郡幌加内町: 'horokanai', 中川郡中川町: 'nakagawa', 常呂郡佐呂間町: 'saroma',
  網走郡美幌町: 'bihoro', 沙流郡平取町: 'biratori', 白老郡白老町: 'shiraoi',
  天塩郡豊富町: 'toyotomi', 空知郡南富良野町: 'minamifurano', 川上郡標茶町: 'shibecha',
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

/**
 * **同名の市が 2 県にある場合の上書き。**
 * id は `<citySlug>-<出典>-<番号>` の形で都道府県を含まないので、
 * slug が同じだと id が衝突して検証が落ちる（東京都府中市の祭りが
 * 広島県府中市にも同じ id で作られ、ビルドが止まった）。
 * **件数の少ない側**に県名を足して分ける。
 */
export const CITY_SLUG_BY_PREF = {
  '広島県|府中市': 'fuchu-hiroshima',
  '群馬県|太田市': 'ota-gunma',
};
