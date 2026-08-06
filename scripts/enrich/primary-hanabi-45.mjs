/**
 * 一次情報での裏取り（第45弾：複数日開催の取りこぼしを直す その10）
 *
 *   node scripts/enrich/primary-hanabi-45.mjs
 *
 * **黒石ねぷた祭りで「日付そのものが違う」がまた出た。**
 * データは7月24日〜7月30日となっていたが、黒石青年会議所（主催）の告知では
 * **7月30日〜8月5日**。ほぼ丸ごとずれていた。
 *
 * なお `venue.address` は**市区町村から書く**（都道府県は付けない）。
 * `scripts/enrich/zz-normalize-address.mjs` が最後に揃えるが、
 * 最初からその形で入れておけば直す手間が要らない。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

const everyDay = (from, to) => {
  const out = [];
  for (let d = new Date(from); d <= new Date(to); d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

patchAll([
  // ------------------------------------------------------------------
  // 青森県
  // ------------------------------------------------------------------

  // 弘前ねぷたまつり。**8月1日から7日まで7日間、毎日運行**。
  // データは初日と最終日の2日しか持っていなかった。
  // しかも**最終日だけ午前（10:00）で、コースも日によって違う**
  ['aomori-007-summer-ar0202e4839', {
    venue: { name: '弘前市中心市街地（土手町コース・駅前コース）', address: '弘前市土手町' },
    links: [L('弘前観光コンベンション協会 弘前ねぷたまつり', 'https://www.hirosaki-kanko.or.jp/edit.html?id=cat02_summer_neputa')],
    occurrence: {
      ...src(2026, 'https://www.hirosaki-kanko.or.jp/edit.html?id=cat02_summer_neputa', '弘前観光コンベンション協会', 'official'),
      dates: everyDay('2026-08-01', '2026-08-07'),
      start_time: '19:00',
      status: 'confirmed',
      note: '8月1日〜4日は土手町コース（19:00〜）、5日・6日は駅前コース（19:00〜）、7日は土手町の午前コース（10:00〜）。7日夜は岩木川河川敷で「なぬかびおくり」（17:00〜20:30予定）',
    },
  }],

  // 黒石ねぷた祭り。**7月30日から8月5日まで**。
  // データの「7月24日〜7月30日」は誤り。
  // なお掲載市区町村が青森市になっているが、実際の開催地は黒石市
  ['aomori-001-gotouti-aomori-join-41438', {
    organizer: '公益社団法人黒石青年会議所',
    venue: { name: '御幸公園〜富田通り・中町こみせ通り', address: '黒石市' },
    links: [L('黒石ねぷた祭り 公式サイト 2026年度 黒石ねぷた祭りについて', 'https://k-jc.com/neputa/archives/2151.html')],
    occurrence: {
      ...src(2026, 'https://k-jc.com/neputa/archives/2151.html', '黒石青年会議所', 'official'),
      dates: everyDay('2026-07-30', '2026-08-05'),
      start_time: '19:00',
      status: 'confirmed',
      note: 'データにあった「7月24日〜7月30日」は誤り。合同運行は7月30日（審査・出陣式17:30、運行19:00）と8月2日（表彰・19:00）。7月31日は中町こみせ通りに13台が集合、最終日8月5日は午前の運行。開催地は黒石市で、掲載の市区町村（青森市）は要修正',
    },
  }],

  // ------------------------------------------------------------------
  // 兵庫県
  // ------------------------------------------------------------------

  // 西宮神社の夏えびす。**7月7日・9日・10日・20日の4日**に行事が立つ。
  // データは7月7日と20日の2日しか持っていなかった
  ['hyogo-004-summer-ar0728e313172', {
    organizer: '西宮神社',
    shrine: '西宮神社',
    venue: { name: '西宮神社', address: '西宮市社家町1-17' },
    links: [L('えびす宮総本社 西宮神社 七月（文月）の祭典・行事案内', 'https://nishinomiya-ebisu.com/event/fuzuki/')],
    occurrence: {
      ...src(2026, 'https://nishinomiya-ebisu.com/event/fuzuki/', '西宮神社', 'official'),
      dates: ['2026-07-07', '2026-07-09', '2026-07-10', '2026-07-20'],
      status: 'confirmed',
      note: '7月7日は神池のLED「天の川」（夕刻〜）、9日・10日はあらえびす夜まつり（ヱビスビールフェスタ・16:00〜21:00）、10日は沖恵美酒神社祭、20日は夏祭（10:00）とえびす萬燈籠（18:00点灯）',
    },
  }],

  // ------------------------------------------------------------------
  // 滋賀県
  // ------------------------------------------------------------------

  // ブルーメの丘。**8月11日と29日の2日で、日付は元から正しかった**。
  // 出典と会場だけ直す
  ['shiga-003-hanabi-ar0725e387765', {
    venue: { name: '滋賀農業公園ブルーメの丘', address: '蒲生郡日野町西大路843' },
    links: [L('ミュージック花火大会2026 公式ページ', 'https://sites.google.com/view/blume-music-hanabi2026/')],
    occurrence: {
      ...src(2026, 'https://sites.google.com/view/blume-music-hanabi2026/', '滋賀農業公園ブルーメの丘', 'official'),
      start_time: '20:15',
      end_time: '20:30',
      status: 'confirmed',
      note: '8月11日と29日の2日。間が空いているが取りこぼしではない',
    },
  }],
], '複数日開催の取りこぼしを直す（10）');
