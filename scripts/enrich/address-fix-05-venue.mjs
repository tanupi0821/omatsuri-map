/**
 * 壊れた会場名・住所を直す その4（取り込みで新しく入ってきたぶん）
 *
 *   node scripts/enrich/address-fix-05-venue.mjs
 *
 * 記事が増えるたびに同じ壊れ方が入ってくる。ここで直すのは4種類。
 *
 * - **会場名が記事の地の文の断片**（「感」の1文字）… fukuoka-leapup は
 *   同じ媒体で2件目。この媒体は会場名の切り出しが安定しない
 * - **市区町村の直後がいきなり番地**（`神戸市長田区1-1`）… 町名が抜けていて
 *   地図が別の場所に落ちる
 * - **会場名がそのまま住所**（`宮古島市平良西里301`）… 施設名が入っていない
 */
import { patchAll } from '../import/_lib.mjs';

const CHECKED = '2026-08-06';

patchAll([
  // おおはしヒル夏まつり。会場名が「感」の1文字だった。
  // 同じ会場（OHASHI HILL）の別のレコードと同じ直し方
  ['fukuoka-019-gotouti-fukuoka-leapup-84206', {
    station: '西鉄天神大牟田線 大橋駅',
    venue: { name: 'OHASHI HILL', address: '福岡市南区大橋1-3-3' },
    occurrence: {
      year: 2026, checked_at: CHECKED,
      note: '会場名が「感」の1文字だけになっていたので直した。会場のOHASHI HILLは福岡市南区大橋',
    },
  }],

  // 星の盆祭り（鉄人広場）。住所が `神戸市長田区1-1` と町名が抜けていた。
  // 鉄人広場は若松公園の中にある
  ['hyogo-008-gotouti-kobe-journal-324328', {
    station: 'JR・地下鉄 新長田駅',
    venue: { name: '鉄人広場（若松公園）', address: '神戸市長田区若松町6丁目' },
    occurrence: {
      year: 2026, checked_at: CHECKED,
      note: '住所が「神戸市長田区1-1」と町名が抜けており、地図が別の場所に落ちる状態だった。会場の鉄人広場は若松公園の中',
    },
  }],

  // みゃーくずみ縁日（宮古島夏まつりに合わせた野外店）。
  // 会場名が住所そのものだった
  ...['okinawa-701-gotouti-myakuzumi-151029', 'okinawa-701-gotouti-myakuzumi-152061'].map((id) => [id, {
    venue: { name: 'みゃーくずみ野外店（西里通り交差点）', address: '宮古島市平良西里301' },
    occurrence: {
      year: 2026, checked_at: CHECKED,
      note: '会場名が住所そのものになっていた。宮古島夏まつり（15:00〜21:00）の開催時間に合わせて営業する野外店',
    },
  }]),

  // 上池袋さくら公園の納涼盆踊り大会。会場名が住所そのものだった
  ['toshima-gotouti-ikebukuro-times-191192', {
    venue: { name: '上池袋さくら公園', address: '豊島区上池袋2-45-15' },
    occurrence: {
      year: 2026,
      dates: ['2026-07-10', '2026-07-11'],
      start_time: '19:00',
      end_time: '21:00',
      status: 'confirmed',
      checked_at: CHECKED,
      note: '7月10日（金）・11日（土）19:00〜21:00、雨天順延（1日のみ）。会場名が住所そのものになっていたので公園名にした',
    },
  }],
], '壊れた会場名・住所を直す（4）');
