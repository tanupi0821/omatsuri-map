/**
 * 一次情報での裏取り（花火大会 第3弾：埼玉県・千葉県）
 *
 *   node scripts/enrich/primary-hanabi-03.mjs
 *
 * 方針は `primary-hanabi-01.mjs` の冒頭のとおり。対象は `aggregator` だったものだけ。
 *
 * この回のねらい:
 *
 * - **同じ祭りが複数件に分かれているものは 1 回の調べで全部直せる**。
 *   さいたま市花火大会は 3 会場 × 区の重複で 6 件あったが、
 *   市の 1 ページ（令和8年6月16日発表）で全部の日付と時刻が取れた。
 *   歩留まりを上げるにはこういう塊から潰すのが早い。
 * - 政令市・中核市は **`*.lg.jp` に「令和8年度◯◯」の告知ページがある**。
 *   `<祭りの名前> <市区町村名> 2026 主催 会場 時間` で上位に出る。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const WP = (code) => L('ウォーカープラス 花火大会2026（元の出典）', `https://hanabi.walkerplus.com/detail/${code}/`);
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

// さいたま市花火大会は 3 会場とも同じ発表・同じ主催なので定型にまとめる
const SAITAMA_URL = 'https://www.city.saitama.lg.jp/006/014/008/003/015/003/p131231.html';
const SAITAMA_ORG = 'さいたま市花火大会実行委員会（事務局：公益社団法人さいたま観光国際協会）';
const saitamaHanabi = (date) => ({
  organizer: SAITAMA_ORG,
  links: [L('さいたま市「令和8年度『さいたま市花火大会』と『夏まつり』を開催します」', SAITAMA_URL)],
  occurrence: {
    ...src(2026, SAITAMA_URL, 'さいたま市', 'gov'),
    dates: [date],
    start_time: '19:30',
    status: 'confirmed',
    note: '荒天中止で順延日なし。当日の開催可否は13時に決定（さいたま市の発表）',
  },
});

patchAll([
  // ------------------------------------------------------------------
  // 埼玉県
  // ------------------------------------------------------------------

  // さいたま市花火大会は 3 会場。区をまたいで重複して入っていたので全部同じ発表を当てる
  ['omiya-hanabi-owada', saitamaHanabi('2026-07-25')],           // 大和田公園会場
  ['saitama-005-hanabi-ar0311e00873', saitamaHanabi('2026-07-25')],
  ['saitama-midori-saitama-hanabi-omagi-midori', saitamaHanabi('2026-08-08')], // 大間木公園会場
  ['saitama-minami-hanabi-omagi', saitamaHanabi('2026-08-08')],
  ['saitama-001-hanabi-ar0311e00513', saitamaHanabi('2026-08-08')],
  ['iwatsuki-hanabi-iwatsuki', saitamaHanabi('2026-08-22')],     // 岩槻文化公園会場

  // 熊谷市のページで日付・時刻を確認。会場は「荒川大橋下流側」と明記されている
  ['kumagaya-hanabi-ar0311e00874', {
    venue: { name: '荒川河畔（荒川大橋下流側）', address: '埼玉県熊谷市' },
    links: [
      L('熊谷市 熊谷花火大会', 'https://www.city.kumagaya.lg.jp/kanko/matsuri/kumagayahanabitaikai/index.html'),
      WP('ar0311e00874'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.kumagaya.lg.jp/kanko/matsuri/kumagayahanabitaikai/index.html', '熊谷市', 'gov'),
      start_time: '19:00',
      end_time: '21:00',
      status: 'confirmed',
      note: '雨天時は翌8月9日（日）に順延',
    },
  }],

  // 深谷市の商工振興担当のページ。主催は「ふかや市商工会内」の実行委員会
  ['fukaya-hanabi-ar0311e01022', {
    organizer: '深谷花火大会実行委員会',
    links: [
      L('深谷市 第32回深谷花火大会', 'https://www.city.fukaya.saitama.jp/soshiki/sangyoshinko/shokoshinkou/tanto/ibento/16474.html'),
      WP('ar0311e01022'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.fukaya.saitama.jp/soshiki/sangyoshinko/shokoshinkou/tanto/ibento/16474.html', '深谷市', 'gov'),
      start_time: '19:00',
      end_time: '21:00',
      status: 'confirmed',
      note: '雨天時は8月9日に順延',
    },
  }],

  // 寄居町。**町のページに花火の時刻が無い**ので時刻は触らず、最寄駅だけ足した
  ['saitama-007-hanabi-ar0311e00903', {
    station: '東武東上線・秩父鉄道・JR八高線 寄居駅',
    venue: { name: '玉淀河原', address: '埼玉県大里郡寄居町' },
    links: [
      L('寄居町 寄居玉淀水天宮祭', 'https://www.town.yorii.saitama.jp/soshiki/13/yoriitamayodosuitengusai.html'),
      WP('ar0311e00903'),
    ],
    occurrence: {
      ...src(2026, 'https://www.town.yorii.saitama.jp/soshiki/13/yoriitamayodosuitengusai.html', '寄居町', 'gov'),
      status: 'confirmed',
      note: '花火の打上時刻は寄居町の告知に記載がなく、以前の発表による',
    },
  }],

  // 狭山市の七夕まつりのページ。**花火は祭り2日間のうち初日だけ**で 19:30〜20:00
  ['sayama-hanabi-ar0311e00413', {
    organizer: '狭山市入間川七夕まつり実行委員会',
    station: '西武新宿線 狭山市駅',
    links: [
      L('狭山市 狭山市入間川七夕まつり', 'https://www.city.sayama.saitama.jp/kankou/kanko/tanabata/index.html'),
      WP('ar0311e00413'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.sayama.saitama.jp/kankou/kanko/tanabata/index.html', '狭山市', 'gov'),
      start_time: '19:30',
      end_time: '20:00',
      status: 'confirmed',
      note: '七夕まつり自体は8月1日・2日の2日間。花火は初日のみ',
    },
  }],

  // 春日部。**市の告知では「第2回春日部大凧花火大会」**で、まつりの部と花火の部で
  // 主催が分かれている。花火は20:10から
  ['kasukabe-hanabi-ar0311e115907', {
    organizer: '庄和商工会・春日部大凧花火大会実行委員会（花火の部）',
    station: '東武アーバンパークライン 南桜井駅',
    venue: { name: 'レジデンシャルパークSHOWA（庄和総合公園）', address: '埼玉県春日部市' },
    links: [
      L('春日部市「第2回春日部大凧花火大会を開催（令和8年8月22日開催）」', 'https://www.city.kasukabe.lg.jp/soshikikarasagasu/shiminsankasuishinka/eventjoho/32193.html'),
      WP('ar0311e115907'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.kasukabe.lg.jp/soshikikarasagasu/shiminsankasuishinka/eventjoho/32193.html', '春日部市', 'gov'),
      start_time: '20:10',
      end_time: '21:00',
      status: 'confirmed',
      note: 'イベント全体は15:30から21:00。まつりの部の主催は春日部市コミュニティ推進協議会',
    },
  }],

  // たたら祭り。**2026年は例年の8月ではなく9月26日・27日の開催**。
  // 花火は祭りのフィナーレだが、公式サイトに時刻の記載が無い
  ['kawaguchi-hanabi-ar0311e00256', {
    organizer: '川口市たたら祭り実行委員会',
    links: [
      L('第46回たたら祭り 公式ホームページ', 'https://www.tatara-matsuri.com/'),
      WP('ar0311e00256'),
    ],
    occurrence: {
      ...src(2026, 'https://www.tatara-matsuri.com/', '川口市たたら祭り実行委員会', 'official'),
      status: 'confirmed',
      note: 'たたら祭り本体は9月26日（土）・27日（日）の2日間。フィナーレ花火の時刻は公式サイトに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 千葉県
  // ------------------------------------------------------------------

  // 手賀沼花火大会は**柏市と我孫子市の共催**。会場も両市にまたがる。
  // 柏市のページに会場が 3 つ（柏2会場・我孫子1会場）並んでいた
  ['kashiwa-hanabi-ar0312e00930', {
    organizer: '手賀沼花火大会実行委員会（柏市・我孫子市の両市役所および商工団体で構成）',
    station: 'JR常磐線 北柏駅・柏駅',
    links: [
      L('柏市 手賀沼花火大会2026', 'https://www.city.kashiwa.lg.jp/shoko/teganumahanabi2026.html'),
      L('我孫子市 手賀沼花火大会2026の開催について', 'https://www.city.abiko.chiba.jp/event/event_moyooshi/hanabi2026.html'),
      WP('ar0312e00930'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.kashiwa.lg.jp/shoko/teganumahanabi2026.html', '柏市', 'gov'),
      start_time: '19:00',
      end_time: '20:10',
      status: 'confirmed',
      note: '19:00開会式、19:10頃から打上開始。柏会場は手賀沼自然ふれあい緑道、我孫子会場は手賀沼公園ほか（我孫子市若松1番地ほか）',
    },
  }],

  // 松戸市のページ。荒天時は中止で順延なし
  ['matsudo-hanabi-ar0312e00979', {
    station: 'JR常磐線 松戸駅・北松戸駅（徒歩約35分）',
    links: [
      L('松戸市「松戸花火大会2026 8月1日（土曜）開催！」', 'https://www.city.matsudo.chiba.jp/miryoku/kankoumiryokubunka/matsuri/summer/matsudohanabi.html'),
      L('松戸花火大会2026 公式サイト', 'https://matsudo-hanabi.com/'),
      WP('ar0312e00979'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.matsudo.chiba.jp/miryoku/kankoumiryokubunka/matsuri/summer/matsudohanabi.html', '松戸市', 'gov'),
      start_time: '19:15',
      end_time: '20:20',
      status: 'confirmed',
      note: '荒天の場合は中止・順延なし',
    },
  }],

  // 香取市のページ。第41回全国尺玉コンクールを同時開催
  ['katori-hanabi-ar0312e00895', {
    links: [
      L('香取市 水郷おみがわ花火大会', 'https://www.city.katori.lg.jp/sightseeing/gyoji/natsu/hanabi.html'),
      WP('ar0312e00895'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.katori.lg.jp/sightseeing/gyoji/natsu/hanabi.html', '香取市', 'gov'),
      start_time: '19:15',
      end_time: '20:45',
      status: 'confirmed',
      note: '第41回全国尺玉コンクールを同時開催（香取市の発表）',
    },
  }],

  // 市川市のページで「第42回」「大洲三丁目地先」を確認。**市のページに時刻は無い**
  ['ichikawa-ichikawa-noryo-hanabi', {
    organizer: '市川市民納涼花火大会実行委員会',
    venue: { name: '江戸川河川敷（大洲三丁目地先）', address: '千葉県市川市大洲3丁目地先' },
    links: [
      L('市川市「令和8年度 第42回市川市民納涼花火大会」', 'https://www.city.ichikawa.lg.jp/eco04/1111000127.html'),
      L('市川市民納涼花火大会 公式ホームページ', 'https://www.ichikawa-hanabi.net/'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.ichikawa.lg.jp/eco04/1111000127.html', '市川市', 'gov'),
      status: 'confirmed',
      note: '打上時刻は市川市のページに記載がなく、以前の発表による',
    },
  }],
], '花火・埼玉県／千葉県');
