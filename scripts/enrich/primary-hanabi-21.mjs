/**
 * 一次情報での裏取り（第21弾：既存リンクからの格上げ その8・夏祭り編）
 *
 *   node scripts/enrich/primary-hanabi-21.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。この回は花火大会以外の夏祭り・神社の祭り。
 *
 * **神社の祭りは日付がルールで決まっていることが多い**（太宰府天満宮の
 * 夏の天神まつりは毎年7月24日・25日）。今年の告知が無くても `recurrence` に
 * 入れておけば「例年◯月ごろ」として役に立つ（`docs/schema.md`）。
 *
 * 使えなかったもの:
 * - 名古屋城夏まつり… リンク先が2025年の日程（8/9〜8/17）で、データの2026年と違う
 * - 郡上おどり… 日程が PDF に切り出されていてページからは読めない
 * - くんねっぷふるさとまつり… リンク先は同じ町の「豊年盆踊り大会」で別の行事だった
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 福岡県
  // ------------------------------------------------------------------

  // 太宰府天満宮。**7月24日が夏越祭、25日が御誕生祭と千灯明**で毎年固定。
  // 露店が出ることも社の告知に書かれている
  ['fukuoka-009-summer-ar1040e510506', {
    organizer: '太宰府天満宮',
    shrine: '太宰府天満宮',
    recurrence: '7月24日・25日',
    recurrence_source: 'https://www.dazaifutenmangu.or.jp/omatsuri/25nichisai',
    stalls: 'yes',
    links: [L('太宰府天満宮 夏の天神まつり（御誕生祭・千灯明）', 'https://www.dazaifutenmangu.or.jp/omatsuri/25nichisai')],
    occurrence: {
      ...src(2026, 'https://www.dazaifutenmangu.or.jp/omatsuri/25nichisai', '太宰府天満宮', 'official'),
      status: 'confirmed',
      note: '7月24日が夏越祭（14:00〜）、25日が御誕生祭（11:00〜）と千灯明（20:00〜）。茅の輪神事・子供みこし・露店が出る',
    },
  }],

  // 前原山笠。**2026年は7月25日の1日だけ**（例年は24日の火伏地蔵庵と
  // 25日の老松神社の2日）。まとめサイトは2日として持っていた
  ['fukuoka-010-summer-ar1040e511024', {
    station: 'JR筑肥線 筑前前原駅北口（徒歩約5分）',
    recurrence: '7月24日（火伏地蔵庵）・7月25日（老松神社）',
    recurrence_source: 'https://kanko-itoshima.jp/spot/maebaruyamakasa/',
    links: [L('糸島市観光協会 前原夏祭り（火伏地蔵祭・老松神社輪越祭）', 'https://kanko-itoshima.jp/spot/maebaruyamakasa/')],
    occurrence: {
      ...src(2026, 'https://kanko-itoshima.jp/spot/maebaruyamakasa/', '糸島市観光協会', 'official'),
      dates: ['2026-07-25'],
      status: 'confirmed',
      note: '例年は7月24日・25日の2日だが、糸島市観光協会によると2026年は7月25日（土）のみ。山笠は14:30から5分おきに出発',
    },
  }],

  // ------------------------------------------------------------------
  // 兵庫県
  // ------------------------------------------------------------------

  // 生田神社の大海夏祭。**8月7日から9日の3日間**なのに、
  // まとめサイト由来のデータは初日と最終日の2日分しか持っていなかった
  ['hyogo-001-summer-ar0728e358506', {
    organizer: '生田神社',
    shrine: '生田神社',
    venue: { name: '生田神社（境内の大海神社）', address: '神戸市中央区下山手通1丁目2-1' },
    links: [L('生田神社 生田大海夏祭', 'https://ikutajinja.or.jp/info/daikai')],
    occurrence: {
      ...src(2026, 'https://ikutajinja.or.jp/info/daikai', '生田神社', 'official'),
      dates: ['2026-08-07', '2026-08-08', '2026-08-09'],
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 北海道
  // ------------------------------------------------------------------

  // 余市町。**花火は19:15頃**で、祭り全体は16:00から20:00
  ['hokkaido-001-summer-ar0101e509303', {
    venue: { name: '余市港', address: '余市郡余市町' },
    links: [L('余市町 第58回北海ソーラン祭り', 'https://www.town.yoichi.hokkaido.jp/kankou/event/2026-0430-1416-19.html')],
    occurrence: {
      ...src(2026, 'https://www.town.yoichi.hokkaido.jp/kankou/event/2026-0430-1416-19.html', '余市町', 'gov'),
      start_time: '16:00',
      end_time: '20:00',
      status: 'confirmed',
      note: '花火の打上げは19:15頃の予定（余市町の発表）',
    },
  }],

  // 新篠津村。村のページで第47回・8月29日を確認
  ['hokkaido-004-summer-ar0101e115062', {
    links: [L('新篠津村 第47回新しのつ青空まつり', 'https://www.vill.shinshinotsu.hokkaido.jp/visit/detail/00002472.html')],
    occurrence: {
      ...src(2026, 'https://www.vill.shinshinotsu.hokkaido.jp/visit/detail/00002472.html', '新篠津村', 'gov'),
      status: 'confirmed',
      note: '時刻は村のページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 岩手県
  // ------------------------------------------------------------------

  // 土沢七夕まつり。**会場は駅前から中町までの土沢商店街**
  ['iwate-007-goguynet-10603', {
    organizer: '土沢七夕まつり実行委員会',
    venue: { name: '土沢商店街（駅前〜中町）', address: '花巻市東和町土沢' },
    links: [L('花巻観光協会 土沢七夕まつり', 'https://www.kanko-hanamaki.ne.jp/event/event_detail.php?id=41')],
    occurrence: {
      ...src(2026, 'https://www.kanko-hanamaki.ne.jp/event/event_detail.php?id=41', '花巻観光協会', 'official'),
      start_time: '16:00',
      end_time: '20:30',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 群馬県
  // ------------------------------------------------------------------

  // 大胡祇園まつり。**主催は町の自治会と青年会**（町内会レベルの祭り）
  ['maebashi-summer-ar0310e351778', {
    organizer: '大胡町自治会・大胡町青年会',
    station: '上毛電気鉄道 大胡駅（徒歩約3分）',
    venue: { name: 'JA前橋市大胡支所広場', address: '前橋市堀越町1115番地1' },
    links: [L('前橋市 大胡祇園まつり', 'https://www.city.maebashi.gunma.jp/soshiki/shimin/ogo/gyomu/1/2120.html')],
    occurrence: {
      ...src(2026, 'https://www.city.maebashi.gunma.jp/soshiki/shimin/ogo/gyomu/1/2120.html', '前橋市', 'gov'),
      status: 'confirmed',
      note: '時刻は前橋市のページに記載がない',
    },
  }],
], '既存リンクからの格上げ（8）');
