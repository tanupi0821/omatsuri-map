/**
 * 一次情報での裏取り（第25弾：既存リンクからの格上げ その12）
 *
 *   node scripts/enrich/primary-hanabi-25.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。
 *
 * 使えなかったもの:
 * - ふるさと上川ふれあい祭り（阿賀町）… リンク先が第37回・2025年の告知で、
 *   データの第38回・2026年とは別の年のもの
 * - 祇園祭ふるさと茂木夏まつり（茂木町）… リンク先が町のお知らせ一覧に変わっていて
 *   この祭りの記事に届かない
 * - 天空 de HANABI（日田市・オートポリス）… 詳細が別ドメインに切り出されている
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 静岡県
  // ------------------------------------------------------------------

  // 焼津神社大祭 荒祭。**毎年8月12日・13日**で固定。神社自体の公式サイト
  ['shizuoka-013-goguynet-26529', {
    shrine: '焼津神社',
    recurrence: '8月12日・13日',
    recurrence_source: 'https://yaizujinja.or.jp/annai/aramaturi/',
    venue: { name: '焼津神社', address: '焼津市焼津二丁目7番2号' },
    links: [L('焼津神社 荒祭', 'https://yaizujinja.or.jp/annai/aramaturi/')],
    occurrence: {
      ...src(2026, 'https://yaizujinja.or.jp/annai/aramaturi/', '焼津神社', 'official'),
      start_time: '10:00',
      status: 'confirmed',
      note: '神輿は朝10時に出発し、夜11時頃に帰着する。一区藤組・二区竹組・三区柳組・四区桜組の四町の祭典委員が運営',
    },
  }],

  // 富士まつり。会場と時間帯が市のページで取れた
  ['shizuoka-020-hanabi-ar0622e357468', {
    organizer: '富士まつり運営委員会',
    venue: { name: '中央公園・中央公園前 青葉通り', address: '富士市' },
    links: [L('富士市 富士まつり', 'https://www.city.fuji.shizuoka.jp/fujijikan/enjoy/kb719c00000006jt.html')],
    occurrence: {
      ...src(2026, 'https://www.city.fuji.shizuoka.jp/fujijikan/enjoy/kb719c00000006jt.html', '富士市', 'gov'),
      start_time: '14:00',
      end_time: '20:30',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 新潟県
  // ------------------------------------------------------------------

  // 十日町おおまつり。**8月25日・26日・27日の3日間**
  ['niigata-001-summer-ar0415e196957', {
    organizer: '十日町市観光協会',
    venue: { name: '駅通り・本町通りほか', address: '十日町市' },
    links: [L('十日町市観光協会 十日町おおまつり', 'https://www.tokamachishikankou.jp/event/tokamashioomatsuri/')],
    occurrence: {
      ...src(2026, 'https://www.tokamachishikankou.jp/event/tokamashioomatsuri/', '十日町市観光協会', 'official'),
      dates: ['2026-08-25', '2026-08-26', '2026-08-27'],
      status: 'confirmed',
      note: '初日（25日）の民謡流し・明石万灯は19:00から20:15。開催日は例年8月25日〜27日',
    },
  }],

  // ------------------------------------------------------------------
  // 大分県
  // ------------------------------------------------------------------

  // ゆふいん盆地まつり。市のページで第58回・2日間を確認
  ['oita-006-summer-ar1044e190830', {
    venue: { name: '湯布院町内', address: '由布市湯布院町' },
    links: [L('由布市 ゆふいん盆地まつり', 'https://www.city.yufu.oita.jp/event08/yufuinbontimaturi')],
    occurrence: {
      ...src(2026, 'https://www.city.yufu.oita.jp/event08/yufuinbontimaturi', '由布市', 'gov'),
      start_time: '19:00',
      status: 'confirmed',
      note: '終了時刻は市のページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 埼玉県
  // ------------------------------------------------------------------

  // 東松山夏まつり。**会場は本町・材木町・箭弓町・松葉町の市街地一帯**
  ['higashimatsuyama-goguynet-68050', {
    organizer: '東松山夏まつり実行委員会',
    station: '東武東上線 東松山駅',
    venue: { name: '本町・材木町・箭弓町・松葉町ほか', address: '東松山市' },
    links: [L('東松山市 東松山夏まつり', 'https://www.city.higashimatsuyama.lg.jp/soshiki/18/1502.html')],
    occurrence: {
      ...src(2026, 'https://www.city.higashimatsuyama.lg.jp/soshiki/18/1502.html', '東松山市', 'gov'),
      status: 'confirmed',
      note: '時刻は市のページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 東京都
  // ------------------------------------------------------------------

  // 羽田まつり。**開催日は毎年7月の最終土曜・日曜**という決まり
  ['ota-summer-ar0313e71658', {
    shrine: '羽田神社',
    organizer: '羽田神社',
    recurrence: '7月最終土曜日・日曜日',
    recurrence_source: 'https://www.hanedajinja.com/gyouji/index.htm',
    links: [L('羽田神社 年中行事（夏季例大祭・羽田まつり）', 'https://www.hanedajinja.com/gyouji/index.htm')],
    occurrence: {
      ...src(2026, 'https://www.hanedajinja.com/gyouji/index.htm', '羽田神社', 'official'),
      status: 'confirmed',
      note: '開催日は毎年7月最終の土曜・日曜。日曜の午後に町内神輿の連合渡御が行われる',
    },
  }],
], '既存リンクからの格上げ（12）');
