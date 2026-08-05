/**
 * 葛飾区の祭りの屋台の有無（区公式PDFの備考欄から）
 *
 *   node scripts/enrich/stalls-katsushika.mjs
 *
 * 出典: 葛飾区「令和8年度 夏まつり・盆踊り・イベント情報」PDF
 *       https://www.city.katsushika.lg.jp/_res/projects/default_project/_page_/001/028/707/080731.pdf
 *
 * この PDF には「備考」欄があり、「模擬店あり（ラムネ、かき氷、綿あめ、焼きそば等）」
 * のように出店の有無がはっきり書かれている。取り込み時に備考を要約してしまい
 * この情報を落としていたので、原文から拾い直して stalls を確定させる。
 *
 * 備考に出店の記載が無いものは unknown のまま。「記載がない＝出ない」ではない。
 */
import { patchAll } from '../import/_lib.mjs';

const yes = { stalls: 'yes' };

patchAll([
  ['katsushika-katsushika-kameari-5nishi', yes],          // 模擬店あり（焼きそば、かき氷、ジュース、ビール等）
  ['katsushika-katsushika-nishimizumoto-iizuka-shin', yes],
  ['katsushika-katsushika-horikiri-6', yes],              // 模擬店あり（すいか割り、綿あめ、ヨーヨーつり等）
  ['katsushika-katsushika-mizumoto-sarumachi-higashi', yes], // 屋台：17時頃〜21時
  ['katsushika-katsushika-kameari-1minami', yes],         // 模擬店あり（やきそば、焼鳥、かき氷）
  ['katsushika-katsushika-togokai-lilio', yes],           // 両町会・子ども会の模擬店（18時から）
  ['katsushika-katsushika-yotsugi-3-wakamiya', yes],
  ['katsushika-katsushika-nishimizumoto-iriya', yes],
  ['katsushika-katsushika-nishikosuge-furusato', yes],    // 模擬店あり（金魚すくい、焼きそば等多数）
  ['katsushika-katsushika-nishikameari-2-tokiwa', yes],   // 模擬店あり（焼きそば、かき氷他）
  ['katsushika-katsushika-mizumoto-koai-shinmachi', yes], // 模擬店あり（かき氷、ゲーム、ワッフルなど）
  ['katsushika-katsushika-kosuge-higashi', yes],
  ['katsushika-katsushika-mizumoto-iriya', yes],
  ['katsushika-katsushika-proud-city-kanamachi', yes],    // 模擬店あり（ストラックアウト、キッチンカーなど）
  ['katsushika-katsushika-takaramachi', yes],             // 模擬店あり
  ['katsushika-katsushika-higashikanamachi-handa', yes],  // 模擬店あり（かき氷、ジュース等）
  ['katsushika-katsushika-mizumoto-shimote', yes],        // 模擬店あり（フランク、くじ）
  ['katsushika-katsushika-shinohara', yes],
  ['katsushika-katsushika-kameari-4', yes],               // 模擬店あり
  ['katsushika-katsushika-maetsukai', yes],               // 模擬店あり（かき氷50円、当てくじ100円 他）
  ['katsushika-katsushika-sumiyoshi-takasago-kita', yes], // 本格的夜店20件以上が出店
  ['katsushika-katsushika-shinsakae', yes],
  ['katsushika-katsushika-kosuge-4', yes],
  ['katsushika-katsushika-nishikameari-2', yes],          // 模擬店あり（やきそば、フランク、かき氷等）
  ['katsushika-katsushika-mizumoto-miyamae', yes],        // 模擬店あり（宮前子ども会の模擬店）
  ['katsushika-katsushika-yotsugi-1', yes],
  ['katsushika-katsushika-higashimizumoto-1', yes],       // 模擬店あり（フランクフルト、かき氷等）
  ['katsushika-katsushika-tsubasa-kodomokai', yes],
  ['katsushika-katsushika-shibamata-kitano', yes],        // 北野小学校PTAの協力で18時30分から模擬店
  ['katsushika-katsushika-kanamachi-2danchi', yes],
  ['katsushika-katsushika-satsuki', yes],                 // 模擬店あり（やきそば、やきとり、かき氷、飲物）
  ['katsushika-katsushika-iizuka-kodomokai', yes],
  ['katsushika-katsushika-shibue-higashi', yes],          // 模擬店あり
  ['katsushika-katsushika-mizumoto-koaikami', yes],
  ['katsushika-katsushika-yotsugi-5', yes],
  ['katsushika-katsushika-omagari', yes],                 // 模擬店あり（ドリンク、焼きそば他）
  ['katsushika-katsushika-mizumoto-chuo', yes],           // 子ども会が出店予定
  ['katsushika-katsushika-shiratori-higashi', yes],
  ['katsushika-katsushika-kanamachi-1danchi', yes],       // 模擬店あり（アイス、飲料、おいなりさん他）
  ['katsushika-katsushika-vinasis-kanamachi', yes],       // 模擬店あり（綿あめ、ポップコーン、かき氷）
  ['katsushika-katsushika-garden-plaza-shibamata', yes],  // 模擬店あり（ゲーム、飲料）
  ['katsushika-katsushika-horikiri-7', yes],              // 模擬店あり（焼きそば、かき氷、わたあめ他）／屋台あり
  ['katsushika-katsushika-nishikameari-4', yes],
  ['katsushika-katsushika-shinjuku-5', yes],              // 模擬店あり（フランクフルト、お菓子、焼きそば等）
], '葛飾区の屋台の有無（区公式PDFの備考欄から）');
