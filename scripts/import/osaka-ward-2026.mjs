/**
 * 大阪市の区が出している夏祭り・盆踊り一覧（2026年度）→ 祭りデータ
 *
 *   node scripts/import/osaka-ward-2026.mjs [--dry]
 *
 * `scripts/crawl/city-ward.mjs` は表になっている区（西淀川・此花）を扱う。
 * ここは**表ではなく地域ごとの見出し付きリスト**で書かれている区を入れる。
 * 列の並びを読む仕掛けが効かないので、読み取った事実を直に置く。
 *
 * `docs/kanto-plan.md` に「東住吉区は地域名の一覧のみで日程が無い」と
 * 書いてあるが、**2026年度版では日程・時間・会場・夜店の有無まで載った**。
 * 行政のページは年度ごとに中身が変わるので、駄目だった区も年に一度は見直す。
 *
 * 東住吉区は「盆踊り・夜店」「模擬店」まで書いてあるので屋台を確定できる。
 * 住吉区は町会主催のものが 7 件あり、**町内会規模がそのまま取れる**。
 */
import { emit } from './_lib.mjs';

const d = (...xs) => xs.map((x) => `2026-${x}`);

// ---------------------------------------------------------------------------
// 東住吉区 https://www.city.osaka.lg.jp/higashisumiyoshi/page/0000600898.html
// [slug, 名称, 地域(主催), 会場, 住所, 日付, 開始, 終了, kind, 屋台, note]
// ---------------------------------------------------------------------------
const HIGASHISUMIYOSHI = [
  ['ikuwa-danjiri', '育和だんじり夏祭り', '育和地域', '育和地域内', null, d('07-04', '07-05'), '09:00', null, '例大祭', 'unknown', null],
  ['ikuwa-odori', '育和おどり', '育和地域', '育和小学校 運動場', '杭全4-10-12', d('08-08'), '18:00', '21:00', '盆踊り', 'yes', null],
  ['kitatanabe', '夏まつりだョ！北田辺', '北田辺地域', '北田辺商店街', null, d('08-11'), '15:00', '20:00', '夏祭り', 'yes', null],
  ['imagawa', '今川納涼まつり', '今川地域', '今川公園グラウンド', '今川4-23', d('08-22'), '17:00', '22:00', '納涼祭', 'yes', '雨天のときは8月23日に順延'],
  ['tanabe', '田辺ふれあい夏まつり', '田辺地域', '田辺中央会館前', '田辺2-11-8', d('08-01'), '16:00', '20:00', '夏祭り', 'yes', null],
  ['minamitanabe', '南田辺まつり', '南田辺地域', '南田辺小学校', '南田辺4-3-4', d('08-01', '08-02'), '17:00', '21:00', '夏祭り', 'yes', null],
  ['higashitanabe-mikoshi', '東田辺子ども神輿', '東田辺地域', '東田辺小学校〜駒川商店街', null, d('07-05'), '10:30', null, '神事', 'unknown', null],
  ['higashitanabe-hanabi', '東田辺手持花火大会', '東田辺地域', '東田辺小学校', '東田辺2-14-16', d('08-08'), '19:30', null, '花火', 'unknown', null],
  ['higashitanabe-summer', '東田辺サマーフェスティバル', '東田辺地域', '東田辺小学校', '東田辺2-14-16', d('07-18'), '15:00', null, '夏祭り', 'yes', null],
  ['minamikudara', '第30回 南百夏まつり', '南百済地域', '南百済小学校 東運動場', '湯里2-4', d('08-01'), '17:00', null, '夏祭り', 'yes', null],
  ['takaai', '鷹合サマーフェスティバル', '鷹合地域', '鷹合小学校', '鷹合3-12-38', d('07-25', '07-26'), '16:00', '20:00', '夏祭り', 'yes', '26日は20時から花火のみ'],
  ['yatakita', '矢田北夜店と花火大会', '矢田北地域', '矢田北小学校 運動場', '照ケ丘矢田2-1-55', d('08-22'), '17:00', '20:00', '夏祭り', 'yes', null],
  ['yatahigashi', '矢田東ふれ愛フェスティバル 花火大会', '矢田東地域', '西浦池グラウンド', '住道矢田3-9', d('07-25'), '19:30', '20:15', '花火', 'unknown', null],
];

// ---------------------------------------------------------------------------
// 住吉区 https://www.city.osaka.lg.jp/sumiyoshi/page/0000471216.html
// 前半は地域活動協議会、後半は町会が主催
// ---------------------------------------------------------------------------
const SUMIYOSHI = [
  ['karitakita', '苅田北ほほえみ盆踊り大会', '苅田北ほほえみ協議会', '苅田北小学校', null, d('07-18', '07-19'), '17:00', '21:00', '盆踊り', '地区', null],
  ['karitaminami', '苅田南盆おどり大会', '苅田南地域活動協議会', 'よさみ池公園広場', null, d('07-25'), '17:00', '21:50', '盆踊り', '地区', null],
  ['shimizugaoka', '清水丘納涼夏祭り', '清水丘地域活動協議会', '清水丘小学校', null, d('07-25'), '16:00', '21:50', '納涼祭', '地区',
    '子どもの部は16時〜19時30分、大人の部は20時〜21時50分。予備日は8月1日'],
  ['nagai', '長居盆踊り大会', '長居地域活動協議会', '長居小学校', null, d('07-25'), '18:00', '20:30', '盆踊り', '地区', null],
  ['minamisumiyoshi-festa', '南住吉えーまちフェスタ', '南住吉連合地域活動協議会', '南住吉小学校', null, d('07-25'), '17:00', '22:00', '夏祭り', '地区', null],
  ['karita', '苅田盆踊り大会', '苅田地域活動協議会', '苅田小学校', null, d('08-22'), '17:00', '20:00', '盆踊り', '地区', '時間は予定'],
  ['minamisumiyoshi3', '南住吉3丁目町会 夏祭', '南住吉3丁目町会', '住吉区医師会館前・町内巡行', null, d('07-05'), '10:15', '12:30', '夏祭り', '町内会', null],
  ['sentai', '千躰町会 夏祭', '千躰町会', '市営千躰住宅 集会所前広場', null, d('08-01'), '17:00', null, '夏祭り', '町内会', null],
  ['yamanouchi', '山之内元町町会 盆踊り', '山之内元町町会', '山之内元町児童遊園', null, d('08-15', '08-16'), '19:00', '21:00', '盆踊り', '町内会', null],
  ['sumiyoshi5', '住吉第5町会 夏祭', '住吉第5町会', 'すみよし隣保館前広場', null, d('08-21'), '18:00', '21:00', '夏祭り', '町内会', null],
  ['sawanocho1', '沢之町1丁目町会 盆踊り', '沢之町1丁目町会', '若松神社', null, d('08-21'), '19:00', null, '盆踊り', '町内会', null],
  ['shinan', '四南町会 盆踊り', '四南町会', '東粉浜公園', null, d('08-22'), '17:00', null, '盆踊り', '町内会', null],
  ['bandaihigashi', '万代東・大領町会 盆踊り', '万代東5丁目町会ほか', '南万領公園', null, d('08-23', '08-24'), '18:30', '21:00', '盆踊り', '町内会',
    '子どもの部は18時30分〜19時30分、大人の部は19時30分〜21時'],
];

// ---------------------------------------------------------------------------
// 此花区 https://www.city.osaka.lg.jp/konohana/page/0000654633.html
// 地域の盆踊りは `crawl/city-ward.mjs` が既に取っている。
// **同じページの前半にある神社の夏祭り 6 件が漏れていた**ので、ここで足す。
// [slug, 神社名, 日付]
// ---------------------------------------------------------------------------
const KONOHANA_SHRINES = [
  ['asahishinmeisha', '朝日神明社', d('07-11', '07-12')],
  ['shikanjima-sumiyoshi', '四貫島住吉神社', d('07-19', '07-20')],
  ['ubusuna', '産土神社', d('07-22', '07-23')],
  ['nishikujo', '西九条神社', d('07-25', '07-26')],
  ['hongu-karasumiya', '本宮鴉宮', d('07-31', '08-01')],
  ['miotsukushi-sumiyoshi', '澪標住吉神社', d('07-31', '08-01')],
];

const DRY = process.argv.includes('--dry');

const higashi = HIGASHISUMIYOSHI.map(([slug, name, org, venue, address, dates, start, end, kind, stalls, note]) => ({
  slug: `hsumi-${slug}`,
  name,
  kind,
  // 「◯◯地域」は地域活動協議会（連合町会の単位）。町内会より一つ上
  scale: '地区',
  venue,
  address,
  organizer: org,
  stalls,
  tags: /花火/.test(name) ? ['花火'] : (/神輿/.test(name) ? ['神輿'] : []),
  dates,
  start,
  end,
  year: 2026,
  status: 'confirmed',
  ...(note ? { note } : {}),
}));

const sumi = SUMIYOSHI.map(([slug, name, org, venue, address, dates, start, end, kind, scale, note]) => ({
  slug: `sumi-${slug}`,
  name,
  kind,
  scale,
  venue,
  address,
  organizer: org,
  // 出典に模擬店・夜店の記載が無い。推測しない
  stalls: 'unknown',
  dates,
  start,
  end,
  year: 2026,
  status: 'confirmed',
  ...(note ? { note } : {}),
}));

const konohana = KONOHANA_SHRINES.map(([slug, shrine, dates]) => ({
  slug: `konohana-${slug}`,
  name: `${shrine} 夏祭り`,
  kind: '例大祭',
  scale: '地区',
  venue: shrine,
  shrine,
  organizer: shrine,
  // 神社の夏祭りは露店が出ることが多いが、出典に記載が無いので推測しない
  stalls: 'unknown',
  dates,
  start: null,
  end: null,
  year: 2026,
  status: 'confirmed',
}));

if (DRY) {
  for (const r of [...higashi, ...sumi, ...konohana]) {
    console.log(`${r.slug} | ${r.name} | ${r.kind} | ${r.scale} | ${r.venue} | ${r.address ?? '-'} | ${r.dates.join(',')} | ${r.start ?? '-'}〜${r.end ?? '-'} | 屋台${r.stalls} | ${r.organizer}`);
  }
  process.exit(0);
}

emit(higashi, {
  pref: '大阪府',
  prefSlug: 'osaka',
  city: '大阪市東住吉区',
  citySlug: 'osaka-020',
  label: '大阪市東住吉区（区公式）',
  source: 'https://www.city.osaka.lg.jp/higashisumiyoshi/page/0000600898.html',
  sourceName: '大阪市東住吉区',
  sourceType: 'gov',
  checkedAt: '2026-08-06',
  year: 2026,
});

emit(konohana, {
  pref: '大阪府',
  prefSlug: 'osaka',
  city: '大阪市此花区',
  citySlug: 'osaka-006',
  label: '大阪市此花区（区公式・神社の夏祭り）',
  source: 'https://www.city.osaka.lg.jp/konohana/page/0000654633.html',
  sourceName: '大阪市此花区',
  sourceType: 'gov',
  checkedAt: '2026-08-06',
  year: 2026,
});

emit(sumi, {
  pref: '大阪府',
  prefSlug: 'osaka',
  city: '大阪市住吉区',
  citySlug: 'osaka-024',
  label: '大阪市住吉区（区公式）',
  source: 'https://www.city.osaka.lg.jp/sumiyoshi/page/0000471216.html',
  sourceName: '大阪市住吉区',
  sourceType: 'gov',
  checkedAt: '2026-08-06',
  year: 2026,
});
