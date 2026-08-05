/**
 * 名古屋市「地域の祭り情報発信」→ 祭りデータ
 *
 *   node scripts/import/nagoya-matsuri.mjs [--dry]
 *
 * 出典: https://www.city.nagoya.jp/kankou/rekishi/1017203/1017220.html
 *       （名古屋市。区ごとに地域に根づいた祭りを 1 件ずつ紹介している）
 *
 * **日付が「毎年7月第3土曜日」という決まりで書かれている**のがこの一覧の特徴。
 * 神社庁のデータと同じ形なので `scripts/lib/jpdate.mjs` でその年の日付に落とし、
 * `recurrence` にも決まりをそのまま残す。
 * **決まりから導いた日付は必ず status: estimated**（市が今年の日程として
 * 発表したわけではない）。docs/schema.md の方針どおり。
 *
 * 「一色まつり」は隔年開催で今年やるか分からないので入れない。
 *
 * 名古屋市の区はエリア定義にほとんど無いので、ここで足す。
 */
import { emit } from './_lib.mjs';
import { writeNationwideAreas } from './_nationwide.mjs';
import { resolveFestivalDate } from '../lib/jpdate.mjs';
import { loadAreaList } from '../lib/areas.mjs';
import { ROOT } from './_lib.mjs';

const SRC = 'https://www.city.nagoya.jp/kankou/rekishi/1017203/1017220.html';

// [区, slug, 名称, 開催の決まり, 時間の記述, 会場, 神社, kind, start]
const RAW = [
  ['南区', 'nagoya-minami', '鍬形祭り', '5月5日', '午前10時から', '笠寺小学校', null, '春祭り', '10:00'],
  ['昭和区', 'nagoya-showa', '茅の輪くぐり', '7月4日', '4日は正午から、5日は午前9時から', '川原神社', '川原神社', '神事', '12:00'],
  ['中区', 'nagoya-naka', '洲崎神社提灯祭', '7月第3土曜日', '献灯は午後7時から', '洲崎神社', '洲崎神社', '例大祭', '19:00'],
  ['天白区', 'nagoya-tempaku', '針名神社天王祭', '7月第3月曜日', '提灯トボシは午後6時から', '針名神社', '針名神社', '例大祭', '18:00'],
  ['北区', 'nagoya-kita', '七夕祭り（多奈波太神社）', '8月第1土曜日', '午前8時から午後9時', '多奈波太神社周辺', '多奈波太神社', '夏祭り', '08:00', '21:00'],
  ['守山区', 'nagoya-moriyama', '提灯山と納涼盆踊り大会', '8月13日', '午後5時から', '勝手社（上志段味）', '勝手社', '盆踊り', '17:00'],
  ['守山区', 'nagoya-moriyama', '百灯祭納涼盆踊り大会', '8月14日', '午後5時から', '諏訪神社（中志段味）', '諏訪神社', '盆踊り', '17:00'],
  ['守山区', 'nagoya-moriyama', '吉根納涼夏祭り', '8月第2土曜日', '午後5時から', '吉根公園', null, '納涼祭', '17:00'],
  ['西区', 'nagoya-nishi2', '蛇池神社万灯流し大祭', '8月20日', '盆踊りは午後7時から', '蛇池公園', '蛇池神社', '例大祭', '19:00'],
  ['南区', 'nagoya-minami', '本地祭り', '10月第1土曜日', '1日目は午後0時30分から、2日目は午前10時から', '星宮社周辺', '星宮社', '秋祭り', '12:30'],
  ['緑区', 'aichi-midori', '大高祭り', '10月第1土曜日', '2日目は午前7時45分から', '大高町一帯', null, '秋祭り', null],
  ['中村区', 'nagoya-nakamura', '烏森三社秋祭り', '10月第2月曜日', '午前9時から', '烏森町一帯', null, '秋祭り', '09:00'],
  ['熱田区', 'nagoya-atsuta', '秋葉大祭・火まつり', '12月16日', '火まつりは午後7時から', '圓通寺', null, '神事', '19:00'],
  ['千種区', 'aichi-005', 'うそ替え（上野天満宮）', '1月15日', '午前9時から', '上野天満宮', '上野天満宮', '神事', '09:00'],
  ['東区', 'nagoya-higashi', 'カッチン玉祭り', '2月26日', '午前9時から', '六所神社', '六所神社', '神事', '09:00'],
];

// 既存のエリア定義に無い区だけ足す（slug は既に振られているものを使う）
const known = new Map(loadAreaList(ROOT).map((a) => [a.city, a.slug]));
const cities = [];
const slugOf = new Map();
for (const [ward, slug] of RAW.map((r) => [`名古屋市${r[0]}`, r[1]])) {
  if (slugOf.has(ward)) continue;
  const use = known.get(ward) ?? slug;
  slugOf.set(ward, use);
  if (!known.has(ward)) cities.push({ name: ward, slug: use });
}

const rows = RAW.map(([ward, , name, rule, timeNote, venue, shrine, kind, start, end]) => {
  const r = resolveFestivalDate(rule, 2026);
  return {
    city: `名古屋市${ward}`,
    citySlug: slugOf.get(`名古屋市${ward}`),
    slug: `nagoyacity-${name.replace(/[^ぁ-んァ-ヶ一-鿿]/g, '').slice(0, 12)}`,
    name,
    kind,
    // 区が「地域に根づいた祭り」として挙げているもの。町内会より広い
    scale: '地区',
    venue,
    ...(shrine ? { shrine } : {}),
    recurrence: rule,
    recurrenceSource: SRC,
    // 出典に模擬店の記載が無い。推測しない
    stalls: 'unknown',
    // 「提灯」「万灯」は灯りの行事であって神輿でも山車でもない。タグは付けない
    tags: [],
    dates: r?.dates ?? [],
    start: start ?? null,
    end: end ?? null,
    year: 2026,
    // **決まりから導いた日付**。市が今年の日程として発表したものではない
    status: r?.exact ? 'confirmed' : 'estimated',
    note: `開催は「毎年${rule}」という決まり。${timeNote}`,
  };
});

if (process.argv.includes('--dry')) {
  for (const r of rows) console.log(`${r.city} (${r.citySlug}) | ${r.name} | ${r.kind} | ${r.venue} | ${r.dates.join(',')} | ${r.status} | ${r.recurrence}`);
  process.exit(0);
}

writeNationwideAreas(new Map([['aichi', { pref: '愛知県', cities }]]));

emit(rows, {
  pref: '愛知県',
  prefSlug: 'aichi',
  label: '名古屋市（市公式・地域の祭り）',
  source: SRC,
  sourceName: '名古屋市',
  sourceType: 'gov',
  checkedAt: '2026-08-06',
  year: 2026,
});
