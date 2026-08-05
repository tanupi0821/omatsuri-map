/**
 * 神奈川県 その他市町村：神社・寺・行政の一次情報からの収集
 *
 * まとめサイトの市町村ページでは日程が確定して載っておらず、収録ゼロになった
 * 7 市町村（伊勢原・寒川・南足柄・二宮・中井・愛川・清川）を、
 * 神社・寺の公式や町の公式ページから埋める。
 *
 * まとめサイトが「2026年の日程は公式発表待ち」と書いている祭りでも、
 * 神社側は例祭日を決め打ちで公開していることが多い。ここが効く。
 */
import { emit } from './_lib.mjs';

const c = (name, slug) => ({ city: name, citySlug: slug });

const ROWS = [
  // ---------------- 伊勢原市 ----------------
  { ...c('伊勢原市', 'isehara'), slug: 'oyama-afuri-kaki-taisai',
    name: '大山阿夫利神社 夏季大祭', kind: '例大祭',
    organizer: '大山阿夫利神社', venue: '大山阿夫利神社', shrine: '大山阿夫利神社', scale: '市',
    recurrence: '7月27日から8月17日',
    recurrenceSource: 'https://www.afuri.or.jp/annual/',
    dates: ['2026-07-27', '2026-08-17'],
    note: '7/27に例大祭・夏季大祭始め、8/17に夏季大祭収め。掲載の2日付は期間の初日と最終日。8/18は二重神社祭',
    source: 'https://www.afuri.or.jp/annual/', sourceName: '大山阿夫利神社 公式', sourceType: 'official' },

  { ...c('伊勢原市', 'isehara'), slug: 'oyama-afuri-shuki-reitaisai',
    name: '大山阿夫利神社 秋季例大祭', kind: '例大祭',
    organizer: '大山阿夫利神社', venue: '大山阿夫利神社', shrine: '大山阿夫利神社', scale: '市',
    dates: ['2026-08-27', '2026-08-28', '2026-08-29'],
    links: ['https://www.city.isehara.kanagawa.jp/kankou_guide/docs/2014100700027/index.html.r'],
    source: 'https://www.afuri.or.jp/annual/', sourceName: '大山阿夫利神社 公式', sourceType: 'official' },

  // ---------------- 寒川町 ----------------
  // 浜降祭そのものの本会場は茅ヶ崎市。寒川町側では発輿祭・御旅所祭・還幸祭が行われる
  { ...c('寒川町', 'samukawa'), slug: 'samukawa-hamaorisai',
    name: '寒川神社 浜降祭（発輿祭・御旅所祭・還幸祭）', kind: '例大祭',
    organizer: '寒川神社', venue: '寒川神社・寒川町商工会館前', shrine: '寒川神社',
    scale: '市', tags: ['神輿'],
    recurrence: '7月の海の日',
    recurrenceSource: 'https://samukawajinjya.jp/en/festival/hamaorisai.html',
    dates: ['2026-07-20'], start: '02:30', end: '12:00',
    note: '2:30 発輿祭（神社から神輿が出る）、7:00 浜降祭（茅ヶ崎・南湖の西浜海岸で合同祭）、10:15 御旅所祭（寒川町商工会館前）、12:00 還幸祭（神社に戻る）。寒川町・茅ヶ崎市の34社・約40基の神輿が集まる。合同祭の会場は茅ヶ崎市',
    source: 'https://samukawajinjya.jp/en/festival/hamaorisai.html',
    sourceName: '寒川神社 公式', sourceType: 'official' },

  // ---------------- 南足柄市 ----------------
  { ...c('南足柄市', 'minamiashigara'), slug: 'ashigara-kintaro-matsuri',
    name: '足柄金太郎まつり（第50回）', kind: '夏祭り',
    organizer: '南足柄市', venue: '南足柄市内', scale: '市', tags: ['神輿', '山車', '花火'],
    dates: ['2026-08-02'],
    note: '市内最大のまつり。御輿の巡行と山車文化の披露、ステージイベント。フィナーレの花火は20:15〜20:35',
    links: ['https://www.city.minamiashigara.kanagawa.jp/kankou/matsuri/p08650.html'],
    source: 'https://mcity-kankokyokai.com/?cat=4',
    sourceName: '南足柄市観光協会', sourceType: 'official' },

  { ...c('南足柄市', 'minamiashigara'), slug: 'daiyuzan-saijoji-taisai',
    name: '大雄山最乗寺 道了尊大祭（9月大祭）', kind: '神事',
    organizer: '大雄山最乗寺', venue: '大雄山最乗寺', scale: '市',
    recurrence: '1月・5月・9月の27日〜28日（年3回）',
    recurrenceSource: 'https://www.city.minamiashigara.kanagawa.jp/kankou/matsuri/p08650.html',
    dates: ['2026-09-27', '2026-09-28'], status: 'estimated',
    note: '日付は「1・5・9月の27〜28日」という決まりから導いたもので、寺が2026年の日程として発表したものではない',
    source: 'https://www.city.minamiashigara.kanagawa.jp/kankou/matsuri/p08650.html',
    sourceName: '南足柄市 公式', sourceType: 'gov' },

  // ---------------- 二宮町 ----------------
  { ...c('二宮町', 'ninomiya'), slug: 'kawawa-jinja-reitaisai',
    name: '川勾神社 例大祭', kind: '例大祭',
    organizer: '川勾神社', venue: '川勾神社および町内・海岸', shrine: '川勾神社',
    scale: '市', tags: ['神輿', '花火', '屋台'],
    recurrence: '10月第2日曜日',
    recurrenceSource: 'https://www.town.ninomiya.kanagawa.jp/0000001323.html',
    dates: ['2026-10-11'], status: 'estimated',
    note: '相模國二之宮。早朝から夜にかけて神輿が町内をまわり、夕刻から海岸で浜降り祭（みそぎ祭）。花火の打ち上げと屋台も出る。日付は「10月第2日曜日」から導いたもの',
    links: ['https://www.kawawajinja.com/schedule.html'],
    source: 'https://www.town.ninomiya.kanagawa.jp/0000001323.html',
    sourceName: '二宮町 公式', sourceType: 'gov' },

  // ---------------- 中井町 ----------------
  { ...c('中井町', 'nakai'), slug: 'gosho-hachimangu-reitaisai',
    name: '五所八幡宮 例大祭', kind: '例大祭',
    organizer: '五所八幡宮', venue: '五所八幡宮', shrine: '五所八幡宮', scale: '市',
    tags: ['鷺の舞', 'かながわのまつり50選'],
    recurrence: '4月29日',
    recurrenceSource: 'https://www.town.nakai.kanagawa.jp/kyodo_shiryokan/bunka/omatsuri/3289.html',
    dates: ['2026-04-29'],
    note: '850年以上の歴史。東日本では当社と大磯六所神社、福島県勿来関熊野神社にしか見られない「鷺の舞」が奉納される。かながわのまつり50選',
    links: ['https://www.gosyo-hachimangu.com'],
    source: 'https://www.town.nakai.kanagawa.jp/kyodo_shiryokan/bunka/omatsuri/3289.html',
    sourceName: '中井町 公式', sourceType: 'gov' },

  // ---------------- 愛川町 ----------------
  { ...c('愛川町', 'aikawa'), slug: 'hasuge-jinja-hiwatari',
    name: '八菅神社 例祭（火渡り）', kind: '例大祭',
    organizer: '八菅神社', venue: '八菅神社', shrine: '八菅神社', scale: '市',
    tags: ['火渡り'],
    recurrence: '3月28日',
    recurrenceSource: 'https://www.town.aikawa.kanagawa.jp/soshiki/kankyou_keizai/syoko/kanko/event/17826.html',
    dates: ['2026-03-28'], start: '12:00', end: '14:00',
    note: '1年の無病息災を祈る荒行「火渡り」。一般も参加できる。奉納剣道は10:30頃から。山岳信仰の霊場だった八菅山の神社',
    source: 'https://www.town.aikawa.kanagawa.jp/soshiki/kankyou_keizai/syoko/kanko/event/17826.html',
    sourceName: '愛川町 公式', sourceType: 'gov' },

  // ---------------- 清川村 ----------------
  { ...c('清川村', 'kiyokawa'), slug: 'miyagase-furusato-matsuri',
    name: '宮ヶ瀬ふるさとまつり（第40回・清川村制70周年記念）', kind: '市民祭',
    organizer: '清川村', venue: '宮ヶ瀬湖畔・水の郷商店街', scale: '市', tags: ['花火'],
    dates: ['2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15', '2026-08-16'],
    note: '花火は8/12・8/15・8/16の19:30から約5分間',
    source: 'https://hanabi.walkerplus.com/detail/ar0314e00928/',
    sourceName: 'ウォーカープラス', sourceType: 'aggregator' },
];

emit(ROWS, {
  pref: '神奈川県',
  prefSlug: 'kanagawa',
  label: '神奈川県 神社・寺・行政の一次情報',
  checkedAt: '2026-08-02',
  year: 2026,
});
