/**
 * 一次情報での裏取り（花火大会 第7弾：北海道）
 *
 *   node scripts/enrich/primary-hanabi-07.mjs
 *
 * 方針は `primary-hanabi-01.mjs` の冒頭のとおり。対象は `aggregator` だったものだけ。
 *
 * 北海道で分かったこと:
 *
 * - **道内の大きな花火大会は新聞社が主催者**であることが多い。
 *   勝毎花火大会は十勝毎日新聞社、函館・釧路・北見は北海道新聞社。
 *   この場合、新聞社のページは「報道」ではなく**主催者の公式発表**なので `official`。
 *   北海道新聞は `hokkaido-np.co.jp/hanabi2026/<市名>/` に主催大会をまとめている。
 * - 逆に**主催でない新聞社の記事は `media` のまま**にすること。
 *   ここで `official` に上げたのは、そのページに自社が主催と書いてあるものだけ。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const WP = (code) => L('ウォーカープラス 花火大会2026（元の出典）', `https://hanabi.walkerplus.com/detail/${code}/`);
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 北海道
  // ------------------------------------------------------------------

  // 勝毎花火大会。主催の十勝毎日新聞社が大会概要のページを持っている
  ['hokkaido-008-hanabi-ar0101e01041', {
    organizer: '十勝毎日新聞社',
    venue: { name: '十勝川河川敷特設会場（十勝大橋下流400m付近）', address: '帯広市' },
    links: [
      L('勝毎花火大会 公式サイト 大会概要', 'https://kachimai-hanabi.com/pg.php?c=about_overview'),
      WP('ar0101e01041'),
    ],
    occurrence: {
      ...src(2026, 'https://kachimai-hanabi.com/pg.php?c=about_overview', '十勝毎日新聞社', 'official'),
      start_time: '19:20',
      end_time: '21:00',
      status: 'confirmed',
      note: '開場は15:00。荒天の場合は8月14日（金）に順延',
    },
  }],

  // おたる潮まつりの公式サイト。**花火は3日間の祭りの最終日**
  ['hokkaido-002-hanabi-ar0101e00713', {
    organizer: 'おたる潮まつり実行委員会',
    station: 'JR函館本線 小樽駅',
    links: [
      L('おたる潮まつり 公式サイト', 'https://otaru.ushiomatsuri.net/'),
      WP('ar0101e00713'),
    ],
    occurrence: {
      ...src(2026, 'https://otaru.ushiomatsuri.net/', 'おたる潮まつり実行委員会', 'official'),
      status: 'confirmed',
      note: '潮まつり自体は7月24日〜26日の3日間で、大花火大会は最終日。時刻は公式サイトに記載がなく、以前の発表による',
    },
  }],

  // 函館。**主催は函館港まつり実行委員会と北海道新聞函館支社**。
  // 打上場所の住所（大町15）はここで取れた
  ['hokkaido-013-hanabi-ar0101e00710', {
    organizer: '函館港まつり実行委員会・北海道新聞函館支社',
    station: 'JR函館駅',
    venue: { name: '緑の島', address: '函館市大町15' },
    links: [
      L('北海道新聞「2026年夏 道新主催花火大会情報（函館市）」', 'https://www.hokkaido-np.co.jp/hanabi2026/hakodate/'),
      WP('ar0101e00710'),
    ],
    occurrence: {
      ...src(2026, 'https://www.hokkaido-np.co.jp/hanabi2026/hakodate/', '北海道新聞函館支社（主催）', 'official'),
      start_time: '19:45',
      end_time: '20:50',
      status: 'confirmed',
      note: '小雨決行、荒天の場合は8月5日（水）に延期予定',
    },
  }],

  // 真駒内。主催は特定非営利活動法人真駒内花火大会
  ['hokkaido-025-hanabi-ar0101e01110', {
    organizer: '特定非営利活動法人真駒内花火大会',
    links: [
      L('北海道真駒内花火大会 2026 花火大会概要', 'https://www.makomanai-hanabi.com/about/'),
      WP('ar0101e01110'),
    ],
    occurrence: {
      ...src(2026, 'https://www.makomanai-hanabi.com/about/', '特定非営利活動法人真駒内花火大会', 'official'),
      start_time: '19:50',
      end_time: '20:50',
      status: 'confirmed',
      note: '開場は17:00。会場に駐車場はない',
    },
  }],

  // 北海道芸術花火。会場の住所（モエレ沼公園1-1）が取れた
  ['hokkaido-017-hanabi-ar0101e05892', {
    organizer: '北海道芸術花火2026開催委員会／NPO法人北海道芸術花火',
    venue: { name: 'モエレ沼公園', address: '札幌市東区モエレ沼公園1-1' },
    links: [
      L('北海道芸術花火2026 公式サイト', 'https://www.moere.jp/'),
      WP('ar0101e05892'),
    ],
    occurrence: {
      ...src(2026, 'https://www.moere.jp/', '北海道芸術花火2026開催委員会', 'official'),
      start_time: '19:30',
      end_time: '20:30',
      status: 'confirmed',
      note: '開場は16:00',
    },
  }],

  // 釧路。主催は北海道新聞釧路支社。会場の住所（幸町3丁目ほか）が取れた
  ['hokkaido-020-hanabi-ar0101e00342', {
    organizer: '北海道新聞釧路支社',
    station: 'JR釧路駅',
    venue: { name: '釧路川河口付近（幣舞橋下流）', address: '釧路市幸町3丁目ほか' },
    links: [
      L('北海道新聞「2026年夏 道新主催花火大会情報（釧路市）」', 'https://www.hokkaido-np.co.jp/hanabi2026/kushiro/'),
      WP('ar0101e00342'),
    ],
    occurrence: {
      ...src(2026, 'https://www.hokkaido-np.co.jp/hanabi2026/kushiro/', '北海道新聞釧路支社（主催）', 'official'),
      start_time: '19:00',
      status: 'confirmed',
    },
  }],

  // 北見。**会場は「小泉河川敷グラウンド（常呂川河畔）」**
  ['hokkaido-028-hanabi-ar0101e00975', {
    organizer: '第73回北見ぼんちまつり実行委員会・北見市観光協会・北海道新聞北見支社',
    venue: { name: '小泉河川敷グラウンド（常呂川河畔）', address: '北見市' },
    links: [
      L('北海道新聞「2026年夏 道新主催花火大会情報（北見市）」', 'https://www.hokkaido-np.co.jp/hanabi2026/kitami/'),
      WP('ar0101e00975'),
    ],
    occurrence: {
      ...src(2026, 'https://www.hokkaido-np.co.jp/hanabi2026/kitami/', '北海道新聞北見支社（主催）', 'official'),
      start_time: '19:40',
      end_time: '20:25',
      status: 'confirmed',
      note: '打上げは約45分間。荒天の場合は7月19日（日）に順延',
    },
  }],
], '花火・北海道');
