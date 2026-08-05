/**
 * 千葉県の夏祭り その2
 *
 * 出典:
 *  - 夏休みおでかけガイド（ウォーカープラス）千葉県一覧の 1〜3 ページ目
 *  - 千葉すまいラボ（印西市・茂原市）
 *
 * 千葉すまいラボは市町村ページを持っているが、確定日程が載るのは 1 市 1 件程度で
 * 歩留まりが悪い。北関東で効いたウォーカープラスの県別一覧のほうが実入りが良かった。
 * 千葉市は政令市なので区まで持つ。
 */
import { emit } from './_lib.mjs';

const WP = (p) => `https://summer.walkerplus.com/odekake/list/ar0312/sg0999/${p}`;
const c = (city, citySlug, extra = {}) => ({
  pref: '千葉県', prefSlug: 'chiba', city, citySlug, ...extra,
});

const ROWS = [
  { ...c('匝瑳市', 'sosa'), slug: 'yaegaki-jinja-gion',
    name: '八重垣神社祇園祭', kind: '例大祭',
    organizer: '八重垣神社', venue: '八重垣神社', shrine: '八重垣神社', scale: '市',
    tags: ['神輿'], dates: ['2026-08-04', '2026-08-05'], source: WP('') },

  { ...c('旭市', 'asahi-chiba'), slug: 'asahi-tanabata-shimin-matsuri',
    name: '旭市七夕市民まつり', kind: '市民祭',
    venue: '旭市内', scale: '市', dates: ['2026-08-06', '2026-08-07'], source: WP('') },

  { ...c('千葉市', 'chiba', { ward: '中央区', wardSlug: 'chiba-chuo' }), slug: 'myoken-taisai',
    name: '妙見大祭', kind: '例大祭',
    organizer: '千葉神社', venue: '千葉神社', shrine: '千葉神社', scale: '市',
    dates: ['2026-08-16', '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20',
      '2026-08-21', '2026-08-22'],
    note: '千葉神社の例大祭。8/16〜22の7日間', source: WP('') },

  { ...c('千葉市', 'chiba', { ward: '中央区', wardSlug: 'chiba-chuo' }), slug: 'oyako-sandai-natsumatsuri',
    name: '千葉の親子三代夏祭り', kind: '市民祭',
    venue: '千葉市中心部', scale: '市', station: '千葉',
    dates: ['2026-08-15', '2026-08-16'], source: WP('') },

  { ...c('勝浦市', 'katsuura'), slug: 'katsuura-wakashio-noryosai',
    name: 'かつうら若潮まつり納涼祭', kind: '納涼祭',
    venue: '勝浦市内', scale: '市', dates: ['2026-08-11'], source: WP('') },

  { ...c('成田市', 'narita'), slug: 'naritasan-mitama-bonodori',
    name: '成田山 みたま祭り盆踊り大会', kind: '盆踊り',
    organizer: '成田山新勝寺', venue: '成田山新勝寺', scale: '市', station: '成田',
    dates: ['2026-08-23', '2026-08-24'], source: WP('') },

  { ...c('富里市', 'tomisato'), slug: 'tomichan-natsumatsuri',
    name: 'とみちゃん夏まつり', kind: '夏祭り',
    venue: '富里市内', scale: '市', dates: ['2026-08-22'], source: WP('2.html') },

  { ...c('銚子市', 'choshi'), slug: 'choshi-minato-matsuri-mikoshi',
    name: '銚子みなとまつり みこしパレード', kind: '夏祭り',
    venue: '銚子市内', scale: '市', tags: ['神輿'],
    dates: ['2026-08-09'], source: WP('2.html') },

  { ...c('銚子市', 'choshi'), slug: 'choshi-iinuma-kannon-bonodori',
    name: '銚子飯沼観音 盆踊り大会', kind: '盆踊り',
    venue: '飯沼観音', scale: '地区', dates: ['2026-08-18'], source: WP('2.html') },

  { ...c('野田市', 'noda'), slug: 'noda-mikoshi-parade',
    name: '野田みこしパレード（第37回）', kind: '夏祭り',
    venue: '野田市内', scale: '市', tags: ['神輿'],
    dates: ['2026-08-08'], source: WP('2.html') },

  { ...c('富津市', 'futtsu'), slug: 'sengen-jinja-kakkomai',
    name: '浅間神社 例祭「羯鼓舞」', kind: '例大祭',
    organizer: '浅間神社', venue: '浅間神社', shrine: '浅間神社', scale: '地区',
    tags: ['羯鼓舞'],
    dates: ['2026-07-05'],
    note: '明治以前から伝わる舞', source: WP('3.html') },

  { ...c('茂原市', 'mobara'), slug: 'mobara-tanabata',
    name: '茂原七夕まつり（第72回）', kind: '夏祭り',
    venue: 'JR茂原駅周辺の商店街', scale: '市', station: '茂原',
    dates: ['2026-07-24', '2026-07-25', '2026-07-26'], start: '14:00', end: '21:00',
    note: 'イベントは16:00から',
    source: 'https://chiba-sumai-labo.com/mobara-natsumatsuri/',
    sourceName: '千葉すまいラボ' },

  { ...c('九十九里町', 'kujukuri'), slug: 'kujukuri-furusato-matsuri',
    name: '九十九里町ふるさとまつり（第34回）', kind: '夏祭り',
    venue: '九十九里町内', scale: '市', tags: ['盆踊り', '屋台'],
    dates: ['2026-08-01'], source: WP('3.html') },

  { ...c('印西市', 'inzai'), slug: 'inzai-summer-fes',
    name: '印祭サマーフェス', kind: '夏祭り',
    organizer: '印西市', venue: '木下駅前にぎわい広場', scale: '市',
    dates: ['2026-10-11'],
    source: 'https://chiba-sumai-labo.com/inzai-natsumatsuri/',
    sourceName: '千葉すまいラボ' },
];

emit(ROWS, {
  pref: '千葉県',
  prefSlug: 'chiba',
  label: '千葉県（ウォーカープラス・千葉すまいラボ）',
  sourceName: '夏休みおでかけガイド（ウォーカープラス）',
  sourceType: 'aggregator',
  checkedAt: '2026-08-03',
  year: 2026,
});
