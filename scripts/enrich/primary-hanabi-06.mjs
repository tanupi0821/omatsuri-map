/**
 * 一次情報での裏取り（花火大会 第6弾：東京都）
 *
 *   node scripts/enrich/primary-hanabi-06.mjs
 *
 * 方針は `primary-hanabi-01.mjs` の冒頭のとおり。対象は `aggregator`／`media` だったものだけ。
 *
 * 東京で分かったこと:
 *
 * - **隅田川花火大会は東京都建設局の河川ページに公式の告知がある**
 *   （実行委員会の事務局は墨田区）。区や都のページは検索で上位に来にくいので、
 *   `<大会名> 2026 実行委員会 公式` のように「実行委員会」を足すと当たる。
 * - **観光協会が主催者のことがある**（八王子観光コンベンション協会、板橋区観光協会）。
 *   この場合の観光協会は「他所の情報をまとめている」のではなく主催者なので `official`。
 * - 公式サイトが日付を書いていないことがある（昭島市民くじら祭）。
 *   その場合は日付を触らず、主催・最寄駅など取れた事実だけ入れる。
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
  // 東京都
  // ------------------------------------------------------------------

  // 隅田川。東京都建設局の河川利活用ページに第49回の告知がある。
  // **第一会場は19:00、第二会場は19:30に打上開始**なので全体を start/end に入れる
  ['sumida-sumidagawa-hanabi', {
    organizer: '隅田川花火大会実行委員会',
    venue: { name: '隅田川（第一会場：桜橋下流〜言問橋上流／第二会場：駒形橋下流〜厩橋上流）', address: '東京都墨田区' },
    links: [
      L('東京都「令和8年（第49回）隅田川花火大会」', 'https://www.kasenrikatsuyou.metro.tokyo.lg.jp/events/info/sumida-fireworks-2026.html'),
      WP('ar0313e00858'),
    ],
    occurrence: {
      ...src(2026, 'https://www.kasenrikatsuyou.metro.tokyo.lg.jp/events/info/sumida-fireworks-2026.html', '東京都', 'gov'),
      start_time: '19:00',
      end_time: '20:30',
      status: 'confirmed',
      note: '第一会場の打上開始は19:00、第二会場は19:30。会場は台東区と墨田区にまたがる',
    },
  }],

  // いたばし花火大会。主催は板橋区と板橋区観光協会
  ['itabashi-hanabi-ar0313e00868', {
    organizer: '板橋区・板橋区観光協会',
    links: [
      L('いたばし花火大会 2026 公式サイト', 'https://itabashihanabi.jp/'),
      WP('ar0313e00868'),
    ],
    occurrence: {
      ...src(2026, 'https://itabashihanabi.jp/', '板橋区・板橋区観光協会', 'official'),
      start_time: '19:00',
      end_time: '20:30',
      status: 'confirmed',
      note: '荒天中止・順延なし',
    },
  }],

  // 世田谷区。**対岸の川崎市制記念多摩川花火大会と合同開催**（別の大会）
  ['setagaya-hanabi-ar0313e355272', {
    organizer: '世田谷区たまがわ花火大会実行委員会',
    links: [
      L('世田谷区「第48回世田谷区たまがわ花火大会」の開催決定について', 'https://www.city.setagaya.lg.jp/02219/23775.html'),
      L('世田谷区たまがわ花火大会 公式サイト', 'https://tamagawa-hanabi.com/about/'),
      WP('ar0313e355272'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.setagaya.lg.jp/02219/23775.html', '世田谷区', 'gov'),
      start_time: '18:00',
      end_time: '19:00',
      status: 'confirmed',
      note: '川崎市制記念多摩川花火大会と合同開催。ステージイベントは15:00から、出店は15:00から20:00',
    },
  }],

  // 調布。**18:00が開会式、打上げは18:15から19:15**
  ['chofu-hanabi-ar0313e00881', {
    organizer: '調布市花火実行委員会',
    links: [
      L('第41回調布花火 公式サイト', 'https://hanabi.csa.gr.jp/'),
      WP('ar0313e00881'),
    ],
    occurrence: {
      ...src(2026, 'https://hanabi.csa.gr.jp/', '調布市花火実行委員会', 'official'),
      start_time: '18:00',
      end_time: '19:15',
      status: 'confirmed',
      note: '18:00開会式、花火の打上げは18:15から19:15。会場は布田・京王多摩川・電通大グランドの3か所',
    },
  }],

  // 八王子。会場の番地（台町2-2）と最寄駅は観光コンベンション協会のページで取れた
  ['hachioji-hanabi-ar0313e00929', {
    station: 'JR八王子駅南口・JR西八王子駅南口・京王線 山田駅',
    venue: { name: '富士森公園', address: '東京都八王子市台町2-2' },
    links: [
      L('八王子観光コンベンション協会 八王子花火大会', 'https://www.hkc.or.jp/fireworks/'),
      WP('ar0313e00929'),
    ],
    occurrence: {
      ...src(2026, 'https://www.hkc.or.jp/fireworks/', '公益社団法人八王子観光コンベンション協会', 'official'),
      start_time: '19:00',
      end_time: '20:15',
      status: 'confirmed',
      note: '荒天中止',
    },
  }],

  // 昭島市民くじら祭。**公式サイトに日付の記載が無い**ので日付は触らず、
  // 主催と最寄駅だけ足した
  ['akishima-hanabi-ar0313e00898', {
    organizer: '昭島市民くじら祭実行委員会（事務局：昭島市商工会）',
    station: 'JR青梅線 東中神駅（徒歩8分）／西立川駅（徒歩10分）',
    links: [
      L('2026 昭島市民くじら祭 公式サイト', 'https://akishima-kujiramatsuri.jp/'),
      WP('ar0313e00898'),
    ],
    occurrence: {
      ...src(2026, 'https://akishima-kujiramatsuri.jp/', '昭島市民くじら祭実行委員会', 'official'),
      status: 'confirmed',
      note: 'くじら祭は8月29日・30日の2日間で、夢花火は初日の夜。時刻は公式サイトに記載がなく、以前の発表による',
    },
  }],

  // 八丈島。**町の告知は8月10日・11日の2日間**で、花火は11日の20:11から
  ['tokyo-002-hanabi-ar0313e00508', {
    organizer: '八丈島納涼花火大会実行委員会',
    venue: { name: '底土海岸（底土港）', address: '東京都八丈島八丈町三根' },
    links: [
      L('八丈町 第25回八丈島納涼花火大会', 'https://www.town.hachijo.tokyo.jp/articles/oshirase-20260701-06/'),
      WP('ar0313e00508'),
    ],
    occurrence: {
      ...src(2026, 'https://www.town.hachijo.tokyo.jp/articles/oshirase-20260701-06/', '八丈町', 'gov'),
      start_time: '20:11',
      status: 'confirmed',
      note: '町の告知では8月10日・11日の開催で、花火の打上げは11日20:11から',
    },
  }],

  // 江東花火大会。区のページで会場（葛西橋と清砂大橋の間）と主催が取れた
  ['koto-local-koto-hanabi', {
    organizer: '江東花火大会実行委員会',
    venue: { name: '荒川・砂町水辺公園（葛西橋と清砂大橋の間）', address: '東京都江東区' },
    links: [
      L('江東区 江東花火大会2026', 'https://www.city.koto.lg.jp/101000/kotohanabi.html'),
      L('江東花火大会 公式WEBサイト', 'https://koto-hanabi.com/'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.koto.lg.jp/101000/kotohanabi.html', '江東区', 'gov'),
      status: 'confirmed',
      note: '小雨決行、荒天等の場合は中止で順延日なし。時刻は区のページに記載がなく、以前の発表による',
    },
  }],
], '花火・東京都');
