/**
 * 一次情報での裏取り（花火大会 第2弾：栃木県・群馬県）
 *
 *   node scripts/enrich/primary-hanabi-02.mjs
 *
 * 方針は `primary-hanabi-01.mjs` の冒頭に書いたとおり。
 * 対象は `aggregator`（ウォーカープラス花火DB）だったものだけ。
 *
 * この回で分かったこと:
 *
 * - **規模の大きい花火大会は実行委員会が独自ドメインの公式サイトを持っている**。
 *   宇都宮・小山・日光・前橋・沼田・桐生・渡良瀬遊水地はいずれもそうだった。
 *   `<大会名> <市区町村名> 主催 会場 時間` の 4 語で 1 発で出る。
 * - **公式サイトは意外と時刻を書かない**。日付と会場しか出ていないことが多く、
 *   時刻はまとめサイトにしか無い。その場合は時刻を上書きせず、
 *   出典だけ差し替えて `note` に経緯を書いた。
 * - **回数（第何回）で年がずれていないか確かめる**。境町・館林・磯部温泉は
 *   検索上位に前回大会のページが残っていた。
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
  // 栃木県
  // ------------------------------------------------------------------

  // 主催はNPO法人。**公式サイトに花火の時刻の記載が無い**ので時刻は触っていない
  ['utsunomiya-hanabi-ar0309e01088', {
    organizer: '特定非営利活動法人うつのみや百年花火',
    venue: { name: '宇都宮市道場宿緑地（鬼怒川河川敷）', address: '栃木県宇都宮市道場宿町' },
    links: [
      L('2026うつのみや花火大会 公式サイト 開催概要', 'https://www.utsunomiya-hanabi.jp/summary'),
      WP('ar0309e01088'),
    ],
    occurrence: {
      ...src(2026, 'https://www.utsunomiya-hanabi.jp/summary', '特定非営利活動法人うつのみや百年花火', 'official'),
      status: 'confirmed',
      note: '荒天時は8月9日（日）に順延。花火の打上時刻は公式サイトに記載がない',
    },
  }],
  // 同じ祭りの重複データ
  ['utsunomiya-utsunomiya-hanabi', {
    organizer: '特定非営利活動法人うつのみや百年花火',
    links: [L('2026うつのみや花火大会 公式サイト 開催概要', 'https://www.utsunomiya-hanabi.jp/summary')],
    occurrence: {
      ...src(2026, 'https://www.utsunomiya-hanabi.jp/summary', '特定非営利活動法人うつのみや百年花火', 'official'),
      status: 'confirmed',
    },
  }],

  // 小山の花火。公式サイトは第74回・10月3日まで出しているが会場と時刻の記載が無い
  ['oyama-hanabi-ar0309e00890', {
    organizer: '小山の花火実行委員会',
    links: [
      L('第74回 小山の花火 公式サイト', 'https://www.oyamanohanabi.com/'),
      WP('ar0309e00890'),
    ],
    occurrence: {
      ...src(2026, 'https://www.oyamanohanabi.com/', '小山の花火実行委員会', 'official'),
      status: 'confirmed',
      note: '時刻は公式サイトに記載がなく、以前の発表による',
    },
  }],

  // 日光花火大会。公式サイトに「栃木県日光市」と明記があり本人確認できた
  ['nikko-hanabi-ar0309e00578', {
    organizer: '日光花火大会実行委員会',
    venue: { name: '日光だいや川公園河川敷・丸山公園', address: '栃木県日光市瀬川' },
    links: [
      L('日光花火大会 公式サイト', 'https://www.nikko-hanabi.com/'),
      WP('ar0309e00578'),
    ],
    occurrence: {
      ...src(2026, 'https://www.nikko-hanabi.com/', '日光花火大会実行委員会', 'official'),
      start_time: '19:00',
      status: 'confirmed',
    },
  }],

  // 渡良瀬遊水地。**会場は「渡良瀬遊水地」ではなく藤岡渡良瀬運動公園**と
  // 公式サイトに出ている。12時開会・18時30分打上なので、全体の時間帯を入れて
  // 花火の時刻は note に書く（`docs/kanto-plan.md` の線引きに従う）
  ['tochigi-shi-watarase-yusuichi-hanabi', {
    organizer: '渡良瀬遊水地花火大会実行委員会',
    venue: { name: '藤岡渡良瀬運動公園（渡良瀬遊水地）', address: '栃木県栃木市藤岡町藤岡字東原地先' },
    links: [
      L('第4回 渡良瀬遊水地花火大会 概要（公式）', 'https://watarase-hanabi.info/fireworks-display-overview2026/'),
      L('渡良瀬遊水地花火大会 公式サイト', 'https://watarase-hanabi.info/'),
    ],
    occurrence: {
      ...src(2026, 'https://watarase-hanabi.info/fireworks-display-overview2026/', '渡良瀬遊水地花火大会実行委員会', 'official'),
      start_time: '12:00',
      end_time: '20:00',
      status: 'confirmed',
      note: '12:00開会、花火の打上げは18:30から20:00まで（公式サイトの予定）',
    },
  }],

  // ------------------------------------------------------------------
  // 群馬県
  // ------------------------------------------------------------------

  // 前橋花火大会。オフィシャルサイトが第70回・8月8日・19時10分打上を出している
  ['maebashi-hanabi-ar0310e00917', {
    organizer: '前橋花火大会実施委員会',
    links: [
      L('前橋花火大会 オフィシャルサイト', 'https://www.maebashihanabi.jp/'),
      WP('ar0310e00917'),
    ],
    occurrence: {
      ...src(2026, 'https://www.maebashihanabi.jp/', '前橋花火大会実施委員会', 'official'),
      start_time: '19:10',
      status: 'confirmed',
      note: '河川敷会場の開場は15:00、オープニングセレモニーは18:50から',
    },
  }],

  // 高崎まつりの大花火大会。**大会名は「高崎まつり大花火大会」**で、
  // まとめサイトの「高崎大花火大会」とは表記が違うが同じもの（会場・日付が一致）
  ['takasaki-hanabi-ar0310e00905', {
    links: [
      L('第52回 高崎まつり 大花火大会（公式）', 'https://www.takasaki-matsuri.jp/oohanabi_taikai/'),
      WP('ar0310e00905'),
    ],
    occurrence: {
      ...src(2026, 'https://www.takasaki-matsuri.jp/oohanabi_taikai/', '高崎まつり実行委員会', 'official'),
      start_time: '19:30',
      end_time: '20:20',
      status: 'confirmed',
      note: '荒天時は8月23日（日）に順延',
    },
  }],

  // 箕郷ふるさと祭り。**高崎市箕郷支所の告知**で会場の番地まで取れた。
  // 市のページに花火の時刻が無いので、時刻は前の出典のまま残す
  ['takasaki-hanabi-ar0310e00577', {
    organizer: '高崎市箕郷支所',
    venue: { name: 'ふれあい公園', address: '群馬県高崎市箕郷町西明屋740' },
    links: [
      L('高崎市（箕郷支所）箕郷ふるさと祭り', 'https://www.city.takasaki.gunma.jp/page/40646.html'),
      WP('ar0310e00577'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.takasaki.gunma.jp/page/40646.html', '高崎市', 'gov'),
      status: 'confirmed',
      note: '祭り全体は11:00から20:00。花火の打上時刻は高崎市の告知に記載がなく、以前の発表による。荒天中止',
    },
  }],

  // 沼田花火大会。実行委員会の公式サイトで第14回・9月12日を確認
  ['numata-hanabi-ar0310e40188', {
    organizer: '沼田花火大会実行委員会',
    venue: { name: '沼田市運動公園', address: '群馬県沼田市硯田町626' },
    links: [
      L('沼田花火大会 公式サイト', 'https://numatahanabi.com/'),
      L('沼田市 沼田花火大会', 'https://www.city.numata.gunma.jp/kanko/1004168/index.html'),
      WP('ar0310e40188'),
    ],
    occurrence: {
      ...src(2026, 'https://numatahanabi.com/', '沼田花火大会実行委員会', 'official'),
      status: 'confirmed',
      note: '時刻は公式サイトに記載がなく、以前の発表による',
    },
  }],

  // 磯部温泉。**磯部温泉組合の公式サイトが第75回として出している**。
  // 検索上位には第74回（前回）のページも残っていたので回数で確かめた
  ['annaka-hanabi-ar0310e513296', {
    organizer: '磯部温泉祭り実行委員会（磯部温泉組合）',
    station: 'JR信越本線 磯部駅',
    venue: { name: '磯部温泉 碓氷川河川敷', address: '群馬県安中市磯部' },
    links: [
      L('磯部温泉 公式ホームページ 第75回 磯部温泉大花火大会', 'https://www.isobeonsen.com/%E3%80%90%E7%AC%AC75%E5%9B%9E-%E7%A3%AF%E9%83%A8%E6%B8%A9%E6%B3%89%E5%A4%A7%E8%8A%B1%E7%81%AB%E5%A4%A7%E4%BC%9A%E3%80%91%E7%BE%A4%E9%A6%AC%E7%9C%8C%E5%86%85%E6%9C%80%E5%A4%9A%E9%96%8B%E5%82%AC'),
      WP('ar0310e513296'),
    ],
    occurrence: {
      ...src(2026, 'https://www.isobeonsen.com/%E3%80%90%E7%AC%AC75%E5%9B%9E-%E7%A3%AF%E9%83%A8%E6%B8%A9%E6%B3%89%E5%A4%A7%E8%8A%B1%E7%81%AB%E5%A4%A7%E4%BC%9A%E3%80%91%E7%BE%A4%E9%A6%AC%E7%9C%8C%E5%86%85%E6%9C%80%E5%A4%9A%E9%96%8B%E5%82%AC', '磯部温泉組合', 'official'),
      start_time: '19:30',
      end_time: '20:10',
      status: 'confirmed',
      note: '小雨決行、荒天時は8月17日に延期（磯部温泉組合の発表）',
    },
  }],

  // 桐生。**公式の大会名は「桐生花火大会」**（まとめサイトは「桐生市花火大会」）。
  // 会場（小梅琴平公園）と日付が一致するので同じもの
  ['kiryu-hanabi-ar0310e558992', {
    organizer: '桐生花火実行委員会',
    links: [
      L('桐生花火大会 公式サイト 花火大会について', 'https://www.kiryuhanabi.com/about'),
      WP('ar0310e558992'),
    ],
    occurrence: {
      ...src(2026, 'https://www.kiryuhanabi.com/about', '桐生花火実行委員会', 'official'),
      start_time: '14:00',
      end_time: '21:00',
      status: 'confirmed',
      note: '会場は14:00から21:00。花火の打上げは20:00から21:00の予定（公式サイト）',
    },
  }],
], '花火・栃木県／群馬県');
