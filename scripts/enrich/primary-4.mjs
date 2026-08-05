/**
 * 一次情報での裏取り（第4弾：**検索で祭りそのものの公式・行政ページを探して**埋める）
 *
 *   node scripts/enrich/primary-4.mjs
 *
 * 対象は「名前・日付・会場名しか無い」まま残っていた祭り。
 * 元の出典（ウォーカープラス等のまとめ）を掘り直すのではなく、
 * **その祭りの公式サイト・市区町村・観光協会のページを新しく探してきて**、
 * 住所・時刻・主催・公式リンクを足し、出典の格を上げる。
 *
 * 守っていること:
 *
 * - **拾うのは事実の項目だけ**（住所・時刻・主催者名・URL）。
 *   見つけたページの文章は持ち込まない。`description` は全件 null のまま。
 * - **同名の祭りを掴まないこと**。「祇園祭」「天王祭」「稲荷神社例祭」は全国にある。
 *   検索で見つけたページが本当にその市区町村のその祭りかを、
 *   ページ内の住所か市区町村名で確かめたものだけをここに書いた。
 *   確かめられなかったものは**埋めずに残す**（下の「埋めなかったもの」を見ること）。
 * - `links` は `{title, url}` の形で統一する。素の文字列と混ぜない
 *   （混ざると詳細ページに `[object Object]` が出る）。
 * - **時刻は同じ年の発表から取る**。前年の発表しか無いものは
 *   `note` に「時刻は前回の発表による」と書いてから入れる。
 *   日付が今年のものだと誤解させないのと同じ理由。
 * - 使わないと決めた情報源（祭の日・八百万の神・いこーよ 等）には当たっていない。
 *   `docs/kanto-plan.md` を見ること。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-05';

// 出典を差し替えるときの定型。source_url を替えたら source_name と格も一緒に替える
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 茨城県
  // ------------------------------------------------------------------

  // 土浦八坂神社の祇園祭。市観光協会が令和8年度の日程を出している
  ['tsuchiura-tsuchiura-gion', {
    organizer: '一般社団法人 土浦市観光協会',
    shrine: '八坂神社',
    links: [
      L('土浦市観光協会 令和8年度 土浦八坂神社祇園祭', 'https://www.tsuchiura-kankou.jp/whats_new/%E4%BB%A4%E5%92%8C%EF%BC%98%E5%B9%B4%E5%BA%A6-%E5%9C%9F%E6%B5%A6%E5%85%AB%E5%9D%82%E7%A5%9E%E7%A4%BE%E7%A5%87%E5%9C%92%E7%A5%AD/'),
      L('土浦八坂神社', 'https://www.tuchiura-yasakajinja.com/'),
    ],
    occurrence: {
      ...src(2026, 'https://www.tsuchiura-kankou.jp/whats_new/%E4%BB%A4%E5%92%8C%EF%BC%98%E5%B9%B4%E5%BA%A6-%E5%9C%9F%E6%B5%A6%E5%85%AB%E5%9D%82%E7%A5%9E%E7%A4%BE%E7%A5%87%E5%9C%92%E7%A5%AD/', '土浦市観光協会', 'official'),
      start_time: '19:00',
      end_time: '21:00',
      note: '初日（7月24日）は19時から19時30分の神事のみ',
    },
  }],

  // 大町の羽黒神社を中心に4日間。最終日だけ早朝の川渡御なので時刻が違う
  ['chikusei-shimodate-gion', {
    organizer: '筑西市観光協会',
    shrine: '羽黒神社',
    venue: { name: '羽黒神社・下館駅北口駅前通り 他' },
    links: [L('筑西市 下館祇園まつり開催のお知らせ', 'https://www.city.chikusei.lg.jp/kankou/kankou-news/page010455.html')],
    occurrence: {
      ...src(2026, 'https://www.city.chikusei.lg.jp/kankou/kankou-news/page010455.html', '筑西市', 'gov'),
      start_time: '18:00',
      end_time: '22:00',
      note: '最終日（7月26日）は早朝6時からの川渡御',
    },
  }],

  // 素鵞熊野神社の例大祭。市が「8月第1金曜からの3日間」と決まりを公開している
  ['itako-itako-gion-sairei', {
    shrine: '素鵞熊野神社',
    venue: { name: '素鵞熊野神社および潮来地区', address: '茨城県潮来市潮来1337' },
    recurrence: '8月第1金曜日から3日間',
    recurrence_source: 'https://www.city.itako.lg.jp/kankou/kankou-event/kankou-mainevent/page001342.html',
    links: [
      L('潮来市 潮来祇園祭禮', 'https://www.city.itako.lg.jp/kankou/kankou-event/kankou-mainevent/page001342.html'),
      L('潮来お祭り委員会', 'https://www.omaturi.jp/'),
    ],
    occurrence: src(2026, 'https://www.city.itako.lg.jp/kankou/kankou-event/kankou-mainevent/page001342.html', '潮来市', 'gov'),
  }],

  // 麻生の八坂神社。宵祭と本祭で時刻が違うので時刻は入れない
  ['namegata-aso-gion-umadashi', {
    shrine: '八坂神社',
    venue: { name: '八坂神社（麻生）参道・天王崎' },
    links: [
      L('行方市 麻生祇園馬出し祭り', 'https://www.city.namegata.ibaraki.jp/page/page001557.html'),
      L('行方市観光協会', 'http://namekan.jp/event/'),
    ],
    occurrence: src(2026, 'https://www.city.namegata.ibaraki.jp/page/page001557.html', '行方市', 'gov'),
  }],

  // 豊田城（常総市地域交流センター）の駐車場が会場。会場名しか無かった
  ['joso-joso-masakado-matsuri', {
    organizer: '常総市観光物産協会',
    venue: { name: '常総市地域交流センター（豊田城）駐車場' },
    links: [L('常総市観光物産協会', 'https://www.joso-kankou.com/festival/')],
    occurrence: {
      start_time: '18:00',
      end_time: '21:00',
      note: '時刻は前回（第42回）の発表による。2026年の発表は未確認',
      checked_at: CHECKED,
      year: 2026,
    },
  }],

  // 2026年は8日のエンタメ祭・10日の納涼祭の2日開催と主催者が発表している
  ['kasama-kasama-noryo-bonodori-hanabi', {
    organizer: '笠間納涼盆踊り花火大会実行委員会',
    links: [L('笠間納涼盆踊り花火大会2026 開催のお知らせ（主催者発表）', 'https://prtimes.jp/main/html/rd/p/000000010.000169739.html')],
    occurrence: {
      ...src(2026, 'https://prtimes.jp/main/html/rd/p/000000010.000169739.html', '笠間納涼盆踊り花火大会実行委員会', 'official'),
      start_time: '15:50',
      end_time: '21:00',
    },
  }],

  // 市が第16回のページを出している
  ['kitaibaraki-kitaibaraki-shimin-natsumatsuri', {
    organizer: '北茨城市民夏まつり実行委員会',
    links: [L('北茨城市 第16回北茨城市民夏まつり', 'https://www.city.kitaibaraki.lg.jp/docs/2026042400026')],
    occurrence: {
      ...src(2026, 'https://www.city.kitaibaraki.lg.jp/docs/2026042400026', '北茨城市', 'gov'),
      start_time: '10:00',
      end_time: '20:00',
    },
  }],

  // 会場は霞ケ浦ふれあいランドの親水公園。運営会社が主催
  ['namegata-namegata-natsumatsuri', {
    organizer: '霞ケ浦ふれあいランド株式会社',
    venue: { name: '霞ケ浦ふれあいランド 親水公園', address: '茨城県行方市玉造甲1234' },
    links: [L('行方市観光協会 イベント情報', 'http://namekan.jp/event/')],
  }],

  // 大宝八幡宮の住所は神社の公式サイトから
  ['shimotsuma-shimotsuma-furin-matsuri', {
    shrine: '大宝八幡宮',
    venue: { name: '大宝八幡宮', address: '茨城県下妻市大宝667' },
    links: [
      L('大宝八幡宮', 'https://www.daiho.or.jp/'),
      L('下妻市観光協会 風鈴まつり', 'http://www.shimotsuma-kankou.jp/page/page000223.html'),
    ],
    occurrence: src(2026, 'https://www.daiho.or.jp/', '大宝八幡宮', 'official'),
  }],

  // 町の公式ページに第49回の日程・時間・会場が出ている
  ['tone-tone-choumin-noryo-hanabi', {
    venue: { name: '利根川 栄橋下河川敷', address: '茨城県北相馬郡利根町布川' },
    links: [L('利根町 第49回利根町民納涼花火大会', 'https://www.town.tone.ibaraki.jp/kanko-bunka/ibenntogyouzi/hanabi/page006051.html')],
    occurrence: {
      ...src(2026, 'https://www.town.tone.ibaraki.jp/kanko-bunka/ibenntogyouzi/hanabi/page006051.html', '利根町', 'gov'),
      start_time: '18:30',
      end_time: '20:30',
      note: '花火の打ち上げは20時から（予定）。予備日は8月23日',
    },
  }],

  // 綱火は流派ごとに神社も保存団体も違う。取り違えないよう住所まで入れる
  ['tsukubamirai-obari-matsushita-ryu-tsunabi', {
    organizer: '小張松下流綱火保存会',
    shrine: '小張愛宕神社',
    venue: { name: '小張愛宕神社 境内', address: '茨城県つくばみらい市小張3235' },
    links: [L('つくばみらい市観光協会 綱火', 'https://mirai-kankou.com/events/102')],
    occurrence: {
      ...src(2026, 'https://mirai-kankou.com/events/102', 'つくばみらい市観光協会', 'gov'),
      start_time: '19:00',
      end_time: '21:30',
    },
  }],
  ['tsukubamirai-takaoka-ryu-tsunabi', {
    organizer: '高岡流綱火更進団',
    shrine: '高岡愛宕神社',
    venue: { name: '高岡愛宕神社 境内', address: '茨城県つくばみらい市高岡630' },
    links: [L('つくばみらい市観光協会 綱火', 'https://mirai-kankou.com/events/102')],
    occurrence: {
      ...src(2026, 'https://mirai-kankou.com/events/102', 'つくばみらい市観光協会', 'gov'),
      start_time: '19:00',
      end_time: '21:30',
    },
  }],

  // 健田須賀神社の夏季大祭。出御・還御の2日で、市が日程を出している
  ['yuki-yuki-natsumatsuri', {
    organizer: '結城夏祭り実行委員会',
    shrine: '健田須賀神社',
    venue: { name: '健田須賀神社および駅通り' },
    links: [
      L('結城市 結城夏祭り', 'https://www.city.yuki.lg.jp/kankou/event/page000147.html'),
      L('健田須賀神社', 'http://www.takedasugajinja.com/yukimaturi.html'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.yuki.lg.jp/kankou/event/page000147.html', '結城市', 'gov'),
      start_time: '10:00',
      end_time: '21:30',
      note: '町内渡御は10時から17時、夜間渡御は18時から21時30分',
    },
  }],

  // ------------------------------------------------------------------
  // 栃木県
  // ------------------------------------------------------------------

  // 八坂神社は鹿島神社の境内末社。住所は鹿島神社のもの
  ['mashiko-mashiko-gion', {
    organizer: '鹿島神社総代会',
    shrine: '八坂神社（鹿島神社境内社）',
    venue: { name: '鹿島神社周辺', address: '栃木県芳賀郡益子町益子1685-1' },
    links: [
      L('益子町 八坂神社祇園祭（益子祇園祭・天王祭）', 'https://www.town.mashiko.lg.jp/page/page002973.html'),
      L('益子町観光協会 益子祇園祭', 'http://blog.mashiko-kankou.org/staff/?p=22629'),
    ],
    occurrence: src(2026, 'https://www.town.mashiko.lg.jp/page/page002973.html', '益子町', 'gov'),
  }],

  // 2年に1度の大祭。市が令和8年開催のお知らせを出している
  ['tochigi-shi-tochigi-aki-matsuri', {
    links: [
      L('栃木市 とちぎ秋まつり（令和8年開催のお知らせ）', 'https://www.city.tochigi.lg.jp/site/tourism/26060.html'),
      L('栃木市観光協会 とちぎ秋まつり', 'https://www.tochigi-kankou.or.jp/event/akimatsuri'),
    ],
    occurrence: src(2026, 'https://www.city.tochigi.lg.jp/site/tourism/26060.html', '栃木市', 'gov'),
  }],

  ['utsunomiya-furusato-miya-matsuri', {
    organizer: 'ふるさと宮まつり開催委員会',
    links: [L('宇都宮市 第51回ふるさと宮まつり', 'https://www.city.utsunomiya.lg.jp/citypromotion/kanko/event/1007238.html')],
    occurrence: {
      ...src(2026, 'https://www.city.utsunomiya.lg.jp/citypromotion/kanko/event/1007238.html', '宇都宮市', 'gov'),
      start_time: '16:00',
      end_time: '21:00',
    },
  }],

  // 本祭は鬼怒川温泉のくろがね橋周辺。神事は龍王峡で時間帯が別
  ['nikko-kinugawa-ryuosai', {
    venue: { name: '鬼怒川温泉 くろがね橋周辺', address: '栃木県日光市鬼怒川温泉' },
    links: [L('日光旅ナビ 鬼怒川温泉 龍王祭', 'https://www.nikko-kankou.org/event/403')],
    occurrence: {
      ...src(2026, 'https://www.nikko-kankou.org/event/403', '日光市観光協会', 'gov'),
      start_time: '18:00',
      end_time: '22:00',
      note: '龍王峡 五龍王神社での神事は7月24日11時から11時50分',
    },
  }],
  // 須賀神社の例大祭。神社が自分で日程ページを持っている
  ['oyama-oyama-gion', {
    organizer: '須賀神社',
    shrine: '須賀神社',
    venue: { name: '須賀神社および小山駅西口周辺', address: '栃木県小山市宮本町1-2-4' },
    recurrence: '7月第3日曜日',
    recurrence_source: 'https://www.sugajinja.or.jp/gionsai/gionsai.html',
    links: [L('須賀神社（小山市）祇園祭', 'https://www.sugajinja.or.jp/gionsai/gionsai.html')],
    occurrence: {
      ...src(2026, 'https://www.sugajinja.or.jp/gionsai/gionsai.html', '須賀神社', 'official'),
      start_time: '16:15',
      end_time: '21:00',
    },
  }],

  // 市が2026年の日程を出している。お下がり〜お上がりで丸一日
  ['sakura-tochigi-kitsuregawa-tennosai', {
    organizer: '喜連川観光協会',
    shrine: '喜連川神社',
    venue: { name: '喜連川中央商店街通り' },
    links: [
      L('さくら市 喜連川天王祭2026', 'https://www.city.tochigi-sakura.lg.jp/event/000060/p005141.html'),
      L('さくら市観光ナビ 喜連川天王祭2026', 'https://sakura-navi.net/event/kitsuregawa-tennnousai2026/'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.tochigi-sakura.lg.jp/event/000060/p005141.html', 'さくら市', 'gov'),
      start_time: '10:00',
      end_time: '23:00',
      note: 'お下がりが10時、お上がりが23時ごろ。商店街通りは14時から23時まで通行止め',
    },
  }],

  ['otawara-yoichi-matsuri', {
    organizer: '与一まつり実行委員会（大田原市商工観光課内）',
    venue: { name: '大田原市 荒町・上町・仲町・下町商店街通り' },
    links: [
      L('大田原市 大田原与一まつり', 'https://www.city.ohtawara.tochigi.jp/docs/2023061300023/'),
      L('とちぎ旅ネット 第43回大田原与一まつり', 'https://www.tochigiji.or.jp/event/e15399'),
    ],
    occurrence: {
      start_time: '15:00',
      end_time: '21:00',
      note: '時刻は前回（第42回）の発表による。2026年の発表は未確認',
      year: 2026,
      checked_at: CHECKED,
    },
  }],

  // 商工会議所が主催概要を出している
  ['utsunomiya-orion-tanabata', {
    links: [
      L('宇都宮商工会議所 2026年度オリオン七夕まつり 開催概要', 'https://www.u-cci.or.jp/chiikishinkou/tanabata_fes/'),
      L('宇都宮観光ナビ オリオン七夕まつり', 'https://www.utsunomiya-cvb.org/event/detail_20039.html'),
    ],
    occurrence: src(2026, 'https://www.u-cci.or.jp/chiikishinkou/tanabata_fes/', '宇都宮商工会議所', 'official'),
  }],

  // 会場は下野国分寺跡ではなく天平の丘公園（国分寺跡に隣接）
  ['shimotsuke-shimotsuke-tozankai', {
    organizer: '下野市観光協会',
    venue: { name: '天平の丘公園（下野国分寺跡に隣接）' },
    links: [
      L('下野市 しもつけ燈桜会', 'https://www.city.shimotsuke.lg.jp/0386/info-0000010553-3.html'),
      L('プチハピしもつけ しもつけ燈桜会', 'https://shimotsuke-pr.jp/tooue'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.shimotsuke.lg.jp/0386/info-0000010553-3.html', '下野市', 'gov'),
      start_time: '18:00',
      end_time: '20:30',
      note: '時刻は前回の発表による。2026年の発表は未確認',
    },
  }],

  // ------------------------------------------------------------------
  // 群馬県
  // ------------------------------------------------------------------

  ['kusatsu-kusatsu-onsen-kanshasai', {
    organizer: '草津町・草津温泉観光協会',
    venue: { name: '湯路広場・熱乃湯・白根神社ほか' },
    links: [L('草津温泉観光協会 草津温泉感謝祭', 'https://www.kusatsu-onsen.ne.jp/kusatsu_kansya/')],
    occurrence: src(2026, 'https://www.kusatsu-onsen.ne.jp/kusatsu_kansya/', '草津温泉観光協会', 'official'),
  }],

  // 町が令和8年度のページを出している
  ['chiyoda-gunma-chiyoda-kawasegaki', {
    links: [L('千代田町 令和8年度 千代田の祭 川せがき', 'https://www.town.chiyoda.gunma.jp/keizai/syoko/syoko007.html')],
    occurrence: {
      ...src(2026, 'https://www.town.chiyoda.gunma.jp/keizai/syoko/syoko007.html', '千代田町', 'gov'),
      start_time: '18:00',
      end_time: '20:50',
      note: '読経・灯ろう流しは19時40分から、打上花火は20時10分から',
    },
  }],

  ['meiwa-meiwa-matsuri', {
    organizer: '明和まつり実行委員会',
    venue: { name: '明和町ふるさとの広場', address: '群馬県邑楽郡明和町南大島1073' },
    occurrence: {
      start_time: '16:00',
      end_time: '21:00',
      note: '時刻は前回（令和7年度）の発表による。2026年の発表は未確認',
      year: 2026,
      checked_at: CHECKED,
    },
  }],

  // ------------------------------------------------------------------
  // 埼玉県
  // ------------------------------------------------------------------

  // 主催者（鴻巣市商工会青年部）が公式サイトで会場の住所まで出している
  ['konosu-konosu-hanabi', {
    organizer: '鴻巣市商工会青年部',
    venue: { name: '糠田運動場および荒川河川敷', address: '埼玉県鴻巣市糠田1073-1' },
    links: [
      L('こうのす花火大会 公式', 'https://kounosuhanabi.com/about/gaiyo.html'),
      L('鴻巣市 第23回こうのす花火大会', 'https://www.city.kounosu.saitama.jp/site/event/1311.html'),
    ],
    occurrence: {
      ...src(2026, 'https://kounosuhanabi.com/about/gaiyo.html', 'こうのす花火大会実行委員会', 'official'),
      start_time: '17:30',
      end_time: '20:00',
    },
  }],

  ['ina-ina-matsuri', {
    organizer: '一般社団法人 伊奈町観光協会',
    links: [L('伊奈町観光協会 まつり', 'https://inakanko.com/?p=we-page-entrylist&spotlist=24191')],
    occurrence: {
      year: 2026,
      checked_at: CHECKED,
      start_time: '16:00',
      end_time: '21:15',
      note: '花火の打ち上げは20時10分から',
    },
  }],

  // 町観光協会が令和8年度のページを出している
  ['nagatoro-nagatoro-funadama', {
    organizer: '長瀞船玉まつり実行委員会',
    venue: { name: '長瀞岩畳周辺' },
    links: [L('長瀞町観光協会 令和8年度 長瀞船玉まつり', 'https://www.nagatoro.gr.jp/funadama2026/')],
    occurrence: {
      ...src(2026, 'https://www.nagatoro.gr.jp/funadama2026/', '長瀞町観光協会', 'official'),
      start_time: '17:00',
      end_time: '20:45',
      note: '万灯船は17時10分から、灯ろう流しは18時20分から、花火は19時15分から',
    },
  }],

  // ------------------------------------------------------------------
  // 千葉県
  // ------------------------------------------------------------------

  ['narita-narita-gion-sai', {
    venue: { name: '成田山表参道・大本堂前・JR成田駅前広場' },
    links: [L('成田市観光協会 成田祇園祭', 'http://www.nrtk.jp/enjoy/shikisaisai/gion-festival.html')],
    occurrence: src(2026, 'http://www.nrtk.jp/enjoy/shikisaisai/gion-festival.html', '成田市観光協会', 'gov'),
  }],

  // 2026年から9月開催に変わった（酷暑を避けるため）。市が報道発表している
  ['kashiwa-kashiwa-matsuri', {
    organizer: '柏まつり実行委員会',
    links: [
      L('柏市 2026柏まつりの開催時期の変更について', 'https://www.city.kashiwa.lg.jp/koho/pressrelease/r7houdou/2gatsu/r8020601.html'),
      L('柏商工会議所 柏まつり', 'https://www.kashiwa-cci.or.jp/other-organizations/kashiwamaturi'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.kashiwa.lg.jp/koho/pressrelease/r7houdou/2gatsu/r8020601.html', '柏市', 'gov'),
      note: '2026年から開催時期を7月下旬から9月に変更',
    },
  }],

  ['tako-tako-gion', {
    shrine: '八坂神社',
    venue: { name: '八坂神社周辺（多古町本町・新町・仲町・高根）' },
    links: [
      L('多古町 多古祇園祭', 'https://www.town.tako.chiba.jp/docs/2018012900186/'),
      L('多古町商工会 多古祇園祭・しいかご舞', 'http://tako.or.jp/kankou/gionmaturi.html'),
    ],
    occurrence: {
      ...src(2026, 'https://www.town.tako.chiba.jp/docs/2018012900186/', '多古町', 'gov'),
      start_time: '18:30',
      end_time: '22:00',
    },
  }],

  // 市が主催。銚港神社を出発して市役所まで
  ['choshi-choshi-minato-matsuri-mikoshi', {
    organizer: '銚子市',
    venue: { name: '銚港神社（飯沼観音前）から銚子市役所まで' },
    links: [L('銚子市 銚子みなとまつりみこしパレード', 'https://www.city.choshi.chiba.jp/event/page1103_00084.html')],
    occurrence: {
      ...src(2026, 'https://www.city.choshi.chiba.jp/event/page1103_00084.html', '銚子市', 'gov'),
      start_time: '13:40',
      end_time: '19:00',
      note: 'みこしの出発は14時。荒天の場合は8月16日に延期',
    },
  }],

  // 会場の住所は日蓮宗の寺院ページから
  ['ichikawa-nakayama-hokekyoji-bonodori', {
    venue: { name: '中山法華経寺 境内', address: '千葉県市川市中山2-10-1' },
    links: [L('正中山 法華経寺（日蓮宗 寺院ページ）', 'https://temple.nichiren.or.jp/1041026-hokekyoji/')],
  }],

  // ------------------------------------------------------------------
  // 神奈川県
  // ------------------------------------------------------------------

  ['fujisawa-enoshima-toro', {
    organizer: '湘南藤沢活性化コンソーシアム',
    venue: { name: '江島神社（瑞心門〜辺津宮）・江の島サムエル・コッキング苑ほか' },
    links: [
      L('藤沢市 江の島灯籠2026', 'https://www.city.fujisawa.kanagawa.jp/kankou/event/2025tourou.html'),
      L('江の島灯籠2026 公式', 'https://enoshima-seacandle.com/event/enoshimatourou/'),
    ],
    occurrence: {
      ...src(2026, 'https://www.city.fujisawa.kanagawa.jp/kankou/event/2025tourou.html', '藤沢市', 'gov'),
      start_time: '18:00',
      end_time: '20:30',
      note: '土日祝と8月10日から14日は21時まで点灯',
    },
  }],

  // 会場は淵野辺駅前ではなく鹿沼公園
  ['sagamihara-chuo-onokita-ginga-matsuri', {
    organizer: '大野北銀河まつり実行委員会',
    venue: { name: '鹿沼公園（淵野辺駅前）' },
    links: [L('第38回 大野北銀河まつり 公式', 'https://gingamatsuri.jimdofree.com/')],
    occurrence: {
      ...src(2026, 'https://gingamatsuri.jimdofree.com/', '大野北銀河まつり実行委員会', 'official'),
      start_time: '14:00',
      end_time: '21:00',
    },
  }],

  ['yamakita-shasui-no-taki-matsuri', {
    venue: { name: '洒水の滝・滝不動尊境内', address: '神奈川県足柄上郡山北町平山' },
    recurrence: '7月第4日曜日',
    recurrence_source: 'https://www.yamakita.net/event/detail.php?id=38',
    links: [
      L('山北町観光協会 洒水の滝まつり', 'https://www.yamakita.net/event/detail.php?id=38'),
      L('山北町 洒水の滝', 'https://www.town.yamakita.kanagawa.jp/0000000198.html'),
    ],
    occurrence: {
      ...src(2026, 'https://www.yamakita.net/event/detail.php?id=38', '山北町観光協会', 'gov'),
      start_time: '11:20',
      note: '滝祭り式典が11時20分から。時刻は前回の発表による',
    },
  }],

  // 神社の住所は神奈川県神社庁から。例大祭は8月第1日曜
  ['totsuka-tomizuka-hachimangu-reitaisai', {
    shrine: '冨塚八幡宮',
    venue: { name: '冨塚八幡宮および周辺', address: '横浜市戸塚区戸塚町3828' },
    recurrence: '8月第1日曜日',
    recurrence_source: 'https://www.kanagawa-jinja.or.jp/shrine/1204082-000/',
    links: [
      L('冨塚八幡宮', 'http://www.tomiduka.net/'),
      L('神奈川県神社庁 冨塚八幡宮', 'https://www.kanagawa-jinja.or.jp/shrine/1204082-000/'),
    ],
  }],

  // ------------------------------------------------------------------
  // 東京都
  // ------------------------------------------------------------------

  ['koto-local-fukagawa-jugoya', {
    organizer: '深川十五夜まつり実行委員会',
    shrine: '富岡八幡宮',
    venue: { name: '富岡八幡宮 境内' },
    links: [L('深川十五夜まつり 公式', 'https://www.fukagawa-jugoya.com')],
    occurrence: {
      start_time: '15:00',
      end_time: '20:30',
      note: '時刻は前回の発表による。2026年の発表は未確認',
      year: 2026,
      checked_at: CHECKED,
    },
  }],

  // 町と観光協会の両方が第25回の日程を出している
  ['hachijo-hachijojima-noryo-hanabi', {
    organizer: '八丈島納涼花火大会実行委員会',
    venue: { name: '底土海岸（底土港）' },
    links: [
      L('八丈町 第25回八丈島納涼花火大会', 'https://www.town.hachijo.tokyo.jp/articles/oshirase-20260701-06/'),
      L('八丈島観光協会 第25回八丈島納涼花火大会', 'https://www.hachijo.gr.jp/blogs/hanabi2026/'),
    ],
    occurrence: {
      ...src(2026, 'https://www.town.hachijo.tokyo.jp/articles/oshirase-20260701-06/', '八丈町', 'gov'),
      start_time: '20:11',
      end_time: '20:50',
      note: '前夜祭は8月10日',
    },
  }],

  ['okutama-okutama-noryo-hanabi', {
    venue: { name: '愛宕山広場' },
    links: [L('奥多摩町 第49回奥多摩納涼花火大会開催のお知らせ', 'https://www.town.okutama.tokyo.jp/1/kankosangyoka/kankojoho/1/2758.html')],
    occurrence: {
      ...src(2026, 'https://www.town.okutama.tokyo.jp/1/kankosangyoka/kankojoho/1/2758.html', '奥多摩町', 'gov'),
      start_time: '19:45',
      end_time: '20:20',
    },
  }],
], '検索で見つけた公式・行政ページで裏取り（茨城・栃木・群馬・埼玉・千葉・神奈川・東京）');
