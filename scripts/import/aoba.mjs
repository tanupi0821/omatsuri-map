/**
 * 青葉区インポーター
 *
 * 出典: 号外NET 横浜市緑区・青葉区
 *       「【2026年最新】横浜市青葉区の夏祭り・盆踊り・秋祭り日程まとめ」
 *       https://yokohamamidori-aoba.goguynet.jp/2026/07/17/aobaku-summer-festival/
 *
 * 横浜18区のなかで、区単位のまとめが出る数少ない区。
 */
import { emit } from './_lib.mjs';

const ROWS = [
  { slug: 'shiratoridai-furusato-natsumatsuri', name: 'しらとり台 ふるさと夏祭り（第20回）', kind: '夏祭り',
    organizer: 'しらとり台自治会', venue: 'しらとり台第二公園（富士公園）',
    dates: ['2026-07-18', '2026-07-19'], start: '15:00', end: '20:00',
    note: '18日は15:00〜20:00、19日は15:00〜19:30' },

  { slug: 'ichigao-summer-festival', name: 'サマーふぇすてぃばる・いちがお 2026（第27回）', kind: '商店街',
    organizer: '市ヶ尾商栄会', venue: '西友市が尾店 お客様駐車場', scale: '地区',
    dates: ['2026-07-18'], start: '15:00', end: '21:00' },

  { slug: 'shinishikawa-shimoya-yusuzumi', name: '新石川下谷自治会 夕涼み会', kind: '納涼祭',
    organizer: '新石川下谷自治会', venue: '新石川小学校',
    dates: ['2026-07-18'], start: '16:30', end: '20:30' },

  { slug: 'tamaplaza-natsumatsuri', name: 'たまプラーザ夏まつり（2026たまプラーザサマー・フェスティバル）', kind: '商店街',
    venue: 'たまプラーザ テラス、駅前通り商店会、中央通り商店街、東急百貨店', scale: '地区',
    dates: ['2026-07-25', '2026-07-26'] },

  { slug: 'tamaplaza-summer-festival-15', name: 'たまプラーザ サマーフェスティバル 2026（第15回）', kind: '商店街',
    venue: 'たまプラーザ各所', scale: '地区',
    dates: ['2026-07-17', '2026-07-18', '2026-07-19', '2026-07-20', '2026-07-21', '2026-07-22',
      '2026-07-23', '2026-07-24', '2026-07-25', '2026-07-26'],
    note: '7/17〜26の期間開催' },

  { slug: 'kamiyamoto-chiku-natsumatsuri', name: '上谷本地区夏祭り', kind: '夏祭り',
    organizer: '上谷本連合町内会', venue: 'もえぎ野小学校 校庭', scale: '地区',
    dates: ['2026-07-25'], start: '17:00', end: '20:00' },

  { slug: 'kamiichigao-bonodori', name: '上市ヶ尾町内会 盆踊り大会', kind: '盆踊り',
    organizer: '上市ヶ尾町内会', venue: '市ヶ尾第一公園',
    dates: ['2026-08-01'], start: '16:00' },

  { slug: 'obacho-noryo-bonodori', name: '大場町納涼盆踊り大会', kind: '盆踊り',
    venue: '大場かやのき公園 多目的広場',
    dates: ['2026-08-01'], start: '17:00', end: '21:00' },

  { slug: 'akanedai-natsumatsuri', name: 'あかね台夏祭り（第30回）', kind: '夏祭り',
    venue: 'あかね台熊の谷公園',
    dates: ['2026-08-01'], start: '17:00', end: '20:30' },

  { slug: 'sakuradai-natsumatsuri', name: '桜台夏まつり', kind: '夏祭り',
    organizer: '桜台自治会', venue: '桜台中央グランド',
    dates: ['2026-08-29'], start: '16:00', end: '21:00' },

  { slug: 'umegaoka-matsuri', name: '梅が丘まつり', kind: '秋祭り',
    organizer: '梅が丘自治会', venue: '梅が丘（会場は出典に記載なし）',
    dates: ['2026-09-05', '2026-09-06'] },

  { slug: 'utsukushigaoka-bonodori', name: '美しが丘盆踊り大会 2026', kind: '盆踊り',
    organizer: '美しが丘連合自治会', venue: '美しが丘公園', scale: '地区',
    dates: ['2026-09-26', '2026-09-27'],
    note: '2026年は酷暑を避けて9月末の開催' },

  { slug: 'azamino-matsuri', name: 'あざみ野まつり（第37回）', kind: '秋祭り',
    venue: '小学校予定地', address: 'あざみ野1-15', scale: '地区',
    dates: ['2026-10-24'] },
];

emit(ROWS, {
  pref: '神奈川県', city: '横浜市', ward: '青葉区',
  prefSlug: 'kanagawa', citySlug: 'yokohama', wardSlug: 'aoba',
  source: 'https://yokohamamidori-aoba.goguynet.jp/2026/07/17/aobaku-summer-festival/',
  sourceName: '号外NET 横浜市緑区・青葉区',
  checkedAt: '2026-08-02',
  year: 2026,
});
