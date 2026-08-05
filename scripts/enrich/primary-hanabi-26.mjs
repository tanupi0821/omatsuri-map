/**
 * 一次情報での裏取り（第26弾：既存リンクからの格上げ その13）
 *
 *   node scripts/enrich/primary-hanabi-26.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。
 *
 * **市区町村が違っているものを2件見つけた**（`note` に書き残した）。
 * 号外NET は「帯広市版」が十勝管内全域を扱うため、記事から取り込んだ祭りの
 * `area.city` が帯広市になってしまっている。歴舟川清流まつりは大樹町、
 * りくべつ鉄道まつりは陸別町が正しい。**`area` を直すのはファイルの置き場所も
 * 変わる操作なので、ここでは触らずに記録だけ残した。**
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 茨城県
  // ------------------------------------------------------------------

  // 藤切り祇園祭。**毎年7月第4土曜日**。会場は深谷八坂神社
  ['kasumigaura-goguynet-34373', {
    shrine: '深谷八坂神社',
    recurrence: '7月第4土曜日',
    recurrence_source: 'https://www.city.kasumigaura.lg.jp/page/page000244.html',
    venue: { name: '深谷八坂神社', address: '茨城県かすみがうら市坂1029-1' },
    links: [L('かすみがうら市 藤切り祇園祭', 'https://www.city.kasumigaura.lg.jp/page/page000244.html')],
    occurrence: {
      ...src(2026, 'https://www.city.kasumigaura.lg.jp/page/page000244.html', 'かすみがうら市', 'gov'),
      status: 'confirmed',
      note: '開催日は毎年7月第4土曜日。時刻は市のページに記載がない',
    },
  }],

  // 真壁祇園祭。**毎年7月23日から26日の4日間**なのに、
  // まとめサイト由来のデータは23日と26日の2日分しか持っていなかった
  ['sakuragawa-summer-ar0308e4843', {
    shrine: '五所駒瀧神社',
    recurrence: '7月23日〜26日',
    recurrence_source: 'https://www.kankou-sakuragawa.jp/page/page000031.html',
    venue: { name: '真壁町市街地', address: '茨城県桜川市真壁町' },
    links: [L('桜川市観光協会 真壁祇園祭', 'https://www.kankou-sakuragawa.jp/page/page000031.html')],
    occurrence: {
      ...src(2026, 'https://www.kankou-sakuragawa.jp/page/page000031.html', '桜川市観光協会', 'official'),
      dates: ['2026-07-23', '2026-07-24', '2026-07-25', '2026-07-26'],
      start_time: '14:00',
      end_time: '21:50',
      status: 'confirmed',
      note: '23日は14:00〜19:00、24日は15:00〜19:30、25日は19:00〜21:15、26日は18:50〜21:50。五所駒瀧神社の祭礼',
    },
  }],

  // 柿岡のおまつり。**正式には「八坂神社祇園祭礼」**で、
  // 開催日は毎年7月第4日曜日を含む土日
  ['ishioka-goguynet-34343', {
    shrine: '八坂神社',
    recurrence: '7月第4日曜日を含む土曜・日曜',
    recurrence_source: 'https://www.city.ishioka.lg.jp/ishiokameguri/omatsuri/page001096.html',
    links: [L('石岡市 柿岡のおまつり（八坂神社祇園祭礼）', 'https://www.city.ishioka.lg.jp/ishiokameguri/omatsuri/page001096.html')],
    occurrence: {
      ...src(2026, 'https://www.city.ishioka.lg.jp/ishiokameguri/omatsuri/page001096.html', '石岡市', 'gov'),
      status: 'confirmed',
      note: '正式名称は「八坂神社祇園祭礼」。開催日は毎年7月第4日曜日を含む土曜・日曜',
    },
  }],

  // ------------------------------------------------------------------
  // 香川県
  // ------------------------------------------------------------------

  // 津田まつり。**会場は津田の松原（砂浜から花火が見える）**
  ['kagawa-005-hanabi-ar0937e513593', {
    venue: { name: '津田の松原', address: '香川県さぬき市津田町津田' },
    links: [L('さぬき市観光協会 津田まつり', 'https://sanuki-kanko.jp/event/summer')],
    occurrence: {
      ...src(2026, 'https://sanuki-kanko.jp/event/summer', 'さぬき市観光協会', 'official'),
      status: 'confirmed',
      note: '時刻は観光協会のページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 北海道
  // ------------------------------------------------------------------

  // 歴舟川清流まつり。**実際の開催地は大樹町**（データの area.city は帯広市のまま）
  ['hokkaido-048-goguynet-57124', {
    organizer: '大樹町観光協会・大樹町',
    venue: { name: '歴舟川 大樹橋上流河川敷', address: '北海道広尾郡大樹町南通1丁目12番地先' },
    links: [L('大樹町 歴舟川清流まつり', 'https://www.town.taiki.hokkaido.jp/soshiki/kikakushokoka/3/1/629.html')],
    occurrence: {
      ...src(2026, 'https://www.town.taiki.hokkaido.jp/soshiki/kikakushokoka/3/1/629.html', '大樹町', 'gov'),
      start_time: '19:20',
      end_time: '20:30',
      status: 'confirmed',
      note: '開催地は広尾郡大樹町。号外NET帯広版から取り込んだため area.city が帯広市になっているので要修正',
    },
  }],

  // りくべつ鉄道まつり。**実際の開催地は陸別町**（同上）
  ['hokkaido-703-goguynet-57091', {
    organizer: 'ふるさと銀河線りくべつ鉄道まつり実行委員会',
    links: [L('陸別町 ふるさと銀河線りくべつ鉄道まつり', 'https://www.rikubetsu.jp/kanko/event/tetsudoumatsuri/')],
    occurrence: {
      ...src(2026, 'https://www.rikubetsu.jp/kanko/event/tetsudoumatsuri/', '陸別町', 'gov'),
      start_time: '18:00',
      status: 'confirmed',
      note: '7月18日が前夜祭（18:00〜）、19日が本祭（10:00〜）。開催地は足寄郡陸別町。号外NET帯広版から取り込んだため area.city が帯広市になっているので要修正',
    },
  }],

  // ------------------------------------------------------------------
  // 和歌山県
  // ------------------------------------------------------------------

  // 田辺祭。**鬪雞神社の祭礼で、毎年7月24日・25日**
  ['wakayama-001-summer-ar0730e4755', {
    shrine: '鬪雞神社',
    recurrence: '7月24日・25日',
    recurrence_source: 'https://www.tanabe-kanko.jp/event/tanabematsuri/',
    venue: { name: '鬪雞神社', address: '和歌山県田辺市東陽1-1' },
    links: [L('田辺市観光協会 田辺祭', 'https://www.tanabe-kanko.jp/event/tanabematsuri/')],
    occurrence: {
      ...src(2026, 'https://www.tanabe-kanko.jp/event/tanabematsuri/', '田辺市観光協会', 'official'),
      status: 'confirmed',
      note: '開催日は毎年7月24日・25日。24日は8:00頃から、25日は4:30頃から',
    },
  }],
], '既存リンクからの格上げ（13）');
