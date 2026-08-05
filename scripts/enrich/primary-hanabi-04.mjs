/**
 * 一次情報での裏取り（花火大会 第4弾：千葉県のつづき）
 *
 *   node scripts/enrich/primary-hanabi-04.mjs
 *
 * 方針は `primary-hanabi-01.mjs` の冒頭のとおり。対象は `aggregator` だったものだけ。
 *
 * この回で引っかかったこと:
 *
 * - **主催者の公式サイトが 403 を返すことがある**（chiba-hanabi.jp）。
 *   その場合は市の告知ページ（`*.lg.jp`）に切り替える。行政の発表も一次情報。
 * - **市のページが去年のままのことがある**（君津市は令和7年の告知しか無かった）。
 *   回数と年で確かめて、今年のものが無ければ**格上げしない**。
 * - 会場が「観覧場所」と「打上場所」で違うことがある（かまがやの花火は
 *   観覧が福太郎スタジアム、打上が市制記念公園）。note に書き分ける。
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
  // 千葉県
  // ------------------------------------------------------------------

  // 千葉市。**主催者の公式サイト chiba-hanabi.jp は 403 を返す**ので市の告知を出典にした
  ['chiba-001-hanabi-ar0312e00869', {
    organizer: '千葉市民花火大会実行委員会',
    links: [
      L('千葉市「千葉開府900年記念 幕張ビーチ花火フェスタ2026（第48回千葉市民花火大会）」', 'https://www.city.chiba.jp/keizainosei/keizai/kanko/2025_chiba_hanabi.html'),
      L('幕張ビーチ花火フェスタ2026 公式サイト', 'https://chiba-hanabi.jp/'),
      WP('ar0312e00869'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.chiba.jp/keizainosei/keizai/kanko/2025_chiba_hanabi.html', '千葉市', 'gov'),
      start_time: '19:30',
      end_time: '20:30',
      status: 'confirmed',
    },
  }],

  // 銚子市の告知。会場の住所（中央町3-1）はここでしか取れなかった
  ['choshi-hanabi-ar0312e00411', {
    venue: { name: '河岸公園周辺および利根川河畔', address: '千葉県銚子市中央町3-1' },
    links: [
      L('銚子市 銚子みなとまつり花火大会', 'https://www.city.choshi.chiba.jp/event/page1103_00076.html'),
      WP('ar0312e00411'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.choshi.chiba.jp/event/page1103_00076.html', '銚子市', 'gov'),
      start_time: '19:00',
      end_time: '20:20',
      status: 'confirmed',
      note: '花火の打上開始は19:30の予定。荒天等で延期の場合は8月15日（土）',
    },
  }],

  // 野田市の告知。**会場は「宝珠花橋の江戸川河川敷」**と明記されている
  ['noda-hanabi-ar0312e00408', {
    organizer: '野田市関宿まつり花火大会運営委員会',
    venue: { name: '関宿ふれあい広場（宝珠花橋 江戸川河川敷）', address: '千葉県野田市' },
    links: [
      L('野田市 関宿まつり花火大会', 'https://www.city.noda.chiba.jp/kanko/1021506/1048328.html'),
      WP('ar0312e00408'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.noda.chiba.jp/kanko/1021506/1048328.html', '野田市', 'gov'),
      start_time: '18:30',
      end_time: '20:30',
      status: 'confirmed',
    },
  }],

  // 富津。実行委員会の公式サイトに当日の進行が出ている。**日付の記載が無い**ので
  // 日付は触らず、回数（第11回）が一致することだけ確認した
  ['futtsu-hanabi-ar0312e00354', {
    organizer: '「富津市民花火大会」実行委員会',
    station: 'JR内房線 青堀駅',
    links: [
      L('第11回 富津市民花火大会 公式サイト', 'https://futtsu-hanabi.com/'),
      WP('ar0312e00354'),
    ],
    occurrence: {
      ...src(2026, 'https://futtsu-hanabi.com/', '「富津市民花火大会」実行委員会', 'official'),
      start_time: '19:30',
      end_time: '20:15',
      status: 'confirmed',
      note: '観覧会場は17:00オープン、19:15開会式、花火は19:30から20:15、21:00消灯（公式サイトの進行）',
    },
  }],

  // 旭市の告知。会場は飯岡海岸。**市のページに花火の時刻は無い**
  ['asahi-chiba-hanabi-ar0312e00249', {
    organizer: '旭市いいおかYOU・遊フェスティバル実行委員会',
    venue: { name: '飯岡海岸', address: '千葉県旭市飯岡' },
    links: [
      L('旭市「旭市いいおかYOU・遊フェスティバル2026海浜花火大会開催日について」', 'https://www.city.asahi.lg.jp/soshiki/14/28262.html'),
      L('旭市いいおかYOU･遊フェスティバル 公式サイト', 'https://youyufes.com/'),
      WP('ar0312e00249'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.asahi.lg.jp/soshiki/14/28262.html', '旭市', 'gov'),
      status: 'confirmed',
      note: '花火の打上時刻は旭市の告知に記載がない',
    },
  }],

  // 一宮町観光協会（主催）のページ。**開催日は「8月第1土曜日」というルール**なので
  // recurrence に入れておく。今年の情報が無い年でも役に立つ
  ['chiba-008-hanabi-ar0312e00900', {
    organizer: '一宮町観光協会',
    station: 'JR外房線 上総一ノ宮駅',
    recurrence: '8月第1土曜日',
    recurrence_source: 'https://ichinomiya.org/spot/%E4%B8%80%E5%AE%AE%E7%94%BA%E7%B4%8D%E6%B6%BC%E8%8A%B1%E7%81%AB%E5%A4%A7%E4%BC%9A/',
    venue: { name: '一宮海岸（2号突堤）', address: '千葉県長生郡一宮町一宮地先' },
    links: [
      L('一宮町観光協会 一宮町納涼花火大会', 'https://ichinomiya.org/spot/%E4%B8%80%E5%AE%AE%E7%94%BA%E7%B4%8D%E6%B6%BC%E8%8A%B1%E7%81%AB%E5%A4%A7%E4%BC%9A/'),
      WP('ar0312e00900'),
    ],
    occurrence: {
      ...src(2026, 'https://ichinomiya.org/spot/%E4%B8%80%E5%AE%AE%E7%94%BA%E7%B4%8D%E6%B6%BC%E8%8A%B1%E7%81%AB%E5%A4%A7%E4%BC%9A/', '一宮町観光協会', 'official'),
      status: 'confirmed',
      note: '打上時刻は観光協会のページに記載がなく、以前の発表による',
    },
  }],

  // 鎌ケ谷市の告知。**観覧場所（福太郎スタジアム）と打上場所（市制記念公園）が違う**
  ['kamagaya-hanabi-ar0312e196701', {
    organizer: 'かまがやの花火実行委員会',
    links: [
      L('鎌ケ谷市 かまがやの花火開催のお知らせ', 'https://www.city.kamagaya.chiba.jp/kanko-bunka-sports/kanko/kamagayanohanabi.html'),
      L('かまがやの花火2026 公式サイト', 'https://www.kamagayanohanabi.com/'),
      WP('ar0312e196701'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.kamagaya.chiba.jp/kanko-bunka-sports/kanko/kamagayanohanabi.html', '鎌ケ谷市', 'gov'),
      start_time: '19:30',
      end_time: '20:30',
      status: 'confirmed',
      note: '観覧場所は福太郎スタジアム、打上場所は市制記念公園。縁日は16:00から20:30。荒天中止で順延なし',
    },
  }],

  // 大網白里市。**例年7月だが2026年は9月開催**。市の告知で日付を確かめた
  ['oamishirasato-hanabi-ar0312e00504', {
    organizer: '大網白里市なつまつり実行委員会',
    venue: { name: '白里海岸（白里海水浴場）', address: '千葉県大網白里市' },
    links: [
      L('大網白里市「おおあみしらさとの花火を9月26日（土曜日）に開催します！」', 'https://www.city.oamishirasato.lg.jp/0000015266.html'),
      WP('ar0312e00504'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.oamishirasato.lg.jp/0000015266.html', '大網白里市', 'gov'),
      start_time: '18:30',
      status: 'confirmed',
      note: '予備日は9月27日。例年は7月開催だったが2026年は9月開催',
    },
  }],

  // 館山市の交通規制の告知に、大会名・日付・時刻・主催が揃っていた
  ['tateyama-hanabi-ar0312e00871', {
    organizer: '館山観光まつり実行委員会',
    links: [
      L('館山市 館山湾花火大会の交通規制について', 'https://www.city.tateyama.chiba.jp/kankominato/page000001_00115.html'),
      WP('ar0312e00871'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.tateyama.chiba.jp/kankominato/page000001_00115.html', '館山市', 'gov'),
      start_time: '19:30',
      end_time: '20:30',
      status: 'confirmed',
      note: '荒天時は8月9日（日）に順延',
    },
  }],

  // 流山市の告知。**名前が「令和7年度」のままだったので今年度の表記に直す**
  ['nagareyama-hanabi-ar0312e00885', {
    name: '令和8年度 流山花火大会',
    station: '流鉄流山線 流山駅・平和台駅（徒歩約5分）',
    venue: { name: '江戸川堤（流山1〜3丁目地先）', address: '千葉県流山市流山1〜3丁目地先' },
    links: [
      L('流山市 令和8年度 流山花火大会', 'https://www.city.nagareyama.chiba.jp/tourism/1013059/1050206.html'),
      WP('ar0312e00885'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.nagareyama.chiba.jp/tourism/1013059/1050206.html', '流山市', 'gov'),
      start_time: '18:00',
      end_time: '18:40',
      status: 'confirmed',
      note: '市制施行60周年記念。三郷花火大会と同時開催',
    },
  }],
], '花火・千葉県（続き）');
