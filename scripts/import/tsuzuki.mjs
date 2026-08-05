/**
 * 都筑区インポーター
 *
 * 出典: むつづき「【2026年版】都筑区の夏祭り一覧｜センター南・北エリア別に紹介」
 *       https://www.tsudzuki.mutsuki.yokohama/summerfes/
 *
 * 横浜18区のなかでいちばん町内会単位の祭りが網羅されている。港北ニュータウンは
 * 自治会が新しく整っていて、告知もきちんと出るのが効いている。
 */
import { emit } from './_lib.mjs';

const ROWS = [
  { slug: 'kagahara-2-noryotaikai', name: '加賀原二丁目 納涼大会', kind: '納涼祭',
    organizer: '加賀原二丁目自治会', venue: 'ぎんなん公園',
    dates: ['2026-07-19'], start: '17:00', end: '21:00' },

  { slug: 'bosch-forum-tsuzuki-natsumatsuri', name: 'ボッシュフォーラムつづき夏まつり2026', kind: '夏祭り',
    organizer: 'ボッシュホール・センター北・中川中央町内会ほか', venue: 'ボッシュホール 全天候広場・プラッツ',
    scale: '地区', dates: ['2026-07-19'], start: '16:00', end: '20:00' },

  { slug: 'tetsunagi-matsuri', name: 'てつなぎまつり', kind: '夏祭り',
    venue: '横浜あゆみ荘', dates: ['2026-07-24'], start: '10:30', end: '14:30',
    tags: ['昼開催'] },

  { slug: 'minamiyamata-mushiokuri', name: '南山田町内会 虫送り（第48回）', kind: '夏祭り',
    organizer: '南山田町内会・虫送り行事保存会', venue: '山田神社・なつみかん公園',
    shrine: '山田神社', dates: ['2026-07-25'], start: '17:00', end: '20:00',
    note: '終了は20:00頃' },

  { slug: 'katsuta-bonodori', name: '勝田町・勝田南町内会 納涼盆踊り大会', kind: '盆踊り',
    organizer: '勝田町内会・勝田南町内会', venue: '勝田杉山神社', shrine: '勝田杉山神社',
    dates: ['2026-07-25'], start: '18:30', end: '20:30' },

  { slug: 'fujimigaoka-natsumatsuri', name: '富士見が丘夏まつり', kind: '夏祭り',
    organizer: '富士見が丘自治会', venue: '川和富士公園',
    dates: ['2026-07-25'], start: '16:30', end: '21:00' },

  { slug: 'ushikubo-bonodori', name: '牛久保町内会 納涼盆踊り大会（第41回）', kind: '盆踊り',
    organizer: '牛久保町内会', venue: '牛久保あやめ公園',
    dates: ['2026-07-25'], start: '17:00', end: '20:00' },

  { slug: 'shibusawa-bonodori', name: '渋沢連合自治会 盆踊り', kind: '盆踊り',
    organizer: '渋沢連合自治会', venue: '荏田東第一小学校', scale: '地区',
    dates: ['2026-07-25'], start: '15:00', end: '20:00' },

  { slug: 'shimoyabune-bonodori', name: '下藪根自治会 納涼盆踊り大会', kind: '盆踊り',
    organizer: '下藪根自治会', venue: '下藪根公園',
    dates: ['2026-07-25'], start: '18:00', end: '21:00' },

  { slug: 'kawawa-jidohome-ennichi', name: '川和児童ホーム ミニえんにち', kind: '縁日',
    organizer: '川和児童ホーム', venue: '川和児童ホーム',
    dates: ['2026-07-25'], start: '13:00', end: '15:00', tags: ['子ども向け', '昼開催'] },

  { slug: 'okuma-bonodori', name: '大熊町内会 盆踊り大会', kind: '盆踊り',
    organizer: '大熊町内会', venue: '大熊公園・大熊杉山神社', shrine: '大熊杉山神社',
    dates: ['2026-07-31', '2026-08-01'], start: '18:00', end: '20:00' },

  { slug: 'orita-fudo-natsumatsuri', name: '折田不動公園 夏まつり', kind: '夏祭り',
    venue: '折田不動公園 多目的広場',
    dates: ['2026-08-01'], start: '16:00', end: '20:00' },

  { slug: 'ushikubo-higashi-natsumatsuri', name: '牛久保東町内会 夏まつり', kind: '夏祭り',
    organizer: '牛久保東町内会', venue: '中川小学校',
    dates: ['2026-08-01'], start: '16:00', end: '20:30' },

  { slug: 'ushikubo-nishi-bonodori', name: '牛久保西町内会 納涼盆踊り大会', kind: '盆踊り',
    organizer: '牛久保西町内会', venue: 'ひかりが丘児童公園',
    dates: ['2026-08-01'], start: '17:00', end: '20:00' },

  { slug: 'hachimanyama-natsumatsuri', name: '八幡山夏祭り', kind: '夏祭り',
    organizer: '中川東町内会', venue: '中川八幡山公園',
    dates: ['2026-08-01'], start: '16:00', end: '20:30' },

  { slug: 'yugi-edaminami-natsumatsuri', name: '柚木荏田南夏まつり（第14回）', kind: '夏祭り',
    organizer: '柚木荏田南連合自治会', venue: '折田不動公園 多目的広場', scale: '地区',
    dates: ['2026-08-01'], start: '16:00', end: '20:00' },

  { slug: 'ikonobe-kawachi-bonodori', name: '池辺川内自治会 盆踊り大会', kind: '盆踊り',
    organizer: '池辺川内自治会', venue: '鶴見川 河川敷',
    dates: ['2026-08-01'], start: '18:00' },

  { slug: 'kawawa-bonodori', name: '川和町内会 夏祭り盆踊り大会', kind: '盆踊り',
    organizer: '川和町内会', venue: '川和小学校',
    dates: ['2026-08-01'], start: '16:45', end: '21:00',
    note: '一部16:45〜18:30、二部18:45〜21:00' },

  { slug: 'kawamukai-bonodori', name: '川向町内会 納涼盆踊り大会', kind: '盆踊り',
    organizer: '川向町内会', venue: '川向稲荷神社', shrine: '川向稲荷神社',
    dates: ['2026-08-01'], start: '18:30' },

  { slug: 'nakazato-bonodori', name: '中里自治会 ぼんおどり大会', kind: '盆踊り',
    organizer: '中里自治会', venue: '中里公園',
    dates: ['2026-08-01'], start: '17:00' },

  { slug: 'kitayamata-natsumatsuri', name: '北山田町内会 夏まつり', kind: '夏祭り',
    organizer: '北山田町内会', venue: '山田富士公園',
    dates: ['2026-08-01', '2026-08-02'], start: '18:00', end: '21:00' },

  { slug: 'higashikata-noryotaikai', name: '東方町内会 納涼大会', kind: '納涼祭',
    organizer: '東方町内会', venue: '東方天満宮', shrine: '東方天満宮',
    dates: ['2026-08-01', '2026-08-02'], start: '18:00', end: '20:30' },

  { slug: 'minamiyamata-bonodori', name: '南山田町内会 納涼盆踊り大会', kind: '盆踊り',
    organizer: '南山田町内会', venue: 'ぼうけん公園',
    dates: ['2026-08-07', '2026-08-08'], start: '19:00', end: '21:30' },

  { slug: 'orimoto-natsumatsuri', name: '折本町内会 夏祭り', kind: '夏祭り',
    organizer: '折本町内会', venue: '西原公園',
    dates: ['2026-08-08'], start: '17:00', end: '21:00' },

  { slug: 'kachida-mini-bonodori', name: 'かちだ連合自治会 ミニ盆踊り大会', kind: '盆踊り',
    organizer: 'かちだ連合自治会', venue: '勝田団地第一集会所・第二公園', scale: '地区',
    dates: ['2026-08-09'], start: '16:00' },

  { slug: 'higashiyamata-noryo-natsumatsuri', name: '東山田連合町内会 納涼夏祭り', kind: '夏祭り',
    organizer: '東山田連合町内会', venue: '山田小学校', scale: '地区',
    dates: ['2026-08-22'], start: '17:00', end: '21:00' },

  { slug: 'edaminami-natsumatsuri', name: '荏田南夏祭り', kind: '夏祭り',
    organizer: '荏田南連合自治会', venue: '荏田南小学校', scale: '地区',
    dates: ['2026-08-22'], start: '16:30', end: '21:00' },

  { slug: 'edasho-natsumatsuri', name: '荏田小学校 夏まつり', kind: '夏祭り',
    venue: '荏田小学校', dates: ['2026-08-22'], start: '17:00' },

  { slug: 'chigadai-bonodori', name: 'ちがだい盆踊り', kind: '盆踊り',
    venue: '茅ヶ崎台小学校', dates: ['2026-08-22'], start: '17:00', end: '20:00' },

  { slug: 'mihanayama-natsumatsuri', name: '見花山自治会 夏祭り', kind: '夏祭り',
    organizer: '見花山自治会', venue: '見花山かりん公園',
    dates: ['2026-08-22'], start: '15:00', end: '21:00' },

  { slug: 'sumire-natsumatsuri', name: 'すみれ夏祭り（第13回）', kind: '夏祭り',
    organizer: 'すみれ夏祭り実行委員会', venue: 'すみれが丘小学校',
    dates: ['2026-08-22'], start: '15:30', end: '21:00' },

  { slug: 'edakin-yomiseichi', name: 'えだきん夜店市', kind: '縁日',
    venue: 'えだきん商店街 えだきん広場', scale: '地区',
    dates: ['2026-08-26'], start: '15:00', end: '20:00' },

  { slug: 'kosodate-jizo-matsuri-bazaar', name: 'みんなのバザール in 子育て地蔵まつり', kind: '夏祭り',
    venue: 'みなきたウォーク', dates: ['2026-09-12'], start: '10:00', end: '15:00',
    tags: ['昼開催'] },

  { slug: 'ikonobe-sugiyama-reitaisai', name: '池辺町杉山神社 例大祭', kind: '例大祭',
    organizer: '池辺町連合自治会', venue: '池辺町杉山神社', shrine: '池辺町杉山神社',
    scale: '地区', dates: ['2026-09-23'], start: '12:00', end: '21:00' },

  { slug: 'chigasaki-higashi-yusuzumi', name: '茅ケ崎東町内会 夕涼み会', kind: '納涼祭',
    organizer: '茅ケ崎東町内会', venue: '茅ケ崎東小学校',
    dates: ['2026-09-26'], start: '16:00', end: '20:00' },
];

emit(ROWS, {
  pref: '神奈川県', city: '横浜市', ward: '都筑区',
  prefSlug: 'kanagawa', citySlug: 'yokohama', wardSlug: 'tsuzuki',
  source: 'https://www.tsudzuki.mutsuki.yokohama/summerfes/',
  sourceName: 'むつづき（横浜市北部エリアの地域情報サイト）',
  checkedAt: '2026-08-02',
  year: 2026,
});
