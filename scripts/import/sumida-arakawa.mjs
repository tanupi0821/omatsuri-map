/**
 * 墨田区・荒川区の祭り
 *
 * 出典:
 *  - すみだデスク「【墨田区】夏祭り・盆踊り2026」https://sumida-media.tokyo.jp/archives/1023
 *  - 荒川区「町会・自治会の夏の催し」PDF
 *    https://www.city.arakawa.tokyo.jp/documents/45496/20260721_08.pdf
 *
 * 荒川区は区が町会単位の一覧を出しているが、**PDF が画像で作られていて
 * テキストが取れない**（pdfjs でも 16 行しか出ない）。OCR が要る。
 * ここに入れているのは検索結果に本文が現れた 1 件だけ。残りは未取得。
 */
import { emit } from './_lib.mjs';

const SUMIDA = 'https://sumida-media.tokyo.jp/archives/1023';
const ARAKAWA = 'https://www.city.arakawa.tokyo.jp/documents/45496/20260721_08.pdf';

emit([
  { slug: 'sumidagawa-hanabi', name: '隅田川花火大会', kind: '花火',
    venue: '隅田川沿い（第一・第二会場）', scale: '区', station: '浅草',
    stalls: 'yes', tags: ['花火'],
    dates: ['2026-07-25'], start: '19:00' },
  { slug: 'kinshicho-kawachi-ondo', name: 'すみだ錦糸町河内音頭大盆踊り（第44回）', kind: '盆踊り',
    venue: '竪川親水公園 特設会場', scale: '区', station: '錦糸町',
    stalls: 'yes',
    dates: ['2026-07-29', '2026-07-30'], start: '17:30', end: '21:00' },
  { slug: 'sumida-kumin-minyo', name: '墨田区民納涼民踊大会', kind: '盆踊り',
    organizer: '墨田区', venue: '東京スカイツリータウン ソラマチひろば', scale: '区',
    station: 'とうきょうスカイツリー',
    dates: ['2026-08-01', '2026-08-02', '2026-08-03'], start: '18:00', end: '20:00' },
  { slug: 'solamachi-natsumatsuri', name: '東京ソラマチ夏まつり', kind: '夏祭り',
    venue: 'ソラマチひろば・1階ソラマチ商店街', scale: '区',
    station: 'とうきょうスカイツリー', stalls: 'yes',
    dates: ['2026-08-01', '2026-08-02', '2026-08-03'], start: '12:00', end: '21:00' },
], {
  pref: '東京都', city: '墨田区',
  prefSlug: 'tokyo', citySlug: 'sumida',
  label: '墨田区（地域メディア）',
  source: SUMIDA, sourceName: 'すみだデスク', sourceType: 'media',
  checkedAt: '2026-08-03', year: 2026,
});

emit([
  { slug: 'minamisenju-higashinippori-1minami', name: '南千住・東日暮里一丁目南町会 盆踊り',
    kind: '盆踊り',
    organizer: '南千住・東日暮里一丁目南町会', venue: '第六瑞光小学校 校庭',
    scale: '町内会',
    dates: ['2026-07-26'], start: '19:00', end: '21:00' },
], {
  pref: '東京都', city: '荒川区',
  prefSlug: 'tokyo', citySlug: 'arakawa',
  label: '荒川区（区公式）',
  source: ARAKAWA, sourceName: '荒川区 町会・自治会の夏の催し', sourceType: 'gov',
  checkedAt: '2026-08-03', year: 2026,
});
