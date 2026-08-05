/**
 * 全国の都道府県と、ウォーカープラスのエリアコード
 *
 * 花火大会DB・夏祭りDB は `ar<地方2桁><都道府県コード2桁>` という規則で、
 * 全 47 都道府県が同じ形で取れる。しかも**屋台の有無を属性として持っている**ので、
 * 「露店があるものだけ載せる」方針のまま全国に広げられる。
 *
 *   花火:   https://hanabi.walkerplus.com/list/<ar>/yatai/
 *   夏祭り: https://summer.walkerplus.com/odekake/list/<ar>/sg0999/yatai/
 */
export const PREFS = [
  { name: '北海道', slug: 'hokkaido', ar: 'ar0101' , region: '北海道' },
  { name: '青森県', slug: 'aomori', ar: 'ar0202' , region: '東北' },
  { name: '岩手県', slug: 'iwate', ar: 'ar0203' , region: '東北' },
  { name: '宮城県', slug: 'miyagi', ar: 'ar0204' , region: '東北' },
  { name: '秋田県', slug: 'akita', ar: 'ar0205' , region: '東北' },
  { name: '山形県', slug: 'yamagata', ar: 'ar0206' , region: '東北' },
  { name: '福島県', slug: 'fukushima', ar: 'ar0207' , region: '東北' },
  { name: '茨城県', slug: 'ibaraki', ar: 'ar0308' , region: '関東' },
  { name: '栃木県', slug: 'tochigi', ar: 'ar0309' , region: '関東' },
  { name: '群馬県', slug: 'gunma', ar: 'ar0310' , region: '関東' },
  { name: '埼玉県', slug: 'saitama', ar: 'ar0311' , region: '関東' },
  { name: '千葉県', slug: 'chiba', ar: 'ar0312' , region: '関東' },
  { name: '東京都', slug: 'tokyo', ar: 'ar0313' , region: '関東' },
  { name: '神奈川県', slug: 'kanagawa', ar: 'ar0314' , region: '関東' },
  { name: '山梨県', slug: 'yamanashi', ar: 'ar0419' , region: '中部' },
  { name: '長野県', slug: 'nagano', ar: 'ar0420' , region: '中部' },
  { name: '新潟県', slug: 'niigata', ar: 'ar0415' , region: '中部' },
  { name: '富山県', slug: 'toyama', ar: 'ar0516' , region: '中部' },
  { name: '石川県', slug: 'ishikawa', ar: 'ar0517' , region: '中部' },
  { name: '福井県', slug: 'fukui', ar: 'ar0518' , region: '中部' },
  { name: '岐阜県', slug: 'gifu', ar: 'ar0621' , region: '中部' },
  { name: '静岡県', slug: 'shizuoka', ar: 'ar0622' , region: '中部' },
  { name: '愛知県', slug: 'aichi', ar: 'ar0623' , region: '中部' },
  { name: '三重県', slug: 'mie', ar: 'ar0624' , region: '近畿' },
  { name: '滋賀県', slug: 'shiga', ar: 'ar0725' , region: '近畿' },
  { name: '京都府', slug: 'kyoto', ar: 'ar0726' , region: '近畿' },
  { name: '大阪府', slug: 'osaka', ar: 'ar0727' , region: '近畿' },
  { name: '兵庫県', slug: 'hyogo', ar: 'ar0728' , region: '近畿' },
  { name: '奈良県', slug: 'nara', ar: 'ar0729' , region: '近畿' },
  { name: '和歌山県', slug: 'wakayama', ar: 'ar0730' , region: '近畿' },
  { name: '鳥取県', slug: 'tottori', ar: 'ar0831' , region: '中国' },
  { name: '島根県', slug: 'shimane', ar: 'ar0832' , region: '中国' },
  { name: '岡山県', slug: 'okayama', ar: 'ar0833' , region: '中国' },
  { name: '広島県', slug: 'hiroshima', ar: 'ar0834' , region: '中国' },
  { name: '山口県', slug: 'yamaguchi', ar: 'ar0835' , region: '中国' },
  { name: '徳島県', slug: 'tokushima', ar: 'ar0936' , region: '四国' },
  { name: '香川県', slug: 'kagawa', ar: 'ar0937' , region: '四国' },
  { name: '愛媛県', slug: 'ehime', ar: 'ar0938' , region: '四国' },
  { name: '高知県', slug: 'kochi', ar: 'ar0939' , region: '四国' },
  { name: '福岡県', slug: 'fukuoka', ar: 'ar1040' , region: '九州' },
  { name: '佐賀県', slug: 'saga', ar: 'ar1041' , region: '九州' },
  { name: '長崎県', slug: 'nagasaki', ar: 'ar1042' , region: '九州' },
  { name: '熊本県', slug: 'kumamoto', ar: 'ar1043' , region: '九州' },
  { name: '大分県', slug: 'oita', ar: 'ar1044' , region: '九州' },
  { name: '宮崎県', slug: 'miyazaki', ar: 'ar1045' , region: '九州' },
  { name: '鹿児島県', slug: 'kagoshima', ar: 'ar1046' , region: '九州' },
  { name: '沖縄県', slug: 'okinawa', ar: 'ar1047' , region: '九州' },
];

/** 地方の並び（北から南）。エリアの選び方をこの単位でも出す */
export const REGIONS = ['北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州'];

export const byName = (n) => PREFS.find((p) => p.name === n) ?? null;
export const bySlug = (s) => PREFS.find((p) => p.slug === s) ?? null;
