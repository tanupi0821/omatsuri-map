/**
 * 宮前区インポーター
 *
 * 出典: みやまえご近所さん（宮前区役所運営）お祭り・盆踊り
 *       https://miyamae-gokinjosan.com/festival/
 *
 * 扱うのは日時・場所・主催という事実情報のみ。紹介文は転載しない。
 * data/festivals/... に 1 祭り 1 ファイルで書き出す。既存ファイルは上書きしない
 * （手で直した description や緯度経度を潰さないため）。--force で上書き。
 *
 *   node scripts/import/miyamae-gokinjosan.mjs [--force]
 */
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_DIR = join(ROOT, 'data', 'festivals', 'kanagawa', 'kawasaki', 'miyamae');

const SOURCE_URL = 'https://miyamae-gokinjosan.com/festival/';
const SOURCE_NAME = 'みやまえご近所さん（宮前区役所運営）';
const CHECKED_AT = '2026-08-02';
const FORCE = process.argv.includes('--force');

// [id, 名称, kind, 主催, 会場名, 住所(宮前区以下), 日付, 開始, 終了, 追加情報]
const ROWS = [
  ['miyazaki6-kodomo-matsuri', '宮崎6丁目自治会 こどもまつり', 'こどもまつり', '宮崎6丁目自治会',
    '宮崎第4公園', '宮崎6-2-3', ['2026-06-07'], null, null, { tags: ['子ども向け'] }],

  ['inukura-bonodori', '犬蔵自治会 盆踊り', '盆踊り', '犬蔵自治会',
    '犬蔵さくらの丘公園', '犬蔵2-13-4', ['2026-07-17', '2026-07-18'], '18:00', '21:00', {}],

  ['kurashiki-danchi-bonodori', '蔵敷団地親和会 盆踊り', '盆踊り', '蔵敷団地親和会',
    '蔵敷第3公園', '菅生5-22-1', ['2026-07-17', '2026-07-18'], '18:45', '21:00', {}],

  ['odai-natsumatsuri', '小台町内会 夏祭り', '夏祭り', '小台町内会',
    '小台公園', '小台2-24', ['2026-07-18'], '17:00', '20:00', {}],

  ['tsuchihashi-bonodori', '土橋町内会 盆踊り', '盆踊り', '土橋町内会',
    '土橋2丁目公園', '土橋2-13-1', ['2026-07-18'], '18:00', '21:00', {}],

  ['minami-sugao-noryosai', '南菅生自治会 納涼祭', '納涼祭', '南菅生自治会',
    '南菅生自治会館・菅生公園・菅生第2公園', '菅生6-3-15', ['2026-07-18'], '13:00', '17:00',
    { tags: ['昼開催'] }],

  ['hiebara-danchi-natsumatsuri', '稗原団地自治会 夏祭り', '夏祭り', '稗原団地自治会',
    '鷲ヶ峰公園（タコ公園）', '菅生3-43-22', ['2026-07-18'], '16:00', '19:00', {}],

  ['sugaogaoka-bonodori', '菅生ヶ丘自治会 盆踊り', '盆踊り', '菅生ヶ丘自治会',
    '菅生ヶ丘自治会館裏・鷲ヶ峰子供の里公園', '菅生ヶ丘25-7', ['2026-07-19'], '17:00', '20:00', {}],

  ['arima-bonodori', '有馬町会 盆踊り', '盆踊り', '有馬町会',
    '有馬中央公園', '有馬4-15-1', ['2026-07-24', '2026-07-25'], '18:30', '20:30', {}],

  ['miyazaki-bonodori', '宮崎町内会 盆踊り', '盆踊り', '宮崎町内会',
    '宮崎台小学校グランド', '宮崎3-18-2', ['2026-07-24', '2026-07-25'], '18:30', '21:00', {}],

  ['nogawa-bonodori', '野川地区 盆踊り', '盆踊り', '野川本町町内会・西野川町内会・東野川南野川町内会',
    '野川小学校', '西野川2-19-1', ['2026-07-24', '2026-07-25'], '18:00', '21:00',
    { scale: '地区' }],

  ['sugaodai-natsumatsuri', '菅生台自治会 夏祭り', '夏祭り', '菅生台自治会',
    '菅生第4公園', '菅生3-33-7', ['2026-07-25'], '16:00', '20:00', {}],

  ['otsuka-bonodori', '大塚町内会 盆踊り', '盆踊り', '大塚町内会',
    '宮崎こうしん坂公園', '宮崎172-6', ['2026-07-25', '2026-07-26'], '18:00', '20:30', {}],

  ['hatsuyama-bonodori', '初山自治会 盆踊り', '盆踊り', '初山自治会',
    '初山幼稚園車庫前', '初山1-17-5', ['2026-07-25', '2026-07-26'], '17:00', '21:00',
    { note: '25日は17:00〜21:00、26日は16:00〜21:00' }],

  ['kurashiki-natsumatsuri', '蔵敷自治会 夏祭り', '夏祭り', '蔵敷自治会',
    '菅生神社 境内', '菅生2-8-1', ['2026-08-01'], '17:00', '20:30',
    { shrine: '菅生神社' }],

  ['hiebara-noryosai', '稗原自治会 納涼祭', '納涼祭', '稗原自治会',
    '潮見台みどり幼稚園', '潮見台6-1', ['2026-08-01'], '17:00', '21:00', {}],

  ['shiboku-honcho-natsumatsuri', '神木本町自治会 夏祭り', '夏祭り', '神木本町自治会',
    '東高根森林公園', '神木本町2-10', ['2026-08-01'], '16:00', '20:00', {}],

  ['hananodai-bonodori', '花の台町内会 盆踊り', '盆踊り', '花の台町内会',
    '宮前平小学校', '宮前平3-14-1', ['2026-08-01', '2026-08-02'], '17:30', '20:30',
    { links: ['https://hananodai.localinfo.jp/'] }],

  ['taira-hikage-bonodori', '平日影自治会 盆踊り', '盆踊り', '平日影自治会',
    '平4丁目公園', '平4-17', ['2026-08-07', '2026-08-08'], '18:00', '20:30', {}],

  ['green-heights-akimatsuri', '宮前平グリーンハイツ自治会 秋祭り', '秋祭り', '宮前平グリーンハイツ自治会',
    '向ヶ丘公園', 'けやき平1-1', ['2026-09-26'], '16:00', '20:00', {}],

  ['kenei-arima-noryosai', '県営有馬団地自治会 納涼祭', '納涼祭', '県営有馬団地自治会',
    'たぬき公園（有馬古墳公園）', '東有馬5-15', [], '12:00', null,
    { date_note: '9月または10月', status: 'estimated' }],

  ['sugao-jinja-reitaisai-nagasawa', '菅生神社例大祭（長沢自治会エリア）', '例大祭', '長沢自治会',
    '長沢自治会館・菅生神社・町内', '菅生2-17-1', ['2026-10-03', '2026-10-04'], null, null,
    { shrine: '菅生神社', tags: ['神輿'] }],

  ['sugao-jinja-reitaisai-sugaodai', '菅生神社例大祭（菅生台自治会エリア）', '例大祭', '菅生台自治会',
    '菅生第3公園', '菅生3-14-21', ['2026-10-03', '2026-10-04'], null, null,
    { shrine: '菅生神社', tags: ['神輿'] }],

  ['sugao-jinja-reitaisai-hiebara', '菅生神社例大祭（稗原団地自治会エリア）', '例大祭', '稗原団地自治会',
    '鷲ヶ峰公園（タコ公園）', '菅生3-43-22', ['2026-10-03', '2026-10-04'], null, null,
    { shrine: '菅生神社', tags: ['神輿'] }],

  ['minamidaira-akimatsuri', '南平町内会 秋まつり', '秋祭り', '南平町内会',
    'みなみだいら公園', '南平台5-7', ['2026-10-24'], null, null, {}],
];

mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
let skipped = 0;

for (const [slug, name, kind, organizer, venue, addr, dates, start, end, extra] of ROWS) {
  const id = `miyamae-${slug}`;
  const path = join(OUT_DIR, `${id}.yml`);

  if (existsSync(path) && !FORCE) {
    skipped++;
    continue;
  }

  const festival = {
    id,
    name,
    kind,
    scale: extra.scale ?? '町内会',
    area: { pref: '神奈川県', city: '川崎市', ward: '宮前区' },
    venue: {
      name: venue,
      address: `川崎市宮前区${addr}`,
      lat: null,
      lng: null,
    },
    organizer,
    ...(extra.shrine ? { shrine: extra.shrine } : {}),
    tags: extra.tags ?? [],
    description: null, // 自分の言葉で後から書く。出典の文章はコピーしない
    links: extra.links ?? [],
    occurrences: [
      {
        year: 2026,
        dates,
        ...(extra.date_note ? { date_note: extra.date_note } : {}),
        start_time: start,
        end_time: end,
        status: extra.status ?? 'confirmed',
        source_url: SOURCE_URL,
        source_name: SOURCE_NAME,
        checked_at: CHECKED_AT,
        ...(extra.note ? { note: extra.note } : {}),
      },
    ],
  };

  writeFileSync(path, stringify(festival, { lineWidth: 0 }), 'utf8');
  written++;
}

console.log(`宮前区: ${written} 件書き出し / ${skipped} 件スキップ（既存）`);
if (skipped > 0) console.log('既存ファイルを上書きするには --force');
