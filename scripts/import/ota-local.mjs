/**
 * 大田区の町会・自治会 盆踊り
 *
 * 出典: おーたふる 大田区商店街ナビ「2026盆踊り情報リンク集」
 *       https://otakushoren.com/event/163825
 *
 * 大田区商店街連合会が運営する地域情報サイト。町会・自治会・商店街単位の
 * 盆踊りを一覧にしている。開催時間は載っていないので日付と会場のみ。
 *
 * 寺社を会場にするものが多いのが大田区の特徴（池上本門寺、東八幡神社、
 * 女塚神社、密蔵院、養源寺）。
 */
import { emit } from './_lib.mjs';

const SRC = 'https://otakushoren.com/event/163825';
const d = (...xs) => xs.map((x) => `2026-${x}`);

// [slug, 主催, 行事名, 会場(なければnull), 日付]
const RAW = [
  ['morigasaki', '森ヶ崎自治会', '納涼盆踊り大会', null, d('07-28', '07-29')],
  ['michizuka', '道塚自治会', '盆踊り大会', '道塚小学校', d('07-30', '07-31')],
  ['denenchofu-minami', '田園調布南町会', '夏祭り ダンス＆子供盆踊り大会', '密蔵院', d('08-01')],
  ['nakarokugo-1', '仲六郷一丁目町会', '納涼会', null, d('08-01')],
  ['omorinaka-hachiman', '大森中八幡自治会', '盆踊り', '八幡神社', d('08-01')],
  ['omori-3-rengo', '大森三丁目連合町会', '盆踊り大会', null, d('08-01')],
  ['chofu-otsuka', '調布大塚自治会', '親と子の納涼盆踊り大会', '調布大塚小学校', d('08-01', '08-02')],
  ['yaguchi-watashi', '矢口の渡商店街', 'わたし盆踊り', null, d('08-02')],
  ['ikegami-honmonji', '池上本門寺', 'みたま祭り・納涼盆踊り大会', '池上本門寺', d('08-04', '08-05')],
  ['ookayama-kitaguchi', '大岡山北口商店街', '盆踊り', '大岡山北口商店街', d('08-07', '08-08')],
  ['higashi-hachiman', '東八幡神社', '例大祭（盆踊り）', '東八幡神社', d('08-07', '08-08')],
  ['yogenji', '養源寺', '精霊送り 盆踊り大会', '養源寺', d('08-15')],
  ['ginreikai', '銀嶺会', '子供盆踊り大会', null, d('08-19', '08-20')],
  ['unoki', '鵜の木西町会・東町会', '盆踊り', null, d('08-22', '08-23')],
  ['shimomaruko-higashi', '下丸子東町会', '夏祭り・盆踊り大会', '工和会館周辺', d('08-22', '08-23')],
  ['ontakesan', '御嶽山', '盆踊り大会', null, d('08-22', '08-23')],
  ['umeyashiki', '梅屋敷 ぷらもーる', '納涼盆踊り大会', null, d('08-28', '08-29')],
  ['onazuka-jinja', '女塚神社', '盆踊り', '女塚神社', d('08-29', '08-30')],
];

const SHRINE = /神社|八幡/;
const KIND = (t) => (/盆踊|わたし盆踊/.test(t) ? '盆踊り' : /納涼会/.test(t) ? '納涼祭' : '夏祭り');

emit(RAW.map(([slug, org, title, venue, dates]) => ({
  slug: `ota-${slug}`,
  name: `${org} ${title}`,
  kind: KIND(title),
  organizer: org,
  // 会場が書かれていないものは主催団体の地域内としか言えない
  venue: venue ?? `${org} 地域内`,
  ...(venue && SHRINE.test(venue) ? { shrine: venue } : {}),
  scale: /町会|自治会/.test(org) ? '町内会' : '地区',
  dates,
  ...(venue ? {} : { note: '会場は出典元の告知を参照。開催時間は出典に記載なし' }),
})), {
  pref: '東京都', city: '大田区',
  prefSlug: 'tokyo', citySlug: 'ota',
  label: '大田区（商店街連合会・町会自治会）',
  source: SRC,
  sourceName: 'おーたふる 大田区商店街ナビ',
  sourceType: 'media',
  checkedAt: '2026-08-03', year: 2026,
});
