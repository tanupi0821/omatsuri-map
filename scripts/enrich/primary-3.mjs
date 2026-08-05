/**
 * 一次情報での裏取り（第3弾：神社庁の例祭日と住所を既存データに反映）
 *
 *   node scripts/enrich/primary-3.mjs
 *
 * まとめサイト由来の町内会の祭りに、会場になっている神社の正確な住所と
 * 公式サイトを足していく。住所が入ると地図が正確に引ける。
 */
import { patchAll } from '../import/_lib.mjs';

const J = (id) => `https://www.kanagawa-jinja.or.jp/shrine/${id}/`;

patchAll([
  // 会場の神社の住所を神社庁から補う（地図の精度が上がる）
  ['takatsu-chitose-bonodori', {
    venue: { address: '川崎市高津区千年539' },
    links: [J('1201070-000')],
  }],
  ['takatsu-futako-kodomokai-bonodori', {
    venue: { address: '川崎市高津区二子1-4-1' },
    links: [J('1201061-000')],
  }],
  ['takatsu-shibokuchi-kita-bonodori', {
    venue: { address: '川崎市高津区子母口122' },
    links: [J('1201053-000')],
  }],
  ['saiwai-kashimada-bonodori', {
    venue: { address: '川崎市幸区鹿島田2-22-44' },
    links: ['https://kashimada-chonaikai.net/', J('1201016-000')],
  }],
  ['asao-takaishi-natsumatsuri', {
    venue: { address: '川崎市麻生区高石1-31-1' },
    links: ['https://takaishijinja.com/', J('1201085-000')],
  }],
  ['miyamae-kurashiki-natsumatsuri', {
    links: [J('1201046-000')],
  }],

  // 保土ケ谷の橘樹神社は「天王祭」とも呼ばれ、6月15日に近い土日が例祭
  ['hodogaya-tachibana-jinja-reitaisai', {
    name: '橘樹神社 例大祭（天王祭）',
    recurrence: '6月15日に近い土曜日・日曜日',
    recurrence_source: 'https://yokohamahodogaya.goguynet.jp/2025/05/06/tachibanajinnjya/',
  }],

  // 高津諏訪神社は公式サイトを持っていて盆踊りも告知している
  ['takatsu-suwa-12-bonodori', {
    links: ['https://takatsu-suwa.jp/'],
  }],
], '一次情報での裏取り（神社庁・神社公式）');
