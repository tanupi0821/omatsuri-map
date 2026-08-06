/**
 * 北関東（群馬・茨城・栃木）の夏祭り
 *
 * 出典: 夏休みおでかけガイド（ウォーカープラス）の県別一覧
 *       https://summer.walkerplus.com/odekake/list/ar03XX/sg0999/
 *
 * この 3 県は神社庁に神社データベースが無く、町内会レベルをまとめている
 * 地域メディアも見つかっていない（まいぷれは北関東に版が無い）。
 * 現状ではこの全国系のまとめが最も網羅している。
 *
 * 一覧にはレース・マジックショー・ビアガーデンなど祭りでないものも混ざるので、
 * 祭り・盆踊り・花火・神事だけを選んで入れている。
 *
 * ここは出典が aggregator なので、主催者の一次情報が見つかり次第
 * scripts/enrich/ で格上げしていく対象。
 */
import { emit } from './_lib.mjs';

const WP = (ar) => `https://summer.walkerplus.com/odekake/list/${ar}/sg0999/`;
const g = (city, citySlug) => ({ pref: '群馬県', prefSlug: 'gunma', city, citySlug, source: WP('ar0310') });
const i = (city, citySlug) => ({ pref: '茨城県', prefSlug: 'ibaraki', city, citySlug, source: WP('ar0308') });
const t = (city, citySlug) => ({ pref: '栃木県', prefSlug: 'tochigi', city, citySlug, source: WP('ar0309') });

const ROWS = [
  // ======================== 群馬県 ========================
  { ...g('桐生市', 'kiryu'), slug: 'kurohone-natsumatsuri',
    name: 'くろほね夏まつり（第39回）', kind: '夏祭り',
    venue: 'わたらせ渓谷鐵道 水沼駅周辺', scale: '地区',
    dates: ['2026-08-15', '2026-08-16'] },

  { ...g('みどり市', 'midori-gunma'), slug: 'midori-summer-festa',
    name: 'みどりサマーフェスタ（第16回）', kind: '夏祭り',
    venue: 'みどり市内', scale: '市', dates: ['2026-08-29'] },

  { ...g('太田市', 'ota-gunma'), slug: 'ojima-neputa',
    name: '尾島ねぷたまつり', kind: '夏祭り',
    venue: '尾島地区', scale: '地区', tags: ['ねぷた', '山車'],
    dates: ['2026-08-14', '2026-08-15'] },

  { ...g('下仁田町', 'shimonita'), slug: 'shimonita-konnyaku-natsumatsuri',
    name: '下仁田こんにゃく夏祭り', kind: '夏祭り',
    venue: '下仁田町内', scale: '市', dates: ['2026-08-14'] },

  { ...g('富岡市', 'tomioka'), slug: 'oshima-no-himatsuri',
    name: '大島の火まつり', kind: '神事',
    venue: '大島地区', scale: '地区', tags: ['火祭り'],
    dates: ['2026-08-16'] },

  { ...g('高崎市', 'takasaki'), slug: 'takasaki-matsuri',
    name: '高崎まつり（第52回）', kind: '夏祭り',
    venue: '高崎市中心市街地', scale: '市', station: '高崎',
    tags: ['花火', '盆踊り', '山車'],
    dates: ['2026-08-22', '2026-08-23'],
    note: '群馬県最大級の夏祭り。約70万人が訪れ、約15,000発の花火。大盆踊り大会も行われる',
    links: ['https://www.takasaki-matsuri.jp/'] },

  { ...g('甘楽町', 'kanra'), slug: 'kanra-shokokai-natsumatsuri',
    name: '甘楽町商工会 夏まつり', kind: '夏祭り',
    venue: '甘楽町内', scale: '市', dates: ['2026-08-14'] },

  // ======================== 茨城県 ========================
  { ...i('つくばみらい市', 'tsukubamirai'), slug: 'takaoka-ryu-tsunabi',
    name: '高岡流綱火', kind: '神事',
    venue: '高岡地区', scale: '地区', tags: ['重要無形民俗文化財', '綱火'],
    dates: ['2026-08-23'],
    note: '操り人形と仕掛け花火を組み合わせた伝統行事' },

  { ...i('つくばみらい市', 'tsukubamirai'), slug: 'obari-matsushita-ryu-tsunabi',
    name: '小張松下流綱火', kind: '神事',
    venue: '小張地区', scale: '地区', tags: ['重要無形民俗文化財', '綱火'],
    dates: ['2026-08-24'] },

  { ...i('つくば市', 'tsukuba'), slug: 'matsuri-tsukuba',
    name: 'まつりつくば', kind: '市民祭',
    venue: 'つくば市中心部', scale: '市', tags: ['ねぶた', '山車'],
    dates: ['2026-08-22', '2026-08-23'] },

  { ...i('常総市', 'joso'), slug: 'joso-masakado-matsuri',
    name: '常総将門まつり（第43回）', kind: '夏祭り',
    venue: '常総市内', scale: '市', dates: ['2026-08-15'] },

  { ...i('下妻市', 'shimotsuma'), slug: 'shimotsuma-furin-matsuri',
    name: '風鈴まつり', kind: '夏祭り',
    venue: '下妻市内', scale: '市',
    dates: ['2026-07-25', '2026-08-23'],
    note: '7/25〜8/23の期間開催。掲載の2日付は期間の初日と最終日' },

  { ...i('行方市', 'namegata'), slug: 'namegata-natsumatsuri',
    name: 'なめがた夏祭り', kind: '夏祭り',
    venue: '行方市内', scale: '市', dates: ['2026-08-08', '2026-08-09'] },

  { ...i('行方市', 'namegata'), slug: 'kesonuma-inari-reitaisai',
    name: '化蘇沼稲荷神社 例大祭', kind: '例大祭',
    organizer: '化蘇沼稲荷神社', venue: '化蘇沼稲荷神社', shrine: '化蘇沼稲荷神社',
    scale: '地区', tags: ['奉納相撲'],
    dates: ['2026-08-23'] },

  { ...i('潮来市', 'itako'), slug: 'itako-gion-sairei',
    name: '潮来祇園祭禮', kind: '例大祭',
    venue: '潮来市中心部', scale: '市', tags: ['山車', '神輿'],
    dates: ['2026-08-07', '2026-08-08', '2026-08-09'] },

  { ...i('かすみがうら市', 'kasumigaura'), slug: 'ayumi-matsuri',
    name: 'あゆみ祭り（第36回）', kind: '夏祭り',
    venue: 'かすみがうら市内', scale: '市', dates: ['2026-08-16'] },

  // ======================== 栃木県 ========================
  { ...t('那須烏山市', 'nasukarasuyama'), slug: 'hanawa-no-tensai',
    name: '塙の天祭', kind: '神事',
    venue: '塙地区', scale: '地区', dates: ['2026-08-30'] },

  { ...t('宇都宮市', 'utsunomiya'), slug: 'orion-tanabata',
    name: 'オリオン七夕まつり', kind: '夏祭り',
    venue: 'オリオン通り商店街', scale: '地区', station: '宇都宮',
    dates: ['2026-07-31', '2026-08-01', '2026-08-02', '2026-08-03'] },

  { ...t('日光市', 'nikko'), slug: 'ashio-noryosai',
    name: '足尾町納涼祭', kind: '納涼祭',
    venue: '足尾町内', scale: '地区', dates: ['2026-08-13'] },

  { ...t('日光市', 'nikko'), slug: 'nikko-waraku-odori',
    name: '日光和楽踊り', kind: '盆踊り',
    venue: '日光市清滝', scale: '地区',
    dates: ['2026-08-07'],
    note: '古河電工日光事業所を会場とする、地域を代表する盆踊り' },

  { ...t('日光市', 'nikko'), slug: 'nantaisan-tohai-taisai',
    name: '男体山登拝大祭', kind: '神事',
    organizer: '日光二荒山神社', venue: '日光二荒山神社・男体山',
    shrine: '日光二荒山神社', scale: '市',
    dates: ['2026-07-31', '2026-08-07'],
    note: '7/31〜8/7の期間。掲載の2日付は期間の初日と最終日' },

  { ...t('日光市', 'nikko'), slug: 'nijusanya-sai',
    name: '二十三夜祭', kind: '神事',
    venue: '日光市内', scale: '地区', dates: ['2026-08-22'] },
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
    label: `${rows[0].pref}（ウォーカープラス）`,
    sourceName: '夏休みおでかけガイド（ウォーカープラス）',
    sourceType: 'aggregator',
    checkedAt: '2026-08-03',
    year: 2026,
  });
}
