/**
 * 一次情報での裏取り（花火大会 第1弾：茨城県）
 *
 *   node scripts/enrich/primary-hanabi-01.mjs
 *
 * 対象は `occurrences[0].source_type` が `aggregator`（ウォーカープラスの花火大会DB）
 * だった祭りだけ。**`official`/`gov` のものには触れていない**。
 *
 * 花火大会から手を付けたのは、**まとめサイト由来 1,137 件のうち約 1,000 件が
 * ウォーカープラスの花火DBで、しかも花火大会は規模が大きく
 * 実行委員会の公式サイトか市町村の告知ページがほぼ必ずある**ため。
 * 町内会の盆踊りを 1 件ずつ当たるより歩留まりがはるかに高い。
 *
 * 守っていること（`docs/kanto-plan.md` と `docs/schema.md` の通り）:
 *
 * - **本人確認をしてから格上げする**。同名の花火大会は全国にある。
 *   実際この回でも「東海まつり花火大会」が茨城県東海村と愛知県東海市の
 *   両方にあり、検索の上位は愛知の方だった。
 *   採用したのは (a) ドメインがその市町村のもの（`*.lg.jp` / `vill.*.jp`）か、
 *   (b) ページ内に市町村名・会場の住所が出ているもの、のどちらかだけ。
 * - **拾うのは事実の項目だけ**（日付・時刻・会場住所・主催者名・最寄駅）。
 *   出典の文章は持ち込まない。`description` は null のまま。
 * - **日付が食い違ったら上書きしない**。年（第何回）を確かめてから直し、
 *   経緯を `note` に残す。
 * - 元のまとめサイトの URL は `links` に `{title, url}` の形で残す。
 *   素の文字列と混ぜると詳細ページに `[object Object]` が出る。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const WP = (code) => L('ウォーカープラス 花火大会2026（元の出典）', `https://hanabi.walkerplus.com/detail/${code}/`);

// 出典を差し替えるときの定型。source_url を替えたら source_name と格も一緒に替える
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 茨城県
  // ------------------------------------------------------------------

  // 実行委員会が独自ドメインの公式サイトを持っている。日付・開始時刻とも
  // まとめサイトの記載と一致したので、出典だけ差し替えた
  ['tsuchiura-hanabi-ar0308e00280', {
    organizer: '土浦全国花火競技大会実行委員会',
    links: [
      L('土浦全国花火競技大会実行委員会 公式ホームページ', 'https://www.tsuchiura-hanabi.jp/'),
      WP('ar0308e00280'),
    ],
    occurrence: {
      ...src(2026, 'https://www.tsuchiura-hanabi.jp/', '土浦全国花火競技大会実行委員会', 'official'),
      start_time: '17:30',
      status: 'confirmed',
    },
  }],

  // 水戸黄門まつりの一部。花火は本祭とは別の日（7/25）に千波湖で上がる。
  // 公式サイトの表記は「千波湖」、まとめサイトは「千波公園」。同じ場所なので会場名は触っていない
  ['mito-hanabi-ar0308e00896', {
    organizer: '水戸黄門まつり実行委員会',
    links: [
      L('水戸黄門まつり 公式ホームページ（水戸観光コンベンション協会）', 'https://mitokoumon.com/koumon/'),
      WP('ar0308e00896'),
    ],
    occurrence: {
      ...src(2026, 'https://mitokoumon.com/koumon/', '水戸黄門まつり実行委員会', 'official'),
      start_time: '19:30',
      end_time: '20:30',
      status: 'confirmed',
    },
  }],

  // 大会名に「常総」が入っており、独自ドメインの公式サイト。日付は一致
  ['joso-hanabi-ar0308e00248', {
    links: [
      L('常総きぬ川花火大会 公式WEBサイト', 'https://www.joso-hanabi.jp/'),
      WP('ar0308e00248'),
    ],
    occurrence: {
      ...src(2026, 'https://www.joso-hanabi.jp/', '常総きぬ川花火大会 実行委員会', 'official'),
      status: 'confirmed',
    },
  }],

  // 取手市の告知ページ。会場の住所（寺田5139）と主催がここで初めて取れた。
  // まとめサイトの住所は「取手市取手」だったので、市の発表で置き換える
  ['toride-hanabi-ar0308e00914', {
    organizer: '取手市観光協会',
    venue: { name: '取手緑地運動公園', address: '取手市寺田5139' },
    links: [
      L('取手市「第71回とりで利根川大花火」開催日決定', 'https://www.city.toride.ibaraki.jp/sanshin/bunkakatsudo/kanko/oshirase/71kaihanabi.html'),
      WP('ar0308e00914'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.toride.ibaraki.jp/sanshin/bunkakatsudo/kanko/oshirase/71kaihanabi.html', '取手市', 'gov'),
      start_time: '19:00',
      end_time: '20:20',
      status: 'confirmed',
    },
  }],

  // 古河市観光協会の花火特設ページ。会場の郵便番号つき住所と最寄駅が取れた
  ['ibaraki-006-hanabi-ar0308e01029', {
    station: 'JR宇都宮線 古河駅／東武日光線 新古河駅',
    venue: { name: '古河ゴルフリンクス（渡良瀬川河川敷）', address: '古河市西町10-1' },
    links: [
      L('こがナビ（古河市観光協会） 古河花火大会', 'https://www.kogakanko.jp/hanabi'),
      WP('ar0308e01029'),
    ],
    occurrence: {
      ...src(2026, 'https://www.kogakanko.jp/hanabi', '古河市観光協会', 'official'),
      status: 'confirmed',
    },
  }],

  // 大会名を冠した公式ドメイン。主催は「大洗のまつり実行委員会」
  ['ibaraki-004-hanabi-ar0308e00860', {
    organizer: '大洗のまつり実行委員会',
    links: [
      L('大洗海上花火大会2026 公式ホームページ', 'https://www.oarai-hanabi.jp/'),
      WP('ar0308e00860'),
    ],
    occurrence: {
      ...src(2026, 'https://www.oarai-hanabi.jp/', '大洗のまつり実行委員会', 'official'),
      status: 'confirmed',
    },
  }],

  // 境町。**境町観光協会のサイトには第37回のページが残っていて時刻が違った**ので、
  // 第39回を掲げている公式ドメイン（sakai-hanabi.com）の方を採った。
  // 終了時刻は「約120分」としか書かれていないので入れていない
  ['ibaraki-003-hanabi-ar0308e01044', {
    venue: { name: 'さかいリバーサイドパーク（利根川河川敷）', address: '猿島郡境町 利根川河川敷' },
    links: [
      L('第39回 利根川大花火大会 公式サイト', 'https://www.sakai-hanabi.com/'),
      WP('ar0308e01044'),
    ],
    occurrence: {
      ...src(2026, 'https://www.sakai-hanabi.com/', '利根川大花火大会実行委員会', 'official'),
      start_time: '18:00',
      status: 'confirmed',
      note: '18:00オープニングセレモニー、18:30打上開始（公式サイトの記載）。終了時刻は「約120分」としか発表されていない',
    },
  }],

  // 東海村（茨城）の第48回。**愛知県東海市にも同名の「東海まつり花火大会」があり、
  // 日付まで同じ 8/8 なので、村の公式ドメイン（vill.tokai.ibaraki.jp）で本人確認した**
  ['ibaraki-001-hanabi-ar0308e356524', {
    links: [
      L('東海村「第48回東海まつり花火大会開催のお知らせ」', 'https://www.vill.tokai.ibaraki.jp/soshikikarasagasu/sangyobu/sangyoseisakuka/4/3/9733.html'),
      WP('ar0308e356524'),
    ],
    occurrence: {
      ...src(2026, 'https://www.vill.tokai.ibaraki.jp/soshikikarasagasu/sangyobu/sangyoseisakuka/4/3/9733.html', '東海村', 'gov'),
      start_time: '19:00',
      end_time: '20:00',
      status: 'confirmed',
    },
  }],
  // 上と同じ祭り（重複データ）。片方だけ直すと一覧で格の違うものが並ぶので両方に入れる
  ['tokai-tokai-matsuri-hanabi', {
    venue: { name: '阿漕ヶ浦公園', address: '那珂郡東海村大字村松' },
    links: [
      L('東海村「第48回東海まつり花火大会開催のお知らせ」', 'https://www.vill.tokai.ibaraki.jp/soshikikarasagasu/sangyobu/sangyoseisakuka/4/3/9733.html'),
    ],
    occurrence: {
      ...src(2026, 'https://www.vill.tokai.ibaraki.jp/soshikikarasagasu/sangyobu/sangyoseisakuka/4/3/9733.html', '東海村', 'gov'),
      start_time: '19:00',
      end_time: '20:00',
      status: 'confirmed',
    },
  }],

  // 鹿嶋市の令和8年度の告知。住所が「鹿嶋市−」のままだったので大船津に直す
  ['kashima-hanabi-ar0308e01114', {
    venue: { name: '大船津地内北浦湖上', address: '鹿嶋市大船津' },
    links: [
      L('鹿嶋市「鹿嶋市花火大会（令和8年度開催について）」', 'https://www.city.kashima.ibaraki.jp/site/kankou/9118.html'),
      WP('ar0308e01114'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.kashima.ibaraki.jp/site/kankou/9118.html', '鹿嶋市', 'gov'),
      start_time: '19:30',
      status: 'confirmed',
      note: '荒天・霧・強風の場合は7月5日（日）に順延（鹿嶋市の発表）',
    },
  }],

  // きらっせ祭り。神栖市の公式情報発信ポータル「カミスミカ」の
  // 2026年夏のイベント特集（2026-07-17 付）に、花火19時・メイン会場の住所・主催が出ている
  ['kamisu-hanabi-ar0308e355835', {
    organizer: 'きらっせ祭り実行委員会（一般社団法人神栖市観光協会）',
    links: [
      L('神栖市 魅力情報発信ポータル「カミスミカ」夏のイベント特集2026', 'https://kamisu-pr.jp/2026/07/17/event2026summer/'),
      L('神栖市観光協会 イベント年間スケジュール', 'https://www.kamisu-kanko.jp/event/index.html'),
      WP('ar0308e355835'),
    ],
    occurrence: {
      ...src(2026, 'https://kamisu-pr.jp/2026/07/17/event2026summer/', '神栖市（カミスミカ）', 'gov'),
      start_time: '19:00',
      status: 'confirmed',
      note: 'メイン会場は豊ヶ浜運動公園およびその周辺（神栖市波崎9579）。花火は19時から波崎海岸で打ち上げ。小雨決行・荒天中止で順延なし',
    },
  }],

  // 第50回 神栖花火大会（2025年開催分）。主催の神栖市観光協会が特設ページを持っていた。
  // **2026年の開催は発表されていないので、年は2025のまま**（去年の日程を今年として出さない）
  ['kamisu-hanabi-ar0308e358258', {
    organizer: '一般社団法人神栖市観光協会・神栖市商工会',
    shrine: '息栖神社',
    station: 'JR総武線 小見川駅（タクシー10分）／JR鹿島線 鹿島神宮駅・潮来駅（タクシー20分）',
    venue: { name: '息栖神社周辺 常陸利根川河畔', address: '神栖市息栖' },
    links: [
      L('神栖市観光協会 第50回神栖花火大会', 'https://www.kamisu-kanko.jp/event-page/natsumatsuri.html'),
      WP('ar0308e358258'),
    ],
    occurrence: {
      ...src(2025, 'https://www.kamisu-kanko.jp/event-page/natsumatsuri.html', '一般社団法人神栖市観光協会', 'official'),
      start_time: '17:50',
      end_time: '18:30',
      status: 'confirmed',
      note: 'メイン会場は息栖にぎわいテラス駐車場。2026年の開催は本稿の確認時点で未発表',
    },
  }],

  // 利根町。**まとめサイトの会場は「栄橋下河川敷」だけだったが、
  // 町の発表では第1会場（栄橋下）と第2会場（利根緑地運動公園）に分かれている**
  ['ibaraki-002-hanabi-ar0308e00587', {
    organizer: '利根町',
    venue: { name: '利根川栄橋下河川敷（第1会場）／利根緑地運動公園（第2会場）', address: '北相馬郡利根町布川' },
    links: [
      L('利根町「第49回利根町民納涼花火大会を開催します！」', 'https://www.town.tone.ibaraki.jp/kanko-bunka/ibenntogyouzi/hanabi/page006051.html'),
      WP('ar0308e00587'),
    ],
    occurrence: {
      ...src(2026, 'https://www.town.tone.ibaraki.jp/kanko-bunka/ibenntogyouzi/hanabi/page006051.html', '利根町', 'gov'),
      start_time: '18:30',
      end_time: '20:30',
      status: 'confirmed',
      note: '花火の打上げは20:00から（イベント全体は18:30開始）。予備日は8月23日（日）',
    },
  }],

  // 稲敷市の告知ページ。会場の番地（荒沼3-1）が取れた
  ['inashiki-hanabi-ar0308e00879', {
    venue: { name: '江戸崎総合運動公園', address: '稲敷市荒沼3-1' },
    links: [
      L('稲敷市「2026いなしき夏まつり花火大会」', 'https://www.city.inashiki.lg.jp/page/page008477.html'),
      WP('ar0308e00879'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.inashiki.lg.jp/page/page008477.html', '稲敷市', 'gov'),
      start_time: '19:00',
      status: 'confirmed',
      note: 'ステージイベント・模擬店は15:00から、花火の打上げは19:00から（稲敷市の発表）',
    },
  }],
  // 上と同じ祭り（重複データ）
  ['inashiki-inashiki-natsumatsuri-hanabi', {
    venue: { name: '江戸崎総合運動公園', address: '稲敷市荒沼3-1' },
    links: [
      L('稲敷市「2026いなしき夏まつり花火大会」', 'https://www.city.inashiki.lg.jp/page/page008477.html'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.inashiki.lg.jp/page/page008477.html', '稲敷市', 'gov'),
      start_time: '19:00',
      status: 'confirmed',
    },
  }],

  // ひたちなか祭り。**8/22が花火大会、8/23が本祭り**で、既存データは2日とも
  // 花火の日にしていた。公式サイトの記載どおり花火の日を8/22に絞る
  ['hitachinaka-hitachinaka-matsuri-hanabi', {
    organizer: '第32回ひたちなか祭り実行委員会',
    venue: { name: '陸上自衛隊勝田駐屯地', address: 'ひたちなか市勝倉3433' },
    links: [
      L('第32回ひたちなか祭り 公式サイト', 'https://www.hitachinaka-fes.com/'),
      L('ひたちなか市 2026年 夏のイベント情報', 'https://www.city.hitachinaka.lg.jp/business/kankoshinko/1002695/1015568.html'),
    ],
    occurrence: {
      ...src(2026, 'https://www.hitachinaka-fes.com/', '第32回ひたちなか祭り実行委員会', 'official'),
      dates: ['2026-08-22'],
      status: 'confirmed',
      note: '8月22日（土）が花火大会、翌23日（日）が本祭り。まとめサイトは2日とも花火の日としていたが、公式サイトの記載に合わせた',
    },
  }],
], '花火・茨城県');
