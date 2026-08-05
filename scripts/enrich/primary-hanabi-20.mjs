/**
 * 一次情報での裏取り（第20弾：既存リンクからの格上げ その7）
 *
 *   node scripts/enrich/primary-hanabi-20.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。
 *
 * **日付が食い違ったので触らなかったもの**:
 * 小豆島まつり（小豆島町）は、まとめサイトが 8月15日、町のページから読めた日付が
 * 6月5日で一致しなかった。どちらが今年のものか確かめられないので出典もそのまま。
 *
 * リンク先が古かったもの: 土居夏まつり（四国中央市・2017年）、
 * 伊自良サマーフェスティバル（山県市・そもそも「伊自良夏まつり」しか載っていない）。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 兵庫県
  // ------------------------------------------------------------------

  // 加西。会場の番地（北条町横尾1000）と花火の時刻が市のページで揃った
  ['hyogo-020-hanabi-ar0728e355834', {
    organizer: '加西サイサイまつり祭典委員会',
    venue: { name: '加西市役所駐車場', address: '兵庫県加西市北条町横尾1000番地' },
    links: [L('加西市 第49回加西サイサイまつり', 'https://www.city.kasai.hyogo.jp/site/bunka03/')],
    occurrence: {
      ...src(2026, 'https://www.city.kasai.hyogo.jp/site/bunka03/', '加西市', 'gov'),
      start_time: '20:30',
      end_time: '20:50',
      status: 'confirmed',
      note: '前夜祭は8月1日。20:30〜20:50は花火の時間帯',
    },
  }],

  // ------------------------------------------------------------------
  // 鹿児島県
  // ------------------------------------------------------------------

  // 知覧ねぷた祭。会場（知覧まち商店街）の番地が取れた
  ['kagoshima-011-summer-ar1046e187805', {
    organizer: '知覧ねぷた祭実行委員会',
    venue: { name: '知覧まち商店街', address: '鹿児島県南九州市知覧町郡6204番地一帯' },
    links: [L('南九州市 第27回知覧ねぷた祭', 'https://www.city.minamikyushu.lg.jp/kankosite/event/5566.html')],
    occurrence: {
      ...src(2026, 'https://www.city.minamikyushu.lg.jp/kankosite/event/5566.html', '南九州市', 'gov'),
      start_time: '19:00',
      end_time: '21:00',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 北海道
  // ------------------------------------------------------------------

  // くしろ港まつり。**8月7日・8日・9日の3日間**なのに、
  // まとめサイト由来のデータは初日と最終日の2日分しか持っていなかった
  ['hokkaido-020-summer-ar0101e75772', {
    organizer: 'くしろ港まつり会',
    venue: { name: '花火大会は耐震・旅客船ターミナル、パレードは北大通', address: '北海道釧路市' },
    links: [L('釧路市 第79回くしろ港まつり', 'https://www.city.kushiro.lg.jp/sangyou/umisora/1006541/1006564/1006566.html')],
    occurrence: {
      ...src(2026, 'https://www.city.kushiro.lg.jp/sangyou/umisora/1006541/1006564/1006566.html', '釧路市', 'gov'),
      dates: ['2026-08-07', '2026-08-08', '2026-08-09'],
      status: 'confirmed',
    },
  }],

  // 伊達武者まつり。**前夜祭（7/31）と本祭（8/1）で時間帯が違う**
  ['hokkaido-011-summer-ar0101e74820', {
    organizer: '伊達武者まつり実行委員会',
    station: 'JR室蘭本線 伊達紋別駅',
    venue: { name: '総合公園だて歴史の杜 カルチャーセンター前広場ほか', address: '北海道伊達市' },
    links: [L('伊達市 第50回伊達武者まつり', 'https://www.city.date.hokkaido.jp/hotnews/detail/00007654.html')],
    occurrence: {
      ...src(2026, 'https://www.city.date.hokkaido.jp/hotnews/detail/00007654.html', '伊達市', 'gov'),
      status: 'confirmed',
      note: '前夜祭（7月31日）は15:00〜21:00、本祭（8月1日）は10:00〜15:00と18:00〜22:00',
    },
  }],

  // とうま蟠龍まつり。**開催日は毎年8月第1日曜日**という決まり
  ['hokkaido-047-hanabi-ar0101e01012', {
    recurrence: '8月第1日曜日',
    recurrence_source: 'https://www.town.tohma.hokkaido.jp/all-about/04/01/1807',
    venue: { name: '公民館まとまーる前特設会場', address: '北海道上川郡当麻町' },
    links: [L('当麻町 蟠龍まつり', 'https://www.town.tohma.hokkaido.jp/all-about/04/01/1807')],
    occurrence: {
      ...src(2026, 'https://www.town.tohma.hokkaido.jp/all-about/04/01/1807', '当麻町', 'gov'),
      status: 'confirmed',
      note: '開催日は毎年8月第1日曜日。花火の時刻は町のページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 茨城県
  // ------------------------------------------------------------------

  // 撞舞。**八坂神社祇園祭の最終日（7月下旬）に行う**国選択の民俗文化財
  ['ryugasaki-summer-ar0308e4772', {
    organizer: '龍ケ崎市撞舞保存会',
    station: '関東鉄道竜ヶ崎線 竜ヶ崎駅',
    recurrence: '7月下旬（八坂神社祇園祭の最終日）',
    recurrence_source: 'https://www.city.ryugasaki.ibaraki.jp/kanko/bunka/bunkazai/tukumai.html',
    venue: { name: '根町 撞舞通り', address: '茨城県龍ケ崎市根町' },
    links: [L('龍ケ崎市 撞舞（つくまい）', 'https://www.city.ryugasaki.ibaraki.jp/kanko/bunka/bunkazai/tukumai.html')],
    occurrence: {
      ...src(2026, 'https://www.city.ryugasaki.ibaraki.jp/kanko/bunka/bunkazai/tukumai.html', '龍ケ崎市', 'gov'),
      start_time: '18:00',
      status: 'confirmed',
      note: '「午後6時頃から」と市のページに記載。八坂神社祇園祭の最終日に行われる',
    },
  }],
], '既存リンクからの格上げ（7）');
