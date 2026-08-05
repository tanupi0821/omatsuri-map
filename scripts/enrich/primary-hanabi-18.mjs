/**
 * 一次情報での裏取り（第18弾：既存リンクからの格上げ その5）
 *
 *   node scripts/enrich/primary-hanabi-18.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。この回は花火大会以外の夏祭りも含む。
 *
 * ここでも**開催日の取りこぼし**が見つかった。長岡まつりは8月1日・2日・3日の
 * 3日間なのに、まとめサイト由来のデータは1日と3日の2日分しか持っていなかった。
 * **「複数日開催の祭りは、まとめサイトが端の2日だけを持っている」**という
 * 誤りの型がここまでで3件（熱海・堂ヶ島・長岡）出ている。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 福岡県
  // ------------------------------------------------------------------

  // くきのうみ。**会場は洞海湾で、若松側と戸畑側の両方から見る**
  ['fukuoka-009-hanabi-ar1040e00936', {
    organizer: 'くきのうみ花火の祭典実行委員会',
    station: 'JR筑豊本線 若松駅（徒歩3分）／JR鹿児島本線 戸畑駅（徒歩5分）',
    venue: { name: '洞海湾（若戸大橋周辺）', address: '福岡県北九州市若松区久岐の浜7番1号（個人協賛会場）' },
    links: [L('北九州市若松区 くきのうみ花火の祭典', 'https://www.city.kitakyushu.lg.jp/wakamatsu/file_0033.html')],
    occurrence: {
      ...src(2026, 'https://www.city.kitakyushu.lg.jp/wakamatsu/file_0033.html', '北九州市', 'gov'),
      start_time: '19:00',
      end_time: '19:40',
      status: 'confirmed',
    },
  }],

  // 那珂川市。**2026年は第50回**。会場は2か所に分かれる
  ['fukuoka-004-hanabi-ar1040e00981', {
    name: '第50回 なかがわ市民の祭り',
    organizer: 'なかがわ市民の祭り実行委員会',
    venue: { name: '梶原運動広場／安徳南小学校運動場', address: '福岡県那珂川市' },
    links: [L('那珂川市 第50回なかがわ市民の祭り', 'https://www.city.nakagawa.lg.jp/soshiki/47/maturi2026.html')],
    occurrence: {
      ...src(2026, 'https://www.city.nakagawa.lg.jp/soshiki/47/maturi2026.html', '那珂川市', 'gov'),
      start_time: '20:10',
      status: 'confirmed',
      note: '花火の打上げは20:10から（那珂川市の発表）',
    },
  }],

  // ------------------------------------------------------------------
  // 群馬県
  // ------------------------------------------------------------------

  // 千代田町。会場は赤岩渡船付近の利根川河畔
  ['gunma-002-hanabi-ar0310e00588', {
    venue: { name: '利根川河畔（赤岩渡船付近）', address: '群馬県邑楽郡千代田町赤岩地先' },
    links: [L('千代田町 千代田の祭 川せがき', 'https://www.town.chiyoda.gunma.jp/keizai/syoko/syoko007.html')],
    occurrence: {
      ...src(2026, 'https://www.town.chiyoda.gunma.jp/keizai/syoko/syoko007.html', '千代田町', 'gov'),
      start_time: '20:10',
      end_time: '20:50',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 宮崎県
  // ------------------------------------------------------------------

  // 小林市（旧須木村）。会場は須木中学校運動場
  ['miyazaki-001-hanabi-ar1045e00570', {
    organizer: 'すき納涼花火大会実行委員会',
    venue: { name: '須木中学校運動場', address: '宮崎県小林市須木' },
    links: [L('小林市 第47回小林市すき納涼花火大会', 'https://www.city.kobayashi.lg.jp/soshikikarasagasu/sukichoshachiikishinkoka/7529.html')],
    occurrence: {
      ...src(2026, 'https://www.city.kobayashi.lg.jp/soshikikarasagasu/sukichoshachiikishinkoka/7529.html', '小林市', 'gov'),
      start_time: '20:00',
      status: 'confirmed',
      note: '開場は17:00、花火の打上げは20:00から',
    },
  }],

  // ------------------------------------------------------------------
  // 新潟県
  // ------------------------------------------------------------------

  // 長岡まつり本体。**8月1日・2日・3日の3日間**なのに、
  // まとめサイト由来のデータは1日と3日の2日分しか持っていなかった
  ['niigata-009-summer-ar0415e73965', {
    organizer: '長岡商工会議所・長岡観光コンベンション協会・長岡花火財団ほか',
    station: 'JR上越新幹線・信越本線 長岡駅',
    links: [L('長岡市 長岡まつり', 'https://www.city.nagaoka.niigata.jp/kankou/event/nagaokamatsuri.html')],
    occurrence: {
      ...src(2026, 'https://www.city.nagaoka.niigata.jp/kankou/event/nagaokamatsuri.html', '長岡市', 'gov'),
      dates: ['2026-08-01', '2026-08-02', '2026-08-03'],
      status: 'confirmed',
      note: '8月1日は平和祭と柿川灯籠流し、2日・3日が大花火大会（19:20〜21:10）',
    },
  }],

  // ------------------------------------------------------------------
  // 大阪府
  // ------------------------------------------------------------------

  // 富田林寺内町燈路。**点灯は18:30から**
  ['osaka-001-summer-ar0727e115393', {
    station: '近鉄長野線 富田林駅・富田林西口駅',
    links: [L('富田林市 富田林寺内町燈路', 'https://www.city.tondabayashi.lg.jp/soshiki/36/76474.html')],
    occurrence: {
      ...src(2026, 'https://www.city.tondabayashi.lg.jp/soshiki/36/76474.html', '富田林市', 'gov'),
      start_time: '17:00',
      end_time: '21:00',
      status: 'confirmed',
      note: '点灯は18:30から21:00。雨天時は8月23日に順延',
    },
  }],

  // ------------------------------------------------------------------
  // 茨城県
  // ------------------------------------------------------------------

  // 下妻まつり。**会場は砂沼南岸と砂沼の湖上**
  ['shimotsuma-hanabi-ar0308e357291', {
    venue: { name: '砂沼南岸および砂沼湖上', address: '茨城県下妻市' },
    links: [L('下妻市 下妻まつり2026', 'https://www.city.shimotsuma.lg.jp/kanko-business-sangyo/event/shimotsumafestival/shimotsumamatsuri2026/')],
    occurrence: {
      ...src(2026, 'https://www.city.shimotsuma.lg.jp/kanko-business-sangyo/event/shimotsumafestival/shimotsumamatsuri2026/', '下妻市', 'gov'),
      start_time: '17:00',
      end_time: '21:00',
      status: 'confirmed',
      note: '17:00から21:00は祭り全体の時間帯。花火の打上時刻は下妻市の告知に記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 山梨県
  // ------------------------------------------------------------------

  // 南部の火祭り。**開催日は毎年8月15日**
  ['yamanashi-004-hanabi-ar0419e00079', {
    recurrence: '8月15日',
    recurrence_source: 'https://www.town.nanbu.yamanashi.jp/kankou/omatsuri/index.html',
    links: [L('南部町 南部の火祭り', 'https://www.town.nanbu.yamanashi.jp/kankou/omatsuri/index.html')],
    occurrence: {
      ...src(2026, 'https://www.town.nanbu.yamanashi.jp/kankou/omatsuri/index.html', '南部町', 'gov'),
      status: 'confirmed',
      note: '開催日は毎年8月15日。時刻は南部町のページに記載がなく、以前の発表による',
    },
  }],
], '既存リンクからの格上げ（5）');
