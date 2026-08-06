/**
 * 一次情報での裏取り（第34弾：神社の鎮座地を入れる／今年の開催回を足す）
 *
 *   node scripts/enrich/primary-hanabi-34.mjs
 *
 * 二つのことをしている。
 *
 * **(1) 町内会の盆踊り・夏まつりに、会場である神社の住所を入れた。**
 * 神奈川県神社庁の神社ページが `links` に入っていたので開いた。
 * ただし**神社庁のページに載っているのは例祭だけ**で、町内会の盆踊りは載っていない。
 * だから**住所と社号だけ入れて、出典は差し替えていない**。
 * 住所はジオコーディングの入力になるので、これだけでも地図に出せるようになる。
 *
 * **(2) 出典が去年の回のままだったものに、今年の開催回を足した。**
 * えいのゴッソイまつりは、データが第35回（2025年11月30日）で止まっていたが、
 * 南九州市のページは第36回（2026年11月29日）を出していた。
 * **去年の開催回を消さずに、2026年の回を足している**（`docs/schema.md` の
 * 「去年の日程を今年のものとして出さない」に沿う形）。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 神奈川県（会場の神社の住所だけ入れる。出典は差し替えない）
  // ------------------------------------------------------------------

  ['asao-takaishi-natsumatsuri', {
    shrine: '高石神社',
    venue: { name: '高石神社', address: '川崎市麻生区高石1-31-1' },
    links: [L('神奈川県神社庁 高石神社', 'https://www.kanagawa-jinja.or.jp/shrine/1201085-000/')],
  }],
  ['takatsu-chitose-bonodori', {
    shrine: '千年神社',
    venue: { name: '千年神社', address: '川崎市高津区千年539' },
    links: [L('神奈川県神社庁 千年神社', 'https://www.kanagawa-jinja.or.jp/shrine/1201070-000/')],
  }],
  ['takatsu-futako-kodomokai-bonodori', {
    shrine: '二子神社',
    venue: { name: '二子神社', address: '川崎市高津区二子1-4-1' },
    links: [L('神奈川県神社庁 二子神社', 'https://www.kanagawa-jinja.or.jp/shrine/1201061-000/')],
  }],
  ['takatsu-shibokuchi-kita-bonodori', {
    // 子母口の鎮守は「橘樹神社（たちばなじんじゃ）」
    shrine: '橘樹神社',
    venue: { name: '橘樹神社', address: '川崎市高津区子母口122' },
    links: [L('神奈川県神社庁 橘樹神社', 'https://www.kanagawa-jinja.or.jp/shrine/1201053-000/')],
  }],

  // ------------------------------------------------------------------
  // 鹿児島県（今年の開催回を足す）
  // ------------------------------------------------------------------

  // えいのゴッソイまつり。**データは第35回（2025年）で止まっていた**。
  // 南九州市が第36回（2026年11月29日）を出しているので、2026年の回を足す
  ['kagoshima-011-hanabi-ar1046e00573', {
    name: '第36回 えいのゴッソイまつり',
    organizer: 'えいのゴッソイまつり実行委員会',
    venue: { name: '頴娃運動公園', address: '南九州市頴娃町牧之内2606番地' },
    links: [L('南九州市 第36回えいのゴッソイまつり', 'https://www.city.minamikyushu.lg.jp/kankosite/event/5571.html')],
    occurrence: {
      ...src(2026, 'https://www.city.minamikyushu.lg.jp/kankosite/event/5571.html', '南九州市', 'gov'),
      dates: ['2026-11-29'],
      start_time: '11:00',
      end_time: '18:20',
      status: 'confirmed',
      note: '花火大会は18:00から。データは第35回（2025年11月30日）で止まっていたので、2026年の回を足した',
    },
  }],
], '神社の鎮座地・今年の開催回の追加');
