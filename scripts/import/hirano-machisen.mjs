/**
 * 大阪市平野区「令和8年度 2026年 7月〜8月 平野区内 夏祭り・サマフェス情報」→ 祭りデータ
 *
 *   node scripts/import/hirano-machisen.mjs [--dry]
 *
 * 出典: https://hiranomachisen.com/?p=4880 （平野区まちづくりセンター）
 *
 * **地域（＝町会連合会の単位）が全件に書かれている**のがこの一覧の価値。
 * 「（長吉六反地域）」「（加美地域）」が主催の地域団体で、町内会規模と分かる。
 *
 * 注意したこと:
 *  - **だんじり・神輿は時間帯が神事ごとに分かれる**（宮入・宵宮・本宮）。
 *    全体の期間を dates に入れ、内訳は note に書く（schema.md の方針）
 *  - 「屋台」は書かれていないので stalls は unknown。**だんじりの「太鼓台」を
 *    露店と取り違えない**
 *  - 杭全神社夏まつりは 7/11〜7/14 の 4 日間だが、出典が挙げるのは
 *    神事のある 4 日。そのまま 4 日として入れる
 */
import { emit } from './_lib.mjs';

const SRC = 'https://hiranomachisen.com/?p=4880';
const d = (...xs) => xs.map((x) => `2026-${x}`);

// [slug, 名称, 地域(主催), 会場, 日付, 開始, 終了, kind, note]
const RAW = [
  ['tanabata', '第12回 こども七夕フェスティバル', '平野区まちづくりセンター', 'コミュニティプラザ平野（平野区民センター）',
    d('07-04'), '10:00', '13:00', 'こどもまつり', null],
  ['kumata', '平野郷 杭全神社 夏まつり', '平野地域・平野西地域・新平野西地域・平野南地域', '杭全神社周辺（南港通りを含む）',
    d('07-11', '07-12', '07-13', '07-14'), null, null, '例大祭',
    '神輿・太鼓台川行神事は11日6時ごろ、九町合同曳行（南港通り）は12日21時45分ごろ、地車宮入は13日19時ごろ、14日が本宮'],
  ['shogakuji', '正覚寺 だんじり祭り（三十周年）', '加美地域', '正覚寺周辺',
    d('07-16', '07-18', '07-20'), null, null, '例大祭',
    '宮入は16日19時30分〜21時30分、宵宮は18日9時〜11時45分と16時〜22時30分、本宮は20日9時〜11時10分と15時〜22時30分'],
  ['asahi-jinja', '旭神社 夏祭', '加美地域', '旭神社', d('07-15', '07-16'), null, null, '例大祭', null],
  ['rokutan', '六反夏まつり', '長吉六反地域', '赤坂公園', d('07-18'), null, null, '夏祭り', null],
  ['sugawara', '菅原神社夏まつり', '加美南部地域', '菅原神社', d('07-23', '07-24'), null, null, '例大祭', null],
  ['kire-tomoshibi', '喜連灯火の夕べ', '喜連地域', '喜連環濠地区・楯原神社・如願寺周辺', d('07-25'), null, null, '夏祭り', null],
  ['kawanabe-shoyukai', '川辺 昭友会 盆踊り大会', '長吉川辺地域', '川辺中公園', d('07-25'), null, null, '盆踊り', null],
  ['nagahara', '長原盆踊り大会', '長吉長原地域', '長吉小学校 北運動場', d('08-08', '08-09'), null, null, '盆踊り', null],
  ['daijyu', '第十町会盆踊り大会', '加美地域 第十町会', '加美神明公園', d('08-21', '08-22'), null, null, '盆踊り', null],
  ['tachibana', 'たちばな町子ども会盆踊り大会', '加美地域 たちばな町子ども会', 'たちばな公園', d('08-22'), null, null, '盆踊り', null],
  ['kire-nishi', '喜連西盆踊り大会', '喜連西地域', '喜連西中央公園', d('08-22', '08-23'), null, null, '盆踊り', null],
];

const rows = RAW.map(([slug, name, org, venue, dates, start, end, kind, note]) => ({
  slug: `hirano-${slug}`,
  name,
  kind,
  // 神社の祭礼は地域全体、町会・子ども会のものは町内会規模
  scale: /町会|子ども会|昭友会/.test(org) ? '町内会' : '地区',
  venue,
  organizer: org,
  ...(kind === '例大祭' && /神社/.test(name) ? { shrine: name.replace(/\s*(夏まつり|夏祭|祭り).*$/, '').replace(/^.*\s/, '') } : {}),
  // だんじり・地車は山車。露店の記載は無いので stalls には触らない
  stalls: 'unknown',
  tags: /だんじり|地車/.test(name + (note ?? '')) ? ['山車'] : (/神輿/.test(note ?? '') ? ['神輿'] : []),
  dates,
  start,
  end,
  year: 2026,
  status: 'confirmed',
  ...(note ? { note } : {}),
}));

if (process.argv.includes('--dry')) {
  for (const r of rows) console.log(`${r.slug} | ${r.name} | ${r.kind} | ${r.scale} | ${r.venue} | ${r.dates.join(',')} | ${r.organizer} | ${r.tags.join('/')} | ${r.shrine ?? ''}`);
  process.exit(0);
}

emit(rows, {
  pref: '大阪府',
  prefSlug: 'osaka',
  city: '大阪市平野区',
  citySlug: 'osaka-003',
  label: '大阪市平野区（まちづくりセンター）',
  source: SRC,
  sourceName: '平野区まちづくりセンター',
  // 区の地域活動を担う中間支援組織。主催団体そのものではないので gov 相当
  sourceType: 'gov',
  checkedAt: '2026-08-06',
  year: 2026,
});
