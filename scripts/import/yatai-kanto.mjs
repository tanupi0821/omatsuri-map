/**
 * 屋台・露店が出ることを確認できた祭り（未収録分の追加）
 *
 * 出典: 夏休みおでかけガイド（ウォーカープラス）の「屋台のある夏祭り」絞り込み
 *       https://summer.walkerplus.com/odekake/list/<県>/sg0999/yatai/
 *
 * **「露店があるものだけ載せる」方針で追加する分。**
 * ウォーカープラスは屋台の有無を属性として持っていて、この絞り込みに出るものは
 * 出典側が屋台ありと明示している。よって stalls: yes で入れられる。
 *
 * 4県ぶん（茨城5・群馬7・栃木1・千葉7）を見たところ、大半はすでに収録済みだった。
 * ここに入れるのは未収録だった分だけ。
 * テーマパークの催し（那須ハイ夏祭り）は地域の祭りではないので入れていない。
 */
import { emit } from './_lib.mjs';

const WP = (ar) => `https://summer.walkerplus.com/odekake/list/${ar}/sg0999/yatai/`;

const ROWS = [
  { pref: '茨城県', prefSlug: 'ibaraki', city: '水戸市', citySlug: 'mito',
    slug: 'mito-komon-matsuri',
    name: '水戸黄門まつり（第66回）', kind: '市民祭',
    venue: '国道50号（水戸駅北口〜大工町交差点）・千波湖', scale: '市', station: '水戸',
    stalls: 'yes', tags: ['花火', 'パレード'],
    dates: ['2026-08-01', '2026-08-02'], start: '11:00', end: '21:00',
    note: '8/1は11:00〜21:00、8/2は11:00〜20:00。花火大会の会場は千波湖',
    links: ['https://mitokoumon.com/koumon/'],
    source: WP('ar0308'), sourceName: '夏休みおでかけガイド（ウォーカープラス）',
    sourceType: 'aggregator' },

  { pref: '茨城県', prefSlug: 'ibaraki', city: '桜川市', citySlug: 'sakuragawa',
    slug: 'makabe-gion',
    name: '真壁祇園祭', kind: '例大祭',
    venue: '真壁町内', scale: '市', stalls: 'yes', tags: ['神輿', '山車'],
    dates: ['2026-07-23', '2026-07-24', '2026-07-25', '2026-07-26'],
    source: WP('ar0308'), sourceName: '夏休みおでかけガイド（ウォーカープラス）',
    sourceType: 'aggregator' },

  { pref: '千葉県', prefSlug: 'chiba', city: '多古町', citySlug: 'tako',
    slug: 'tako-gion',
    name: '多古祇園祭', kind: '例大祭',
    venue: '多古町内', scale: '市', stalls: 'yes', tags: ['神輿', '山車'],
    dates: ['2026-07-25', '2026-07-26'],
    source: WP('ar0312'), sourceName: '夏休みおでかけガイド（ウォーカープラス）',
    sourceType: 'aggregator' },
];

const byPref = new Map();
for (const r of ROWS) {
  if (!byPref.has(r.prefSlug)) byPref.set(r.prefSlug, []);
  byPref.get(r.prefSlug).push(r);
}
for (const [prefSlug, list] of byPref) {
  emit(list, {
    pref: list[0].pref,
    prefSlug,
    label: `屋台あり（${list[0].pref}）`,
    checkedAt: '2026-08-03',
    year: 2026,
  });
}

// ---- 神奈川県（ウォーカープラス「屋台のある夏祭り」の未収録分）----
emit([
  { city: '横須賀市', citySlug: 'yokosuka', slug: 'oppama-matsuri',
    name: 'おっぱままつり2026', kind: '夏祭り',
    venue: '追浜駅周辺', scale: '市', station: '追浜', stalls: 'yes',
    dates: ['2026-07-12'],
    source: WP('ar0314'), sourceName: '夏休みおでかけガイド（ウォーカープラス）',
    sourceType: 'aggregator' },
  { city: '藤沢市', citySlug: 'fujisawa', slug: 'fujisawa-tanabata',
    name: '藤沢七夕まつり', kind: '夏祭り',
    venue: '藤沢駅周辺', scale: '市', station: '藤沢', stalls: 'yes',
    dates: ['2026-07-04'],
    source: WP('ar0314'), sourceName: '夏休みおでかけガイド（ウォーカープラス）',
    sourceType: 'aggregator' },
  { city: '相模原市', citySlug: 'sagamihara', ward: '中央区', wardSlug: 'sagamihara-chuo',
    slug: 'onokita-ginga-matsuri',
    name: '大野北銀河まつり（第38回）', kind: '夏祭り',
    venue: '淵野辺駅周辺', scale: '区', station: '淵野辺', stalls: 'yes',
    dates: ['2026-08-01', '2026-08-02'],
    source: WP('ar0314'), sourceName: '夏休みおでかけガイド（ウォーカープラス）',
    sourceType: 'aggregator' },
], {
  pref: '神奈川県', prefSlug: 'kanagawa',
  label: '屋台あり（神奈川県）',
  checkedAt: '2026-08-03', year: 2026,
});
