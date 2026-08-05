/**
 * 一次情報での裏取り（第27弾：既存リンクからの格上げ その14）
 *
 *   node scripts/enrich/primary-hanabi-27.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。この回も 8 件すべて当たった。
 *
 * 水都まつり（大垣市）でまた**複数日開催の取りこぼし**（3日開催のうち2日分しか
 * 持っていなかった）。この型はこれで6件目。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 埼玉県
  // ------------------------------------------------------------------

  // 大宮日進七夕まつり。会場は日進駅南口の七夕通りと日進小学校の校庭
  ['saitama-001-summer-ar0311e72577', {
    organizer: '大宮日進七夕まつり実行委員会',
    station: 'JR川越線 日進駅南口',
    venue: { name: '日進七夕通り周辺・日進小学校校庭', address: '埼玉県さいたま市北区日進町' },
    links: [L('VISIT SAITAMA CITY 大宮夏まつり 第54回大宮日進七夕まつり2026', 'https://visitsaitamacity.jp/events/26')],
    occurrence: {
      ...src(2026, 'https://visitsaitamacity.jp/events/26', '公益社団法人さいたま観光国際協会', 'official'),
      start_time: '15:00',
      end_time: '21:00',
      status: 'confirmed',
    },
  }],

  // 中山道まつり。**8月1日は21:00まで、2日は22:00まで**
  ['saitama-003-summer-ar0311e72219', {
    organizer: '中山道まつり実行委員会',
    station: 'JR・東武 大宮駅',
    venue: { name: '大宮駅東口周辺', address: '埼玉県さいたま市大宮区' },
    links: [L('VISIT SAITAMA CITY 大宮夏まつり 2026中山道まつり', 'https://visitsaitamacity.jp/events/24')],
    occurrence: {
      ...src(2026, 'https://visitsaitamacity.jp/events/24', '公益社団法人さいたま観光国際協会', 'official'),
      start_time: '17:00',
      end_time: '22:00',
      status: 'confirmed',
      note: '8月1日は17:00〜21:00、2日は17:00〜22:00',
    },
  }],

  // 長瀞船玉まつり。**開催日は毎年8月15日**で固定
  ['saitama-002-summer-ar0311e357292', {
    recurrence: '8月15日',
    recurrence_source: 'https://www.nagatoro.gr.jp/spot/matsuri/',
    venue: { name: '長瀞岩畳', address: '埼玉県秩父郡長瀞町長瀞' },
    links: [L('長瀞町観光協会 長瀞船玉まつり', 'https://www.nagatoro.gr.jp/spot/matsuri/')],
    occurrence: {
      ...src(2026, 'https://www.nagatoro.gr.jp/spot/matsuri/', '長瀞町観光協会', 'official'),
      status: 'confirmed',
      note: '開催日は毎年8月15日。時刻は観光協会のページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 神奈川県
  // ------------------------------------------------------------------

  // 湘南ひらつか七夕まつり。**最終日だけ19:00で終わる**
  ['hiratsuka-shonan-hiratsuka-tanabata', {
    organizer: '湘南ひらつか七夕まつり実行委員会',
    station: 'JR東海道本線 平塚駅北口（徒歩2分）',
    venue: { name: '平塚市中心街および市内各所', address: '神奈川県平塚市' },
    links: [L('平塚市 第74回湘南ひらつか七夕まつり', 'https://www.city.hiratsuka.kanagawa.jp/kanko/page-c_01099.html')],
    occurrence: {
      ...src(2026, 'https://www.city.hiratsuka.kanagawa.jp/kanko/page-c_01099.html', '平塚市', 'gov'),
      end_time: '20:30',
      status: 'confirmed',
      note: '7月3日・4日は20:30まで、5日は19:00まで',
    },
  }],

  // えびな市民まつり。主催は海老名市と実行委員会
  ['ebina-hanabi-ar0314e00451', {
    organizer: '海老名市／えびな市民まつり実行委員会',
    venue: { name: '海老名運動公園', address: '神奈川県海老名市' },
    links: [L('海老名市 えびな市民まつり2026', 'https://www.city.ebina.kanagawa.jp/shisei/profile/1008687/1008890.html')],
    occurrence: {
      ...src(2026, 'https://www.city.ebina.kanagawa.jp/shisei/profile/1008687/1008890.html', '海老名市', 'gov'),
      start_time: '10:00',
      end_time: '18:30',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 岐阜県
  // ------------------------------------------------------------------

  // 水都まつり。**7月31日・8月1日・2日の3日間**なのに、
  // まとめサイト由来のデータは端の2日分しか持っていなかった
  ['gifu-001-summer-ar0621e74987', {
    venue: { name: '本町・大垣駅通り', address: '岐阜県大垣市' },
    links: [L('大垣観光協会 水都まつり', 'https://www.ogakikanko.jp/event/index.html')],
    occurrence: {
      ...src(2026, 'https://www.ogakikanko.jp/event/index.html', '大垣観光協会', 'official'),
      dates: ['2026-07-31', '2026-08-01', '2026-08-02'],
      status: 'confirmed',
      note: '時刻は観光協会のページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 北海道
  // ------------------------------------------------------------------

  // にいかっぷふるさと祭り。**会場は「旧JR新冠駅前広場」**（日高本線の廃止区間）
  ['hokkaido-013-summer-ar0101e510355', {
    venue: { name: '旧JR新冠駅前広場周辺', address: '北海道新冠郡新冠町' },
    links: [L('新冠町 にいかっぷふるさと祭り', 'https://www.niikappu.jp/event/matsuri.html')],
    occurrence: {
      ...src(2026, 'https://www.niikappu.jp/event/matsuri.html', '新冠町', 'gov'),
      status: 'confirmed',
      note: '7月18日は21:00まで、19日は20:00まで。開始時刻は町のページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 東京都
  // ------------------------------------------------------------------

  // あきしま郷土芸能まつり。会場は昭島駅北口の特設会場
  ['akishima-goguynet-126490', {
    organizer: '第十六回あきしま郷土芸能まつり実行委員会',
    station: 'JR青梅線 昭島駅北口（徒歩2分）',
    venue: { name: 'JR昭島駅北口 モリタウン北側特設会場', address: '東京都昭島市田中町562-1' },
    links: [L('昭島観光まちづくり協会 第十六回あきしま郷土芸能まつり', 'https://akishima-kanko.org/event/%e7%ac%ac%e5%8d%81%e5%85%ad%e5%9b%9e%e3%81%82%e3%81%8d%e3%81%97%e3%81%be%e9%83%b7%e5%9c%9f%e8%8a%b8%e8%83%bd%e3%81%be%e3%81%a4%e3%82%8a%e9%96%8b%e5%82%ac/')],
    occurrence: {
      ...src(2026, 'https://akishima-kanko.org/event/%e7%ac%ac%e5%8d%81%e5%85%ad%e5%9b%9e%e3%81%82%e3%81%8d%e3%81%97%e3%81%be%e9%83%b7%e5%9c%9f%e8%8a%b8%e8%83%bd%e3%81%be%e3%81%a4%e3%82%8a%e9%96%8b%e5%82%ac/', '昭島観光まちづくり協会', 'official'),
      start_time: '10:00',
      end_time: '15:00',
      status: 'confirmed',
    },
  }],
], '既存リンクからの格上げ（14）');
