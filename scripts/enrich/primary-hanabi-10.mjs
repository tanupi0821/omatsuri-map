/**
 * 一次情報での裏取り（花火大会 第10弾：長野県・秋田県・兵庫県）
 *
 *   node scripts/enrich/primary-hanabi-10.mjs
 *
 * 方針は `primary-hanabi-01.mjs` の冒頭のとおり。対象は `aggregator` だったものだけ。
 *
 * **商工会議所が主催者のことが多い**（大曲・能代・上田・大館）。
 * 市のページに無くても商工会議所か観光協会を探すと出てくる。
 * `docs/kanto-plan.md` の「市のページに無ければ商工会を探す」がそのまま当てはまった。
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
  // 長野県
  // ------------------------------------------------------------------

  // 諏訪湖。主催は諏訪湖祭実行委員会（諏訪市役所観光課内）
  ['nagano-005-hanabi-ar0420e00799', {
    organizer: '諏訪湖祭実行委員会（諏訪市役所観光課内）',
    venue: { name: '上諏訪温泉 諏訪湖上（湖畔公園前）', address: '長野県諏訪市' },
    links: [
      L('諏訪市観光ガイド（諏訪観光協会）2026 諏訪湖の花火', 'https://www.suwakanko.jp/story/hanabi-suwako/'),
      WP('ar0420e00799'),
    ],
    occurrence: {
      ...src(2026, 'https://www.suwakanko.jp/story/hanabi-suwako/', '諏訪観光協会', 'official'),
      start_time: '19:00',
      status: 'confirmed',
      note: '終了時刻は主催側のページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 秋田県
  // ------------------------------------------------------------------

  // 大曲。**昼花火（17:10〜18:00）と夜花火（19:00〜21:30）があるのが特徴**。
  // 全体の時間帯を start/end に入れ、内訳は note に書く
  ['akita-005-hanabi-ar0205e00654', {
    organizer: '大曲商工会議所・大仙市',
    venue: { name: '「大曲の花火」公園（雄物川河畔）', address: '秋田県大仙市大曲雄物川河畔' },
    links: [
      L('大曲の花火 公式サイト 開催概要（全国花火競技大会）', 'https://www.omagari-hanabi.com/overview/summer'),
      WP('ar0205e00654'),
    ],
    occurrence: {
      ...src(2026, 'https://www.omagari-hanabi.com/overview/summer', '大曲商工会議所・大仙市', 'official'),
      start_time: '17:10',
      end_time: '21:30',
      status: 'confirmed',
      note: '昼花火は17:10〜18:00、夜花火は19:00〜21:30',
    },
  }],

  // 大館。**大文字焼き（第58回）と花火大会（第72回）で回数が違う**同じ祭りの中の行事
  ['akita-003-hanabi-ar0205e00041', {
    organizer: '大館大文字まつり実行委員会',
    venue: { name: '長木川河川敷', address: '秋田県大館市' },
    links: [
      L('大館市 大館大文字まつり', 'https://www.city.odate.lg.jp/city/kankou/festibal/festa/summer/daimonzi'),
      WP('ar0205e00041'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.odate.lg.jp/city/kankou/festibal/festa/summer/daimonzi', '大館市', 'gov'),
      start_time: '20:15',
      status: 'confirmed',
      note: '大文字焼きは20:00から。市の告知に花火の終了時刻は記載がない',
    },
  }],

  // 能代。主催は能代の花火実行委員会（能代商工会議所内）
  ['akita-009-hanabi-ar0205e01043', {
    organizer: '能代の花火実行委員会（能代商工会議所内）',
    station: 'JR五能線 能代駅',
    venue: { name: '能代港下浜ふ頭 特設会場', address: '秋田県能代市' },
    links: [
      L('能代観光協会 第22回港まつり 能代の花火', 'https://welcomenoshiro.com/event/22thnoshiro%EF%BD%B0hanabi/'),
      L('能代の花火 公式サイト', 'https://noshiro-hanabi.com/'),
      WP('ar0205e01043'),
    ],
    occurrence: {
      ...src(2026, 'https://welcomenoshiro.com/event/22thnoshiro%EF%BD%B0hanabi/', '能代観光協会', 'official'),
      start_time: '19:30',
      end_time: '21:00',
      status: 'confirmed',
      note: '雨天決行。荒天の場合は7月19日（日）・20日（月）に順延',
    },
  }],

  // ------------------------------------------------------------------
  // 兵庫県
  // ------------------------------------------------------------------

  // 姫路。市の告知で時刻と最寄駅が取れた。**全席有料**
  ['hyogo-005-hanabi-ar0728e00353', {
    organizer: '姫路みなと祭協賛会',
    station: '山陽電鉄 飾磨駅',
    venue: { name: '姫路港（飾磨地区）', address: '兵庫県姫路市飾磨区' },
    links: [
      L('姫路市「姫路みなと祭海上花火大会2026」の開催について', 'https://www.city.himeji.lg.jp/shisei/0000033517.html'),
      WP('ar0728e00353'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.himeji.lg.jp/shisei/0000033517.html', '姫路市', 'gov'),
      start_time: '19:40',
      end_time: '20:50',
      status: 'confirmed',
      note: '全席有料。会場周辺は当日全面駐車禁止',
    },
  }],

  // 猪名川花火大会は**大阪府池田市と兵庫県川西市の共催**で府県境をまたぐ。
  // 2026年は熱中症対策のため8月から11月に移した
  ['hyogo-010-hanabi-ar0728e00767', {
    organizer: '猪名川花火大会開催委員会（池田市・川西市）',
    venue: { name: '猪名川河川敷（大阪側＝池田市桃園／兵庫側＝川西市小花・下加茂）', address: '兵庫県川西市小花' },
    links: [
      L('池田市「令和8年第77回猪名川花火大会の開催について」', 'https://www.city.ikeda.osaka.jp/soshiki/siminseikatsu/citypro/event/18901.html'),
      WP('ar0728e00767'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.ikeda.osaka.jp/soshiki/siminseikatsu/citypro/event/18901.html', '池田市', 'gov'),
      start_time: '18:00',
      end_time: '18:30',
      status: 'confirmed',
      note: '従来は8月開催だったが、熱中症対策・安全面の理由で2026年度は11月7日に変更された',
    },
  }],
], '花火・長野県／秋田県／兵庫県');
