/**
 * 横浜市 区別インポーター（神奈川すまいラボの区別ページ）
 *
 * 出典: 神奈川すまいラボ 各区の夏祭り・盆踊りガイド
 *       https://kanagawa-sumai-labo.com/<区>-ku-natsumatsuri/
 *
 * 他のソースで拾えていない区を埋めるために使う。日付が明記されているものだけを取る。
 * 2026年の日程が未発表で 2025年の実績だけ載っているものは、年を 2025 として入れておく。
 * サイト側では「2025年の情報です／今年は未確認」と明示されて出る。
 */
import { emit } from './_lib.mjs';

const src = (slug) => `https://kanagawa-sumai-labo.com/${slug}-ku-natsumatsuri/`;

const ROWS = [
  // --- 港南区 ---
  { ward: '港南区', wardSlug: 'konan', slug: 'minamigaoka-natsumatsuri',
    name: '南ヶ丘町内会 夏祭り（第24回）', kind: '夏祭り',
    organizer: '南ヶ丘町内会', venue: '南ヶ丘（上大岡・港南中央エリア）',
    dates: ['2026-07-18'], source: src('konan') },

  { ward: '港南区', wardSlug: 'konan', slug: 'okubo-3cho-bonodori',
    name: '大久保三町 合同盆踊り', kind: '盆踊り',
    venue: '大久保公園', scale: '地区',
    dates: ['2026-07-25'], source: src('konan') },

  { ward: '港南区', wardSlug: 'konan', slug: 'hinominami-natsumatsuri',
    name: 'みなみ夏まつり！2026（日野南地域）', kind: '夏祭り',
    venue: '日野南（港南台エリア）', scale: '地区',
    dates: ['2026-07-31'], source: src('konan') },

  { ward: '港南区', wardSlug: 'konan', slug: 'kamiooka-rengo-bonodori',
    name: '上大岡連合町内会 盆踊り', kind: '盆踊り',
    organizer: '上大岡連合町内会', venue: '上大岡公園', scale: '地区',
    dates: ['2026-08-01'], start: '16:00', end: '20:30',
    note: '雨天のときは翌2日に順延', source: src('konan') },

  // --- 泉区 ---
  { ward: '泉区', wardSlug: 'izumi', slug: 'suga-jinja-reitaisai',
    name: '須賀神社 例大祭（和泉の天王さま）', kind: '例大祭',
    organizer: '須賀神社', venue: '和泉地域一帯（神輿渡御はいずみ中央駅方面）',
    shrine: '須賀神社', scale: '地区', tags: ['神輿'],
    dates: ['2026-07-25', '2026-07-26'], source: src('izumi') },

  { ward: '泉区', wardSlug: 'izumi', slug: 'shirayuri-koen-bonodori',
    name: 'しらゆり公園 納涼盆踊り大会', kind: '盆踊り',
    venue: 'しらゆり公園',
    dates: ['2025-07-26', '2025-07-27'], year: 2025,
    note: '2025年の実績。2026年の日程は未発表', source: src('izumi') },

  { ward: '泉区', wardSlug: 'izumi', slug: 'ryokuen-rengo-natsumatsuri',
    name: '緑園連合 夏祭り大会', kind: '夏祭り',
    organizer: '緑園連合自治会', venue: '緑園地区', scale: '地区',
    dates: ['2025-08-23'], year: 2025,
    note: '2025年の実績。2026年の日程は未発表', source: src('izumi') },

  // --- 瀬谷区 ---
  { ward: '瀬谷区', wardSlug: 'seya', slug: 'tanabata-toro-matsuri',
    name: '七夕灯篭祭り', kind: '夏祭り',
    venue: '三ツ境駅南口〜長屋門公園周辺、阿久和向原第二公園', scale: '地区',
    dates: ['2026-07-04', '2026-07-05'], start: '18:30', end: '20:30',
    tags: ['灯籠流し'], note: '点灯は18:30〜20:30', source: src('seya') },
];

emit(ROWS, {
  pref: '神奈川県', city: '横浜市',
  prefSlug: 'kanagawa', citySlug: 'yokohama',
  label: '横浜市（区別ページ）',
  sourceName: '神奈川すまいラボ',
  checkedAt: '2026-08-02',
  year: 2026,
});
