/**
 * 一次情報での裏取り（第30弾：既存リンクからの格上げ その15）
 *
 *   node scripts/enrich/primary-hanabi-30.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。
 *
 * 取れなかったもの:
 * - かんおんじ銭形まつり（観音寺商工会議所）… 接続拒否
 * - よさこい祭り（高知商工会議所）… TLS 証明書のホスト名が合わず取得できない
 *   （`www.cciweb.or.jp` の証明書が `*.bizmw.com` になっている）
 * - 八千代ふるさと親子祭… リンク先が第51回・2025年でデータの第52回とは別の年
 * - 杉田まつり（横浜市磯子区）… リンク先が2024年の区民ニュース
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 北海道
  // ------------------------------------------------------------------

  // 千歳。**打上げは自衛隊駐屯地の中**なので会場の住所が分かりにくい。
  // 商工会議所のページで「北信濃724番地」まで取れた
  ['hokkaido-033-hanabi-ar0101e00742', {
    organizer: '千歳市民花火大会実行委員会',
    station: 'JR千歳駅（バス「桜木線」で北桜コミュニティセンター前下車）',
    venue: { name: '陸上自衛隊北千歳駐屯地内 スキー山横', address: '千歳市北信濃724番地' },
    links: [L('千歳商工会議所 千歳市空港開港100年記念 千歳市民花火大会', 'https://www.chitose-cci.or.jp/information/view/87')],
    occurrence: {
      ...src(2026, 'https://www.chitose-cci.or.jp/information/view/87', '千歳市民花火大会実行委員会（千歳商工会議所）', 'official'),
      start_time: '19:45',
      end_time: '20:30',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 三重県
  // ------------------------------------------------------------------

  // おわせ港まつり。荒天時は翌日に順延
  ['mie-015-hanabi-ar0624e00208', {
    organizer: '第73回おわせ港まつり実行委員会',
    venue: { name: '尾鷲港周辺', address: '尾鷲市' },
    links: [L('尾鷲観光物産協会 第73回おわせ港まつり', 'https://owasekankou.com/special/minatomatsuri/')],
    occurrence: {
      ...src(2026, 'https://owasekankou.com/special/minatomatsuri/', '尾鷲観光物産協会', 'official'),
      start_time: '19:30',
      end_time: '21:00',
      status: 'confirmed',
      note: '荒天時は8月2日に順延',
    },
  }],

  // 潮かけ祭り。**開催日は毎年7月14日**（前夜祭が13日）で固定
  ['mie-006-hanabi-ar0624e00452', {
    organizer: '一般社団法人志摩市観光協会',
    station: '近鉄志摩線 鵜方駅（三交バス御座行きで約47分、「和具」下車）',
    recurrence: '7月14日（前夜祭は7月13日）',
    recurrence_source: 'https://www.iseshima-kanko.jp/event/1020',
    venue: { name: '和具漁港 魚市場周辺', address: '志摩市志摩町和具' },
    links: [L('伊勢志摩観光ナビ（志摩市観光協会）潮かけ祭り', 'https://www.iseshima-kanko.jp/event/1020')],
    occurrence: {
      ...src(2026, 'https://www.iseshima-kanko.jp/event/1020', '一般社団法人志摩市観光協会', 'official'),
      status: 'confirmed',
      note: '開催日は毎年7月14日。花火の時刻は観光協会のページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 熊本県
  // ------------------------------------------------------------------

  // 宇城市の「ふるさと祭り」は旧町ごとに別の日にやる。市のイベント一覧に両方載っている
  ['kumamoto-001-hanabi-ar1043e356343', {
    links: [L('宇城市 イベント情報（小川町ふるさと祭り）', 'https://www.city.uki.kumamoto.jp/kankobunka/events/2594200')],
    occurrence: {
      ...src(2026, 'https://www.city.uki.kumamoto.jp/kankobunka/events/2594200', '宇城市', 'gov'),
      status: 'confirmed',
      note: '時刻・会場は市のイベント一覧に記載がなく、以前の発表による',
    },
  }],
  ['kumamoto-001-hanabi-ar1043e356344', {
    links: [L('宇城市 イベント情報（豊野町ふるさと祭り）', 'https://www.city.uki.kumamoto.jp/kankobunka/events/2594200')],
    occurrence: {
      ...src(2026, 'https://www.city.uki.kumamoto.jp/kankobunka/events/2594200', '宇城市', 'gov'),
      status: 'confirmed',
      note: '時刻・会場は市のイベント一覧に記載がなく、以前の発表による',
    },
  }],

  // 甲佐町のあゆまつり。**2026年は75周年の記念大会**
  ['kumamoto-013-hanabi-ar1043e00319', {
    links: [L('甲佐町 あゆまつり75周年記念イベント', 'https://www.town.kosa.lg.jp/q/aview/1/13066.html')],
    occurrence: {
      ...src(2026, 'https://www.town.kosa.lg.jp/q/aview/1/13066.html', '甲佐町', 'gov'),
      status: 'confirmed',
      note: '2026年は75周年の記念イベント。時刻は町のページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 高知県
  // ------------------------------------------------------------------

  // 奈半利町。町のページで第61回・8月16日を確認
  ['kochi-002-hanabi-ar0939e518024', {
    links: [L('奈半利町 第61回奈半利町港まつり', 'https://www.town.nahari.kochi.jp/kanko/dtl.php?hdnKey=1706')],
    occurrence: {
      ...src(2026, 'https://www.town.nahari.kochi.jp/kanko/dtl.php?hdnKey=1706', '奈半利町', 'gov'),
      status: 'confirmed',
      note: '時刻は町のページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 福岡県
  // ------------------------------------------------------------------

  // 今井祇園祭。**正式には「今井祇園行事」**（国選択の民俗文化財）。
  // 例年は7月中旬〜8月初旬で、2026年は8月1日
  ['fukuoka-008-summer-ar1040e314279', {
    shrine: '今井津須佐神社',
    recurrence: '7月中旬〜8月初旬',
    recurrence_source: 'https://www.city.yukuhashi.fukuoka.jp/site/bunkazai/27697.html',
    venue: { name: '今井津須佐神社・今井西公民館', address: '行橋市元永1299' },
    links: [L('行橋市 今井祇園行事', 'https://www.city.yukuhashi.fukuoka.jp/site/bunkazai/27697.html')],
    occurrence: {
      ...src(2026, 'https://www.city.yukuhashi.fukuoka.jp/site/bunkazai/27697.html', '行橋市', 'gov'),
      start_time: '17:00',
      status: 'confirmed',
      note: '「夜祇園」は17:00頃から、「元永山笠」は18:00頃から、「車上連歌」は20:00頃から',
    },
  }],

  // ------------------------------------------------------------------
  // 兵庫県
  // ------------------------------------------------------------------

  // こうべ海の盆踊り。会場（メリケンパーク）の住所と最寄駅が区のページで取れた
  ['hyogo-001-summer-ar0728e194700', {
    organizer: 'こうべ海の盆踊り実行委員会',
    station: '神戸市営地下鉄海岸線 みなと元町駅（徒歩7分）／JR・阪神 元町駅（徒歩10分）',
    venue: { name: 'メリケンパーク', address: '神戸市中央区波止場町2-2' },
    links: [L('神戸市中央区 こうべ海の盆踊り2026', 'https://www.city.kobe.lg.jp/d49614/kuyakusho/chuoku/keikaku/uminobon/top.html')],
    occurrence: {
      ...src(2026, 'https://www.city.kobe.lg.jp/d49614/kuyakusho/chuoku/keikaku/uminobon/top.html', '神戸市', 'gov'),
      start_time: '18:00',
      end_time: '20:30',
      status: 'confirmed',
    },
  }],
], '既存リンクからの格上げ（15）');
