/**
 * 金沢区インポーター その2（区の行事カレンダー）
 *
 * 出典: 横浜市金沢区のお祭り・催し物・イベント情報 2026年スケジュール
 *       https://page.yokohama/wp/festival-calendar/
 *
 * 観光協会のページは夏の神社例大祭だけだったが、こちらは通年の行事を
 * 時間つきで並べている。夏以外の祭りも拾えるので、サイトが夏だけのものでなくなる。
 * 純粋なスポーツ大会や産業イベントは祭りではないので入れていない。
 */
import { emit } from './_lib.mjs';

const ROWS = [
  { slug: 'seto-jinja-keimei-shinji', name: '瀬戸神社 鶏鳴神事', kind: '神事',
    organizer: '瀬戸神社', venue: '瀬戸神社', shrine: '瀬戸神社',
    dates: ['2026-01-01'], start: '00:00' },

  { slug: 'asahina-dondoyaki', name: '朝比奈 どんど焼き', kind: '神事',
    venue: '朝比奈町570', dates: ['2026-01-10'], start: '13:00' },

  { slug: 'uminokoen-dondoyaki', name: '海の公園 どんど焼き（第31回）', kind: '神事',
    venue: '海の公園', scale: '地区',
    dates: ['2026-01-17'], start: '10:00', end: '15:00' },

  { slug: 'seto-jinja-setsubunsai', name: '瀬戸神社 節分祭', kind: '神事',
    organizer: '瀬戸神社', venue: '瀬戸神社 境内', shrine: '瀬戸神社',
    dates: ['2026-02-03'], start: '14:30' },

  { slug: 'shomyoji-sakura-matsuri', name: '称名寺 桜まつり 福祉バザー', kind: '春祭り',
    venue: '称名寺・金沢町公園', scale: '地区',
    dates: ['2026-03-28'], start: '10:00', end: '13:00' },

  { slug: 'hanamatsuri-taikai', name: '花まつり大会（第80回）', kind: '春祭り',
    venue: '称名寺〜薬王寺', scale: '地区',
    dates: ['2026-04-04'], start: '10:30' },

  { slug: 'nagahama-tsutsuji-matsuri', name: '長浜公園 つつじ祭り', kind: '春祭り',
    venue: '長浜公園 運動広場・園路',
    dates: ['2026-04-29'], start: '09:00', end: '13:30' },

  { slug: 'shomyoji-takigi-noh', name: '称名寺 薪能（第29回）', kind: '神事',
    venue: '称名寺 境内 特設能舞台', scale: '区',
    dates: ['2026-05-03'], start: '17:00', note: '17時開演' },

  { slug: 'seto-jinja-reitaisai', name: '瀬戸神社 例大祭・琵琶島神社 神幸祭', kind: '例大祭',
    organizer: '瀬戸神社', venue: '瀬戸神社', shrine: '瀬戸神社', scale: '地区',
    tags: ['神輿'], dates: ['2026-05-15'], start: '10:00' },

  { slug: 'seto-jinja-nagoshi-oharae', name: '瀬戸神社 夏越大祓・茅の輪くぐり', kind: '神事',
    organizer: '瀬戸神社', venue: '瀬戸神社', shrine: '瀬戸神社',
    dates: ['2026-06-30'], start: '15:00' },

  { slug: 'minamikawa-natsumatsuri', name: '南川町内会 夏祭り', kind: '夏祭り',
    organizer: '南川町内会', venue: '南川（六浦南）',
    dates: ['2026-07-11', '2026-07-12'], start: '16:00', end: '16:00',
    note: '7/11 宵宮 16:00〜20:30、7/12 本祭 9:30〜16:00' },

  { slug: 'seto-jinja-tennosai', name: '瀬戸神社 天王祭', kind: '例大祭',
    organizer: '瀬戸神社', venue: '瀬戸神社', shrine: '瀬戸神社',
    dates: ['2026-07-12'], start: '09:00' },

  { slug: 'tomioka-hachimangu-reitaisai', name: '富岡八幡宮 例大祭・祇園舟', kind: '例大祭',
    organizer: '富岡八幡宮', venue: '富岡八幡宮', shrine: '富岡八幡宮', scale: '地区',
    dates: ['2026-07-12'], start: '10:00',
    note: '祇園舟は横浜市の無形民俗文化財' },

  { slug: 'kanazawa-kumin-dai-bonodori', name: '金沢区民大盆踊り大会（第4回）', kind: '盆踊り',
    venue: '金沢地区センター 体育館', scale: '区',
    dates: ['2026-07-25'], start: '15:00', end: '20:00' },

  { slug: 'kanazawa-matsuri-hanabi', name: '金沢まつり 花火大会（第52回）', kind: '花火',
    venue: '海の公園', scale: '区', tags: ['花火'],
    dates: ['2026-08-22'], start: '19:00', end: '20:00' },

  { slug: 'shio-matsuri', name: '汐祭り', kind: '神事',
    venue: '野島・金沢漁港', scale: '地区',
    dates: ['2026-09-01'], start: '11:00', note: '11:00頃から' },

  { slug: 'kanazawa-bunko-geijutsusai', name: '金沢文庫芸術祭（第26回）', kind: '区民祭',
    venue: '海の公園', scale: '区',
    dates: ['2026-09-20'], start: '09:30', end: '20:00' },

  { slug: 'kanazawa-matsuri-ikiiki-festa', name: '金沢まつり いきいきフェスタ（第52回）', kind: '区民祭',
    venue: '海の公園', scale: '区',
    dates: ['2026-10-17'], start: '10:00', end: '15:30' },

  { slug: 'kanazawa-hakkei-mikoshi-parade', name: '金沢八景みこしパレード 2026', kind: '秋祭り',
    venue: '金沢八景駅前', scale: '区', tags: ['神輿'],
    dates: ['2026-11-08'], start: '10:00', end: '18:00' },
];

emit(ROWS, {
  pref: '神奈川県', city: '横浜市', ward: '金沢区',
  prefSlug: 'kanagawa', citySlug: 'yokohama', wardSlug: 'kanazawa',
  source: 'https://page.yokohama/wp/festival-calendar/',
  sourceName: '横浜市金沢区 行事カレンダー',
  sourceType: 'media',
  checkedAt: '2026-08-02',
  year: 2026,
});
