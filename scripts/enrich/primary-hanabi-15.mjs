/**
 * 一次情報での裏取り（花火大会 第15弾：既存リンクからの格上げ その2）
 *
 *   node scripts/enrich/primary-hanabi-15.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。`links` に市区町村・観光協会・商工会議所の
 * ページを既に持っていた祭りを開いて、内容を確かめてから格上げした。
 *
 * 開いてみて使えなかったもの（記録として残す）:
 *
 * | 祭り | 理由 |
 * |---|---|
 * | 田瀬湖湖水まつり（花巻市）／いちき串木野サマーフェスタ | リンク先が 404。ページが作り直されている |
 * | わらじ祭花火大会（志摩市） | リンク先が2024年の告知のまま |
 * | 吉野川祭り（五条市）／うと地蔵まつり（宇土市） | 概要ページで、今年の日程・時刻が無い |
 * | 七尾港まつり（七尾市） | リンクが `minatomaturi2024.html` で前々年のもの |
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 香川県
  // ------------------------------------------------------------------

  // さぬき高松まつり。**花火は3日間の祭りの中日（8/13）**
  ['kagawa-003-hanabi-ar0937e00702', {
    station: 'JR高松駅／ことでん高松築港駅（徒歩約4分）',
    venue: { name: '高松港 玉藻防波堤', address: '香川県高松市' },
    links: [L('高松市 さぬき高松まつり', 'https://www.city.takamatsu.kagawa.jp/smph/kanko/takamatsumatsuri/matsuri.html')],
    occurrence: {
      ...src(2026, 'https://www.city.takamatsu.kagawa.jp/smph/kanko/takamatsumatsuri/matsuri.html', '高松市', 'gov'),
      start_time: '20:15',
      end_time: '20:45',
      status: 'confirmed',
      note: 'さぬき高松まつりは8月12日〜14日の3日間で、花火大会は13日',
    },
  }],

  // 丸亀。**会場は市街地ではなくレオマリゾートの園内**
  ['kagawa-006-hanabi-ar0937e00628', {
    organizer: '丸亀市',
    venue: { name: 'レオマリゾート園内', address: '香川県丸亀市綾歌町栗熊西40-1' },
    links: [L('丸亀市 まるがめ婆娑羅花火ファンタジアinレオマ', 'https://www.city.marugame.lg.jp/page/15520.html')],
    occurrence: {
      ...src(2026, 'https://www.city.marugame.lg.jp/page/15520.html', '丸亀市', 'gov'),
      start_time: '20:00',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 高知県
  // ------------------------------------------------------------------

  // 高知市観光協会（主催）。最寄りは駅ではなく路面電車の電停
  ['kochi-001-hanabi-ar0939e00705', {
    organizer: '公益社団法人高知市観光協会',
    station: 'とさでん交通 県庁前電停',
    venue: { name: '鏡川河畔（みどりの広場）', address: '高知県高知市' },
    links: [L('高知市観光協会 第76回高知市納涼花火大会', 'https://welcome-kochi.jp/event/hanabi/index.html')],
    occurrence: {
      ...src(2026, 'https://welcome-kochi.jp/event/hanabi/index.html', '公益社団法人高知市観光協会', 'official'),
      start_time: '19:45',
      end_time: '21:00',
      status: 'confirmed',
    },
  }],

  // 四万十市観光協会（主催）。**増水でも延期になる**川の花火
  ['kochi-004-hanabi-ar0939e00706', {
    organizer: '一般社団法人四万十市観光協会',
    venue: { name: '四万十川お祭り広場（赤鉄橋たもとの四万十川河川敷）', address: '高知県四万十市' },
    links: [L('四万十市観光協会 第22回しまんと市民祭 納涼花火大会', 'https://shimanto-kankou.com/shiminsai/hanabi/')],
    occurrence: {
      ...src(2026, 'https://shimanto-kankou.com/shiminsai/hanabi/', '一般社団法人四万十市観光協会', 'official'),
      start_time: '20:00',
      end_time: '20:30',
      status: 'confirmed',
      note: '荒天・増水時は9月5日に延期',
    },
  }],

  // ------------------------------------------------------------------
  // 熊本県
  // ------------------------------------------------------------------

  // 玉名。**悪天候時の延期先が2段階（10/4→10/12）**
  ['kumamoto-011-hanabi-ar1043e00953', {
    venue: { name: '菊池川 高瀬大橋一帯', address: '熊本県玉名市高瀬' },
    links: [L('玉名商工会議所 令和8年度玉名花火大会', 'https://www.tamana-cci.or.jp/festivals_events/hanabi/')],
    occurrence: {
      ...src(2026, 'https://www.tamana-cci.or.jp/festivals_events/hanabi/', '玉名商工会議所', 'official'),
      start_time: '19:00',
      status: 'confirmed',
      note: '悪天候時は10月4日または10月12日に延期',
    },
  }],

  // ------------------------------------------------------------------
  // 長野県
  // ------------------------------------------------------------------

  // 佐久市観光協会。会場は佐久大橋〜野沢橋の間
  ['nagano-004-hanabi-ar0420e513309', {
    station: 'JR小海線 中込駅',
    venue: { name: '千曲川河川敷（佐久大橋〜野沢橋間）', address: '長野県佐久市' },
    links: [L('佐久市観光協会 第64回佐久千曲川大花火大会', 'https://www.sakukankou.jp/news/2777/')],
    occurrence: {
      ...src(2026, 'https://www.sakukankou.jp/news/2777/', '佐久市観光協会', 'official'),
      start_time: '19:30',
      status: 'confirmed',
    },
  }],

  // 信州上田。主催の上田商工会議所が告知を出している
  ['nagano-011-hanabi-ar0420e00685', {
    organizer: '信州上田大花火大会実行委員会（上田商工会議所内）',
    station: 'JR北陸新幹線・しなの鉄道・上田電鉄 上田駅',
    venue: { name: '千曲川河川敷（常田新橋下流）', address: '長野県上田市常田1丁目' },
    links: [L('上田商工会議所 第39回信州上田大花火大会', 'https://www.ucci.or.jp/info/event/shinsyuuedadaihanabitaikai2026/')],
    occurrence: {
      ...src(2026, 'https://www.ucci.or.jp/info/event/shinsyuuedadaihanabitaikai2026/', '上田商工会議所', 'official'),
      start_time: '19:00',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 石川県
  // ------------------------------------------------------------------

  // 川北まつり。北國新聞社（主催）のイベントサイト
  ['ishikawa-003-hanabi-ar0517e00674', {
    venue: { name: '手取川河川敷', address: '石川県能美郡川北町' },
    links: [L('北國花火川北大会 公式ページ（北國新聞社）', 'https://hk-event.jp/hanabi/kawakita/index.html')],
    occurrence: {
      ...src(2026, 'https://hk-event.jp/hanabi/kawakita/index.html', '北國新聞社', 'official'),
      end_time: '20:15',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 宮城県
  // ------------------------------------------------------------------

  // 泉区民ふるさとまつり。**会場は七北田公園（命名権で「やまいちサステナパーク」）**
  ['miyagi-005-hanabi-ar0204e00623', {
    organizer: '泉区民ふるさとまつり協賛会（みやぎ仙台商工会内）',
    venue: { name: 'やまいちサステナパーク七北田公園（七北田川河川敷周辺）', address: '宮城県仙台市泉区' },
    links: [L('仙台市泉区 第44回泉区民ふるさとまつり', 'https://www.city.sendai.jp/izumi-katsudo/izumiku/machizukuri/event/hurumatu/44izumihurusato.html')],
    occurrence: {
      ...src(2026, 'https://www.city.sendai.jp/izumi-katsudo/izumiku/machizukuri/event/hurumatu/44izumihurusato.html', '仙台市泉区', 'gov'),
      start_time: '19:00',
      end_time: '19:30',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 宮崎県
  // ------------------------------------------------------------------

  // 油津港まつり。日南市観光協会のページ
  ['miyazaki-007-hanabi-ar1045e00335', {
    organizer: '油津港まつり協賛会',
    venue: { name: '油津港内', address: '宮崎県日南市西町' },
    links: [L('日南市観光協会 油津港まつり2026花火大会', 'https://www.kankou-nichinan.jp/tourisms/15686/')],
    occurrence: {
      ...src(2026, 'https://www.kankou-nichinan.jp/tourisms/15686/', '日南市観光協会', 'official'),
      start_time: '20:00',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 長崎県
  // ------------------------------------------------------------------

  // 島原。会場の郵便番号つき住所と最寄駅が取れた
  ['nagasaki-008-hanabi-ar1042e00946', {
    organizer: '島原温泉ガマダス花火大会実行委員会',
    station: '島原鉄道 島原港駅',
    venue: { name: '島原港（島原外港南側防波堤）', address: '長崎県島原市下川尻町7-5' },
    links: [L('島原温泉 第32回島原温泉ガマダス花火大会', 'https://www.shimabaraonsen.com/guide/gamadasuhanabi')],
    occurrence: {
      ...src(2026, 'https://www.shimabaraonsen.com/guide/gamadasuhanabi', '島原温泉観光協会', 'official'),
      start_time: '20:15',
      end_time: '20:45',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 新潟県
  // ------------------------------------------------------------------

  // 村上。**前夜祭が8月7日にある**
  ['niigata-001-hanabi-ar0415e195551', {
    organizer: '村上市花火大会実行委員会',
    links: [L('村上市 村上市花火大会in清流あらかわ', 'https://www.city.murakami.lg.jp/site/kanko/arakawataisai.html')],
    occurrence: {
      ...src(2026, 'https://www.city.murakami.lg.jp/site/kanko/arakawataisai.html', '村上市', 'gov'),
      status: 'confirmed',
      note: '前夜祭は8月7日。花火の時刻は村上市のページに記載がない',
    },
  }],
], '花火・既存リンクからの格上げ（2）');
