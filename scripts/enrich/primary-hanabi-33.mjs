/**
 * 一次情報での裏取り（第33弾：神社の例大祭と、既存リンクからの格上げ その18）
 *
 *   node scripts/enrich/primary-hanabi-33.mjs
 *
 * **神奈川県神社庁の神社ページは、その神社の例祭日を持っている。**
 * 既に `links` に入っていたので開いてみたところ、鎮座地の住所と
 * 例祭日の決まり（`recurrence`）が取れた。神社庁は既に他の祭りで
 * `official` として使っているので、格もそれに合わせている。
 *
 * **ただし「神社のページに載っているのは例祭だけ」**という限界がある。
 * 新城神社（川崎市中原区）の納涼盆踊り大会は町内会の行事なので神社庁のページには無い。
 * この場合は**住所などの事実だけ入れて、出典は差し替えていない**。
 * 神社のページを開いたからといって、そこに載っていない祭りの出典にはできない。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 秋田県
  // ------------------------------------------------------------------

  // 綴子神社例大祭。**毎年7月14日・15日**で固定。14日は19時から、15日は11時から
  ['akita-006-summer-ar0205e507415', {
    shrine: '綴子神社',
    recurrence: '7月14日・15日',
    recurrence_source: 'https://www.city.kitaakita.akita.jp/archive/contents-6038',
    venue: { name: '綴子神社', address: '北秋田市綴子' },
    links: [L('北秋田市 八幡宮綴子神社例大祭', 'https://www.city.kitaakita.akita.jp/archive/contents-6038')],
    occurrence: {
      ...src(2026, 'https://www.city.kitaakita.akita.jp/archive/contents-6038', '北秋田市', 'gov'),
      start_time: '19:00',
      status: 'confirmed',
      note: '7月14日は19:00から、15日は11:00から。開催日は毎年7月14日・15日',
    },
  }],

  // ------------------------------------------------------------------
  // 神奈川県
  // ------------------------------------------------------------------

  // 亀岡八幡宮の例大祭。**神社庁のページに例祭日「7月16日」がある**。
  // データは7月15日・16日の2日で、15日が宵宮にあたる
  ['zushi-kameoka-hachimangu-reitaisai', {
    shrine: '亀岡八幡宮',
    recurrence: '7月16日',
    recurrence_source: 'https://www.kanagawa-jinja.or.jp/shrine/1205122-000/',
    venue: { name: '亀岡八幡宮', address: '逗子市逗子5-2-13' },
    links: [L('神奈川県神社庁 亀岡八幡宮', 'https://www.kanagawa-jinja.or.jp/shrine/1205122-000/')],
    occurrence: {
      ...src(2026, 'https://www.kanagawa-jinja.or.jp/shrine/1205122-000/', '神奈川県神社庁', 'official'),
      status: 'confirmed',
      note: '神社庁の記載では例大祭は7月16日。データの7月15日は宵宮にあたる',
    },
  }],

  // 冨塚八幡宮の例大祭。**例祭日は8月第1日曜日**（2026年は8月2日）。
  // 神社の表記は「富塚」ではなく「冨塚」
  ['totsuka-tomizuka-hachimangu-reitaisai', {
    name: '冨塚八幡宮 例大祭',
    shrine: '冨塚八幡宮',
    recurrence: '8月第1日曜日',
    recurrence_source: 'https://www.kanagawa-jinja.or.jp/shrine/1204082-000/',
    venue: { name: '冨塚八幡宮', address: '横浜市戸塚区戸塚町3828' },
    links: [L('神奈川県神社庁 冨塚八幡宮', 'https://www.kanagawa-jinja.or.jp/shrine/1204082-000/')],
    occurrence: {
      ...src(2026, 'https://www.kanagawa-jinja.or.jp/shrine/1204082-000/', '神奈川県神社庁', 'official'),
      status: 'confirmed',
      note: '例祭日は8月第1日曜日（2026年は8月2日）。データの8月1日は宵宮にあたる。神社の表記は「冨塚」',
    },
  }],

  // 新城神社の納涼盆踊り大会。**神社庁のページに載っているのは
  // 例祭（3月20日）と例大祭（10月第1日曜日）だけ**で、盆踊りは町内会の行事。
  // したがって住所などの事実だけ入れ、**出典は差し替えない**
  ['nakahara-shinjo-jinja-bonodori', {
    shrine: '新城神社',
    venue: { name: '新城神社', address: '川崎市中原区新城中町4-14' },
    links: [L('神奈川県神社庁 新城神社', 'https://www.kanagawa-jinja.or.jp/shrine/1201044-000/')],
  }],

  // ------------------------------------------------------------------
  // 宮崎県
  // ------------------------------------------------------------------

  // みやざき青島国際ビールまつり。会場（こどものくに）の住所が取れた
  ['miyazaki-004-hanabi-ar1045e00463', {
    organizer: 'みやざき青島国際ビールまつり実行委員会',
    venue: { name: 'こどものくに（ホテル側広場）', address: '宮崎市青島1丁目1-1' },
    links: [L('宮崎市観光協会 みやざき青島国際ビールまつり', 'https://www.miyazaki-city.tourism.or.jp/feature/miyazaki_thingtao')],
    occurrence: {
      ...src(2026, 'https://www.miyazaki-city.tourism.or.jp/feature/miyazaki_thingtao', '宮崎市観光協会', 'official'),
      start_time: '11:00',
      end_time: '21:30',
      status: 'confirmed',
    },
  }],
], '神社の例大祭・既存リンクからの格上げ（18）');
