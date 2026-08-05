/**
 * 埼玉県の「屋台のある夏祭り」（未収録分）
 *
 * 出典: 夏休みおでかけガイド（ウォーカープラス）「屋台のある夏祭り」絞り込み
 *       https://summer.walkerplus.com/odekake/list/ar0311/sg0999/yatai/
 *
 * 「露店があるものだけ載せる」方針での追加。出典が屋台の有無を属性として
 * 持っているので stalls: yes で入れられる。
 */
import { emit } from './_lib.mjs';

const WP = 'https://summer.walkerplus.com/odekake/list/ar0311/sg0999/yatai/';

emit([
  { city: 'ふじみ野市', citySlug: 'fujimino', slug: 'kamifukuoka-tanabata',
    name: '上福岡七夕まつり（第72回）', kind: '夏祭り',
    venue: '上福岡駅周辺', scale: '市', station: '上福岡',
    dates: ['2026-08-08', '2026-08-09'] },
  { city: 'ふじみ野市', citySlug: 'fujimino', slug: 'ooi-matsuri',
    name: 'おおい祭り（第26回）', kind: '夏祭り',
    venue: '大井中央公園ほか', scale: '市',
    dates: ['2026-07-26'] },
  { city: '越谷市', citySlug: 'koshigaya', slug: 'minamikoshigaya-awaodori',
    name: '南越谷阿波踊り（第40回）', kind: '夏祭り',
    venue: '南越谷駅・新越谷駅周辺', scale: '市', station: '南越谷',
    dates: ['2026-08-21', '2026-08-22', '2026-08-23'] },
  { city: '長瀞町', citySlug: 'nagatoro', slug: 'nagatoro-funadama',
    name: '長瀞船玉まつり', kind: '夏祭り',
    venue: '荒川岩畳周辺', scale: '市', station: '長瀞', tags: ['花火', '灯籠流し'],
    dates: ['2026-08-15'] },
  { city: '狭山市', citySlug: 'sayama', slug: 'irumagawa-tanabata',
    name: '狭山市入間川七夕まつり', kind: '夏祭り',
    venue: '狭山市駅西口・七夕通り商店街', scale: '市', station: '狭山市',
    dates: ['2026-08-01', '2026-08-02'] },
  { city: '川越市', citySlug: 'kawagoe', slug: 'kawagoe-hyakumanto',
    name: '川越百万灯夏まつり', kind: '夏祭り',
    venue: '川越市中心市街地', scale: '市', station: '本川越', tags: ['灯籠'],
    dates: ['2026-07-25', '2026-07-26'] },
  { city: '志木市', citySlug: 'shiki', slug: 'shikishima-jinja-saiten',
    name: '敷島神社 祭典', kind: '例大祭',
    organizer: '敷島神社', venue: '敷島神社', shrine: '敷島神社', scale: '市',
    dates: ['2026-07-18', '2026-07-19'] },
  { city: '川口市', citySlug: 'kawaguchi', slug: 'kawaguchi-tanabata',
    name: '川口七夕まつり（第65回）', kind: '夏祭り',
    venue: '川口駅前・本町大通り', scale: '市', station: '川口',
    dates: ['2026-07-03', '2026-07-04', '2026-07-05', '2026-07-06', '2026-07-07'] },
].map((r) => ({ ...r, stalls: 'yes' })), {
  pref: '埼玉県', prefSlug: 'saitama',
  label: '埼玉県（屋台あり）',
  source: WP, sourceName: '夏休みおでかけガイド（ウォーカープラス）',
  sourceType: 'aggregator',
  checkedAt: '2026-08-03', year: 2026,
});
