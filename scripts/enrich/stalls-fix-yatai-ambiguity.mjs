/**
 * 「屋台」の意味の取り違えを直す
 *
 *   node scripts/enrich/stalls-fix-yatai-ambiguity.mjs
 *
 * **日本語の「屋台」には二つの意味がある。**
 *   1. 食べ物や遊びを売る露店・夜店（このサイトの stalls が指すもの）
 *   2. 祭りで曳く山車（とくに栃木・群馬・埼玉北部。「屋台行事」「屋台まつり」）
 *
 * タグの「屋台」から stalls: yes を立てる移行をしたときに、2 の意味のものが
 * 混ざっていた。鹿沼今宮神社祭の屋台行事はユネスコ無形文化遺産の山車行事であって、
 * 露店の話ではない。成田祇園祭の「屋台」も曳山を指す。
 *
 * 露店が出ないという意味ではないので no ではなく unknown に戻す。
 */
import { patchAll } from '../import/_lib.mjs';

patchAll([
  ['kanuma-kanuma-imamiya-yatai', { stalls: 'unknown' }],
  ['narita-narita-gion-sai', { stalls: 'unknown' }],
], '「屋台」の意味の取り違えを差し戻し');
