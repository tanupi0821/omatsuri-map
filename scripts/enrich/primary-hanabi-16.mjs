/**
 * 一次情報での裏取り（花火大会 第16弾：既存リンクからの格上げ その3）
 *
 *   node scripts/enrich/primary-hanabi-16.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。
 *
 * **開催日が複数あるのにまとめサイトが端の2日しか持っていない**という取りこぼしが
 * ここでも見つかった。堂ヶ島夕映えの花火は 9/26・9/27・10/3・10/4 の4日あるのに
 * 9/26 と 10/4 の2日だけになっていた（熱海海上花火大会と同じ形の誤り）。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 大分県
  // ------------------------------------------------------------------

  // ななせの火群まつり。会場の住所（大字市字赤池188）が市のページで取れた
  ['oita-005-hanabi-ar1044e191268', {
    organizer: 'ななせの火群まつり実行委員会',
    venue: { name: '七瀬川自然公園', address: '大分県大分市大字市字赤池188' },
    links: [L('大分市 第27回ななせの火群まつり', 'https://www.city.oita.oita.jp/o058/bunkasports/guide/2026homura.html')],
    occurrence: {
      ...src(2026, 'https://www.city.oita.oita.jp/o058/bunkasports/guide/2026homura.html', '大分市', 'gov'),
      start_time: '20:45',
      status: 'confirmed',
      note: '花火は20:45から。終了時刻は大分市のページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 沖縄県
  // ------------------------------------------------------------------

  // 久米島まつり。町のページで会場（ふれあい公園）と2日間の開催を確認
  ['okinawa-002-hanabi-ar1047e357470', {
    venue: { name: '久米島町ふれあい公園', address: '沖縄県島尻郡久米島町' },
    links: [L('久米島町 第26回久米島まつり', 'https://www.town.kumejima.okinawa.jp/docs/2026071000037/')],
    occurrence: {
      ...src(2026, 'https://www.town.kumejima.okinawa.jp/docs/2026071000037/', '久米島町', 'gov'),
      status: 'confirmed',
      note: '花火の時刻は久米島町のページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 島根県
  // ------------------------------------------------------------------

  // 出雲神話まつり。**盆踊りは8月8日、花火大会は8月22日**と日が離れている
  ['shimane-006-hanabi-ar0832e76834', {
    organizer: '出雲神話まつり振興会・出雲神話まつり実行委員会',
    venue: { name: '大津神立河川敷公園', address: '島根県出雲市' },
    links: [L('出雲市 第21回出雲神話まつり', 'https://www.city.izumo.shimane.jp/www/contents/1780383228895/index.html')],
    occurrence: {
      ...src(2026, 'https://www.city.izumo.shimane.jp/www/contents/1780383228895/index.html', '出雲市', 'gov'),
      start_time: '20:00',
      end_time: '20:40',
      status: 'confirmed',
      note: '同じ祭りの出雲盆踊りは8月8日で、花火大会は8月22日',
    },
  }],

  // ------------------------------------------------------------------
  // 静岡県
  // ------------------------------------------------------------------

  // 堂ヶ島。**主催の観光協会は4日分を発表している**のに、
  // まとめサイト由来のデータは最初と最後の2日しか持っていなかった
  ['shizuoka-012-hanabi-ar0622e469847', {
    organizer: '一般社団法人西伊豆町観光協会',
    venue: { name: '堂ヶ島公園', address: '静岡県賀茂郡西伊豆町仁科2910-2' },
    links: [L('西伊豆町観光協会 堂ヶ島夕映えの花火', 'https://www.nishiizu-kankou.com/event/sunsethanabi')],
    occurrence: {
      ...src(2026, 'https://www.nishiizu-kankou.com/event/sunsethanabi', '一般社団法人西伊豆町観光協会', 'official'),
      dates: ['2026-09-26', '2026-09-27', '2026-10-03', '2026-10-04'],
      start_time: '17:45',
      status: 'confirmed',
      note: 'まとめサイトは9月26日と10月4日の2日分しか載せていなかったが、主催の西伊豆町観光協会は4日を発表している。打上げは約10分間',
    },
  }],

  // 沼津。**観光協会のページは「毎年7月下旬に2日間」としか書いていない**ので
  // 日付・時刻は触らず、主催と最寄駅と例年の決まりだけ入れた
  ['shizuoka-021-hanabi-ar0622e00888', {
    organizer: '沼津夏まつり実行委員会（沼津市産業振興部観光戦略課）',
    station: 'JR東海道本線 沼津駅',
    recurrence: '7月下旬の2日間',
    recurrence_source: 'https://numazukanko.jp/event/50051',
    links: [L('沼津観光ポータル 沼津夏まつり・狩野川花火大会', 'https://numazukanko.jp/event/50051')],
    occurrence: {
      ...src(2026, 'https://numazukanko.jp/event/50051', '沼津市観光戦略課（沼津観光ポータル）', 'gov'),
      status: 'confirmed',
      note: '日付・時刻は沼津観光ポータルに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 徳島県
  // ------------------------------------------------------------------

  // 吉野川市。主催は吉野川商工会議所内の実行委員会
  ['tokushima-001-hanabi-ar0936e01004', {
    organizer: '吉野川市納涼花火大会等実行委員会（吉野川商工会議所内）',
    venue: { name: '吉野川市県民運動場', address: '徳島県吉野川市' },
    links: [L('吉野川商工会議所 吉野川市納涼花火大会', 'https://www.yoshinogawacci.jp/kankou/hanabi/renraku')],
    occurrence: {
      ...src(2026, 'https://www.yoshinogawacci.jp/kankou/hanabi/renraku', '吉野川商工会議所', 'official'),
      start_time: '20:00',
      status: 'confirmed',
      note: '雨天時は8月11日に順延',
    },
  }],

  // ------------------------------------------------------------------
  // 富山県
  // ------------------------------------------------------------------

  // 射水市観光協会。会場（海王丸パーク）の住所と最寄駅が取れた
  ['toyama-006-hanabi-ar0516e00670', {
    organizer: '富山新港花火大会実行委員会・射水市観光まちづくり課',
    station: '万葉線 海王丸駅',
    venue: { name: '海王丸パーク', address: '富山県射水市海王町8' },
    links: [L('射水市観光協会 第60回富山新港花火大会', 'https://www.imizu-kanko.jp/events/fireworks-festival/')],
    occurrence: {
      ...src(2026, 'https://www.imizu-kanko.jp/events/fireworks-festival/', '射水市観光協会', 'official'),
      start_time: '20:00',
      end_time: '20:40',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 和歌山県
  // ------------------------------------------------------------------

  // 串本まつり。**会場は「串本漁港」**（まとめサイトの記載より具体的）
  ['wakayama-011-hanabi-ar0730e00159', {
    venue: { name: '串本漁港', address: '和歌山県東牟婁郡串本町' },
    links: [L('串本町 串本まつり', 'https://www.town.kushimoto.wakayama.jp/kanko/event/kusimotomaturi.html')],
    occurrence: {
      ...src(2026, 'https://www.town.kushimoto.wakayama.jp/kanko/event/kusimotomaturi.html', '串本町', 'gov'),
      start_time: '19:45',
      end_time: '21:00',
      status: 'confirmed',
    },
  }],
], '花火・既存リンクからの格上げ（3）');
