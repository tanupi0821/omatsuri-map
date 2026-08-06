/**
 * 一次情報での裏取り（第19弾：既存リンクからの格上げ その6）
 *
 *   node scripts/enrich/primary-hanabi-19.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。
 *
 * 使えなかったもの:
 * - 本別きらめきタウンフェスティバル（本別町）… リンク先が2022年のまま。
 *   ただし「毎年9月の第1土・日曜日」という決まりは書かれていた
 * - 香住ふるさとまつり（香美町）／新宮納涼ふれあいまつり（たつの市）… リンク先が 404
 * - 飯塚納涼花火大会（飯塚商工会議所）… TLS 証明書が検証できず取得できなかった
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 福井県
  // ------------------------------------------------------------------

  // 敦賀。**とうろう流し18:30 → 花火19:30**の順で行う
  ['fukui-005-hanabi-ar0518e00677', {
    venue: { name: '名勝「気比の松原」', address: '敦賀市松島町' },
    links: [L('敦賀観光協会 第77回とうろう流しと大花火大会', 'https://tsuruga-kanko.jp/special/sp_fireworks/')],
    occurrence: {
      ...src(2026, 'https://tsuruga-kanko.jp/special/sp_fireworks/', '敦賀観光協会', 'official'),
      start_time: '19:30',
      status: 'confirmed',
      note: 'とうろう流しは18:30から、花火は19:30から',
    },
  }],

  // ------------------------------------------------------------------
  // 北海道
  // ------------------------------------------------------------------

  // いわない怒涛まつり。**祭り自体は8月8日・9日の2日間**で、花火は初日
  ['hokkaido-005-hanabi-ar0101e00125', {
    links: [L('岩内町観光協会 第53回いわない怒涛まつり', 'https://www.iwanai-kanko.jp/news/detail.html?id=1518')],
    occurrence: {
      ...src(2026, 'https://www.iwanai-kanko.jp/news/detail.html?id=1518', '岩内町観光協会', 'official'),
      status: 'confirmed',
      note: '祭りは8月8日・9日の2日間。花火の時刻は観光協会のページに記載がない',
    },
  }],

  // 白糠町。会場の番地（岬1丁目228番地）が取れた
  ['hokkaido-014-hanabi-ar0101e558988', {
    organizer: '港inしらぬか花火大会実行委員会',
    venue: { name: '白糠漁港特設会場', address: '白糠郡白糠町岬1丁目228番地' },
    links: [L('白糠町 第12回港inしらぬか花火大会', 'https://www.town.shiranuka.lg.jp/section/keizai/h8v21a0000001jnq.html')],
    occurrence: {
      ...src(2026, 'https://www.town.shiranuka.lg.jp/section/keizai/h8v21a0000001jnq.html', '白糠町', 'gov'),
      start_time: '19:00',
      end_time: '20:00',
      status: 'confirmed',
      note: 'ステージイベントは16:30から。予備日は8月23日',
    },
  }],

  // 名寄。**本祭は12:00から20:30**（花火はその中の夜の部）
  ['hokkaido-036-hanabi-ar0101e00149', {
    organizer: 'てっし名寄まつり実行委員会',
    links: [L('名寄観光まちづくり協会 てっし名寄まつり', 'https://nayoro-kankou.com/top/event/tesshi-festival/')],
    occurrence: {
      ...src(2026, 'https://nayoro-kankou.com/top/event/tesshi-festival/', '名寄観光まちづくり協会', 'official'),
      status: 'confirmed',
      note: '本祭は12:00から20:30。花火の時刻は協会のページに記載がない',
    },
  }],

  // 広尾町。**十勝港まつりは第70回、海上花火大会は第36回**で回数が別
  ['hokkaido-045-hanabi-ar0101e01059', {
    organizer: '十勝港まつり協賛会（事務局：広尾町役場水産商工観光課）',
    venue: { name: '十勝港第4ふ頭', address: '広尾郡広尾町会所前6丁目' },
    links: [L('広尾町 十勝港まつり', 'https://www.town.hiroo.lg.jp/kankou/event/')],
    occurrence: {
      ...src(2026, 'https://www.town.hiroo.lg.jp/kankou/event/', '広尾町', 'gov'),
      status: 'confirmed',
      note: '十勝港まつりは第70回、海上花火大会は第36回。花火の時刻は町のページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 神奈川県
  // ------------------------------------------------------------------

  // あつぎ鮎まつり。**2026年は例年の8月から10月開催に変わった**
  ['atsugi-hanabi-ar0314e00243', {
    organizer: 'あつぎ鮎まつり実行委員会（厚木市商業観光課）',
    station: '小田急小田原線 本厚木駅（東口から徒歩約15分）',
    venue: { name: '相模川 三川合流点', address: '厚木市' },
    links: [L('厚木市観光協会 第80回あつぎ鮎まつり', 'https://www.atsugi-kankou.jp/soshiki/ac-kankou/ayu-festival9.html')],
    occurrence: {
      ...src(2026, 'https://www.atsugi-kankou.jp/soshiki/ac-kankou/ayu-festival9.html', '厚木市観光協会', 'official'),
      status: 'confirmed',
      note: '2026年から秋開催（10月10日・11日）に変わった。花火の時刻は観光協会のページに記載がない',
    },
  }],
  // 同じ祭りの重複データ
  ['atsugi-atsugi-ayu-matsuri', {
    organizer: 'あつぎ鮎まつり実行委員会（厚木市商業観光課）',
    station: '小田急小田原線 本厚木駅（東口から徒歩約15分）',
    links: [L('厚木市観光協会 第80回あつぎ鮎まつり', 'https://www.atsugi-kankou.jp/soshiki/ac-kankou/ayu-festival9.html')],
    occurrence: {
      ...src(2026, 'https://www.atsugi-kankou.jp/soshiki/ac-kankou/ayu-festival9.html', '厚木市観光協会', 'official'),
      status: 'confirmed',
    },
  }],
], '既存リンクからの格上げ（6）');
