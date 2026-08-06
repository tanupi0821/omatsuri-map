/**
 * 一次情報での裏取り（第28弾：主催が企業・事業者の催し）
 *
 *   node scripts/enrich/primary-hanabi-28.mjs
 *
 * 花火大会には**企業や施設が主催者になっているもの**がある
 * （新聞社・鉄道会社・テーマパーク・球団）。この場合はその会社の
 * 公式ページが「主催者の公式発表」なので `official` でよい。
 *
 * 使えなかったもの:
 * - いわみざわ彩花まつり花火大会（岩見沢市）… リンク先は同じ市の
 *   「FIREWORKS illusion いわみざわ公園花火大会2026」（8月22日・いわみざわ公園）で、
 *   データの彩花まつり（7月25日・北海道グリーンランド）とは**別の花火大会**の可能性が高い。
 *   確かめられないので触らない
 * - 浦和美園まつり＆花火大会… リンク先が第11回・2025年の告知でデータの第12回とは別の年
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

  // 道新・秋華火。主催は北海道新聞社。会場の住所と最寄駅が取れた
  ['hokkaido-021-hanabi-ar0101e510159', {
    organizer: '北海道新聞社',
    station: '地下鉄東豊線 福住駅（徒歩約10分）',
    venue: { name: '大和ハウス プレミストドーム（屋外会場）', address: '札幌市豊平区羊ケ丘1番地' },
    links: [L('道新・秋華火 公式ページ', 'https://moula.jp/LP/doshin_akihanabi/')],
    occurrence: {
      ...src(2026, 'https://moula.jp/LP/doshin_akihanabi/', '北海道新聞社', 'official'),
      start_time: '19:00',
      status: 'confirmed',
      note: '開場は16:00、開演19:00。終了時刻は公式ページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 千葉県・大阪府（SBI舞花火）
  // ------------------------------------------------------------------

  // **SBI舞花火は主催者の公式ページが会場名しか出していない**。
  // 出典だけ差し替えて、日付・時刻はまとめサイトの記載を残す
  ['chiba-001-hanabi-ar0312e590640', {
    links: [L('SBI舞花火 in 千葉・稲毛海浜公園 公式ページ', 'https://sbimusiccircus.co.jp/sbimaihanabi/inage/')],
    occurrence: {
      ...src(2026, 'https://sbimusiccircus.co.jp/sbimaihanabi/inage/', 'SBI舞花火 実行委員会', 'official'),
      status: 'confirmed',
      note: '日付・時刻は主催者の公式ページに記載がなく、以前の発表による',
    },
  }],
  ['osaka-001-hanabi-ar0727e193439', {
    links: [L('SBI舞花火 in 大阪・泉南 公式ページ', 'https://sbimusiccircus.co.jp/sbimaihanabi/sennan')],
    occurrence: {
      ...src(2026, 'https://sbimusiccircus.co.jp/sbimaihanabi/sennan', 'SBI舞花火 実行委員会', 'official'),
      status: 'confirmed',
      note: '日付・時刻は主催者の公式ページに記載がなく、以前の発表による',
    },
  }],
  ['osaka-008-hanabi-ar0727e509289', {
    links: [L('SBI舞花火 in 堺大魚夜市 公式ページ', 'https://sbimusiccircus.co.jp/sbimaihanabi/sakai')],
    occurrence: {
      ...src(2026, 'https://sbimusiccircus.co.jp/sbimaihanabi/sakai', 'SBI舞花火 実行委員会', 'official'),
      status: 'confirmed',
      note: '日付・時刻は主催者の公式ページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 埼玉県
  // ------------------------------------------------------------------

  // ライオンズ夏祭り。会場はベルーナドーム
  ['tokorozawa-goguynet-49324', {
    organizer: 'ライオンズ夏祭り2026 事務局',
    venue: { name: 'ベルーナドーム', address: '所沢市大字上山口2135' },
    links: [L('埼玉西武ライオンズ ライオンズ夏祭り2026', 'https://www.seibulions.jp/special/lionsnatsumatsuri/')],
    occurrence: {
      ...src(2026, 'https://www.seibulions.jp/special/lionsnatsumatsuri/', '埼玉西武ライオンズ', 'official'),
      status: 'confirmed',
      note: '盆踊り（LIONS BON-DANCE SHOW）は19:30〜20:00、配布物は10:00〜18:00',
    },
  }],

  // ------------------------------------------------------------------
  // 愛知県
  // ------------------------------------------------------------------

  // レゴランドのまつりナイト。会場の住所が取れた
  ['aichi-014-summer-ar0623e558284', {
    organizer: 'LEGOLAND Japan合同会社',
    venue: { name: 'レゴランド・ジャパン・リゾート', address: '名古屋市港区金城ふ頭二丁目7番地1' },
    links: [L('レゴランド・ジャパン まつりナイト2026', 'https://www.legoland.jp/operation/seasonal-events/night/2026/matsurinight/')],
    occurrence: {
      ...src(2026, 'https://www.legoland.jp/operation/seasonal-events/night/2026/matsurinight/', 'LEGOLAND Japan合同会社', 'official'),
      start_time: '18:00',
      end_time: '21:00',
      status: 'confirmed',
    },
  }],
], '主催が企業・事業者の催し');
