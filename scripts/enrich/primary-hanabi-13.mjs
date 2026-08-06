/**
 * 一次情報での裏取り（花火大会 第13弾：山形県・岩手県・山梨県・長崎県）
 *
 *   node scripts/enrich/primary-hanabi-13.mjs
 *
 * 方針は `primary-hanabi-01.mjs` の冒頭のとおり。対象は `aggregator` だったものだけ。
 *
 * **日付が食い違ったので入れなかったもの**:
 * 「神明の花火大会」（市川三郷町）は、まとめサイトが 8月7日、
 * 町の特設ページから読めた日付が 8月4日で一致しなかった。
 * 神明の花火は名前のとおり例年 8月7日なので町のページの方を誤読した可能性が高いが、
 * **確かめられないうちは触らない**方針に従ってそのまま残した。
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
  // 山形県
  // ------------------------------------------------------------------

  // 赤川。**公式サイトに日付・時刻の記載が無い**（チケット制で告知が別ページ）ので
  // 出典と主催だけ入れる
  ['yamagata-003-hanabi-ar0206e00656', {
    organizer: '赤川花火大会実行委員会',
    links: [
      L('第33回赤川花火大会 公式サイト', 'https://akagawahanabi.com/'),
      WP('ar0206e00656'),
    ],
    occurrence: {
      ...src(2026, 'https://akagawahanabi.com/', '赤川花火大会実行委員会', 'official'),
      status: 'confirmed',
      note: '無料観覧席はなく、事前のチケット予約が必要。日付・時刻は公式サイトに記載がなく、以前の発表による',
    },
  }],

  // 酒田。**会場は両羽橋〜出羽大橋の間の最上川河川公園**
  ['yamagata-007-hanabi-ar0206e00028', {
    organizer: '酒田の花火実行委員会',
    venue: { name: '最上川河川公園（国道7号両羽橋〜国道112号出羽大橋の間）', address: '酒田市' },
    links: [
      L('酒田の花火2026 公式サイト 開催概要', 'https://sakata-hanabi.com/summary/'),
      WP('ar0206e00028'),
    ],
    occurrence: {
      ...src(2026, 'https://sakata-hanabi.com/summary/', '酒田の花火実行委員会', 'official'),
      start_time: '19:00',
      end_time: '20:00',
      status: 'confirmed',
    },
  }],

  // 山形大花火大会。**打上げは19:12〜20:25**（まとめサイトは19:00としていた）
  ['yamagata-002-hanabi-ar0206e00657', {
    organizer: '山形大花火大会実行委員会（公益社団法人山形青年会議所内）',
    venue: { name: '霞城公園', address: '山形市霞城町1-7' },
    links: [
      L('山形大花火大会 公式サイト 2026年花火大会概要', 'https://yamagatahanabi.com/overview/'),
      WP('ar0206e00657'),
    ],
    occurrence: {
      ...src(2026, 'https://yamagatahanabi.com/overview/', '山形大花火大会実行委員会', 'official'),
      start_time: '19:12',
      end_time: '20:25',
      status: 'confirmed',
      note: '開場は16:00（市役所観覧席は18:00）、屋台は14:00から',
    },
  }],

  // ------------------------------------------------------------------
  // 岩手県
  // ------------------------------------------------------------------

  // 盛岡。主催は盛岡商工会議所都南支所内の実行委員会
  ['iwate-003-hanabi-ar0203e00646', {
    organizer: '盛岡花火の祭典実行委員会（盛岡商工会議所都南支所）',
    venue: { name: '都南大橋下流 北上川河川敷', address: '盛岡市' },
    links: [
      L('盛岡観光コンベンション協会 盛岡花火の祭典', 'https://www.odette.or.jp/?p=798'),
      WP('ar0203e00646'),
    ],
    occurrence: {
      ...src(2026, 'https://www.odette.or.jp/?p=798', '盛岡観光コンベンション協会', 'official'),
      start_time: '19:25',
      end_time: '20:30',
      status: 'confirmed',
      note: '開場は16:30。雨天決行、荒天中止で順延なし',
    },
  }],

  // ------------------------------------------------------------------
  // 山梨県
  // ------------------------------------------------------------------

  // 石和温泉。会場の番地（石和町市部777）が主催側のページで取れた
  ['yamanashi-005-hanabi-ar0419e00682', {
    organizer: '一般社団法人笛吹市観光物産連盟（共催：笛吹市）',
    venue: { name: '笛吹市役所前 笛吹川河川敷', address: '笛吹市石和町市部777' },
    links: [
      L('笛吹市観光物産連盟 2026笛吹市夏祭り', 'https://www.fuefuki-kanko.jp/scontents/summerfes/'),
      WP('ar0419e00682'),
    ],
    occurrence: {
      ...src(2026, 'https://www.fuefuki-kanko.jp/scontents/summerfes/', '一般社団法人笛吹市観光物産連盟', 'official'),
      start_time: '19:30',
      end_time: '21:00',
      status: 'confirmed',
      note: '警報級の荒天の場合は8月23日（日）に延期。協賛者席以外は無料観覧席',
    },
  }],

  // ------------------------------------------------------------------
  // 長崎県
  // ------------------------------------------------------------------

  // 大村。**長崎空港の最終便が発着したあとに打ち上げる**ので開始が21:30頃と遅い
  ['nagasaki-015-hanabi-ar1042e01032', {
    organizer: '一般社団法人大村市観光コンベンション協会',
    venue: { name: 'ボートレース大村（大村湾）', address: '大村市玖島1丁目45-3' },
    links: [
      L('大村市観光コンベンション協会 おおむら夏越花火大会特設ページ', 'https://e-oomura.jp/pages/45/'),
      WP('ar1042e01032'),
    ],
    occurrence: {
      ...src(2026, 'https://e-oomura.jp/pages/45/', '一般社団法人大村市観光コンベンション協会', 'official'),
      start_time: '21:30',
      status: 'confirmed',
      note: '打上げは長崎空港の最終便が発着したあと（21:30頃）から約15分。雨天中止',
    },
  }],
], '花火・山形県／岩手県／山梨県／長崎県');
