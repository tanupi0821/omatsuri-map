/**
 * 東京都の「屋台のある夏祭り」（未収録分）
 *
 * 出典: 夏休みおでかけガイド（ウォーカープラス）「屋台のある夏祭り」絞り込み
 *       https://summer.walkerplus.com/odekake/list/ar0313/sg0999/yatai/
 *
 * **「露店があるものだけ載せる」方針での追加。**
 * 出典が屋台の有無を属性として持っているので stalls: yes で入れられる。
 *
 * これまで集めてきたのが町会・自治会の盆踊りと神社の例大祭だったのに対し、
 * ここに出てくるのは駅前や商業施設の大規模な祭り。取りこぼしていた層。
 */
import { emit } from './_lib.mjs';

const WP = 'https://summer.walkerplus.com/odekake/list/ar0313/sg0999/yatai/';
const t = (city, citySlug) => ({ city, citySlug });

const ROWS = [
  { ...t('港区', 'minato'), slug: 'roppongi-hills-bonodori',
    name: '六本木ヒルズ盆踊り 2026', kind: '盆踊り',
    venue: '六本木ヒルズ アリーナ', scale: '区', station: '六本木',
    dates: ['2026-08-21', '2026-08-22', '2026-08-23'] },

  { ...t('品川区', 'shinagawa'), slug: 'osaki-newcity-bonodori',
    name: '大崎ニューシティ盆踊り大会（第36回）', kind: '盆踊り',
    venue: '大崎ニューシティ', scale: '地区', station: '大崎',
    dates: ['2026-08-21', '2026-08-22'] },

  { ...t('渋谷区', 'shibuya'), slug: 'shibuya-bonodori',
    name: '渋谷盆踊り（第7回）', kind: '盆踊り',
    venue: '渋谷区内', scale: '区', station: '渋谷',
    dates: ['2026-08-08'] },

  { ...t('杉並区', 'suginami'), slug: 'koenji-awaodori',
    name: '東京高円寺阿波おどり（第67回）', kind: '夏祭り',
    venue: '高円寺駅周辺の商店街', scale: '区', station: '高円寺',
    dates: ['2026-08-29', '2026-08-30'] },

  { ...t('杉並区', 'suginami'), slug: 'asagaya-tanabata',
    name: '阿佐谷七夕まつり（第70回）', kind: '夏祭り',
    venue: '阿佐谷パールセンター商店街ほか', scale: '区', station: '阿佐ケ谷',
    dates: ['2026-08-07', '2026-08-08', '2026-08-09', '2026-08-10', '2026-08-11'] },

  { ...t('豊島区', 'toshima'), slug: 'otsuka-awaodori',
    name: '東京大塚阿波おどり', kind: '夏祭り',
    venue: '大塚駅周辺', scale: '区', station: '大塚',
    dates: ['2026-08-29'] },

  { ...t('台東区', 'taito'), slug: 'ueno-natsumatsuri',
    name: '江戸趣味納涼大会 うえの夏まつり（第75回）', kind: '夏祭り',
    venue: '上野公園 不忍池周辺', scale: '区', station: '上野',
    dates: ['2026-07-10', '2026-08-11'],
    note: '7/10〜8/11の期間開催。掲載の2日付は期間の初日と最終日' },

  { ...t('台東区', 'taito'), slug: 'iriya-asagao',
    name: '入谷朝顔まつり（入谷朝顔市）', kind: '縁日',
    venue: '入谷鬼子母神（真源寺）・言問通り', scale: '区', station: '入谷',
    dates: ['2026-07-06', '2026-07-07', '2026-07-08'] },

  { ...t('墨田区', 'sumida'), slug: 'soramachi-ennichi',
    name: 'ソラマチこども縁日・墨田区民納涼民踊大会', kind: '縁日',
    venue: '東京ソラマチ', scale: '区', station: 'とうきょうスカイツリー',
    dates: ['2026-07-25', '2026-08-11'],
    note: '7/25〜8/11の期間開催。掲載の2日付は期間の初日と最終日' },

  { ...t('八王子市', 'hachioji'), slug: 'hachioji-matsuri',
    name: '八王子まつり', kind: '夏祭り',
    venue: '甲州街道（西放射線ユーロード周辺）', scale: '市', station: '八王子',
    tags: ['山車', '神輿'],
    dates: ['2026-08-07', '2026-08-08', '2026-08-09'] },

  { ...t('福生市', 'fussa'), slug: 'fussa-tanabata',
    name: '福生七夕まつり（第76回）', kind: '夏祭り',
    venue: 'JR福生駅・牛浜駅周辺', scale: '市', station: '福生',
    dates: ['2026-08-07', '2026-08-08', '2026-08-09'] },

  { ...t('千代田区', 'chiyoda'), slug: 'otemachi-ennichi',
    name: '大手町縁日 2026', kind: '縁日',
    venue: '大手町', scale: '区', station: '大手町',
    dates: ['2026-07-30', '2026-07-31'] },

  { ...t('千代田区', 'chiyoda'), slug: 'marunouchi-bonodori',
    name: '丸の内盆踊り 2026', kind: '盆踊り',
    venue: '丸の内', scale: '区', station: '東京',
    dates: ['2026-07-24'] },

  { ...t('港区', 'minato'), slug: 'shinbashi-koichi',
    name: '新橋こいち祭（第29回）', kind: '夏祭り',
    venue: '新橋駅前・SL広場周辺', scale: '区', station: '新橋',
    dates: ['2026-07-23', '2026-07-24'] },

  { ...t('大田区', 'ota'), slug: 'haneda-matsuri',
    name: '羽田神社 夏季例大祭（羽田まつり）', kind: '例大祭',
    organizer: '羽田神社', venue: '羽田神社および氏子地域', shrine: '羽田神社',
    scale: '区', station: '大鳥居', tags: ['神輿'],
    dates: ['2026-07-25', '2026-07-26'] },

  { ...t('新宿区', 'shinjuku'), slug: 'shinjuku-eisa',
    name: '新宿エイサーまつり（第23回）', kind: '夏祭り',
    venue: '新宿駅周辺', scale: '区', station: '新宿',
    dates: ['2026-07-25'] },

  { ...t('新宿区', 'shinjuku'), slug: 'kagurazaka-matsuri',
    name: '神楽坂まつり（第52回）', kind: '夏祭り',
    venue: '神楽坂通り・毘沙門天善國寺', scale: '区', station: '飯田橋',
    dates: ['2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25'] },

  { ...t('豊島区', 'toshima'), slug: 'sunshine-city-bonodori',
    name: 'サンシャインシティ納涼盆踊り大会（第47回）', kind: '盆踊り',
    venue: 'サンシャインシティ 噴水広場', scale: '区', station: '東池袋',
    dates: ['2026-07-30', '2026-07-31', '2026-08-01'] },
];

emit(ROWS.map((r) => ({ ...r, stalls: 'yes' })), {
  pref: '東京都',
  prefSlug: 'tokyo',
  label: '東京都（屋台あり）',
  source: WP,
  sourceName: '夏休みおでかけガイド（ウォーカープラス）',
  sourceType: 'aggregator',
  checkedAt: '2026-08-03',
  year: 2026,
});
