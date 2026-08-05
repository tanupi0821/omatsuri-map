/**
 * 花火大会DBの「屋台あり」で既収録分を格上げする
 *
 *   node scripts/enrich/stalls-hanabi.mjs
 *
 * 出典: 花火大会2026（ウォーカープラス）の屋台あり絞り込み
 *       https://hanabi.walkerplus.com/list/<県>/yatai/
 *
 * 花火大会のデータベースは屋台の有無を項目として持っている。
 * この絞り込みに出るものは出典側が屋台ありと明示している。
 */
import { patchAll } from '../import/_lib.mjs';

const yes = { stalls: 'yes' };

patchAll([
  // 神奈川県
  ['hakone-ashinoko-natsumatsuri-week', yes],
  ['miura-miurakaigan-noryo-hanabi', yes],
  ['kiyokawa-miyagase-furusato-matsuri', yes],
  ['kanazawa-kanazawa-matsuri-hanabi', yes],
  ['ayase-ayase-hanabi', yes],
  ['kaisei-kaisei-noryo-matsuri', yes],
  ['matsuda-matsuda-kanko-matsuri', yes],
  ['yugawara-yugawara-kaijo-hanabi', yes],
], '屋台の有無の裏取り（花火大会DB・既収録分）');

// 埼玉県（既収録分）
patchAll([
  ['nagatoro-nagatoro-funadama', { stalls: 'yes' }],
  ['saitama-minami-hanabi-omagi', { stalls: 'yes' }],
], '屋台の有無の裏取り（埼玉県・花火DB）');
