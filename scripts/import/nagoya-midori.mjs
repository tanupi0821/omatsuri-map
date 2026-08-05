/**
 * 名古屋市緑区「令和8年度 緑区各学区の盆踊り大会・夏祭り日程案内」→ 祭りデータ
 *
 *   node scripts/import/nagoya-midori.mjs [--dry]
 *
 * 出典: https://www.city.nagoya.jp/midori/oshirase/1024402/1051527.html
 *
 * 名古屋市は**区ではなく学区（小学校区）単位**で町内会がまとまっている。
 * 名東区・西淀川区と同じ型の一覧が緑区にもあった
 * （`docs/kanto-plan.md` に「緑区は表が無い」と書いたのは別のページを見ていた）。
 *
 * 主催は学区連絡協議会・自治会。会場は小学校の運動場やコミュニティセンターで、
 * まさに町内会規模。屋台の有無は書かれていないので unknown のまま。
 */
import { emit } from './_lib.mjs';
import { writeNationwideAreas } from './_nationwide.mjs';

const SRC = 'https://www.city.nagoya.jp/midori/oshirase/1024402/1051527.html';
const d = (...xs) => xs.map((x) => `2026-${x}`);

// [slug, 学区/自治会, 行事名, 会場, 日付, 開始, 終了]
const RAW = [
  ['taishi', '太子学区', '夏まつり', '太子小学校', d('07-11'), '18:30', '20:00'],
  ['narumi', 'なるみ学区', 'なるみ祭り', 'なるぱーく', d('07-18', '07-19'), '13:45', '20:30'],
  ['naganedai', '長根台学区', '長根台学区夏祭り', '長根台コミュニティセンター', d('07-25'), '17:00', '19:00'],
  ['odaka', '大高・大高北学区', '夏祭り盆踊り', '大高北小学校', d('07-25'), '17:00', '20:00'],
  ['midori', '緑学区', '緑学区納涼盆踊り大会', '緑小学校', d('07-25'), '17:30', '20:10'],
  ['higashigaoka', '東丘学区', '東丘サマーフェスティバル', '鳴海団地グラウンド', d('08-01', '08-02'), '17:00', '21:00'],
  ['takinomizu', '滝ノ水学区', '夏まつり', '滝ノ水小学校', d('08-01'), '17:30', '20:30'],
  ['oshimizu', '大清水学区', 'ふれあい納涼盆踊り大会', '平手南公園', d('08-01'), '17:30', '20:30'],
  ['kosaka', '小坂学区', '盆踊り', '小坂小学校', d('08-01'), '18:00', '20:30'],
  ['takohata', '蛸畑自治会', '盆踊り大会', '蛸畑公園', d('08-01'), '18:00', '21:00'],
  ['moronoki', '諸ノ木自治会', '諸ノ木自治会夏まつり', '日本ガイシ諸の木グラウンド', d('08-01'), '18:00', '21:00'],
  ['naruko', '鳴子学区', '鳴子まつり', '鳴子中央公園', d('08-22'), '17:00', '21:00'],
  ['togasa', '戸笠学区', '戸笠まつり', '戸笠小学校', d('09-20'), '17:00', '21:00'],
  ['momoyama', '桃山学区', '桃山学区夏まつり', '緑黒石第一公園', d('09-26'), '17:00', '21:00'],
];

const KIND = (n) => {
  if (/盆踊/.test(n)) return '盆踊り';
  if (/納涼/.test(n)) return '納涼祭';
  return '夏祭り';
};

const rows = RAW.map(([slug, org, name, venue, dates, start, end]) => ({
  slug: `midori-${slug}`,
  // 「夏まつり」「盆踊り」だけの名前が 3 件ある。学区名を前に付けて区別する
  name: /学区|自治会|なるみ|鳴子|戸笠/.test(name) ? name : `${org} ${name}`,
  kind: KIND(name),
  scale: '地区', // 学区は町内会より広く、区より狭い
  venue,
  organizer: org,
  // 出典に模擬店の記載が無い。推測しない
  stalls: 'unknown',
  dates,
  start,
  end,
  year: 2026,
  status: 'confirmed',
}));

if (process.argv.includes('--dry')) {
  for (const r of rows) console.log(`${r.slug} | ${r.name} | ${r.kind} | ${r.venue} | ${r.dates.join(',')} | ${r.start}〜${r.end} | ${r.organizer}`);
  process.exit(0);
}

// 名古屋市緑区はまだエリア定義に無いので足す
writeNationwideAreas(new Map([['aichi', { pref: '愛知県', cities: [{ name: '名古屋市緑区', slug: 'aichi-midori' }] }]]));

emit(rows, {
  pref: '愛知県',
  prefSlug: 'aichi',
  city: '名古屋市緑区',
  citySlug: 'aichi-midori',
  label: '名古屋市緑区（区公式）',
  source: SRC,
  sourceName: '名古屋市緑区',
  sourceType: 'gov',
  checkedAt: '2026-08-06',
  year: 2026,
});
