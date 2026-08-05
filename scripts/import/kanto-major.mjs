/**
 * 千葉・茨城・栃木・群馬の代表的な祭り
 *
 * この 4 県は神社庁が神社データベースを持っていないので、神社庁ルートが使えない。
 * 神社・市町村・実行委員会の公式サイトから 1 件ずつ拾う、横浜・川崎でやったのと同じ手作業。
 * 数は稼げないが、そのぶん出典の格は高い。
 *
 * 国指定重要無形民俗文化財やユネスコ無形文化遺産のものから優先して入れている。
 * ここを起点に、周辺の町内会レベルの祭りへ広げていく。
 */
import { emit } from './_lib.mjs';

const c = (pref, prefSlug, city, citySlug) => ({ pref, prefSlug, city, citySlug });

const ROWS = [
  // ======================== 千葉県 ========================
  { ...c('千葉県', 'chiba', '香取市', 'katori'), slug: 'sawara-taisai-natsu',
    name: '佐原の大祭 夏祭り（八坂神社祇園祭）', kind: '例大祭',
    organizer: '八坂神社', venue: '八坂神社および小野川周辺（佐原本宿地区）',
    shrine: '八坂神社', scale: '市', tags: ['山車', 'ユネスコ無形文化遺産'],
    recurrence: '7月10日以降の金・土・日曜日',
    recurrenceSource: 'https://www.city.katori.lg.jp/sightseeing/matsuri/introduction/natsu.html',
    dates: ['2026-07-10', '2026-07-11', '2026-07-12'], start: '10:00', end: '22:00',
    note: '関東三大山車祭りのひとつ。2026年は成田祇園祭と11年ぶりに同日開催',
    source: 'https://www.city.katori.lg.jp/sightseeing/matsuri/introduction/natsu.html',
    sourceName: '香取市 公式', sourceType: 'gov' },

  { ...c('千葉県', 'chiba', '香取市', 'katori'), slug: 'sawara-taisai-aki',
    name: '佐原の大祭 秋祭り（諏訪神社秋祭り）', kind: '秋祭り',
    organizer: '諏訪神社', venue: '諏訪神社および新宿地区', shrine: '諏訪神社',
    scale: '市', tags: ['山車', 'ユネスコ無形文化遺産'],
    recurrence: '10月第2土曜日を中心とした3日間',
    recurrenceSource: 'https://www.city.katori.lg.jp/sightseeing/matsuri/introduction/aki.html',
    dates: ['2026-10-11', '2026-10-12'],
    source: 'https://www.city.katori.lg.jp/sightseeing/matsuri/introduction/aki.html',
    sourceName: '香取市 公式', sourceType: 'gov' },

  { ...c('千葉県', 'chiba', '成田市', 'narita'), slug: 'narita-gion-sai',
    name: '成田祇園祭', kind: '夏祭り',
    venue: '成田山新勝寺および成田山表参道', scale: '市', station: '成田',
    tags: ['山車', '屋台'],
    dates: ['2026-07-10', '2026-07-11', '2026-07-12'],
    note: '2026年は佐原の大祭夏祭りと11年ぶりに同日開催',
    source: 'https://maruchiba.jp/event/detail_10868.html',
    sourceName: 'ちば観光ナビ（千葉県公式観光サイト）', sourceType: 'gov' },

  // ======================== 茨城県 ========================
  { ...c('茨城県', 'ibaraki', '石岡市', 'ishioka'), slug: 'ishioka-no-omatsuri',
    name: '石岡のおまつり（常陸國總社宮 例大祭）', kind: '例大祭',
    organizer: '常陸國總社宮', venue: '常陸國總社宮および石岡市中心部',
    shrine: '常陸國總社宮', scale: '市', station: '石岡',
    tags: ['山車', '獅子', '神輿'],
    recurrence: '敬老の日を最終日とする3日間',
    recurrenceSource: 'https://sosyagu-reitaisai.com/',
    dates: ['2026-09-15', '2026-09-19', '2026-09-20', '2026-09-21'],
    start: '09:00', end: '21:00',
    note: '関東三大祭りのひとつ。9/15 例祭、9/19 神幸祭、9/20 奉祝祭・奉納相撲、9/21 還幸祭。山車と獅子は9:00〜21:00、13:00〜21:00は中心部で交通規制。2026年の年番町は森木町',
    links: ['https://www.ishioka-kankou.com/events/ishioka-matsuri/'],
    source: 'https://sosyagu-reitaisai.com/',
    sourceName: '常陸國總社宮例大祭 公式', sourceType: 'official' },

  { ...c('茨城県', 'ibaraki', '鹿嶋市', 'kashima'), slug: 'kashima-jingu-saitosai',
    name: '鹿島神宮 祭頭祭', kind: '神事',
    organizer: '鹿島神宮', venue: '鹿島神宮および大町通り', shrine: '鹿島神宮',
    scale: '市', station: '鹿島神宮', tags: ['重要無形民俗文化財'],
    recurrence: '3月9日（3月9日が平日の年は祭頭囃しを直後の土曜に分ける）',
    recurrenceSource: 'https://www.city.kashima.ibaraki.jp/site/kankou/9110.html',
    dates: ['2026-03-09', '2026-03-14'], start: '10:00',
    note: '3/9 10:00 祭頭祭（本殿での神事）、3/14 祭頭囃し・春季祭。3/14は鹿島神宮前の大町通り一帯が歩行者天国になる',
    source: 'https://www.city.kashima.ibaraki.jp/site/kankou/9110.html',
    sourceName: '鹿嶋市 公式', sourceType: 'gov' },

  // ======================== 栃木県 ========================
  { ...c('栃木県', 'tochigi', '日光市', 'nikko'), slug: 'toshogu-shunki-reitaisai',
    name: '日光東照宮 春季例大祭', kind: '例大祭',
    organizer: '日光東照宮', venue: '日光東照宮および表参道', shrine: '日光東照宮',
    scale: '市', station: '日光', tags: ['流鏑馬', '武者行列'],
    recurrence: '5月17日〜18日',
    recurrenceSource: 'https://toshogu.jp/pages/28/',
    dates: ['2026-05-17', '2026-05-18'],
    note: '5/17 10:00頃 例祭、13:00頃 神事流鏑馬。5/18 11:00頃 渡御祭（百物揃千人武者行列）',
    links: ['https://toshogu.jp/pages/28/'],
    source: 'https://www.tochigiji.or.jp/event/e15062/',
    sourceName: 'とちぎ旅ネット（栃木県観光物産協会）', sourceType: 'gov' },

  { ...c('栃木県', 'tochigi', '那須烏山市', 'nasukarasuyama'), slug: 'karasuyama-yamaage',
    name: '烏山の山あげ行事（八雲神社 例大祭）', kind: '例大祭',
    organizer: '八雲神社', venue: '烏山市街地', shrine: '八雲神社', scale: '市',
    tags: ['ユネスコ無形文化遺産', '重要無形民俗文化財', '野外歌舞伎'],
    recurrence: '7月第4土曜日を含む金・土・日曜日',
    recurrenceSource: 'https://www.tochigiji.or.jp/event/e16221/',
    dates: ['2026-07-24', '2026-07-25', '2026-07-26'],
    note: '1560年から460年以上続く。国指定重要無形民俗文化財、ユネスコ無形文化遺産',
    source: 'https://www.tochigiji.or.jp/event/e16221/',
    sourceName: 'とちぎ旅ネット（栃木県観光物産協会）', sourceType: 'gov' },

  { ...c('栃木県', 'tochigi', '鹿沼市', 'kanuma'), slug: 'kanuma-imamiya-yatai',
    name: '鹿沼今宮神社祭の屋台行事', kind: '例大祭',
    organizer: '今宮神社', venue: '今宮神社および鹿沼市街地', shrine: '今宮神社',
    scale: '市', tags: ['ユネスコ無形文化遺産', '重要無形民俗文化財', '屋台'],
    recurrence: '10月',
    recurrenceSource: 'https://www.pref.tochigi.lg.jp/culture/bunkajoho/tokushu/matsuri.html',
    dates: [], date_note: '10月（2026年の日程は未発表）', status: 'unconfirmed',
    note: '二十数台の屋台が練り歩いておはやしを競う。ユネスコ無形文化遺産',
    source: 'https://www.pref.tochigi.lg.jp/culture/bunkajoho/tokushu/matsuri.html',
    sourceName: '栃木県 公式', sourceType: 'gov' },

  // ======================== 群馬県 ========================
  { ...c('群馬県', 'gunma', '桐生市', 'kiryu'), slug: 'kiryu-yagibushi-matsuri',
    name: '桐生八木節まつり（第63回）', kind: '夏祭り',
    venue: '桐生市内各所', scale: '市', station: '桐生', tags: ['八木節'],
    dates: ['2026-08-07', '2026-08-08', '2026-08-09'],
    links: ['http://www.kiryu-maturi.net/schedule.html'],
    source: 'https://www.gunlabo.net/event/event.shtml?id=906',
    sourceName: 'ぐんラボ！', sourceType: 'media' },

  { ...c('群馬県', 'gunma', '沼田市', 'numata'), slug: 'numata-matsuri',
    name: '沼田まつり', kind: '夏祭り',
    organizer: '沼田市', venue: '沼田市中心市街地', scale: '市', station: '沼田',
    tags: ['神輿', '山車'],
    dates: ['2026-08-03', '2026-08-04', '2026-08-05'],
    note: '江戸時代からの須賀神社「祇園祭」と「沼田まつり商工祭」を統合した祭り。来場者20万人超',
    source: 'https://www.city.numata.gunma.jp/kanko/numatamatsuri/',
    sourceName: '沼田市 公式', sourceType: 'gov' },

  { ...c('群馬県', 'gunma', '富岡市', 'tomioka'), slug: 'nukisaki-jinja-reisai',
    name: '一之宮貫前神社 例祭（古武道奉納演武）', kind: '例大祭',
    organizer: '一之宮貫前神社', venue: '一之宮貫前神社', shrine: '一之宮貫前神社',
    scale: '市', tags: ['古武道'],
    dates: ['2026-05-26'], start: '10:00',
    note: '上野国一之宮',
    links: ['http://nukisaki.or.jp/'],
    source: 'https://gunma-kanko.jp/spots/585',
    sourceName: '観光ぐんま（群馬県観光物産国際協会）', sourceType: 'gov' },

  { ...c('群馬県', 'gunma', '前橋市', 'maebashi'), slug: 'maebashi-tanabata',
    name: '前橋七夕まつり（第76回）', kind: '夏祭り',
    venue: '前橋市中心商店街', scale: '市', station: '前橋',
    dates: ['2026-07-10', '2026-07-11', '2026-07-12'],
    links: ['https://maebashi-tanabata.jp/'],
    source: 'https://www.maebashi-cvb.com/feature/tanabata/tanabata',
    sourceName: '前橋観光コンベンション協会', sourceType: 'gov' },

  { ...c('群馬県', 'gunma', '前橋市', 'maebashi'), slug: 'maebashi-hanabi',
    name: '前橋花火大会（第70回）', kind: '花火',
    venue: '利根川河畔', scale: '市', station: '前橋', tags: ['花火'],
    dates: ['2026-08-08'],
    links: ['https://www.maebashihanabi.jp/'],
    source: 'https://hanabi.walkerplus.com/detail/ar0310e00917/',
    sourceName: 'ウォーカープラス', sourceType: 'aggregator' },
];

// 県ごとに分けて emit（emit は 1 県 1 回）
const byPref = new Map();
for (const r of ROWS) {
  const k = r.prefSlug;
  if (!byPref.has(k)) byPref.set(k, []);
  byPref.get(k).push(r);
}
for (const [prefSlug, rows] of byPref) {
  emit(rows, {
    pref: rows[0].pref,
    prefSlug,
    label: `${rows[0].pref}（主要な祭り）`,
    checkedAt: '2026-08-02',
    year: 2026,
  });
}
