/**
 * 北関東の祭りに会場を補う
 *
 *   node scripts/enrich/kita-kanto-venues.mjs
 *
 * 夏休みおでかけガイドの一覧は会場が空欄のことが多いが、
 * ウォーカープラス本体のお祭り一覧には会場が入っている。突き合わせて埋める。
 *
 * 出典: https://www.walkerplus.com/event_list/<県>/eg0055/
 */
import { patchAll } from '../import/_lib.mjs';

const v = (name) => ({ venue: { name } });

patchAll([
  // ---- 群馬県 ----
  ['ota-ojima-neputa', v('尾島商店街大通り')],
  ['takasaki-takasaki-matsuri', v('高崎市中心市街地・もてなし広場ほか')],
  ['tomioka-oshima-no-himatsuri', v('富岡市大島地区')],
  ['shimonita-shimonita-konnyaku-natsumatsuri', v('下仁田こんにゃく手作り体験道場 広場')],
  ['kanra-kanra-shokokai-natsumatsuri', v('甘楽ふれあいの丘')],
  ['numata-numata-matsuri', v('沼田市中心市街地')],

  // ---- 茨城県 ----
  ['shimotsuma-shimotsuma-furin-matsuri', { venue: { name: '大宝八幡宮' }, shrine: '大宝八幡宮' }],
  ['tsukuba-matsuri-tsukuba', v('つくばエクスプレス つくば駅周辺')],
  ['itako-itako-gion-sairei', v('潮来地区')],
  ['tsukubamirai-obari-matsushita-ryu-tsunabi', { venue: { name: '小張愛宕神社 境内' }, shrine: '小張愛宕神社' }],
  ['kasama-kasama-noryo-bonodori-hanabi', v('笠間大池公園（笠間ポレポレシティ前）')],
  ['namegata-namegata-natsumatsuri', v('霞ケ浦ふれあいランド 親水公園')],
  ['kasumigaura-ayumi-matsuri', v('歩崎公園')],
], '北関東の祭りに会場を補完');
