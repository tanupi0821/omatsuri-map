/**
 * 一次情報での裏取り（第48弾：小樽市の神社例大祭・潮まつりを一覧ページでまとめて直す）
 *
 *   node scripts/enrich/primary-hanabi-48.mjs
 *
 * **小樽観光協会が「令和8年度 小樽市内 神社の例大祭情報（一覧）」を出していた。**
 * 17社の例大祭が、神社名・開催日・住所つきで1ページに並んでいる。
 * 伊東観光協会の花火一覧（第44弾）と同じ型で、**自治体・観光協会の
 * 「今年の祭り一覧」ページは1本で何件も片付く**。まずこれを探すのが速い。
 *
 * ここで分かったこと:
 *
 * - 招魂祭は**5月15日の1日だけ**。データにあった5月10日は誤り
 * - 龍宮神社・住吉神社の例大祭は**3日間**なのに、データは初日しか持っていなかった
 * - 号外NET・小樽ジャーナル由来の記事は、**記事の公開日が開催日として
 *   入り込んでいる**ものがある（潮まつりの記事に6月4日・7月6日が入っていた）。
 *   これは日付の取りこぼしではなく、取り込みの誤り
 *
 * 大花火大会は潮まつりの3日間のうち**最終日だけ**なので、祭り本体と分けて書く。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

const everyDay = (from, to) => {
  const out = [];
  for (let d = new Date(from); d <= new Date(to); d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

// 小樽市内の神社例大祭は、この一覧ページが出典
const REIDAISAI = 'https://otaru.gr.jp/citizen/2026-shrine-festival';
const reidaisai = (shrine, address, dates, note) => ({
  shrine,
  venue: { name: shrine, address },
  links: [L('おたるぽーたる（小樽観光協会）令和8年度 小樽市内 神社の例大祭情報（一覧）', REIDAISAI)],
  occurrence: {
    ...src(2026, REIDAISAI, '小樽観光協会', 'official'),
    dates,
    status: 'confirmed',
    note,
  },
});

// おたる潮まつりは複数の記事から重複して取り込まれているので、同じ内容を配る
const USHIO = 'https://otaru.ushiomatsuri.net/2026';
const ushio = (extra) => ({
  organizer: 'おたる潮まつり実行委員会',
  station: 'JR函館本線 小樽駅',
  venue: { name: '小樽港第3号ふ頭基部および市内中心部', address: '小樽市港町' },
  links: [
    L('おたる潮まつり公式サイト 開催情報（2026年）', USHIO),
    L('おたるぽーたる（小樽観光協会）第60回おたる潮まつり', 'https://otaru.gr.jp/event/ushiomaturi2026'),
  ],
  occurrence: {
    ...src(2026, USHIO, 'おたる潮まつり実行委員会', 'official'),
    status: 'confirmed',
    ...extra,
  },
});
const USHIO_DAYS = ['2026-07-24', '2026-07-25', '2026-07-26'];
const USHIO_NOTE = '7月24日（金）〜26日（日）の3日間。第60回の記念大会でテーマは「60年目の潮 さあ、港を熱くしろ！」。大花火大会は最終日26日の20:00〜20:30';

patchAll([
  // ------------------------------------------------------------------
  // 小樽市・神社の例大祭
  // ------------------------------------------------------------------

  // 招魂祭 例大祭。**5月15日の1日だけ**。データにあった5月10日は誤り。
  // 郷土の発展に尽くした物故者を慰霊する祭りで、小樽市内で一番早い
  ['hokkaido-002-gotouti-otaru-gr-407792', {
    venue: { name: '小樽公園 顕誠塔前広場', address: '小樽市花園5丁目' },
    links: [L('おたるぽーたる（小樽観光協会）令和8年 小樽市内お祭り情報', 'https://otaru.gr.jp/tourist/r8otarusinaiomaturizilyouhou')],
    occurrence: {
      ...src(2026, 'https://otaru.gr.jp/tourist/r8otarusinaiomaturizilyouhou', '小樽観光協会', 'official'),
      dates: ['2026-05-15'],
      start_time: '11:00',
      status: 'confirmed',
      note: '2026年は第81回。5月15日（金）11:00から小樽公園の顕誠塔前広場で。データにあった5月10日は誤りで、開催は1日だけ。小樽市内で一番早い祭り',
    },
  }],

  // 龍宮神社例大祭。**6月20日〜22日の3日間**。データは21日しか持っていなかった
  ['hokkaido-002-gotouti-otaru-gr-414100', reidaisai(
    '龍宮神社', '小樽市稲穂3丁目22-11', everyDay('2026-06-20', '2026-06-22'),
    '6月20日（土）〜22日（月）の3日間。データは21日しか持っていなかった。水天宮・住吉神社とあわせて小樽三大まつりのひとつ',
  )],

  // 水天宮例大祭。日付は元から正しかったので、社号と住所だけ確かにする
  ['hokkaido-002-gotouti-otaru-gr-414170', reidaisai(
    '水天宮', '小樽市相生町3-1', everyDay('2026-06-14', '2026-06-16'),
    '6月14日（日）〜16日（火）の3日間。小樽三大まつりのひとつ',
  )],

  // 住吉神社例大祭。**7月14日〜16日の3日間**。データは14日しか持っていなかった
  ['hokkaido-002-gotouti-otaru-journal-125502', reidaisai(
    '住吉神社', '小樽市住ノ江2丁目5-1', everyDay('2026-07-14', '2026-07-16'),
    '7月14日（火）〜16日（木）の3日間。データは14日しか持っていなかった。小樽三大まつりのひとつ',
  )],

  // ------------------------------------------------------------------
  // 小樽市・第60回おたる潮まつり（同じ祭りが複数記事から重複して入っている）
  // ------------------------------------------------------------------

  ...[
    'hokkaido-002-gotouti-otaru-gr-425614',
    'hokkaido-002-gotouti-otaru-gr-425618',
    'hokkaido-002-gotouti-otaru-gr-426179',
    'hokkaido-002-gotouti-otaru-gr-426480',
    'hokkaido-002-gotouti-otaru-journal-125725',
    'hokkaido-002-summer-ar0101e74357',
  ].map((id) => [id, ushio({ dates: USHIO_DAYS, note: USHIO_NOTE })]),

  // 記事の公開日が開催日として入り込んでいたもの。潮まつりは7月24日〜26日
  ['hokkaido-002-gotouti-otaru-journal-124526', ushio({
    dates: USHIO_DAYS,
    note: `${USHIO_NOTE}。データにあった6月4日は記事の公開日が開催日として入り込んだもの`,
  })],
  ['hokkaido-002-gotouti-otaru-journal-125295', ushio({
    dates: USHIO_DAYS,
    note: `${USHIO_NOTE}。データにあった7月6日は記事の公開日が開催日として入り込んだもの`,
  })],

  // 大花火大会は潮まつり3日間のうち**最終日26日だけ**
  ['hokkaido-002-gotouti-otaru-gr-427091', ushio({
    dates: ['2026-07-26'],
    start_time: '20:00',
    end_time: '20:30',
    note: '大花火大会は潮まつり3日間の最終日、7月26日（日）20:00〜20:30のみ。データは祭り本体と同じ3日間になっていた',
  })],

  // ------------------------------------------------------------------
  // 埼玉県
  // ------------------------------------------------------------------

  // 第69回 羽生大天白藤まつり。**4月19日から5月5日までの期間**。
  // データは端の2日しか持っていなかった。
  // 羽生市の公式ページは令和7年（前年）のままだったので、
  // 羽生市観光協会（主催・問い合わせ先）のページを出典にする
  ['hanyu-goguynet-17114', {
    organizer: '一般社団法人 羽生市観光協会',
    shrine: '大天白神社',
    venue: { name: '大天白神社（大天白公園）', address: '羽生市中央3-8' },
    links: [L('羽生市観光協会 大天白羽生藤まつり', 'https://hanyu-kanko.jp/event_calendar/event/fujimatsuri/index.html')],
    occurrence: {
      ...src(2026, 'https://hanyu-kanko.jp/event_calendar/event/fujimatsuri/index.html', '羽生市観光協会', 'official'),
      dates: everyDay('2026-04-19', '2026-05-05'),
      status: 'confirmed',
      note: '2026年は第69回。4月19日（日）〜5月5日（火・祝）の期間。公園中央の池の周りに紫と白の藤が約60本。飲食出店は4月19日・25日・26日で、25日は奉納剣道とキャラクター撮影会、26日は奉納芸能と子ども縁日。羽生市の公式ページは令和7年のままだったため観光協会のページを出典にした',
    },
  }],
], '小樽の例大祭・潮まつりほか（13）');
