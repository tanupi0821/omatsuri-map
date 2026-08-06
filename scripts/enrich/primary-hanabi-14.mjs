/**
 * 一次情報での裏取り（花火大会 第14弾：既に `links` に公式ページを持っていたもの）
 *
 *   node scripts/enrich/primary-hanabi-14.mjs
 *
 * ここからは**探し方を変えている**。
 *
 * これまでは祭りごとに検索して公式ページを探していたが、
 * **`links` に既に市区町村や観光協会のページが入っているのに、
 * `occurrences[0].source_type` がまとめサイトのままになっているもの**が
 * 260 件あった。リンクは前任者が拾っていたのに、出典の格を上げる作業が
 * 済んでいなかったということ。
 *
 * この層は「探す」手間がゼロで、**そのリンクを開いて内容を確かめるだけ**で
 * 格上げできる。歩留まりが最も高いので、ここから潰した。
 * `links` のドメインが市区町村（`*.lg.jp` など）か観光協会で、
 * かつパスが2階層以上（＝その祭りの個別ページである見込みが高い）ものを対象にした。
 *
 * 開いてみて**前年のページだったもの**（渥美半島花火大会は第2回・2025年、
 * 知立の秋葉まつりは2025年）は格上げしていない。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 愛知県
  // ------------------------------------------------------------------

  // 新城市観光協会のページ。会場の郵便番号つき住所が取れた
  ['aichi-002-hanabi-ar0623e00816', {
    venue: { name: '桜淵公園', address: '新城市庭野字八名井田2-1' },
    links: [L('新城市観光協会 第57回新城納涼花火大会', 'https://shinshirokankou.com/feature/detail/124/')],
    occurrence: {
      ...src(2026, 'https://shinshirokankou.com/feature/detail/124/', '新城市観光協会', 'official'),
      start_time: '19:20',
      end_time: '20:45',
      status: 'confirmed',
      note: '荒天時は8月15日に延期',
    },
  }],

  // 日本ライン夏まつり。**8月1日から10日まで毎晩20時頃に約10分ずつ上げる**
  // 「ロングラン花火」で、犬山市と各務原市にまたがる
  ['aichi-003-hanabi-ar0623e00814', {
    organizer: '日本ライン夏まつり実行委員会',
    venue: { name: '木曽川河畔 ツインブリッジ下流', address: '犬山市' },
    links: [L('犬山市 日本ライン夏まつり ロングラン花火', 'https://www.city.inuyama.aichi.jp/shisei/1005983/1006011/1008860.html')],
    occurrence: {
      ...src(2026, 'https://www.city.inuyama.aichi.jp/shisei/1005983/1006011/1008860.html', '犬山市', 'gov'),
      start_time: '20:00',
      status: 'confirmed',
      note: '8月1日から10日まで毎晩20時頃に約10分間。対岸の各務原市とまたがる',
    },
  }],

  // 知多市観光協会。最寄駅が取れた
  ['aichi-008-hanabi-ar0623e113682', {
    station: '名鉄常滑線 新舞子駅',
    links: [L('知多市観光協会 第13回新舞子ビーチフェスティバル花火大会', 'https://chita-kanko.com/feature/detail/14/')],
    occurrence: {
      ...src(2026, 'https://chita-kanko.com/feature/detail/14/', '知多市観光協会', 'official'),
      start_time: '19:00',
      status: 'confirmed',
    },
  }],

  // みよし市。会場の住所と時刻が市のページで揃った
  ['aichi-015-hanabi-ar0623e00820', {
    organizer: '三好池まつり実行委員会',
    venue: { name: '三好池周辺', address: 'みよし市三好町池ノ原1' },
    links: [L('みよし市 三好池まつり', 'https://www.city.aichi-miyoshi.lg.jp/soshiki/shiminkeizai/sangyo/kankou/117.html')],
    occurrence: {
      ...src(2026, 'https://www.city.aichi-miyoshi.lg.jp/soshiki/shiminkeizai/sangyo/kankou/117.html', 'みよし市', 'gov'),
      start_time: '18:40',
      end_time: '20:30',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 秋田県
  // ------------------------------------------------------------------

  // 八峰町。**屋台村は13時から21時30分**まで出る（露店があることの裏づけ）
  ['akita-004-hanabi-ar0205e512284', {
    organizer: '八峰町花火大会実行委員会',
    station: 'JR五能線 八森駅（徒歩5分）',
    venue: { name: '中浜海岸', address: '山本郡八峰町' },
    stalls: 'yes',
    links: [L('八峰町 八峰花火フェス2026', 'https://www.town.happo.lg.jp/archive/p20260610161448')],
    occurrence: {
      ...src(2026, 'https://www.town.happo.lg.jp/archive/p20260610161448', '八峰町', 'gov'),
      start_time: '20:00',
      status: 'confirmed',
      note: '花火の打上げは20:00から。屋台村は13:00から21:30まで（八峰町の発表）',
    },
  }],

  // 北秋田市。**開催日が「毎年8月16日」で固定**されているので recurrence に入れる
  ['akita-006-hanabi-ar0205e00040', {
    organizer: '阿仁の花火実行委員会',
    station: '秋田内陸線 阿仁合駅（徒歩5分）',
    recurrence: '8月16日',
    recurrence_source: 'https://www.city.kitaakita.akita.jp/archive/contents-6041',
    venue: { name: '阿仁河川公園', address: '北秋田市阿仁銀山字下新町' },
    links: [L('北秋田市 阿仁の花火と灯籠流し', 'https://www.city.kitaakita.akita.jp/archive/contents-6041')],
    occurrence: {
      ...src(2026, 'https://www.city.kitaakita.akita.jp/archive/contents-6041', '北秋田市', 'gov'),
      start_time: '19:15',
      status: 'confirmed',
      note: '灯籠流しは18:30から、花火は19:15から。開催日は毎年8月16日で固定',
    },
  }],

  // ------------------------------------------------------------------
  // 福岡県
  // ------------------------------------------------------------------

  // 朝倉市。**正式には「甘木川花火大会 流灌頂法要会」**で主催は流灌頂奉賛会
  ['fukuoka-003-hanabi-ar1040e01031', {
    organizer: '流灌頂奉賛会（問合せ：朝倉商工会議所）',
    venue: { name: '小石原川 甘木橋下流', address: '朝倉市' },
    links: [L('朝倉市 甘木川花火大会', 'https://www.city.asakura.lg.jp/site/kanko/13553.html')],
    occurrence: {
      ...src(2026, 'https://www.city.asakura.lg.jp/site/kanko/13553.html', '朝倉市', 'gov'),
      start_time: '19:40',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 岐阜県
  // ------------------------------------------------------------------

  // 下呂市。会場の番地（森960）と最寄駅が取れた
  ['gifu-006-hanabi-ar0621e440135', {
    station: 'JR高山本線 下呂駅（徒歩約3分）',
    venue: { name: '下呂大橋上流 河川敷', address: '下呂市森960番地' },
    links: [L('下呂市 下呂温泉まつり 花火ミュージカル夏公演', 'https://www.city.gero.lg.jp/site/kanko/23881.html')],
    occurrence: {
      ...src(2026, 'https://www.city.gero.lg.jp/site/kanko/23881.html', '下呂市', 'gov'),
      start_time: '20:00',
      end_time: '20:30',
      status: 'confirmed',
    },
  }],

  // 各務原市。主催は地元の区・発展会・観光協会・新聞社・放送局の実行委員会
  ['gifu-011-hanabi-ar0621e00190', {
    organizer: 'おがせ池夏まつり実行委員会（各務区・各務発展会・各務原市観光協会・岐阜新聞社・岐阜放送）',
    station: '名鉄各務原線 苧ヶ瀬駅（北へ徒歩15分）',
    links: [L('各務原市 第38回おがせ池夏まつり花火大会', 'https://www.city.kakamigahara.lg.jp/event/1005356/1010019/1027755.html')],
    occurrence: {
      ...src(2026, 'https://www.city.kakamigahara.lg.jp/event/1005356/1010019/1027755.html', '各務原市', 'gov'),
      start_time: '19:30',
      end_time: '20:10',
      status: 'confirmed',
    },
  }],

  // 美濃市観光協会。会場の地名（横越中島地内）が取れた
  ['gifu-012-hanabi-ar0621e471876', {
    organizer: '美濃市花火大会実行委員会',
    station: '長良川鉄道 美濃市駅',
    venue: { name: '下渡橋下流 長良川河畔', address: '美濃市横越中島地内' },
    links: [L('美濃市観光協会 美濃市民花火大会', 'https://minokanko.com/event/category/summer/p7968/')],
    occurrence: {
      ...src(2026, 'https://minokanko.com/event/category/summer/p7968/', '美濃市観光協会', 'official'),
      start_time: '19:30',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 群馬県
  // ------------------------------------------------------------------

  // 明和町。会場の番地と最寄駅が取れた
  ['gunma-003-hanabi-ar0310e01085', {
    station: '東武伊勢崎線 川俣駅東口（徒歩約15分）',
    venue: { name: '明和町ふるさとの広場', address: '邑楽郡明和町南大島1073番地' },
    links: [L('明和町 令和8年度明和まつり', 'https://www.town.meiwa.gunma.jp/life/soshiki/sangyoukankyo/event/5632.html')],
    occurrence: {
      ...src(2026, 'https://www.town.meiwa.gunma.jp/life/soshiki/sangyoukankyo/event/5632.html', '明和町', 'gov'),
      start_time: '20:00',
      end_time: '20:30',
      status: 'confirmed',
      note: '荒天時は9月19日に順延',
    },
  }],

  // ------------------------------------------------------------------
  // 広島県
  // ------------------------------------------------------------------

  // 竹原市観光協会（主催）。会場の郵便番号つき住所と最寄駅が取れた
  ['hiroshima-004-hanabi-ar0834e00106', {
    organizer: '一般社団法人竹原市観光協会',
    station: 'JR呉線 大乗駅（徒歩約10分）',
    venue: { name: '高崎町', address: '竹原市高崎町' },
    links: [L('竹原市観光協会 たけはら夏まつり花火大会', 'https://www.takeharakankou.jp/event/8297/')],
    occurrence: {
      ...src(2026, 'https://www.takeharakankou.jp/event/8297/', '一般社団法人竹原市観光協会', 'official'),
      start_time: '19:45',
      end_time: '20:15',
      status: 'confirmed',
    },
  }],

  // 江田島市。**市のページは日付しか出していない**ので時刻は触らない
  ['hiroshima-005-hanabi-ar0834e361460', {
    links: [L('江田島市 2026江田島湾海上花火大会', 'https://www.city.etajima.hiroshima.jp/cms/articles/show/12090')],
    occurrence: {
      ...src(2026, 'https://www.city.etajima.hiroshima.jp/cms/articles/show/12090', '江田島市', 'gov'),
      status: 'confirmed',
      note: '時刻は江田島市のページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 兵庫県
  // ------------------------------------------------------------------

  // 伊丹市の花火大会のページ。**概要ページなので第46回であることしか分からない**
  ['hyogo-008-hanabi-ar0728e01030', {
    links: [L('伊丹市 いたみ花火大会', 'https://www.city.itami.lg.jp/SOSIKI/TOSHIKATSURYOKU/TOSID/itamihanabitaikai/index.html')],
    occurrence: {
      ...src(2026, 'https://www.city.itami.lg.jp/SOSIKI/TOSHIKATSURYOKU/TOSID/itamihanabitaikai/index.html', '伊丹市', 'gov'),
      status: 'confirmed',
      note: '日付・時刻は伊丹市の概要ページに記載がなく、以前の発表による',
    },
  }],
], '花火・既存リンクからの格上げ（1）');
