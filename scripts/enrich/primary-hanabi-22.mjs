/**
 * 一次情報での裏取り（第22弾：既存リンクからの格上げ その9）
 *
 *   node scripts/enrich/primary-hanabi-22.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。
 *
 * ここでも**複数日開催の取りこぼし**が2件。八戸七夕まつりは3日、
 * いせさき楽市夜市は8月の毎土曜5回あるのに、どちらも端の日しか入っていなかった。
 *
 * 使えなかったもの: 大間町ブルーマリンフェスティバル・とみちゃん夏まつり・
 * 八幡浜みなと花火大会は、リンク先が一覧ページで個別の告知に届いていない。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 青森県
  // ------------------------------------------------------------------

  // 八戸七夕まつり。**3日間**（17日は17:00開始、18・19日は18:00開始）
  ['aomori-006-summer-ar0202e188528', {
    organizer: '八戸商工会議所・株式会社まちづくり八戸',
    venue: { name: '八戸市中心商店街（十三日町・三日町・ヤグラ横町）', address: '八戸市' },
    links: [L('まちづくり八戸 第74回八戸七夕まつり', 'https://www.8town.co.jp/project/tanabata/')],
    occurrence: {
      ...src(2026, 'https://www.8town.co.jp/project/tanabata/', '株式会社まちづくり八戸', 'official'),
      dates: ['2026-07-17', '2026-07-18', '2026-07-19'],
      start_time: '17:00',
      end_time: '21:00',
      status: 'confirmed',
      note: '初日（17日）は17:00から、18日・19日は18:00から。いずれも21:00まで',
    },
  }],

  // ------------------------------------------------------------------
  // 秋田県
  // ------------------------------------------------------------------

  // 協和七夕花火。**開催は毎年7月上旬**。会場の地番が取れた
  ['akita-005-hanabi-ar0205e467443', {
    organizer: '協和七夕花火実行委員会',
    recurrence: '7月上旬',
    recurrence_source: 'https://daisenkankou.com/near/%E5%8D%94%E5%92%8C%E4%B8%83%E5%A4%95%E8%8A%B1%E7%81%AB',
    venue: { name: '協和船岡 上宇津野地内', address: '大仙市協和船岡字上宇津野地内' },
    links: [L('大仙市観光物産協会 協和七夕花火', 'https://daisenkankou.com/near/%E5%8D%94%E5%92%8C%E4%B8%83%E5%A4%95%E8%8A%B1%E7%81%AB')],
    occurrence: {
      ...src(2026, 'https://daisenkankou.com/near/%E5%8D%94%E5%92%8C%E4%B8%83%E5%A4%95%E8%8A%B1%E7%81%AB', '大仙市観光物産協会', 'official'),
      status: 'confirmed',
      note: '日付・時刻は観光物産協会のページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 千葉県
  // ------------------------------------------------------------------

  // 多古祇園祭。**毎年7月25日・26日**で固定
  ['chiba-003-summer-ar0312e73552', {
    shrine: '八坂神社',
    station: '芝山鉄道 芝山千代田駅（徒歩約2分）',
    recurrence: '7月25日・26日',
    recurrence_source: 'https://www.town.tako.chiba.jp/docs/2018012900186/',
    venue: { name: '八坂神社周辺', address: '香取郡多古町多古' },
    links: [L('多古町 多古祇園祭', 'https://www.town.tako.chiba.jp/docs/2018012900186/')],
    occurrence: {
      ...src(2026, 'https://www.town.tako.chiba.jp/docs/2018012900186/', '多古町', 'gov'),
      status: 'confirmed',
      note: '開催日は毎年7月25日・26日。時刻は町のページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 福岡県
  // ------------------------------------------------------------------

  // まつりみなみ。会場は志井公園
  ['fukuoka-001-summer-ar1040e112128', {
    organizer: 'まつりみなみ実行委員会',
    venue: { name: '志井公園', address: '北九州市小倉南区志井公園' },
    links: [L('北九州市小倉南区 まつりみなみ2026', 'https://www.city.kitakyushu.lg.jp/kokuraminami/w3200178.html')],
    occurrence: {
      ...src(2026, 'https://www.city.kitakyushu.lg.jp/kokuraminami/w3200178.html', '北九州市', 'gov'),
      start_time: '18:00',
      end_time: '21:00',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 群馬県
  // ------------------------------------------------------------------

  // いせさき楽市。**8月は「夜市」として毎週土曜に5回**開催する。
  // まとめサイト由来のデータは4回分しか持っていなかった
  ['gunma-001-goguynet-62376', {
    station: 'JR両毛線・東武伊勢崎線 伊勢崎駅',
    venue: { name: '伊勢崎駅南口駅前広場', address: '伊勢崎市今泉町二丁目' },
    links: [L('伊勢崎市 いせさき楽市', 'https://www.city.isesaki.lg.jp/soshiki/keizai/shoko/machinakakaseika/13542.html')],
    occurrence: {
      ...src(2026, 'https://www.city.isesaki.lg.jp/soshiki/keizai/shoko/machinakakaseika/13542.html', '伊勢崎市', 'gov'),
      dates: ['2026-08-01', '2026-08-08', '2026-08-15', '2026-08-22', '2026-08-29'],
      start_time: '17:00',
      end_time: '20:30',
      status: 'confirmed',
      note: '8月は「夜市」として毎週土曜に開催。市の告知では8月29日も含めて5回',
    },
  }],

  // 尾島ねぷたまつり。**毎年8月14日・15日**で固定
  ['ota-summer-ar0310e4773', {
    organizer: '尾島ねぷたまつり実行委員会',
    station: '東武伊勢崎線 木崎駅（徒歩約20分）',
    recurrence: '8月14日・15日',
    recurrence_source: 'https://www.city.ota.gunma.jp/site/kankou/1037648.html',
    venue: { name: '尾島商店街大通り（県道142号線）周辺', address: '太田市尾島町' },
    links: [L('太田市 尾島ねぷたまつり', 'https://www.city.ota.gunma.jp/site/kankou/1037648.html')],
    occurrence: {
      ...src(2026, 'https://www.city.ota.gunma.jp/site/kankou/1037648.html', '太田市', 'gov'),
      start_time: '17:00',
      end_time: '22:00',
      status: 'confirmed',
      note: '津軽物産市のみ15:00から',
    },
  }],

  // 館林まつり。**7月18日が前夜祭、19日が本まつり**で時間帯が違う
  ['tatebayashi-summer-ar0310e305050', {
    organizer: '館林まつり運営委員会',
    venue: { name: '本町通り', address: '館林市本町' },
    links: [L('館林市 第55回館林まつり', 'https://www.city.tatebayashi.gunma.jp/s059/kanko/020/20210506113415.html')],
    occurrence: {
      ...src(2026, 'https://www.city.tatebayashi.gunma.jp/s059/kanko/020/20210506113415.html', '館林市', 'gov'),
      start_time: '15:00',
      end_time: '21:00',
      status: 'confirmed',
      note: '7月18日が前夜祭（16:00〜21:00）、19日が本まつり（15:00〜21:00）',
    },
  }],
], '既存リンクからの格上げ（9）');
