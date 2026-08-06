/**
 * 一次情報での裏取り（第35弾：既存リンクからの格上げ その19）
 *
 *   node scripts/enrich/primary-hanabi-35.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。**この層はここでほぼ打ち止め**。
 *
 * 取れなかったもの: 清流の花火大会（道志村・接続拒否）、忍野八海祭り（一覧ページ）、
 * 飯塚納涼花火大会・氏郷まつり・宮若納涼花火大会・よさこい祭り（いずれも
 * TLS 証明書がホスト名と合わず取得できない）。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 沖縄県
  // ------------------------------------------------------------------

  // 北中城まつり。村のページで第41回・10月10日・しおさい公苑を確認
  ['okinawa-004-hanabi-ar1047e124948', {
    venue: { name: 'しおさい公苑', address: '中頭郡北中城村' },
    links: [L('北中城村 第41回北中城まつり', 'https://www.vill.kitanakagusuku.lg.jp/kakuka/kikaku/chiiki/kankou/dai34kaikitanakagusukusiosaimaturinituite/index.html')],
    occurrence: {
      ...src(2026, 'https://www.vill.kitanakagusuku.lg.jp/kakuka/kikaku/chiiki/kankou/dai34kaikitanakagusukusiosaimaturinituite/index.html', '北中城村', 'gov'),
      status: 'confirmed',
      note: '時刻は村のページに記載がなく、実行委員会が準備中',
    },
  }],

  // ------------------------------------------------------------------
  // 鳥取県
  // ------------------------------------------------------------------

  // 波止のまつり。**毎年7月27日が前夜祭（花火）、28日が船御幸**。
  // 会場は神﨑神社と赤碕港の周辺
  ['tottori-006-hanabi-ar0831e511711', {
    shrine: '神﨑神社',
    recurrence: '7月27日（前夜祭）・7月28日（船御幸）',
    recurrence_source: 'https://www.kotoura-kankou.com/event/hanabi2025/',
    venue: { name: '神﨑神社・赤碕港周辺', address: '東伯郡琴浦町赤碕' },
    links: [L('琴浦町観光協会 波止のまつり納涼花火大会', 'https://www.kotoura-kankou.com/event/hanabi2025/')],
    occurrence: {
      ...src(2026, 'https://www.kotoura-kankou.com/event/hanabi2025/', '琴浦町観光協会', 'official'),
      status: 'confirmed',
      note: '花火は前夜祭（7月27日）の夜。翌28日が船御幸。時刻は観光協会のページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 愛知県
  // ------------------------------------------------------------------

  // 知立の秋葉まつり。**開催日は「9月下旬の日曜日」という決まり**で、
  // データの2026年9月20日はこの決まりに合う。会場は知立神社
  ['aichi-012-hanabi-ar0623e00242', {
    shrine: '知立神社',
    station: '名鉄名古屋本線 知立駅（徒歩約12分）',
    recurrence: '9月下旬の日曜日',
    recurrence_source: 'https://www.chiryu-kanko.com/event/detail/4/',
    venue: { name: '知立神社ほか（本町・西町・宝町・山町・山屋敷町・中新町）', address: '知立市西町神田12' },
    links: [L('知立市観光協会 秋葉まつり', 'https://www.chiryu-kanko.com/event/detail/4/')],
    occurrence: {
      ...src(2026, 'https://www.chiryu-kanko.com/event/detail/4/', '知立市観光協会', 'official'),
      status: 'confirmed',
      note: '観光協会のページは「毎年9月下旬の日曜日」という決まりを示している（例として2025年は9月21日）。手筒花火の奉納は19:00から',
    },
  }],

  // ------------------------------------------------------------------
  // 愛媛県（会場だけ入れる。出典は差し替えない）
  // ------------------------------------------------------------------

  // 土居夏まつり。**市のページは2017年の記事のまま**なので出典には使えないが、
  // 会場（関川河川敷ふるさと広場）は変わらない事実なので入れておく
  ['ehime-003-hanabi-ar0938e00118', {
    venue: { name: '関川河川敷 ふるさと広場', address: '四国中央市土居町' },
  }],
], '既存リンクからの格上げ（19）');
