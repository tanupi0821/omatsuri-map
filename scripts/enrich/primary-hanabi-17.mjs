/**
 * 一次情報での裏取り（花火大会 第17弾：既存リンクからの格上げ その4）
 *
 *   node scripts/enrich/primary-hanabi-17.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。
 *
 * 使えなかったもの:
 * - 紀文まつり花火大会（有田市）… リンク先が第43回・2025年の告知で、
 *   しかも「大雨・強風注意報により中止」と書かれていた。今年の分ではないので触らない
 * - 若桜町納涼花火大会（若桜町）… 「7月下旬」としか書かれておらず日付が確定できない
 * - 佐賀城下花火大会（佐賀市）… リンク先が 404
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 滋賀県
  // ------------------------------------------------------------------

  // 湖南市。会場（野洲川親水公園）の住所と最寄駅が取れた
  ['shiga-007-hanabi-ar0725e512144', {
    organizer: '湖南市三大まつり実行委員会',
    station: 'JR草津線 甲西駅（徒歩約20分）',
    venue: { name: '野洲川親水公園', address: '滋賀県湖南市夏見地先' },
    links: [L('ぶらり湖南（湖南市観光協会）湖南市夏まつり', 'https://www.burari-konan.jp/kanko/event/post_114/')],
    occurrence: {
      ...src(2026, 'https://www.burari-konan.jp/kanko/event/post_114/', '湖南市観光協会', 'official'),
      status: 'confirmed',
      note: '花火の時刻は観光協会のページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 島根県
  // ------------------------------------------------------------------

  // 浜田市観光協会。会場（浜田漁港一帯）の町名と最寄駅が取れた
  ['shimane-003-hanabi-ar0832e00687', {
    station: 'JR山陰本線 浜田駅（シャトルバス運行）',
    venue: { name: '浜田漁港一帯', address: '島根県浜田市原井町' },
    links: [L('浜田市観光協会 2026石州浜っ子夏まつり', 'https://kankou-hamada.or.jp/lp/hamakko-natsumaturi/')],
    occurrence: {
      ...src(2026, 'https://kankou-hamada.or.jp/lp/hamakko-natsumaturi/', '浜田市観光協会', 'official'),
      start_time: '20:30',
      end_time: '21:00',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 富山県
  // ------------------------------------------------------------------

  // 魚津。**祭りは8月第1週の金・土・日の3日間**という決まりがある
  ['toyama-002-hanabi-ar0516e00064', {
    organizer: '魚津まつり実行委員会',
    station: 'あいの風とやま鉄道 魚津駅',
    recurrence: '8月第1週の金・土・日',
    recurrence_source: 'https://uozu-kanko.jp/library/jyantokoi_uozu_matsuri/',
    links: [L('魚津市観光協会 じゃんとこい魚津まつり', 'https://uozu-kanko.jp/library/jyantokoi_uozu_matsuri/')],
    occurrence: {
      ...src(2026, 'https://uozu-kanko.jp/library/jyantokoi_uozu_matsuri/', '魚津市観光協会', 'official'),
      status: 'confirmed',
      note: '祭り全体は8月7日から9日の3日間で、花火は台船から打ち上げる。花火の時刻は観光協会のページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 和歌山県
  // ------------------------------------------------------------------

  // 御坊市。会場は日高川河川敷
  ['wakayama-003-hanabi-ar0730e00435', {
    organizer: '御坊市花火大会実行委員会',
    venue: { name: '日高川河川敷', address: '和歌山県御坊市' },
    links: [L('御坊市 御坊市花火大会', 'https://www.city.gobo.lg.jp/topics/4691.html')],
    occurrence: {
      ...src(2026, 'https://www.city.gobo.lg.jp/topics/4691.html', '御坊市', 'gov'),
      start_time: '20:00',
      status: 'confirmed',
    },
  }],

  // 湯浅町観光協会。**主催の事務局は湯浅町ふるさと振興課**（＝実質的に町）
  ['wakayama-005-hanabi-ar0730e00778', {
    organizer: '湯浅まつり実行委員会（事務局：湯浅町ふるさと振興課）',
    links: [L('湯浅町観光協会 令和8年度(第50回)湯浅まつり花火大会', 'https://www.yuasa-kankokyokai.com/article/5721/')],
    occurrence: {
      ...src(2026, 'https://www.yuasa-kankokyokai.com/article/5721/', '湯浅町観光協会', 'official'),
      status: 'confirmed',
      note: '荒天時は翌日に順延。時刻は観光協会のページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 山形県
  // ------------------------------------------------------------------

  // 大石田町。打上げ場所は横山下河原
  ['yamagata-005-hanabi-ar0206e00659', {
    organizer: '大石田まつり委員会',
    station: 'JR奥羽本線 大石田駅',
    venue: { name: '最上川 横山下河原（打上げ）', address: '山形県北村山郡大石田町' },
    links: [L('大石田町 大石田まつり「最上川花火大会」', 'https://www.town.oishida.yamagata.jp/kankou/matsuri/o-maturi.html')],
    occurrence: {
      ...src(2026, 'https://www.town.oishida.yamagata.jp/kankou/matsuri/o-maturi.html', '大石田町', 'gov'),
      start_time: '19:00',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 山口県
  // ------------------------------------------------------------------

  // 秋吉台。会場の番地（秋芳町秋吉3506-2）が取れた
  ['yamaguchi-005-hanabi-ar0835e00698', {
    organizer: '秋吉台観光まつり実行委員会',
    venue: { name: '秋吉台カルスト展望台周辺', address: '山口県美祢市秋芳町秋吉3506-2' },
    links: [L('カルストくん（美祢市観光協会）第48回秋吉台観光まつり花火大会', 'https://karusuto.com/event/hanabi2026/')],
    occurrence: {
      ...src(2026, 'https://karusuto.com/event/hanabi2026/', '美祢市観光協会', 'official'),
      start_time: '19:10',
      end_time: '20:00',
      status: 'confirmed',
    },
  }],
], '花火・既存リンクからの格上げ（4）');
