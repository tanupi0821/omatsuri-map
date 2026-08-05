/**
 * 一次情報での裏取り（第1弾：神社・寺・自治会の公式サイト）
 *
 * まとめサイト経由で入れたデータを、神社や主催者の公式発表で置き換える。
 * emit() と違ってこちらは意図的に上書きする。出典の格を上げる操作だから。
 *
 *   node scripts/enrich/shrines.mjs
 *
 * この作業で分かったこと（重要）:
 *  - 川崎山王祭は2026年から開催が8月→6月に変わっていた。まとめサイト経由で入れた
 *    8/1〜8/3 は「前年までの日程」で、完全な誤情報だった。神社の公式ページで発覚。
 *  - 神奈川県神社庁は県内全神社の「例祭日」をルールの形（10月第1日曜日、など）で
 *    公開している。今年の日程が未発表でも例祭日のルールは出せる。
 */
import { patchAll } from '../import/_lib.mjs';

const CHECKED = '2026-08-02';
const JINJACHO = 'https://www.kanagawa-jinja.or.jp/';

patchAll([
  // -----------------------------------------------------------------------
  // 【要修正】川崎山王祭：2026年から6月開催に変更されていた
  // -----------------------------------------------------------------------
  ['kawasakiku-kawasaki-sanno-matsuri', {
    name: '川崎山王祭（稲毛神社例大祭）',
    links: ['https://www.takemikatsuchi.net/schedulelist/sannousai/'],
    tags: ['神輿', '屋台', '県指定無形民俗文化財'],
    recurrence: '6月15日（2026年から、猛暑を避けて8月開催より変更）',
    recurrence_source: 'https://www.takemikatsuchi.net/',
    occurrence: {
      year: 2026,
      dates: ['2026-06-14', '2026-06-15', '2026-06-20', '2026-06-21'],
      start_time: null,
      end_time: null,
      status: 'confirmed',
      note: '6/14 18:00 宵宮祭、6/15 10:00 山王祭・14:00 古式宮座式（県指定無形民俗文化財）、6/20 12:45〜15:10頃 町内みこし連合渡御、6/21 6:30〜20:00 神幸祭（孔雀・玉の大神輿が23町内を渡御）、6/21 17:10〜19:00頃 山王ふぇすてぃばる（市役所通りのパレード）',
      source_url: 'https://www.takemikatsuchi.net/%E5%B7%9D%E5%B4%8E%E5%B1%B1%E7%8E%8B%E7%A5%AD%EF%BC%886-14-6-21%EF%BC%89/',
      source_name: '川崎山王社 稲毛神社 公式',
      source_type: 'official',
      checked_at: CHECKED,
    },
  }],

  // -----------------------------------------------------------------------
  // 出典の格上げ・情報の補強
  // -----------------------------------------------------------------------
  ['tsurumi-sojiji-mitama-bonodori', {
    name: '大本山總持寺 み霊祭り 納涼盆踊り大会（第79回）',
    organizer: '大本山總持寺三松会',
    tags: ['屋台', '万灯供養'],
    links: ['https://www.sojiji.jp/'],
    occurrence: {
      year: 2026,
      dates: ['2026-07-17', '2026-07-18', '2026-07-19'],
      start_time: '17:30',
      end_time: '20:30',
      status: 'confirmed',
      note: '第79回。万灯供養は7/17・18の17:00〜20:00（向唐門付近）、法要は7/18 17:00〜。横浜大空襲と鶴見事故の慰霊が起こり',
      source_url: 'https://tsurumi-watchers.com/2026-mitama/',
      source_name: 'つるみウォッチャーズ',
      source_type: 'media',
      checked_at: CHECKED,
    },
  }],

  ['naka-honmoku-omanagashi', {
    name: '本牧神社 例祭・お馬流し（第461回）',
    organizer: '本牧神社',
    tags: ['神輿', '県指定無形民俗文化財'],
    links: ['https://honmoku.or.jp/'],
    occurrence: {
      year: 2026,
      dates: ['2026-07-31', '2026-08-01', '2026-08-02'],
      status: 'confirmed',
      note: '第461回。創始1566年と伝わる特殊神事で、地域の災厄を「お馬さま」に託して本牧の沖合に流す。神奈川県指定無形民俗文化財。全17カ町の神輿渡御あり',
      source_url: 'https://www.townnews.co.jp/0113/2026/07/16/844752.html',
      source_name: 'タウンニュース 中区・西区・南区版',
      source_type: 'media',
      checked_at: CHECKED,
    },
  }],

  // -----------------------------------------------------------------------
  // 例祭日のルールを神社庁・神社公式から補う
  // （今年の日程が未発表でも「毎年いつごろか」は出せる）
  // -----------------------------------------------------------------------
  ['miyamae-sugao-jinja-reitaisai-nagasawa', {
    recurrence: '10月第1日曜日',
    recurrence_source: `${JINJACHO}shrine/1201046-000/`,
    links: ['https://nagasawa-jichikai.org/sugao-jinja/'],
    occurrence: {
      year: 2025,
      dates: ['2025-10-04', '2025-10-05'],
      status: 'confirmed',
      note: '10/4 8:00 菅生神社境内で御神輿・御太鼓（山車）お祓い、9:00 長沢自治会館に神酒所開設、13:00頃 宮太鼓神酒所着、14:30〜21:00 演芸大会。10/5 8:00 宮出し、13:30 長沢子ども会神輿巡行、17:30 宮入り',
      source_url: 'https://nagasawa-jichikai.org/sugao-jinja/',
      source_name: '長沢自治会 公式サイト',
      source_type: 'official',
      checked_at: CHECKED,
    },
  }],

  ['miyamae-sugao-jinja-reitaisai-sugaodai', {
    recurrence: '10月第1日曜日',
    recurrence_source: `${JINJACHO}shrine/1201046-000/`,
  }],

  ['miyamae-sugao-jinja-reitaisai-hiebara', {
    recurrence: '10月第1日曜日',
    recurrence_source: `${JINJACHO}shrine/1201046-000/`,
  }],

  ['nakahara-shinjo-jinja-bonodori', {
    links: [`${JINJACHO}shrine/1201044-000/`],
    venue: { address: '川崎市中原区新城中町4-14' },
  }],

  ['totsuka-tomizuka-hachimangu-reitaisai', {
    recurrence: '8月第1日曜日',
    recurrence_source: 'https://www.totsuka-pallso.jp/mailmagazine/yado/44.html',
  }],
], '一次情報での裏取り（神社・自治会）');
