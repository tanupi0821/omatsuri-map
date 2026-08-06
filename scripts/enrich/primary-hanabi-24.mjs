/**
 * 一次情報での裏取り（第24弾：既存リンクからの格上げ その11）
 *
 *   node scripts/enrich/primary-hanabi-24.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。
 *
 * **この回でいちばん大きな直し**: 石和温泉鵜飼花火は主催側が11日分を発表しているのに、
 * まとめサイト由来のデータは7月20日と8月16日の2日しか持っていなかった。
 * 「複数日開催は端の2日だけ」という誤りがこれで5件目（熱海・堂ヶ島・長岡・
 * 八戸七夕・石和鵜飼）。**この型は他にもまだあるはず**なので、
 * 次にやる人は複数日開催の祭りを優先して見直すとよい。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 徳島県
  // ------------------------------------------------------------------

  // 日和佐うみがめまつり。町のページで第63回・7月18日を確認
  ['tokushima-001-summer-ar0936e511010', {
    organizer: '日和佐うみがめまつり実行委員会',
    links: [L('美波町 第63回日和佐うみがめまつり', 'https://www.town.minami.lg.jp/docs/3324727.html')],
    occurrence: {
      ...src(2026, 'https://www.town.minami.lg.jp/docs/3324727.html', '美波町', 'gov'),
      status: 'confirmed',
      note: '時刻は町のページに記載がない',
    },
  }],

  // 宍喰祇園祭り。**毎年7月16日が宵宮・17日が本祭**で固定。
  // 奉納花火は宵宮の20:30から
  ['tokushima-002-summer-ar0936e508010', {
    shrine: '宍喰八坂神社',
    station: '阿佐海岸鉄道 宍喰駅（徒歩3分）',
    recurrence: '7月16日・17日',
    recurrence_source: 'https://www.kaiyo-kankou.jp/event/event-961/',
    venue: { name: '宍喰八坂神社周辺', address: '海部郡海陽町久保' },
    links: [L('海陽町観光協会 宍喰祇園祭り', 'https://www.kaiyo-kankou.jp/event/event-961/')],
    occurrence: {
      ...src(2026, 'https://www.kaiyo-kankou.jp/event/event-961/', '海陽町観光協会', 'official'),
      start_time: '18:00',
      status: 'confirmed',
      note: '宵宮（16日）は18:00から、奉納花火は20:30から。本祭（17日）は10:00から、奉納餅投げは13:00から',
    },
  }],

  // ------------------------------------------------------------------
  // 和歌山県
  // ------------------------------------------------------------------

  // 粉河祭。**2年に1回**の開催で、宵祭が7月25日、本祭が26日
  ['wakayama-004-summer-ar0730e4757', {
    recurrence: '7月25日（宵祭）・26日（本祭）、2年に1回',
    recurrence_source: 'https://www.city.kinokawa.lg.jp/kankoshinko/2020-0520-1150-12.html',
    venue: { name: '粉河とんまか通り周辺', address: '紀の川市粉河地内' },
    links: [L('紀の川市 粉河祭', 'https://www.city.kinokawa.lg.jp/kankoshinko/2020-0520-1150-12.html')],
    occurrence: {
      ...src(2026, 'https://www.city.kinokawa.lg.jp/kankoshinko/2020-0520-1150-12.html', '紀の川市', 'gov'),
      start_time: '19:00',
      end_time: '23:00',
      status: 'confirmed',
      note: '宵祭（25日）は19:00〜23:00、本祭（26日）は16:00から。2年に1回の開催',
    },
  }],

  // 鹿島神社奉納花火祭。**開催日は毎年8月1日**で固定
  ['wakayama-010-hanabi-ar0730e355417', {
    shrine: '鹿島神社',
    recurrence: '8月1日',
    recurrence_source: 'https://www.minabe-kanko.jp/sightseeing/1187',
    venue: { name: '南部湾', address: '日高郡みなべ町埴田20' },
    links: [L('みなべ観光協会 鹿島神社奉納花火祭', 'https://www.minabe-kanko.jp/sightseeing/1187')],
    occurrence: {
      ...src(2026, 'https://www.minabe-kanko.jp/sightseeing/1187', 'みなべ観光協会', 'official'),
      start_time: '20:00',
      end_time: '21:00',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 山梨県
  // ------------------------------------------------------------------

  // 石和温泉鵜飼花火。**主催側は11日分を発表している**（うち8月12日・13日は特別打上げ）。
  // まとめサイト由来のデータは7月20日と8月16日の2日しか持っていなかった
  ['yamanashi-005-hanabi-ar0419e467624', {
    venue: { name: '笛吹市役所前 笛吹川河川敷', address: '笛吹市石和町市部777' },
    links: [L('笛吹市観光物産連盟 石和温泉鵜飼', 'https://www.fuefuki-kanko.jp/scontents/summerfes/1011/index.html')],
    occurrence: {
      ...src(2026, 'https://www.fuefuki-kanko.jp/scontents/summerfes/1011/index.html', '一般社団法人笛吹市観光物産連盟', 'official'),
      dates: [
        '2026-07-20', '2026-07-25', '2026-07-26',
        '2026-08-01', '2026-08-02', '2026-08-08', '2026-08-09',
        '2026-08-12', '2026-08-13', '2026-08-15', '2026-08-16',
      ],
      start_time: '20:50',
      end_time: '21:00',
      status: 'confirmed',
      note: 'まとめサイトは7月20日と8月16日の2日分しか載せていなかったが、主催側は11日を発表している。8月12日・13日は特別打上げ',
    },
  }],

  // ------------------------------------------------------------------
  // 埼玉県
  // ------------------------------------------------------------------

  // おおい祭り。会場と最寄駅が市のページで取れた
  ['fujimino-summer-ar0311e69080', {
    organizer: 'おおい祭り実行委員会',
    station: '東武東上線 ふじみ野駅西口（徒歩10分）',
    venue: { name: '東久保中央公園および周辺道路・大井東中学校', address: 'ふじみ野市' },
    links: [L('ふじみ野市 第26回おおい祭り', 'https://www.city.fujimino.saitama.jp/soshikiichiran/kyodosuishinka/chiikishinkogakari/ooimatsuri/16727.html')],
    occurrence: {
      ...src(2026, 'https://www.city.fujimino.saitama.jp/soshikiichiran/kyodosuishinka/chiikishinkogakari/ooimatsuri/16727.html', 'ふじみ野市', 'gov'),
      start_time: '12:00',
      end_time: '20:30',
      status: 'confirmed',
      note: '模擬店の販売は11:30から',
    },
  }],

  // ------------------------------------------------------------------
  // 東京都
  // ------------------------------------------------------------------

  // 日暮里繊維街夏祭り。**昼の催し（10:00〜15:00）**で夜祭ではない
  ['arakawa-goguynet-82848', {
    organizer: '荒川区',
    venue: { name: 'ふらっとにっぽり（荒川区立日暮里地域活性化施設）1階・2階', address: '荒川区東日暮里' },
    links: [L('荒川区 日暮里繊維街夏祭り in ふらっとにっぽり', 'https://www.city.arakawa.tokyo.jp/a020/sangyou/furattonippori/natsumatsuri2026.html')],
    occurrence: {
      ...src(2026, 'https://www.city.arakawa.tokyo.jp/a020/sangyou/furattonippori/natsumatsuri2026.html', '荒川区', 'gov'),
      start_time: '10:00',
      end_time: '15:00',
      status: 'confirmed',
    },
  }],
], '既存リンクからの格上げ（11）');
