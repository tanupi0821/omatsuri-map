/**
 * 北関東の神社の祭礼（ウォーカープラス お祭り一覧から）
 *
 * 出典: ウォーカープラス お祭り一覧
 *       https://www.walkerplus.com/event_list/<県>/eg0055/
 *
 * 神社庁に神社データベースが無い北関東で、神社の祭礼を拾える数少ない一覧。
 * 露店の有無は書かれていないので stalls は unknown のまま。
 * 「屋台」と書かれていても山車のことがあるので、確認できるまで yes にしない。
 */
import { emit } from './_lib.mjs';

const WP = (ar) => `https://www.walkerplus.com/event_list/${ar}/eg0055/`;

emit([
  { city: '宇都宮市', citySlug: 'utsunomiya', slug: 'futaarayama-kikusuisai',
    name: '宇都宮二荒山神社 菊水祭', kind: '秋祭り',
    organizer: '宇都宮二荒山神社', venue: '宇都宮二荒山神社および市内',
    shrine: '宇都宮二荒山神社', scale: '市', station: '宇都宮',
    tags: ['神輿', '流鏑馬', '山車'],
    recurrence: '10月の最終土曜・日曜',
    recurrenceSource: 'http://futaarayamajinja.jp/nenkan/',
    dates: ['2026-10-24', '2026-10-25'],
    note: '1673年に火災を免れた御礼として始まった。豊城入彦命の鳳輦が市内を渡御し流鏑馬が奉納される。数年に一度は山車も出る',
    links: ['http://futaarayamajinja.jp/nenkan/'] },

  { city: '宇都宮市', citySlug: 'utsunomiya', slug: 'futaarayama-daidai-kagura',
    name: '宇都宮二荒山神社 太々神楽', kind: '神事',
    organizer: '宇都宮二荒山神社', venue: '宇都宮二荒山神社',
    shrine: '宇都宮二荒山神社', scale: '市', station: '宇都宮',
    dates: ['2026-09-27'],
    links: ['http://futaarayamajinja.jp/nenkan/'] },

  { city: '宇都宮市', citySlug: 'utsunomiya', slug: 'utsunomiya-joshi-matsuri',
    name: '宇都宮城址まつり', kind: '秋祭り',
    venue: '宇都宮城址公園', scale: '市', station: '宇都宮',
    dates: ['2026-10-18'] },

  { city: '栃木市', citySlug: 'tochigi-shi', slug: 'tochigi-aki-matsuri',
    name: 'とちぎ秋まつり', kind: '秋祭り',
    venue: 'とちぎ蔵の街大通り', scale: '市', station: '栃木',
    tags: ['山車'],
    dates: ['2026-11-14', '2026-11-15'] },
], {
  pref: '栃木県', prefSlug: 'tochigi',
  label: '栃木県（神社祭礼ほか）',
  source: WP('ar0309'), sourceName: 'ウォーカープラス お祭り一覧',
  sourceType: 'aggregator',
  checkedAt: '2026-08-03', year: 2026,
});

emit([
  { city: '北茨城市', citySlug: 'kitaibaraki', slug: 'kitaibaraki-shimin-natsumatsuri',
    name: '北茨城市民夏まつり（第16回）', kind: '市民祭',
    venue: 'JR磯原駅周辺', scale: '市', station: '磯原',
    dates: ['2026-08-29'] },
], {
  pref: '茨城県', prefSlug: 'ibaraki',
  label: '茨城県（お祭り一覧）',
  source: WP('ar0308'), sourceName: 'ウォーカープラス お祭り一覧',
  sourceType: 'aggregator',
  checkedAt: '2026-08-03', year: 2026,
});
