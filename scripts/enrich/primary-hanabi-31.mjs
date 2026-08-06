/**
 * 一次情報での裏取り（第31弾：既存リンクからの格上げ その16）
 *
 *   node scripts/enrich/primary-hanabi-31.mjs
 *
 * **この回から歩留まりが落ちた**（10件開いて使えたのは4件）。
 * 残っている `links` はリンク切れか一覧ページのものが多い。内訳:
 *
 * | 状態 | 例 |
 * |---|---|
 * | 404（ページが作り直されている） | 加東市花火大会、どんとけぇかんなべ夏祭り、刀水橋花火大会、広小路わくわくフェスタ |
 * | TLS 証明書がホスト名と合わない | 宮若商工会議所（`*.plesk.page` の証明書）、高知商工会議所（`*.bizmw.com` の証明書） |
 * | 一覧ページで個別の告知に届かない | あゆみ祭り、奄美まつり |
 * | 前年のポスターしか無い | 城陽秋花火（2025のまま） |
 *
 * **`links` からの格上げはここでほぼ天井**。この先は検索で新しい出典を
 * 探し直す必要がある（このセッションでは WebSearch の上限に達している）。
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

  // 宝塚。**会場は阪急宝塚駅前のソリオ宝塚ゆめ広場**
  ['hyogo-011-goguynet-46024', {
    organizer: 'ゆめ広場ふれあい夏まつり実行委員会',
    station: '阪急宝塚線 宝塚駅',
    venue: { name: 'ソリオ宝塚 ゆめ広場一帯', address: '宝塚市栄町2丁目' },
    links: [L('宝塚市 ゆめ広場ふれあい夏まつり', 'https://www.city.takarazuka.hyogo.jp/event/1000043/1061701/1063688.html')],
    occurrence: {
      ...src(2026, 'https://www.city.takarazuka.hyogo.jp/event/1000043/1061701/1063688.html', '宝塚市', 'gov'),
      start_time: '17:00',
      end_time: '21:00',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 熊本県
  // ------------------------------------------------------------------

  // 小国町。**開催日は毎年8月13日**で固定。会場は宮原のケヤキ広場周辺
  ['kumamoto-001-summer-ar1043e153733', {
    recurrence: '8月13日',
    recurrence_source: 'https://www.town.kumamoto-oguni.lg.jp/toppage/toppage_hihyoji/20981',
    venue: { name: '宮原 ケヤキ広場周辺', address: '阿蘇郡小国町宮原' },
    links: [L('小国町 ふるさとの夏祭り', 'https://www.town.kumamoto-oguni.lg.jp/toppage/toppage_hihyoji/20981')],
    occurrence: {
      ...src(2026, 'https://www.town.kumamoto-oguni.lg.jp/toppage/toppage_hihyoji/20981', '小国町', 'gov'),
      status: 'confirmed',
      note: '開催日は毎年8月13日。時刻は町のページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 愛媛県
  // ------------------------------------------------------------------

  // 風早海まつり。**会場は北条港の外港野積場**（まとめサイトより具体的）。
  // 花火は20:20から
  ['ehime-007-hanabi-ar0938e469533', {
    venue: { name: '北条港 外港野積場', address: '松山市北条辻' },
    links: [L('松山市 夏のまつり・イベント（風早海まつり）', 'https://www.city.matsuyama.ehime.jp/kanko/kankoguide/matsurievent/matsuri-summer.html')],
    occurrence: {
      ...src(2026, 'https://www.city.matsuyama.ehime.jp/kanko/kankoguide/matsurievent/matsuri-summer.html', '松山市', 'gov'),
      start_time: '20:20',
      status: 'confirmed',
      note: '花火の打上げは20:20から。終了時刻は市のページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 茨城県
  // ------------------------------------------------------------------

  // あゆみ祭り。**観光協会のページは第36回であることと主催しか出していない**
  ['kasumigaura-summer-ar0308e312904', {
    organizer: 'あゆみ祭り実行委員会',
    links: [L('かすみがうら市観光協会 第36回あゆみ祭り', 'https://www.kasumigaura-kankou.jp/page/page000018.html')],
    occurrence: {
      ...src(2026, 'https://www.kasumigaura-kankou.jp/page/page000018.html', 'かすみがうら市観光協会', 'official'),
      status: 'confirmed',
      note: '日付・時刻は観光協会のページに記載がなく、以前の発表による',
    },
  }],
], '既存リンクからの格上げ（16）');
