/**
 * 北関東（群馬・茨城・栃木）の夏祭り その2
 *
 * 出典: 夏休みおでかけガイド（ウォーカープラス）県別一覧の 2〜3 ページ目
 *
 * 祇園祭・天王祭がとにかく多いのが北関東の特徴。7月中旬〜下旬に集中する。
 * 一覧に混ざるレース・マジックショー・物産フェアは除いてある。
 */
import { emit } from './_lib.mjs';

const WP = (ar, p) => `https://summer.walkerplus.com/odekake/list/${ar}/sg0999/${p}.html`;
const g = (city, citySlug, p) => ({ pref: '群馬県', prefSlug: 'gunma', city, citySlug, source: WP('ar0310', p) });
const i = (city, citySlug, p) => ({ pref: '茨城県', prefSlug: 'ibaraki', city, citySlug, source: WP('ar0308', p) });
const t = (city, citySlug, p) => ({ pref: '栃木県', prefSlug: 'tochigi', city, citySlug, source: WP('ar0309', p) });

const ROWS = [
  // ======================== 群馬県 ========================
  { ...g('前橋市', 'maebashi', 2), slug: 'ogo-gion-matsuri',
    name: '大胡祇園まつり', kind: '夏祭り', venue: '大胡地区', scale: '地区',
    dates: ['2026-07-25', '2026-07-26'] },

  { ...g('前橋市', 'maebashi', 3), slug: 'akagisan-lantern',
    name: '赤城山らんたん祭り', kind: '夏祭り', venue: '赤城山', scale: '地区',
    tags: ['灯籠'], dates: ['2026-08-01'] },

  { ...g('館林市', 'tatebayashi', 3), slug: 'tatebayashi-matsuri',
    name: '館林まつり', kind: '夏祭り', venue: '館林市内', scale: '市',
    dates: ['2026-07-18', '2026-07-19'] },

  { ...g('藤岡市', 'fujioka', 3), slug: 'oniishi-natsumatsuri',
    name: '鬼石夏祭り', kind: '夏祭り', venue: '鬼石地区', scale: '地区',
    dates: ['2026-07-18', '2026-07-19'] },

  { ...g('草津町', 'kusatsu', 3), slug: 'kusatsu-onsen-kanshasai',
    name: '草津温泉感謝祭（第80回）', kind: '夏祭り', venue: '草津温泉', scale: '市',
    dates: ['2026-08-01', '2026-08-02'] },

  { ...g('中之条町', 'nakanojo', 3), slug: 'shima-suiryosai',
    name: '四万水涼祭', kind: '夏祭り', venue: '四万温泉', scale: '地区',
    dates: ['2026-07-26'] },

  // ======================== 茨城県 ========================
  { ...i('笠間市', 'kasama', 2), slug: 'kasama-noryo-bonodori-hanabi',
    name: '笠間納涼盆踊り花火大会2026', kind: '盆踊り', venue: '笠間市内', scale: '市',
    tags: ['花火'], dates: ['2026-08-08', '2026-08-10'] },

  { ...i('桜川市', 'sakuragawa', 2), slug: 'sakuragawa-noryo-taikai',
    name: '納涼大会', kind: '納涼祭', venue: '桜川市内', scale: '市',
    dates: ['2026-08-15'] },

  { ...i('龍ケ崎市', 'ryugasaki', 2), slug: 'tsukumai',
    name: '撞舞（つくまい）', kind: '神事', venue: '龍ケ崎市内', scale: '市',
    tags: ['重要無形民俗文化財'], dates: ['2026-07-26'] },

  { ...i('下妻市', 'shimotsuma', 2), slug: 'furusato-matsuri-rengo-togyo',
    name: 'ふるさとまつり連合渡御', kind: '夏祭り', venue: '下妻市内', scale: '市',
    tags: ['神輿'], dates: ['2026-07-25'] },

  { ...i('結城市', 'yuki', 3), slug: 'yuki-natsumatsuri',
    name: '結城夏祭り', kind: '夏祭り', venue: '結城市内', scale: '市',
    dates: ['2026-07-12', '2026-07-19'],
    note: '7/12〜7/19の期間。掲載の2日付は期間の初日と最終日' },

  { ...i('筑西市', 'chikusei', 3), slug: 'shimodate-gion',
    name: '下館祇園まつり', kind: '夏祭り', venue: '筑西市内', scale: '市',
    tags: ['神輿'], dates: ['2026-07-23', '2026-07-24', '2026-07-25', '2026-07-26'] },

  { ...i('土浦市', 'tsuchiura', 3), slug: 'tsuchiura-gion',
    name: '土浦祇園まつり', kind: '夏祭り',
    venue: '土浦市内（川口町バス停前広場、市役所うらら大屋根広場前）', scale: '市',
    dates: ['2026-07-24', '2026-07-25', '2026-07-26'] },

  { ...i('行方市', 'namegata', 3), slug: 'aso-gion-umadashi',
    name: '麻生祇園馬出し祭', kind: '例大祭', venue: '行方市内', scale: '市',
    tags: ['神輿'], dates: ['2026-07-04', '2026-07-05'] },

  { ...i('稲敷市', 'inashiki', 3), slug: 'edosaki-gion',
    name: '江戸崎祇園祭', kind: '夏祭り', venue: '稲敷市内', scale: '市',
    dates: ['2026-07-24', '2026-07-25', '2026-07-26'] },

  // ======================== 栃木県 ========================
  { ...t('大田原市', 'otawara', 2), slug: 'yoichi-matsuri',
    name: '与一まつり（第43回）', kind: '夏祭り', venue: '大田原市内', scale: '市',
    dates: ['2026-08-07', '2026-08-08'] },

  { ...t('小山市', 'oyama', 2), slug: 'oyama-gion',
    name: '小山祇園祭', kind: '夏祭り', venue: '小山市内', scale: '市',
    dates: ['2026-07-19'] },

  { ...t('下野市', 'shimotsuke', 2), slug: 'shimotsuke-tozankai',
    name: 'しもつけ燈桜会（第8回）', kind: '夏祭り', venue: '下野国分寺', scale: '市',
    tags: ['灯籠'], dates: ['2026-07-19'] },

  { ...t('栃木市', 'tochigi-shi', 2), slug: 'tochigi-bon-matsuri',
    name: 'とちぎ盆祭り', kind: '盆踊り', venue: '栃木市内', scale: '市',
    dates: ['2026-07-25'] },

  { ...t('さくら市', 'sakura-tochigi', 2), slug: 'ujiie-shoko-matsuri',
    name: '氏家商工まつり2026', kind: '商店街', venue: '氏家地区', scale: '地区',
    dates: ['2026-07-18', '2026-07-19'] },

  { ...t('さくら市', 'sakura-tochigi', 2), slug: 'kitsuregawa-tennosai',
    name: '喜連川天王祭2026', kind: '例大祭', venue: '喜連川地区', scale: '地区',
    dates: ['2026-07-25'] },

  { ...t('宇都宮市', 'utsunomiya', 2), slug: 'chikatsu-jinja-natsumatsuri',
    name: '智賀都神社の夏祭り', kind: '夏祭り',
    organizer: '智賀都神社', venue: '智賀都神社', shrine: '智賀都神社', scale: '地区',
    dates: ['2026-07-25'] },

  { ...t('宇都宮市', 'utsunomiya', 2), slug: 'miyaichi-sai',
    name: '宮壹祭', kind: '夏祭り', venue: '宇都宮市内', scale: '市',
    dates: ['2026-07-05'] },

  { ...t('宇都宮市', 'utsunomiya', 3), slug: 'yasaka-jinja-tennosai',
    name: '八坂神社 天王祭', kind: '例大祭',
    organizer: '八坂神社', venue: 'JR宇都宮駅北側', shrine: '八坂神社', scale: '地区',
    dates: ['2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19'] },

  { ...t('宇都宮市', 'utsunomiya', 3), slug: 'futaarayama-tennosai',
    name: '宇都宮二荒山神社 天王祭', kind: '例大祭',
    organizer: '宇都宮二荒山神社', venue: '宇都宮二荒山神社', shrine: '宇都宮二荒山神社',
    scale: '市',
    dates: ['2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19', '2026-07-20'] },

  { ...t('宇都宮市', 'utsunomiya', 3), slug: 'oya-natsumatsuri',
    name: '大谷夏祭り（第4回）', kind: '夏祭り', venue: '大谷地区', scale: '地区',
    dates: ['2026-07-18'] },

  { ...t('益子町', 'mashiko', 2), slug: 'mashiko-gion',
    name: '益子祇園祭', kind: '例大祭', venue: '八坂神社周辺', shrine: '八坂神社',
    scale: '市', dates: ['2026-07-23', '2026-07-24', '2026-07-25'] },

  { ...t('日光市', 'nikko', 3), slug: 'kinugawa-ryuosai',
    name: '鬼怒川温泉 龍王祭', kind: '夏祭り', venue: '鬼怒川温泉街', scale: '地区',
    dates: ['2026-07-24', '2026-07-25'] },
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
    label: `${rows[0].pref}（ウォーカープラス 2〜3ページ目）`,
    sourceName: '夏休みおでかけガイド（ウォーカープラス）',
    sourceType: 'aggregator',
    checkedAt: '2026-08-03',
    year: 2026,
  });
}
