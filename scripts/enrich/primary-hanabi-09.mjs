/**
 * 一次情報での裏取り（花火大会 第9弾：愛知県・新潟県）
 *
 *   node scripts/enrich/primary-hanabi-09.mjs
 *
 * 方針は `primary-hanabi-01.mjs` の冒頭のとおり。対象は `aggregator` だったものだけ。
 *
 * **同名の別大会に注意した例**: 「東海まつり花火大会」は
 * 愛知県東海市（第57回・大池公園）と茨城県東海村（第48回・阿漕ヶ浦公園）の
 * 両方にあり、2026年はどちらも 8月8日。回数と会場と市町村ドメインで
 * 取り違えていないことを確かめてから入れた。
 * 茨城県東海村のほうは `primary-hanabi-01.mjs` で扱っている。
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
  // 愛知県
  // ------------------------------------------------------------------

  // 東海市（愛知）の第57回。**茨城県東海村の第48回とは別の大会**
  ['aichi-001-hanabi-ar0623e00812', {
    organizer: '第57回東海まつり花火大会実行委員会',
    station: '名鉄常滑線 太田川駅',
    venue: { name: '大池公園', address: '愛知県東海市中央町3丁目' },
    links: [
      L('東海市 第57回東海まつり花火大会', 'https://www.city.tokai.aichi.jp/bunka/1002737/1006610/1009628.html'),
      WP('ar0623e00812'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.tokai.aichi.jp/bunka/1002737/1006610/1009628.html', '東海市', 'gov'),
      start_time: '19:20',
      end_time: '20:30',
      status: 'confirmed',
    },
  }],

  // 豊田おいでんまつり。**「マイタウンおいでん」→「おいでん総踊り」→花火大会**の
  // 3部構成で、花火は最終日の7月26日
  ['aichi-004-hanabi-ar0623e00808', {
    organizer: '豊田おいでんまつり実行委員会',
    links: [
      L('豊田おいでんまつり 公式サイト', 'https://www.oidenmaturi.com/'),
      WP('ar0623e00808'),
    ],
    occurrence: {
      ...src(2026, 'https://www.oidenmaturi.com/', '豊田おいでんまつり実行委員会', 'official'),
      status: 'confirmed',
      note: '7月25日が「おいでん総踊り」、26日が花火大会。時刻は公式サイトに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 新潟県
  // ------------------------------------------------------------------

  // 長岡。**開催日が毎年8月2日・3日で固定**されている珍しい大会
  ['niigata-009-hanabi-ar0415e00665', {
    organizer: '一般財団法人 長岡花火財団',
    links: [
      L('長岡花火 公式ウェブサイト（一般財団法人 長岡花火財団）', 'https://nagaokamatsuri.com/'),
      WP('ar0415e00665'),
    ],
    occurrence: {
      ...src(2026, 'https://nagaokamatsuri.com/', '一般財団法人 長岡花火財団', 'official'),
      start_time: '19:20',
      end_time: '21:25',
      status: 'confirmed',
      note: '開催日は毎年8月2日・3日で固定。会場内の観覧には有料観覧席チケットが必要（無料席はない）',
    },
  }],

  // 柏崎。主催はぎおん柏崎まつり協賛会
  ['niigata-016-hanabi-ar0415e00663', {
    organizer: 'ぎおん柏崎まつり協賛会',
    links: [
      L('ぎおん柏崎まつり 海の大花火大会 公式サイト', 'https://kashiwazaki-hanabi.jp/'),
      WP('ar0415e00663'),
    ],
    occurrence: {
      ...src(2026, 'https://kashiwazaki-hanabi.jp/', 'ぎおん柏崎まつり協賛会', 'official'),
      start_time: '19:30',
      status: 'confirmed',
      note: '終了時刻は公式サイトに記載がない',
    },
  }],

  // 三条。**打上場所は三条防災ステーション、指定観覧会場は六ノ町河川緑地**と
  // 分かれている。まとめサイトは「上須頃堤外地」しか持っていなかった
  ['niigata-018-hanabi-ar0415e00056', {
    organizer: '三条夏まつり協賛会',
    venue: { name: '三条防災ステーション（打上場所）／六ノ町河川緑地（指定観覧会場）', address: '新潟県三条市' },
    links: [
      L('三条夏まつり協賛会 行事スケジュール', 'https://sanjo-natsumatsuri.com/event-schedule/'),
      WP('ar0415e00056'),
    ],
    occurrence: {
      ...src(2026, 'https://sanjo-natsumatsuri.com/event-schedule/', '三条夏まつり協賛会', 'official'),
      start_time: '19:30',
      end_time: '21:30',
      status: 'confirmed',
      note: '三条夏まつりは7月31日・8月1日の2日間で、大花火大会は8月1日',
    },
  }],

  // 小千谷市のページ。会場は「信濃川旭橋下流左岸堤防」
  ['niigata-003-hanabi-ar0415e00060', {
    organizer: 'おぢやまつり実行委員会',
    venue: { name: '信濃川 旭橋下流左岸堤防', address: '新潟県小千谷市' },
    links: [
      L('小千谷市 おぢやまつり', 'https://www.city.ojiya.niigata.jp/site/kanko/ojiyamatsuri.html'),
      WP('ar0415e00060'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.ojiya.niigata.jp/site/kanko/ojiyamatsuri.html', '小千谷市', 'gov'),
      start_time: '19:30',
      end_time: '21:00',
      status: 'confirmed',
      note: 'おぢやまつりは8月21日〜23日の3日間で、大花火大会は22日。予備日は23日',
    },
  }],

  // 阿賀野川ござれや花火。**主催は新潟市北区**（区役所）
  ['niigata-004-hanabi-ar0415e00061', {
    organizer: '新潟市北区',
    venue: { name: '阿賀野川 松浜橋上流側', address: '新潟県新潟市北区松浜本町（右岸）・東区津島屋（左岸）' },
    links: [
      L('阿賀野川ござれや花火 公式サイト 大会概要', 'https://www.gozareya.jp/overview'),
      L('新潟市北区 阿賀野川ござれや花火', 'https://www.city.niigata.lg.jp/kita/about/fubutsu/fireworks.html'),
      WP('ar0415e00061'),
    ],
    occurrence: {
      ...src(2026, 'https://www.gozareya.jp/overview', '阿賀野川ござれや花火大会実行委員会', 'official'),
      start_time: '19:50',
      end_time: '21:00',
      status: 'confirmed',
      note: '開会セレモニーは19:30頃から、打上げは20:00頃から',
    },
  }],

  // 見附市のページ。会場の番地（本町字焼田所1308番地3）が取れた
  ['niigata-012-hanabi-ar0415e511938', {
    organizer: '見附まつり実行委員会',
    venue: { name: '見附運動公園多目的グラウンド内特設会場', address: '新潟県見附市本町字焼田所1308番地3' },
    links: [
      L('見附市 第58回見附まつり花火大会インフォメーション', 'https://www.city.mitsuke.niigata.jp/soshiki/4/26486.html'),
      WP('ar0415e511938'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.mitsuke.niigata.jp/soshiki/4/26486.html', '見附市', 'gov'),
      start_time: '19:30',
      end_time: '20:30',
      status: 'confirmed',
      note: '雨天時は7月20日に順延',
    },
  }],

  // 上越。**上越市の公式観光サイトに時刻の記載が無い**ので時刻は触らず、
  // 出典だけ差し替えた
  ['niigata-017-hanabi-ar0415e00664', {
    links: [
      L('上越観光Navi（上越市公式観光情報サイト）上越まつり 大花火大会', 'https://joetsukankonavi.jp/joetsumatsuri/hanabi/'),
      WP('ar0415e00664'),
    ],
    occurrence: {
      ...src(2026, 'https://joetsukankonavi.jp/joetsumatsuri/hanabi/', '上越市（上越観光Navi）', 'gov'),
      status: 'confirmed',
      note: '上越まつりは7月23日〜29日。大花火大会は直江津地区の祇園祭の一部。打上時刻は上越市のページに記載がなく、以前の発表による',
    },
  }],
], '花火・愛知県／新潟県');
