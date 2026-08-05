/**
 * 一次情報での裏取り（花火大会 第8弾：静岡県）
 *
 *   node scripts/enrich/primary-hanabi-08.mjs
 *
 * 方針は `primary-hanabi-01.mjs` の冒頭のとおり。対象は `aggregator` だったものだけ。
 *
 * この回の収穫:
 *
 * - **熱海海上花火大会は夏季だけで6日ある**のに、まとめサイト由来のデータは
 *   2日しか持っていなかった。主催（熱海市観光協会）のページで6日分に直した。
 *   **開催日が複数ある祭りは、まとめサイトが取りこぼしていることが多い**。
 * - 静岡は市の観光協会（島田・藤枝・熱海・伊東）が主催者を兼ねていて、
 *   協会サイトが一次情報になっている。
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
  // 静岡県
  // ------------------------------------------------------------------

  // 安倍川。**公式サイトに時刻の記載が無い**ので時刻は触っていない
  ['shizuoka-016-hanabi-ar0622e00889', {
    organizer: '安倍川花火大会本部',
    links: [
      L('安倍川花火大会 公式ウェブサイト', 'https://www.abekawa-hanabi.com/'),
      WP('ar0622e00889'),
    ],
    occurrence: {
      ...src(2026, 'https://www.abekawa-hanabi.com/', '安倍川花火大会本部', 'official'),
      status: 'confirmed',
      note: '時刻は公式サイトに記載がなく、以前の発表による',
    },
  }],

  // 清水みなと祭り。会場の住所（相生町6-17）は公式サイトで取れた
  ['shizuoka-017-hanabi-ar0622e00907', {
    organizer: '清水みなと祭り実行委員会',
    venue: { name: '清水港 日の出埠頭', address: '静岡県静岡市清水区相生町6-17' },
    links: [
      L('清水みなと祭り 公式ホームページ 2026 海上花火大会', 'https://www.minatokappore.jp/hanabi/'),
      WP('ar0622e00907'),
    ],
    occurrence: {
      ...src(2026, 'https://www.minatokappore.jp/hanabi/', '清水みなと祭り実行委員会', 'official'),
      start_time: '19:30',
      status: 'confirmed',
      note: 'みなと祭り自体は7月31日〜8月2日の3日間で、海上花火大会は最終日',
    },
  }],

  // 焼津。市のページで打上場所（焼津外港南防波堤）と観覧会場の別が分かった
  ['shizuoka-013-hanabi-ar0622e01046', {
    organizer: '焼津海上花火大会実行委員会',
    venue: { name: '焼津漁港新港地区（打上げは焼津外港南防波堤）', address: '静岡県焼津市城之腰付近' },
    links: [
      L('焼津市「【市制75周年】第51回焼津海上花火大会」', 'https://www.city.yaizu.lg.jp/event/fireflower.html'),
      WP('ar0622e01046'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.yaizu.lg.jp/event/fireflower.html', '焼津市', 'gov'),
      status: 'confirmed',
      note: '時刻は焼津市のページに記載がなく、以前の発表による',
    },
  }],

  // 大井川。**荒天のときの順延先が2段階（8/2→8/22）**あるので note に残す
  ['shizuoka-023-hanabi-ar0622e01025', {
    organizer: '一般社団法人島田市観光協会',
    links: [
      L('大井川大花火大会 公式サイト', 'https://ooigawa-hanabi.jp/'),
      L('島田市 第39回大井川大花火大会', 'https://www.city.shimada.shizuoka.jp/kanko-docs/ooigawa_hanabi.html'),
      WP('ar0622e01025'),
    ],
    occurrence: {
      ...src(2026, 'https://ooigawa-hanabi.jp/', '一般社団法人島田市観光協会', 'official'),
      start_time: '19:00',
      status: 'confirmed',
      note: '荒天時は8月2日（日）に順延、2日も荒天なら8月22日（土）に延期',
    },
  }],

  // 藤枝。会場の番地（若王子474-1）が観光協会の告知で取れた
  ['shizuoka-001-hanabi-ar0622e00617', {
    organizer: '一般社団法人藤枝市観光協会',
    venue: { name: '蓮華寺池公園', address: '静岡県藤枝市若王子474-1' },
    links: [
      L('藤枝市観光協会 第46回 藤枝花火大会開催のお知らせ', 'https://www.fujieda.gr.jp/news/n24551/'),
      WP('ar0622e00617'),
    ],
    occurrence: {
      ...src(2026, 'https://www.fujieda.gr.jp/news/n24551/', '一般社団法人藤枝市観光協会', 'official'),
      start_time: '19:15',
      end_time: '20:30',
      status: 'confirmed',
      note: '小雨決行、荒天の場合は8月8日（土）に延期',
    },
  }],

  // 熱海。**夏季だけで6日開催**しているのに、まとめサイト由来のデータは2日分しか
  // 持っていなかった。主催の熱海市観光協会のページで6日分に直す
  ['shizuoka-005-hanabi-ar0622e00886', {
    organizer: '熱海市観光協会',
    station: 'JR東海道本線 熱海駅',
    venue: { name: '熱海湾（熱海港7.5m岸壁〜海釣り施設）', address: '静岡県熱海市渚町地先' },
    links: [
      L('あたみニュース（熱海市観光協会）熱海海上花火大会', 'https://www.ataminews.gr.jp/event/8/'),
      WP('ar0622e00886'),
    ],
    occurrence: {
      ...src(2026, 'https://www.ataminews.gr.jp/event/8/', '熱海市観光協会', 'official'),
      dates: ['2026-07-20', '2026-07-26', '2026-08-05', '2026-08-09', '2026-08-18', '2026-08-24'],
      start_time: '20:15',
      end_time: '20:40',
      status: 'confirmed',
      note: 'まとめサイトは7月20日と8月24日の2日分しか載せていなかったが、主催の熱海市観光協会は夏季6日を発表している。雨天決行',
    },
  }],

  // 按針祭。**2026年は第80回で、例年の倍の約2万発**
  ['shizuoka-002-hanabi-ar0622e00802', {
    organizer: '伊東市観光課',
    links: [
      L('伊豆・伊東観光ガイド（伊東観光協会）伊東温泉海の花火大会', 'https://itospa.com/event/detail_10019.html'),
      WP('ar0622e00802'),
    ],
    occurrence: {
      ...src(2026, 'https://itospa.com/event/detail_10019.html', '伊東観光協会', 'official'),
      start_time: '20:00',
      end_time: '21:00',
      status: 'confirmed',
      note: '2026年は第80回の記念大会',
    },
  }],
], '花火・静岡県');
