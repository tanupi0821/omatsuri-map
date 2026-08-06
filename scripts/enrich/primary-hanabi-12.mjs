/**
 * 一次情報での裏取り（花火大会 第12弾：九州・中国地方）
 *
 *   node scripts/enrich/primary-hanabi-12.mjs
 *
 * 方針は `primary-hanabi-01.mjs` の冒頭のとおり。対象は `aggregator` だったものだけ。
 *
 * 関門海峡花火大会は**下関市（山口）と門司区（福岡）が海峡をはさんで同時に上げる**ため、
 * データにも 2 件ある。主催も実行委員会が両側に分かれているので、
 * それぞれの実行委員会のページを出典にした（同じものにまとめない）。
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
  // 福岡県
  // ------------------------------------------------------------------

  // 門司側。**下関側とは主催が別**（関門海峡花火大会実行委員会門司）
  ['fukuoka-002-hanabi-ar1040e00932', {
    organizer: '関門海峡花火大会実行委員会門司',
    station: 'JR鹿児島本線 門司港駅',
    links: [
      L('2026関門海峡花火大会（門司側）公式サイト', 'https://www.kanmon-hanabi.love/'),
      WP('ar1040e00932'),
    ],
    occurrence: {
      ...src(2026, 'https://www.kanmon-hanabi.love/', '関門海峡花火大会実行委員会門司', 'official'),
      status: 'confirmed',
      note: '海峡をはさんで下関市と同時開催。時刻は門司側の公式サイトに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 熊本県
  // ------------------------------------------------------------------

  // やつしろ。**18:00開始で20:30終了と長い**（約135分）
  ['kumamoto-012-hanabi-ar1043e01051', {
    venue: { name: '球磨川河川緑地（新萩原橋上流）', address: '八代市' },
    links: [
      L('第39回やつしろ全国花火競技大会 公式サイト', 'https://www.8246hanabi.com/'),
      WP('ar1043e01051'),
    ],
    occurrence: {
      ...src(2026, 'https://www.8246hanabi.com/', 'やつしろ全国花火競技大会実行委員会（事務局：八代市観光振興課）', 'official'),
      start_time: '18:00',
      end_time: '20:30',
      status: 'confirmed',
      note: '小雨決行。荒天や増水で打上げ現場が流失した場合は11月7日（土）に延期。物産展・露店は12:00から',
    },
  }],

  // ------------------------------------------------------------------
  // 鹿児島県
  // ------------------------------------------------------------------

  // 川内川。会場は「西開聞町〜大小路町の河川敷一帯」
  ['kagoshima-003-hanabi-ar1046e00998', {
    organizer: '川内川花火大会実行委員会',
    venue: { name: '川内川河川敷一帯（西開聞町〜大小路町）', address: '薩摩川内市西開聞町' },
    links: [
      L('川内川花火大会 公式サイト', 'https://www.sendaihanabi.com/'),
      WP('ar1046e00998'),
    ],
    occurrence: {
      ...src(2026, 'https://www.sendaihanabi.com/', '川内川花火大会実行委員会', 'official'),
      start_time: '19:40',
      end_time: '20:30',
      status: 'confirmed',
      note: '雨天時は8月23日に延期',
    },
  }],

  // ------------------------------------------------------------------
  // 大分県
  // ------------------------------------------------------------------

  // おおいた「夢」花火。**ドローンショー19:15→花火19:30**の順
  ['oita-005-hanabi-ar1044e00983', {
    organizer: 'おおいた「夢」花火実行委員会',
    venue: { name: '大分川 弁天大橋上流', address: '大分市' },
    links: [
      L('大分市 おおいた「夢」花火2026を開催します', 'https://www.city.oita.oita.jp/o154/yumehanabi2026.html'),
      WP('ar1044e00983'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.oita.oita.jp/o154/yumehanabi2026.html', '大分市', 'gov'),
      start_time: '19:15',
      end_time: '20:30',
      status: 'confirmed',
      note: '19:15からドローンショー、19:30から花火の打上げ（約1時間）。荒天の場合は9月6日（日）に延期',
    },
  }],

  // 別府。**公式ページの会場は「北浜緑地帯」**（まとめサイトは打上げ場所の別府湾沖のみ）
  ['oita-011-hanabi-ar1044e00990', {
    organizer: 'べっぷ火の海まつり実行委員会',
    venue: { name: '北浜緑地帯（打上げは別府湾沖）', address: '別府市北浜' },
    links: [
      L('別府市観光協会 2026年度 べっぷ火の海まつり', 'https://beppu-event.jp/natsuyoi/'),
      WP('ar1044e00990'),
    ],
    occurrence: {
      ...src(2026, 'https://beppu-event.jp/natsuyoi/', '別府市観光協会', 'official'),
      status: 'confirmed',
      note: '火の海まつりは7月25日・26日の2日間で、納涼花火大会は26日。時刻は主催側のページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 広島県
  // ------------------------------------------------------------------

  // 福山。主催は福山祭委員会福山夏まつり実施本部
  ['hiroshima-002-hanabi-ar0834e00984', {
    organizer: '福山祭委員会 福山夏まつり実施本部',
    venue: { name: '芦田川大橋上流', address: '福山市' },
    links: [
      L('福山夏まつり2026 あしだ川花火大会 公式サイト', 'https://fukuyama-natsumatsuri.jp/ashida/'),
      WP('ar0834e00984'),
    ],
    occurrence: {
      ...src(2026, 'https://fukuyama-natsumatsuri.jp/ashida/', '福山祭委員会', 'official'),
      start_time: '19:30',
      end_time: '20:30',
      status: 'confirmed',
    },
  }],

  // 広島みなと。会場の住所（宇品海岸3丁目）が公式サイトで取れた
  ['hiroshima-008-hanabi-ar0834e00696', {
    organizer: '広島祭委員会',
    venue: { name: '広島港 1万トンバース沖', address: '広島市南区宇品海岸3丁目' },
    links: [
      L('広島みなと 夢 花火大会 公式サイト', 'https://www.minato-yumehanabi.com/'),
      WP('ar0834e00696'),
    ],
    occurrence: {
      ...src(2026, 'https://www.minato-yumehanabi.com/', '広島祭委員会', 'official'),
      start_time: '20:00',
      end_time: '21:00',
      status: 'confirmed',
      note: '会場は17:00開場、19:20からオープニングセレモニー',
    },
  }],

  // ------------------------------------------------------------------
  // 山口県
  // ------------------------------------------------------------------

  // 宇部。市のページに郵便番号つきの会場住所があった
  ['yamaguchi-009-hanabi-ar0835e01001', {
    organizer: '宇部市花火大会実行委員会（宇部商工会議所内）',
    venue: { name: '宇部港', address: '宇部市港町一丁目15番28号' },
    links: [
      L('宇部市 第72回宇部市花火大会', 'https://www.city.ube.yamaguchi.jp/kyouyou/event/1029412/1029394.html'),
      WP('ar0835e01001'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.ube.yamaguchi.jp/kyouyou/event/1029412/1029394.html', '宇部市', 'gov'),
      start_time: '20:00',
      end_time: '20:30',
      status: 'confirmed',
      note: '荒天の場合は7月26日（日）に延期。19:45から20:00はドローンショー',
    },
  }],
], '花火・九州／中国地方');
