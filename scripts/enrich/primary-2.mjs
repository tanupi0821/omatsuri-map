/**
 * 一次情報での裏取り（第2弾：主催者・町内会・実行委員会の公式サイト）
 *
 *   node scripts/enrich/primary-2.mjs
 *
 * この作業で分かったこと:
 *  - 花の台町内会（宮前区）の公式サイトに「8/2は雷雨予報のため盆踊り中止」の告知。
 *    まとめサイトは中止まで追わない。町内会の公式を見にいって初めて分かる類。
 *  - 「関内まつり」は厳島神社の例大祭そのものではなく、関内地区連合町内会が主催する
 *    まちの祭り。まとめサイトの「関内まつり（厳島神社例大祭）」という表記は不正確だった。
 *  - 金沢区は区の行事カレンダーが宵宮／本祭を分けて時間まで出している。
 */
import { patchAll } from '../import/_lib.mjs';

const CHECKED = '2026-08-02';
const KANAZAWA_CAL = 'https://page.yokohama/wp/festival-calendar/';

patchAll([
  // -----------------------------------------------------------------------
  // 【中止情報】町内会の公式告知でしか分からないもの
  // -----------------------------------------------------------------------
  ['miyamae-hananodai-bonodori', {
    occurrence: {
      year: 2026,
      dates: ['2026-08-01'],
      start_time: '17:30',
      end_time: '20:30',
      status: 'confirmed',
      note: '当初は8/1・8/2の2日間の予定だったが、8/2は雷雨予報のため中止と町内会が告知。模擬店は16:00から。子どもたちは6月から毎週土日の夕方に太鼓の練習をしている',
      source_url: 'https://hananodai.localinfo.jp/',
      source_name: '花の台町内会 公式サイト',
      source_type: 'official',
      checked_at: CHECKED,
    },
  }],

  // -----------------------------------------------------------------------
  // 出典を主催者の公式に差し替え
  // -----------------------------------------------------------------------
  ['izumi-suga-jinja-reitaisai', {
    links: ['https://www.izumi-sugajinja.jp/'],
    occurrence: {
      year: 2026,
      dates: ['2026-07-25', '2026-07-26'],
      status: 'confirmed',
      note: '7/25（宵宮）14:00〜 御霊遷しの儀（境内）、17:00〜20:00 奉納演芸。7/26（本宮）13:00 式典、14:00 車両渡御出発、17:00 神輿出発式、19:30 宮入。渡御ルートは台谷戸神酒所→中村神酒所→いずみ中央駅→神社',
      source_url: 'https://www.izumi-sugajinja.jp/?p=921',
      source_name: '須賀神社 公式',
      source_type: 'official',
      checked_at: CHECKED,
    },
  }],

  ['naka-kannai-matsuri', {
    // 厳島神社の例大祭そのものではないので名前を直す
    name: '関内まつり',
    kind: '夏祭り',
    organizer: '関内地区連合町内会',
    shrine: null,
    links: ['https://www.kannai-matsuri.jp/'],
    tags: ['神輿', '縁日', '子ども向け'],
    occurrence: {
      year: 2026,
      dates: ['2026-07-25'],
      start_time: '16:00',
      end_time: '18:30',
      status: 'confirmed',
      note: '縁日こども広場（りそな銀行前）16:30〜18:00、関内神輿巡行（馬車道商店街ほか）17:30〜18:30、タヒチアンダンスショー。主催は常盤町・住吉町・相生町・太田町・弁天通の各町内会など8団体',
      source_url: 'https://www.kannai-matsuri.jp/',
      source_name: '関内まつり 公式',
      source_type: 'official',
      checked_at: CHECKED,
    },
  }],

  ['kohoku-shin-yokohama-bonodori', {
    name: '新横浜 盆おどり（第24回）',
    organizer: '新横浜町内会（3町内会合同）',
    venue: { name: '新横浜駅前広場' },
    links: ['https://shinyokohama.info/'],
    occurrence: {
      year: 2026,
      dates: ['2026-07-24', '2026-07-25'],
      status: 'confirmed',
      source_url: 'https://shinyokohama.info/',
      source_name: '新横浜町内会 公式サイト',
      source_type: 'official',
      checked_at: CHECKED,
    },
  }],

  ['hodogaya-hoshikawa-sugiyama-nagoshisai', {
    links: ['https://www.sugiyamajinja.or.jp/'],
    recurrence: '6月末（夏越大祓は6月30日）',
    recurrence_source: 'https://www.sugiyamajinja.or.jp/',
    occurrence: {
      year: 2026,
      dates: ['2026-06-27', '2026-06-28', '2026-06-30'],
      status: 'confirmed',
      note: '6/27 10:00〜12:00 大祓詞の書写の会、13:00〜17:30 スギマロ駄菓子屋、17:00〜19:00 小さな花火大会、18:00〜 宵宮祭。6/28 10:00〜12:30 神葬祭の講座、12:00〜 夏越祭。6/30 17:00〜 夏越大祓神事。茅の輪は6/25頃〜7/7頃',
      source_url: 'https://www.townnews.co.jp/0115/2026/06/18/841047.html',
      source_name: 'タウンニュース 保土ケ谷区版',
      source_type: 'media',
      checked_at: CHECKED,
    },
  }],

  // -----------------------------------------------------------------------
  // 金沢区の神社：宵宮と本祭それぞれの時間を区の行事カレンダーから補う
  // -----------------------------------------------------------------------
  ['kanazawa-nojima-inari-reitaisai', {
    name: '野島神社 例大祭',
    occurrence: {
      year: 2026, dates: ['2026-07-11', '2026-07-12'],
      start_time: '17:00', end_time: '20:00', status: 'confirmed',
      note: '7/11 宵宮 17:00〜19:00（万燈神輿）、7/12 本祭 12:00〜20:00',
      source_url: KANAZAWA_CAL, source_name: '横浜市金沢区 行事カレンダー',
      source_type: 'media', checked_at: CHECKED,
    },
  }],

  ['kanazawa-susaki-jinja-reitaisai', {
    occurrence: {
      year: 2026, dates: ['2026-07-11', '2026-07-12'],
      start_time: '18:30', end_time: '20:00', status: 'confirmed',
      note: '7/11 宵宮 18:30〜20:30（万燈神輿）、7/12 本祭 12:30〜20:00',
      source_url: KANAZAWA_CAL, source_name: '横浜市金沢区 行事カレンダー',
      source_type: 'media', checked_at: CHECKED,
    },
  }],

  ['kanazawa-machiya-jinja-reitaisai', {
    occurrence: {
      year: 2026, dates: ['2026-07-18', '2026-07-19'],
      start_time: '19:00', end_time: '19:00', status: 'confirmed',
      note: '7/18 宵宮 19:00〜、7/19 本祭 13:30〜19:00',
      source_url: KANAZAWA_CAL, source_name: '横浜市金沢区 行事カレンダー',
      source_type: 'media', checked_at: CHECKED,
    },
  }],

  ['kanazawa-tego-jinja-reitaisai', {
    occurrence: {
      year: 2026, dates: ['2026-07-18', '2026-07-19'],
      start_time: '09:00', status: 'confirmed',
      note: '7/18 宵宮 9:00〜、7/19 本祭',
      source_url: KANAZAWA_CAL, source_name: '横浜市金沢区 行事カレンダー',
      source_type: 'media', checked_at: CHECKED,
    },
  }],

  ['kanazawa-hachiman-jinja-reitaisai', {
    occurrence: {
      year: 2026, dates: ['2026-07-18', '2026-07-19'],
      start_time: '16:00', end_time: '19:00', status: 'confirmed',
      note: '7/18 宵宮 16:00〜22:00、7/19 本祭 14:00〜19:00',
      source_url: KANAZAWA_CAL, source_name: '横浜市金沢区 行事カレンダー',
      source_type: 'media', checked_at: CHECKED,
    },
  }],

  ['kanazawa-kumano-jinja-reitaisai', {
    occurrence: {
      year: 2026, dates: ['2026-07-25', '2026-07-26'],
      start_time: '15:00', end_time: '19:00', status: 'confirmed',
      note: '7/25 宵宮 15:00〜21:00、7/26 本祭 15:00〜19:00',
      source_url: KANAZAWA_CAL, source_name: '横浜市金沢区 行事カレンダー',
      source_type: 'media', checked_at: CHECKED,
    },
  }],
], '一次情報での裏取り（主催者・町内会）');
