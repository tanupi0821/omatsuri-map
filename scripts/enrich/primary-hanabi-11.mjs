/**
 * 一次情報での裏取り（花火大会 第11弾：大阪府・三重県・宮城県・福島県）
 *
 *   node scripts/enrich/primary-hanabi-11.mjs
 *
 * 方針は `primary-hanabi-01.mjs` の冒頭のとおり。対象は `aggregator` だったものだけ。
 *
 * **日付が食い違ったので入れなかったもの**:
 * 桑名水郷花火大会は、まとめサイトが 7月25日、主催者の公式サイト（kuwana-hanabi.com）が
 * 8月1日となっていて一致しなかった。どちらが今年の日程か確かめられなかったので
 * **出典もデータも触っていない**。勝手に上書きするより、まとめサイトのまま残す方が正しい。
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
  // 大阪府
  // ------------------------------------------------------------------

  // なにわ淀川。**公式サイトは第38回であることしか出しておらず**、
  // 日付も時刻も書いていない。出典だけ差し替えて事実は触らない
  ['osaka-003-hanabi-ar0727e00982', {
    links: [
      L('第38回 なにわ淀川花火大会 公式サイト', 'https://www.yodohanabi.com/'),
      WP('ar0727e00982'),
    ],
    occurrence: {
      ...src(2026, 'https://www.yodohanabi.com/', 'なにわ淀川花火大会運営委員会', 'official'),
      status: 'confirmed',
      note: '日付・時刻は公式サイトに記載がなく、以前の発表による。市民ボランティアによる運営',
    },
  }],

  // ------------------------------------------------------------------
  // 三重県
  // ------------------------------------------------------------------

  // 熊野。**予備日が3日も設定されている**（海上で打ち上げるため天候の影響が大きい）
  ['mie-002-hanabi-ar0624e00803', {
    organizer: '熊野市観光協会',
    station: 'JR紀勢本線 熊野市駅（徒歩5分）',
    venue: { name: '七里御浜海岸', address: '三重県熊野市井戸町' },
    links: [
      L('熊野市観光協会 熊野大花火大会', 'https://www.kumano-kankou.info/kumano-fireworks/'),
      WP('ar0624e00803'),
    ],
    occurrence: {
      ...src(2026, 'https://www.kumano-kankou.info/kumano-fireworks/', '熊野市観光協会', 'official'),
      start_time: '19:00',
      status: 'confirmed',
      note: '予備日は8月21日・24日・27日（熊野市観光協会の発表）',
    },
  }],

  // 伊勢。伊勢市が花火大会専用のサイトを持っている
  ['mie-003-hanabi-ar0624e00804', {
    venue: { name: '宮川河畔（度会橋上流）', address: '三重県伊勢市' },
    links: [
      L('伊勢市 伊勢神宮奉納全国花火大会', 'https://www.city.ise.mie.jp/hanabi/'),
      L('伊勢市 第74回大会プログラム', 'https://www.city.ise.mie.jp/hanabi/program/1020446.html'),
      WP('ar0624e00804'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.ise.mie.jp/hanabi/', '伊勢市', 'gov'),
      start_time: '19:20',
      end_time: '21:00',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 宮城県
  // ------------------------------------------------------------------

  // 仙台七夕花火祭。**主催は公益社団法人仙台青年会議所**（市ではない）
  ['miyagi-001-hanabi-ar0204e00651', {
    organizer: '公益社団法人仙台青年会議所',
    venue: { name: '青葉山公園周辺・広瀬川河川敷', address: '宮城県仙台市青葉区' },
    links: [
      L('第57回仙台七夕花火祭 公式サイト 開催概要', 'https://sendai-tanabatahanabi.com/overview/'),
      WP('ar0204e00651'),
    ],
    occurrence: {
      ...src(2026, 'https://sendai-tanabatahanabi.com/overview/', '公益社団法人仙台青年会議所', 'official'),
      start_time: '19:30',
      end_time: '20:30',
      status: 'confirmed',
      note: '雨天決行・荒天中止で順延なし',
    },
  }],

  // 石巻。**祭りは7/31前夜祭〜8/2の3日間**で、花火は8月1日
  ['miyagi-011-hanabi-ar0204e00650', {
    organizer: '石巻川開祭実行委員会',
    links: [
      L('石巻市 石巻川開き祭り', 'https://www.city.ishinomaki.lg.jp/cont/10452000b/-kanko/0011/20130225181937.html'),
      L('石巻川開き祭り 公式サイト', 'https://www.ishinomakikawabiraki.jp/'),
      WP('ar0204e00650'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.ishinomaki.lg.jp/cont/10452000b/-kanko/0011/20130225181937.html', '石巻市', 'gov'),
      status: 'confirmed',
      note: '祭り全体は7月31日（前夜祭）から8月2日まで。花火大会は8月1日で、雨天・荒天の場合は翌日に順延',
    },
  }],

  // ------------------------------------------------------------------
  // 福島県
  // ------------------------------------------------------------------

  // ふくしま花火大会。市のページで会場（信夫ケ丘緑地）と時刻が取れた
  ['fukushima-012-hanabi-ar0207e00660', {
    station: 'JR福島駅（有料臨時シャトルバスで約15分）',
    venue: { name: '信夫ケ丘緑地（阿武隈川と松川の合流点の河川敷）', address: '福島県福島市' },
    links: [
      L('福島市 第48回ふくしま花火大会', 'https://www.city.fukushima.fukushima.jp/kankounavi/contents/enjoy/1/13758.html'),
      WP('ar0207e00660'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.fukushima.fukushima.jp/kankounavi/contents/enjoy/1/13758.html', '福島市', 'gov'),
      start_time: '19:30',
      end_time: '20:30',
      status: 'confirmed',
    },
  }],

  // いわき。会場の郵便番号つき住所が公式サイトで取れた
  ['fukushima-007-hanabi-ar0207e00661', {
    organizer: 'いわき花火大会実行委員会',
    station: 'JR常磐線 泉駅（バスで約15分）',
    venue: { name: 'アクアマリンパーク（小名浜港1・2号埠頭間）', address: '福島県いわき市小名浜本町11-1' },
    links: [
      L('いわき花火大会 公式サイト', 'https://www.iwakihanabi.com/'),
      WP('ar0207e00661'),
    ],
    occurrence: {
      ...src(2026, 'https://www.iwakihanabi.com/', 'いわき花火大会実行委員会', 'official'),
      start_time: '19:00',
      status: 'confirmed',
      note: 'ゲートの開場は16:00。終了時刻は公式サイトに記載がない',
    },
  }],
], '花火・大阪府／三重県／宮城県／福島県');
