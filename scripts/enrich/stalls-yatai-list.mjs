/**
 * 屋台の有無を「屋台のある夏祭り」一覧で裏取りして格上げする
 *
 *   node scripts/enrich/stalls-yatai-list.mjs
 *
 * 出典: 夏休みおでかけガイド（ウォーカープラス）の「屋台のある夏祭り」絞り込み
 *   茨城 https://summer.walkerplus.com/odekake/list/ar0308/sg0999/yatai/
 *   群馬 https://summer.walkerplus.com/odekake/list/ar0310/sg0999/yatai/
 *   栃木 https://summer.walkerplus.com/odekake/list/ar0309/sg0999/yatai/
 *   千葉 https://summer.walkerplus.com/odekake/list/ar0312/sg0999/yatai/
 *
 * ウォーカープラスは屋台の有無を属性として持っている。この絞り込みに出るものは
 * 出典側が屋台ありと明示しているので、すでに収録済みのものを stalls: yes に上げる。
 *
 * 逆に、この一覧に出てこないからといって「屋台が出ない」とは限らない
 * （出典が属性を付けていないだけのことがある）ので、no にはしない。
 */
import { patchAll } from '../import/_lib.mjs';

const Y = (ar) => `https://summer.walkerplus.com/odekake/list/${ar}/sg0999/yatai/`;
const IB = Y('ar0308'); const GU = Y('ar0310'); const CH = Y('ar0312');

const yes = (source) => ({ stalls: 'yes', links: [source] });

patchAll([
  // ---- 茨城県 ----
  ['tsukuba-matsuri-tsukuba', yes(IB)],
  ['kasumigaura-ayumi-matsuri', yes(IB)],
  ['ryugasaki-tsukumai', yes(IB)],

  // ---- 群馬県 ----
  ['kiryu-kiryu-yagibushi-matsuri', yes(GU)],
  ['ota-ojima-neputa', yes(GU)],
  ['kanra-kanra-shokokai-natsumatsuri', yes(GU)],
  ['numata-numata-matsuri', yes(GU)],
  ['maebashi-ogo-gion-matsuri', yes(GU)],
  ['maebashi-maebashi-tanabata', yes(GU)],
  ['tatebayashi-tatebayashi-matsuri', yes(GU)],

  // ---- 千葉県 ----
  ['chiba-chuo-oyako-sandai-natsumatsuri', yes(CH)],
  ['asahi-chiba-asahi-tanabata-shimin-matsuri', yes(CH)],
  ['tomisato-tomichan-natsumatsuri', yes(CH)],
  ['mobara-mobara-tanabata', yes(CH)],
  ['kujukuri-kujukuri-furusato-matsuri', yes(CH)],
  ['katori-sawara-taisai-natsu', yes(CH)],
], '屋台の有無の裏取り（ウォーカープラス 屋台絞り込み）');

// 東京都（ウォーカープラス「屋台のある夏祭り」に出ていた既収録分）
patchAll([
  ['minato-jinjacho-minato-3013-0', { stalls: 'yes' }],   // 麻布十番納涼まつり（十番稲荷神社）
  ['koto-local-tomioka-hachimangu', { stalls: 'yes' }],   // 深川八幡祭り（富岡八幡宮例祭）
], '屋台の有無の裏取り（東京都・既収録分）');

// 神奈川県（ウォーカープラス「屋台のある夏祭り」に出ていた既収録分）
patchAll([
  ['nishi-minatomirai-dai-bonodori', { stalls: 'yes' }],
  ['kamakura-tsurugaoka-bonbori', { stalls: 'yes' }],
  ['nishi-yokohama-tanabata', { stalls: 'yes' }],
  ['yamato-yamato-awaodori', { stalls: 'yes' }],
  ['hiratsuka-shonan-hiratsuka-tanabata', { stalls: 'yes' }],
  ['manazuru-manazuru-kibune-matsuri', { stalls: 'yes' }],
  ['yugawara-yugawara-yassa-matsuri', { stalls: 'yes' }],
], '屋台の有無の裏取り（神奈川県・既収録分）');

// 埼玉県（ウォーカープラス「屋台のある夏祭り」に出ていた既収録分）
patchAll([
  ['saitama-kita-nisshin-tanabata', { stalls: 'yes' }],
  ['omiya-nakasendo-matsuri', { stalls: 'yes' }],
], '屋台の有無の裏取り（埼玉県・既収録分）');
