/**
 * 一次情報での裏取り（花火大会 第5弾：神奈川県）
 *
 *   node scripts/enrich/primary-hanabi-05.mjs
 *
 * 方針は `primary-hanabi-01.mjs` の冒頭のとおり。対象は `aggregator` だったものだけ。
 *
 * 神奈川は歩留まりが特に良かった。**市の観光課か市観光協会がほぼ必ず
 * 単独のページを持っている**。10 件調べて 10 件とも一次情報に辿り着いた。
 *
 * 気をつけたこと:
 *
 * - **「開始時刻」がセレモニーの時刻のことがある**。小田原は18:30がセレモニー、
 *   花火は19:10から。まとめサイトは18:30を打上開始として載せていた。
 *   全体の時間帯を start/end に入れ、花火の時刻は note に書く。
 * - 川崎市制記念多摩川花火大会は**世田谷区のたまがわ花火大会と合同開催**で、
 *   対岸の別イベントとして両方データにある。同じものにまとめない
 *   （主催も会場も別）。
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
  // 神奈川県
  // ------------------------------------------------------------------

  // 逗子市の令和8年度のページ。**打上開始が19:30から19:20に変更**されている
  ['zushi-zushi-kaigan-hanabi', {
    organizer: '逗子市観光協会・逗子市（共催）',
    links: [
      L('逗子市「（2026年度）第69回逗子海岸花火大会」', 'https://www.city.zushi.kanagawa.jp/shiminkatsudo/kanko/1004356/1013768.html'),
      L('第69回逗子海岸花火大会 公式サイト', 'https://zushihanabi.com/'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.zushi.kanagawa.jp/shiminkatsudo/kanko/1004356/1013768.html', '逗子市', 'gov'),
      start_time: '19:20',
      end_time: '20:15',
      status: 'confirmed',
      note: '安全確保のため打上開始が19:30から19:20に変更された（逗子市の発表）',
    },
  }],

  // 平塚市のページ。**毎年8月第4金曜日**という決まりがあるので recurrence に入れる
  ['hiratsuka-shonan-hiratsuka-hanabi', {
    organizer: '湘南ひらつか花火大会実行委員会',
    station: 'JR東海道線 平塚駅',
    recurrence: '8月第4金曜日',
    recurrence_source: 'https://www.city.hiratsuka.kanagawa.jp/kanko/page-c_01068.html',
    links: [
      L('平塚市 湘南ひらつか花火大会', 'https://www.city.hiratsuka.kanagawa.jp/kanko/page-c_01068.html'),
      WP('ar0314e00883'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.hiratsuka.kanagawa.jp/kanko/page-c_01068.html', '平塚市', 'gov'),
      start_time: '19:00',
      end_time: '20:00',
      status: 'confirmed',
      note: '荒天の場合は8月30日（日）に延期。開場は17:00から',
    },
  }],

  // 藤沢市観光協会（主催側）の告知。**30分だけの大会**で18:00〜18:30
  ['fujisawa-hanabi-ar0314e00859', {
    organizer: 'ふじさわ江の島花火大会実行委員会',
    venue: { name: '片瀬海岸西浜（西浜沖の台船から打上げ）', address: '藤沢市片瀬海岸' },
    links: [
      L('藤沢市観光協会「2026ふじさわ江の島花火大会」の開催について', 'https://www.fujisawa-kanko.jp/news/20260626-1.html'),
      WP('ar0314e00859'),
    ],
    occurrence: {
      ...src(2026, 'https://www.fujisawa-kanko.jp/news/20260626-1.html', '藤沢市観光協会', 'official'),
      start_time: '18:00',
      end_time: '18:30',
      status: 'confirmed',
      note: '荒天中止・順延日なし',
    },
  }],

  // 川崎市のページ。**世田谷区のたまがわ花火大会と合同開催**だが別の大会
  ['kanagawa-007-hanabi-ar0314e182441', {
    organizer: '川崎市・一般社団法人川崎市観光協会・高津観光協会',
    venue: { name: '多摩川河川敷（国道246号旧道 二子橋〜第三京浜道路間）', address: '川崎市高津区' },
    links: [
      L('川崎市 川崎市制記念多摩川花火大会', 'https://www.city.kawasaki.jp/280/page/0000117559.html'),
      WP('ar0314e182441'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.kawasaki.jp/280/page/0000117559.html', '川崎市', 'gov'),
      start_time: '18:00',
      end_time: '19:00',
      status: 'confirmed',
      note: '荒天中止。対岸の世田谷区たまがわ花火大会と合同開催',
    },
  }],

  // 相模原市緑区のページ。会場の番地（与瀬317-1）はここで取れた
  ['kanagawa-008-hanabi-ar0314e00894', {
    organizer: 'さがみ湖湖上祭花火大会実行委員会',
    venue: { name: '県立相模湖公園（相模湖湖上）', address: '相模原市緑区与瀬317-1' },
    links: [
      L('相模原市 さがみ湖湖上祭花火大会', 'https://www.city.sagamihara.kanagawa.jp/midoriku/1032827/1033503.html'),
      WP('ar0314e00894'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.sagamihara.kanagawa.jp/midoriku/1032827/1033503.html', '相模原市', 'gov'),
      start_time: '19:30',
      end_time: '20:20',
      status: 'confirmed',
    },
  }],

  // 相模原納涼花火大会は実行委員会の公式サイトがある。**終了時刻の記載は無い**
  ['kanagawa-006-hanabi-ar0314e00862', {
    organizer: '相模原納涼花火大会実行委員会',
    venue: { name: '相模川高田橋上流', address: '相模原市中央区水郷田名' },
    links: [
      L('相模原納涼花火大会 公式サイト', 'https://sagamiharahanabi.com/'),
      WP('ar0314e00862'),
    ],
    occurrence: {
      ...src(2026, 'https://sagamiharahanabi.com/', '相模原納涼花火大会実行委員会', 'official'),
      start_time: '19:00',
      status: 'confirmed',
      note: '協賛エリアの入場開始は13:00。終了時刻は公式サイトに記載がない',
    },
  }],

  // 小田原。**18:30はオープニングセレモニーで、花火の打上げは19:10から**。
  // まとめサイトは18:30を打上開始として載せていた
  ['odawara-hanabi-ar0314e00865', {
    station: 'JR東海道線 鴨宮駅（徒歩約15分）／小田原駅（徒歩約20分）',
    venue: { name: '酒匂川スポーツ広場', address: '小田原市寿町5-22' },
    links: [
      L('小田原市 第37回小田原酒匂川花火大会', 'https://www.city.odawara.kanagawa.jp/kanko/event/AUG/p36642.html'),
      L('小田原市観光協会 第37回小田原酒匂川花火大会', 'https://www.odawara-kankou.com/hanabi/sakawa-hanabi.html'),
      WP('ar0314e00865'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.odawara.kanagawa.jp/kanko/event/AUG/p36642.html', '小田原市', 'gov'),
      start_time: '18:30',
      end_time: '20:10',
      status: 'confirmed',
      note: '18:30〜19:10はオープニングセレモニー、花火の打上げは19:10から20:10',
    },
  }],

  // 久里浜ペリー祭の公式サイト。主催は久里浜観光協会
  ['yokosuka-hanabi-ar0314e00880', {
    organizer: '久里浜観光協会',
    station: '京急久里浜線 京急久里浜駅',
    links: [
      L('2026久里浜ペリー祭 公式サイト', 'https://perryfes.jp/'),
      WP('ar0314e00880'),
    ],
    occurrence: {
      ...src(2026, 'https://perryfes.jp/', '久里浜観光協会', 'official'),
      start_time: '19:30',
      end_time: '20:00',
      status: 'confirmed',
      note: '荒天中止・順延なし。会場は久里浜海岸・ペリー公園・カインズ裏岸壁（旧ニチロ岸壁）・久里浜ふ頭',
    },
  }],

  // 茅ヶ崎市観光協会のページ。**打上開始は19:20**（まとめサイトは19:30としていた）
  ['chigasaki-southern-beach-hanabi', {
    station: 'JR東海道線 茅ケ崎駅',
    links: [
      L('茅ヶ崎市観光協会 サザンビーチちがさき花火大会', 'https://www.chigasaki-kankou.org/event/hanabi/'),
      WP('ar0314e00899'),
    ],
    occurrence: {
      ...src(2026, 'https://www.chigasaki-kankou.org/event/hanabi/', '茅ヶ崎市観光協会', 'official'),
      start_time: '19:20',
      end_time: '20:10',
      status: 'confirmed',
    },
  }],

  // みなとみらい。**2026年から名前が「みなとみらいフェスティバル」に変わっている**。
  // 公式の実施概要に日付の記載が無いので日付は触らず、花火の時刻だけ入れた
  ['nishi-minatomirai-festival', {
    name: '横浜グリーンエクスポ応援 みなとみらいフェスティバル',
    venue: { name: '臨港パーク・耐震バース・横浜ハンマーヘッド9号岸壁・カップヌードルミュージアムパークほか', address: '横浜市西区みなとみらい' },
    links: [
      L('みなとみらいフェスティバル 2026実施概要', 'https://www.mmsf.yokohama/pages/8958430/page_202505121411'),
      L('みなとみらいフェスティバル 公式サイト', 'https://www.mmsf.yokohama/'),
    ],
    occurrence: {
      ...src(2026, 'https://www.mmsf.yokohama/pages/8958430/page_202505121411', 'みなとみらいフェスティバル実行委員会', 'official'),
      start_time: '19:10',
      end_time: '19:55',
      status: 'confirmed',
      note: '花火（スカイシンフォニー in ヨコハマ）の時間帯。旧称は「みなとみらいスマートフェスティバル」',
    },
  }],
], '花火・神奈川県');
