/**
 * 取り込みの新しい抽出規則との食い違いを検分する（その3：まとめ記事と残り）
 *
 *   node scripts/enrich/primary-hanabi-66.mjs
 *
 * ■ 新規則のいちばん危ない壊れ方：**まとめ記事の中の全部の祭りが同じ日になる**
 *
 * 「【2026年最新】横浜市青葉区の夏祭り・盆踊り・秋祭り日程まとめ」のような
 * **1本の記事に何十件もの祭りが並ぶ記事**では、新規則は記事の先頭で見つけた
 * 日付を、その記事から作られた**全部の祭りに同じように割り当ててしまう**。
 *
 * 実際、青葉区の11件すべてが 7/18・7/19 に、緑区の8件すべてが 7/19 になる。
 * あざみ野まつり（10月）・梅が丘まつり（9月）・中山まつり（11月）まで
 * 7月の同じ日になるので、**これは採用できない。**
 * いまの日付は祭りごとに違っていて、そちらのほうが正しい。
 *
 * 川崎市多摩区・周南エリアのまとめ記事も同じ形で壊れる。
 *
 * → 入口の直しとしては、**1本の記事から複数の祭りを作るときは、
 *   記事全体の日付ではなく、その祭りの見出しの近くの日付だけを見る**必要がある。
 *   近くに無ければ「日付なし」にしたほうが、全件を同じ日にするより害が少ない。
 *
 * ■ もうひとつ：**日付が取れなくなる 5 件**
 *
 * 松戸花火大会（8/1）、幕張ビーチ花火フェスタ（5/19）、
 * わっしょい百万夏まつり（9/19・20）などで、新規則は日付を1つも返さない。
 * **入っていた日付が消えるのは、間違った日付より悪い場合がある**ので採用しない。
 */
import { patchAll } from '../import/_lib.mjs';

const CHECKED = '2026-08-06';

const everyDay = (from, to) => {
  const out = [];
  for (let d = new Date(from); d <= new Date(to); d.setDate(d.getDate() + 1)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
};

// まとめ記事由来。祭りごとに日付が違うので、記事全体から取った日付は当てられない
const ROUNDUP = '出典が「地域の祭りをまとめて紹介する記事」なので、取り込みを読み直すと記事の先頭の日付が全部の祭りに割り当てられてしまう（この記事から作られた祭りが全部同じ日になる）。祭りごとの日付であるいまの値を残した';
const roundup = (id) => [id, { occurrence: { year: 2026, checked_at: CHECKED, note: ROUNDUP } }];

// 日付が取れなくなるもの。消えるより残したほうがよい
const LOST = '取り込みを読み直すと日付が1つも取れなくなる（記事本文に開催日の書き方が無い）。日付が消えるほうが害が大きいので、いまの値を残した';
const lost = (id) => [id, { occurrence: { year: 2026, checked_at: CHECKED, note: LOST } }];

patchAll([
  // ==================================================================
  // 採用しない：まとめ記事由来（横浜市青葉区・緑区、川崎市多摩区、周南エリア）
  // ==================================================================

  ...[
    'aoba-akanedai-natsumatsuri', 'aoba-azamino-matsuri', 'aoba-ichigao-summer-festival',
    'aoba-kamiichigao-bonodori', 'aoba-kamiyamoto-chiku-natsumatsuri', 'aoba-obacho-noryo-bonodori',
    'aoba-sakuradai-natsumatsuri', 'aoba-shinishikawa-shimoya-yusuzumi', 'aoba-tamaplaza-natsumatsuri',
    'aoba-umegaoka-matsuri', 'aoba-utsukushigaoka-bonodori',
    'midori-hachiman-jinja-reitaisai', 'midori-kamoi-bonodori', 'midori-midori-kumin-matsuri',
    'midori-nagatsuta-shotengai-bonodori', 'midori-nakayama-matsuri', 'midori-nakayama-shotengai-bonodori',
    'midori-nakayamacho-bonodori', 'midori-nakayamacho-matsuri',
    'tama-noborito-chubu-bonodori', 'tama-seki-bonodori', 'tama-shiroshita-kodomo-mikoshi',
    'tama-yakumo-jinja-natsumatsuri',
    'yamaguchi-013-goguynet-118284', 'yamaguchi-013-goguynet-119137', 'yamaguchi-013-goguynet-119484',
    'yamaguchi-013-goguynet-119527', 'yamaguchi-013-goguynet-119565',
    'osaka-002-goguynet-41495', 'yokosuka-goguynet-44824', 'iwate-007-goguynet-10582',
  ].map(roundup),

  // ==================================================================
  // 採用しない：日付が取れなくなるもの
  // ==================================================================

  ...[
    'abiko-goguynet-73567', 'mihama-goguynet-27958', 'chiba-001-goguynet-27958',
    'matsudo-goguynet-18494', 'fukuoka-006-goguynet-43004',
  ].map(lost),

  // ==================================================================
  // 採用しない：その他（理由が個別のもの）
  // ==================================================================

  // 第78回 青梅市納涼花火大会。**開催は8月1日**。
  // 読み直すと前売り関係の6/15・6/21・7/4が足される
  ['tokyo-022-goguynet-11588', {
    occurrence: {
      year: 2026, checked_at: CHECKED,
      note: '8月1日開催。取り込みを読み直すと6月15日・6月21日・7月4日が足されるが、いずれも前売り券に関する日付なので採用しない',
    },
  }],

  // 第55回 久留米ほとめき通り商店街 土曜夜市。**毎週土曜**
  ['fukuoka-016-goguynet-58081', {
    occurrence: {
      year: 2026, checked_at: CHECKED,
      note: '6月20日から7月25日まで毎週土曜の夜市。記事の題は「6/20〜7/25」なので、取り込みを読み直すと端の2日に縮んでしまう。開催日を並べたいまの値のほうが正しい（7月11日・18日も本来は開催日）',
    },
  }],

  // 天王洲夏夜祭。題は「7/24(金)・25(土)」で2日
  ['shinagawa-goguynet-127305', {
    occurrence: {
      year: 2026, checked_at: CHECKED,
      note: '7月24日（金）・25日（土）の2日間。取り込みを読み直すと24日だけになるが、題が「・」で2日を並べているので、いまの2日が正しい',
    },
  }],

  // 第19回 関屋浜 海の花火大会
  ['niigata-003-goguynet-44118', {
    occurrence: {
      year: 2026, checked_at: CHECKED,
      note: '7月19日・20日の2日間。取り込みを読み直すと19日だけになるが、いまの2日を残した',
    },
  }],

  // 横浜駐屯地納涼祭
  ['hodogaya-goguynet-37950', {
    occurrence: {
      year: 2026, checked_at: CHECKED,
      note: '7月18日・19日の2日間。取り込みを読み直すと18日だけになるが、いまの2日を残した',
    },
  }],

  // ==================================================================
  // 採用する：新規則のほうが正しいもの
  // ==================================================================

  // 夕すずみ植物園2026 こども縁日。題に「8月21日から3日間開催」
  ['toyama-003-goguynet-24130', {
    occurrence: {
      year: 2026, dates: everyDay('2026-08-21', '2026-08-23'), status: 'confirmed', checked_at: CHECKED,
      note: '8月21日から3日間。データは初日しか持っていなかった',
    },
  }],

  // 水辺で乾杯！利根運河2026 こども縁日
  ['nagareyama-goguynet-82009', {
    occurrence: {
      year: 2026, dates: everyDay('2026-07-03', '2026-07-05'), status: 'confirmed', checked_at: CHECKED,
      note: '7月3日〜5日の3日間。データは初日しか持っていなかった',
    },
  }],

  // 靜岡縣護國神社 万灯みたま祭
  ['shizuoka-016-goguynet-13756', {
    occurrence: {
      year: 2026, dates: everyDay('2026-08-13', '2026-08-15'), status: 'confirmed', checked_at: CHECKED,
      note: '8月13日〜15日の3日間。約1万灯の提灯が並び、花火も上がる。データは初日しか持っていなかった',
    },
  }],

  // アイスフェス＆アジアン夜市 SHIZUOKA 2026（同じ催しが2件に割れている）
  ...['shizuoka-016-goguynet-13408', 'shizuoka-016-goguynet-13701'].map((id) => [id, {
    occurrence: {
      year: 2026, dates: everyDay('2026-07-24', '2026-07-26'), status: 'confirmed', checked_at: CHECKED,
      note: '7月24日〜26日の3日間、駿府城公園で。データは初日しか持っていなかった',
    },
  }]),

  // 第71回 とまこまい港まつり
  ['hokkaido-022-goguynet-57645', {
    occurrence: {
      year: 2026, dates: everyDay('2026-08-07', '2026-08-09'), status: 'confirmed', checked_at: CHECKED,
      note: '8月7日〜9日の3日間。データは初日しか持っていなかった',
    },
  }],

  // 石岡のおまつり（常陸國總社宮大祭）
  ['ishioka-goguynet-34525', {
    occurrence: {
      year: 2026, dates: everyDay('2026-09-19', '2026-09-21'), status: 'confirmed', checked_at: CHECKED,
      note: '9月19日〜21日の3日間。データは初日しか持っていなかった',
    },
  }],

  // 垂井曳軕（ひきやま）まつり
  ['gifu-025-goguynet-45007', {
    occurrence: {
      year: 2026, dates: everyDay('2026-05-02', '2026-05-04'), status: 'confirmed', checked_at: CHECKED,
      note: '5月2日〜4日の3日間。データは初日しか持っていなかった',
    },
  }],

  // 第52回 石橋まつり 大盆踊り大会
  ['osaka-013-goguynet-43614', {
    occurrence: {
      year: 2026, dates: ['2026-07-25', '2026-07-26'], status: 'confirmed', checked_at: CHECKED,
      note: '7月25日・26日の2日間、石橋駅前公園で。データは初日しか持っていなかった',
    },
  }],

  // ゴミNO!!大垣まつりクリーン作戦（大垣まつりは5月9日・10日）
  ['gifu-001-goguynet-45098', {
    occurrence: {
      year: 2026, dates: ['2026-05-09', '2026-05-10'], status: 'confirmed', checked_at: CHECKED,
      note: '大垣まつりに合わせて5月9日・10日の2日間。データは初日しか持っていなかった',
    },
  }],

  // 旭が丘中央公園 夏祭り・盆踊り大会。7月21日は根拠がない
  ['tokyo-002-goguynet-107484', {
    occurrence: {
      year: 2026, dates: ['2026-07-24', '2026-07-25'], status: 'confirmed', checked_at: CHECKED,
      note: '7月24日・25日の2日間。データにあった7月21日は根拠がない',
    },
  }],

  // なかいちちょうかいまつり（十条仲原一丁目）。7月26日は根拠がない
  ['kita-goguynet-64886', {
    occurrence: {
      year: 2026, dates: everyDay('2026-08-07', '2026-08-09'), status: 'confirmed', checked_at: CHECKED,
      note: '8月7日〜9日の3日間。データにあった7月26日は根拠がなく、8日が抜けていた',
    },
  }],

  // たぬきのこども縁日（土山サービスエリア）。8月11日は根拠がない
  ['shiga-006-tsushin-shigamamma-166838', {
    occurrence: {
      year: 2026, dates: everyDay('2026-07-18', '2026-07-20'), status: 'confirmed', checked_at: CHECKED,
      note: '7月18日〜20日の3日間。データにあった8月11日は根拠がない',
    },
  }],

  // くらやみ祭（大國魂神社例大祭）。同じ祭りが2件に割れていて、
  // どちらも 4/30 と 5/6 を端に持ちながら間が虫食いになっていた。
  // 例大祭は4月30日から5月6日までの一連の神事なので全日にする
  ...['fuchu-goguynet-32763', 'fuchu-goguynet-32796'].map((id) => [id, {
    occurrence: {
      year: 2026, dates: everyDay('2026-04-30', '2026-05-06'), status: 'confirmed', checked_at: CHECKED,
      note: '4月30日から5月6日までの一連の神事。データは4/30と5/6を端に持ちながら間が虫食いになっていた（取り込みを読み直しても虫食いの場所が変わるだけだったので、期間として全日を入れた）。5月3日からは周辺道路で交通規制がある',
    },
  }]),
], 'まとめ記事の日付割り当てと残り（31）');
