/**
 * 東京フェスタの記事 → 祭りデータ
 *
 *   node scripts/import/tokyofesta.mjs
 *
 * 東京の祭り専門の媒体なので、載っているものはまず祭り。
 * 題名が「京橋盆踊り2026（8月28日～29日 京橋エドグラン）」の形で、
 * 本文が「日時：」「会場：」「主催：」の箇条書き。
 *
 * 市区町村は題名にも本文にも素で出るので、**既に定義してある名前だけを拾う**。
 * 素朴に「◯◯区」を拾うと祭りの名前の一部を区だと思ってしまう。
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { emit, ROOT } from './_lib.mjs';
import { loadAreaList } from '../lib/areas.mjs';
import { citySlug } from '../lib/romaji.mjs';
import { writeNationwideAreas } from './_nationwide.mjs';
import {
  IS_FESTIVAL, NOT_FESTIVAL, KIND, hasStalls,
  pickDates, pickVenue, pickName, pickOrganizer, usableName,
} from './_article.mjs';

const CHECKED = '2026-08-05';
const RAW = join(ROOT, 'data', 'raw', 'tokyofesta', 'posts.json');

if (!existsSync(RAW)) {
  console.error('data/raw/tokyofesta/posts.json がない。先に crawl/tokyofesta.mjs を回すこと');
  process.exit(1);
}

// 東京都の市区町村だけ。長い名前から見る（「東京都北区」が「北区」より先に）
const LOOKUP = loadAreaList(ROOT)
  .filter((a) => a.pref === '東京都')
  .map((a) => ({ pref: a.pref, city: a.city, citySlug: a.slug, key: a.city }))
  .sort((a, b) => b.key.length - a.key.length);

/**
 * 多摩地域の市（武蔵野・立川・府中など）はエリア定義に入っていない。
 * 記事に出てきたら足す。23 区だけの媒体ではないので必要になる。
 */
const generated = new Map();
function ensureCity(name) {
  const hit = LOOKUP.find((a) => a.city === name);
  if (hit) return hit;
  const rec = { pref: '東京都', city: name, citySlug: citySlug(name) ?? null };
  if (!rec.citySlug) return null; // ローマ字が分からない市は足さない
  LOOKUP.push({ ...rec, key: name });
  if (!generated.has('tokyo')) generated.set('tokyo', { pref: '東京都', cities: [] });
  generated.get('tokyo').cities.push({ name, slug: rec.citySlug });
  return rec;
}

/**
 * 記事に区名が出ず、**街の名前だけ**書かれていることが多い
 * （「渋谷キャスト」「巣鴨駅南口」「自由が丘駅前」）。
 * よく出る街を区に対応づける。ここに無いものは取り込まない。
 */
const LANDMARK = {
  渋谷: '渋谷区', 原宿: '渋谷区', 恵比寿: '渋谷区', 代官山: '渋谷区', 道玄坂: '渋谷区',
  新宿: '新宿区', 花園神社: '新宿区', 神楽坂: '新宿区', 高田馬場: '新宿区',
  巣鴨: '豊島区', 池袋: '豊島区', とげぬき地蔵: '豊島区', 大塚: '豊島区',
  自由が丘: '目黒区', 中目黒: '目黒区', 学芸大学: '目黒区',
  神田明神: '千代田区', 秋葉原: '千代田区', 丸の内: '千代田区', 神保町: '千代田区',
  浅草: '台東区', 上野: '台東区', 御徒町: '台東区',
  六本木: '港区', 新橋: '港区', 品川駅: '港区', 麻布: '港区', 赤坂: '港区',
  銀座: '中央区', 日本橋: '中央区', 月島: '中央区', 晴海: '中央区', 築地: '中央区',
  錦糸町: '墨田区', 押上: '墨田区', 両国: '墨田区',
  豊洲: '江東区', 門前仲町: '江東区', 亀戸: '江東区', 富岡八幡宮: '江東区',
  三軒茶屋: '世田谷区', 下北沢: '世田谷区', 二子玉川: '世田谷区',
  高円寺: '杉並区', 阿佐ヶ谷: '杉並区', 荻窪: '杉並区',
  中野: '中野区', 赤羽: '北区', 王子: '北区', 蒲田: '大田区', 大森: '大田区',
  北千住: '足立区', 亀有: '葛飾区', 柴又: '葛飾区', 小岩: '江戸川区', 葛西: '江戸川区',
  // 実データを見て足した分
  築地本願寺: '中央区', 蛇窪神社: '品川区', 品川中央公園: '品川区',
  サンシャインシティ: '豊島区', 大正大学: '豊島区', 西巣鴨: '豊島区',
  隅田公園: '墨田区', 竪川: '墨田区', 東京スカイツリー: '墨田区',
  麻布台ヒルズ: '港区', 東京タワー: '港区', 芝公園: '港区',
  吉祥寺: '武蔵野市', 立川: '立川市', 府中: '府中市', 大國魂神社: '府中市',
  ヒューリック浅草橋: '台東区', 浅草橋: '台東区',
  高輪ゲートウェイ: '港区', 天王洲: '品川区', 八重洲: '中央区',
  代々木公園: '渋谷区', 稲城: '稲城市',
};

/**
 * 東京フェスタは東京の媒体だが、**都外の祭りも少し載る**
 *（横浜・川越・所沢・柏の葉・江の島など）。
 * 全国のエリア定義で当てにいくと誤判定が出た:
 *   「しながわスネークタウン（蛇窪神社）」→ 神奈川県大井町
 *   「すもも祭（府中市・大國魂神社）」→ 広島県府中市
 *   「新潟フェス in 東急歌舞伎町タワー」→ 新潟県長岡市
 * 同名の市が各地にあるため。**この媒体は東京都に限る**。
 * 都外の祭りは号外NET・レアリアなど他の媒体で拾う。
 */
const LANDMARKS = Object.keys(LANDMARK).sort((a, b) => b.length - a.length);

const { items } = JSON.parse(readFileSync(RAW, 'utf8'));
const rowsByCity = new Map();
let noCity = 0; let noDate = 0; let notFestival = 0;

for (const it of items) {
  // 会場のほうが正確なので、本文の頭（＝概要欄）を先に見る
  const head = it.body.slice(0, 600);
  const area = LOOKUP.find((a) => head.includes(a.key))
    ?? LOOKUP.find((a) => it.title.includes(a.key))
    // 区名が出ないときは街の名前から引く
    ?? (() => {
      const lm = LANDMARKS.find((k) => it.title.includes(k) || head.includes(k));
      return lm ? ensureCity(LANDMARK[lm]) : null;
    })();
  if (!area) { noCity++; continue; }

  /**
   * この媒体は**題名がそのまま祭りの名前**（「京橋盆踊り2026（8月28日～29日 …）」）。
   * 本文は時刻表なので、そちらから拾うと
   * 「21:00 （盆踊り大会17:00」のような切れ端になる。題名を先に使う。
   */
  const fromTitle = it.title.replace(/[（(].*$/, '').replace(/^.*[＠@]\s*/, '').trim();
  const name = (usableName(fromTitle) && IS_FESTIVAL.test(fromTitle))
    ? fromTitle
    : pickName(it.body, it.title);
  if (!usableName(name) || !IS_FESTIVAL.test(name) || NOT_FESTIVAL.test(name)) {
    notFestival++; continue;
  }

  const dates = pickDates(it.body, it.title, it.date);
  if (!dates.length) { noDate++; continue; }
  const year = Number(dates[0].slice(0, 4));
  if (dates.some((d) => Number(d.slice(0, 4)) !== year)) { noDate++; continue; }

  const organizer = pickOrganizer(it.body);

  if (!rowsByCity.has(area.city)) rowsByCity.set(area.city, { area, rows: [] });
  rowsByCity.get(area.city).rows.push({
    city: area.city,
    citySlug: area.citySlug,
    slug: `tokyofesta-${it.id}`,
    name,
    kind: KIND(name),
    venue: pickVenue(it.body) ?? `${area.city}内`,
    ...(organizer ? { organizer } : {}),
    // 主催が町会・自治会なら町内会規模、そうでなければ地区規模とみなす
    scale: /町会|自治会|子ども会/.test(organizer ?? '') ? '町内会' : '地区',
    stalls: hasStalls(it.body) ? 'yes' : 'unknown',
    dates,
    year,
    source: it.url,
    sourceName: '東京フェスタ',
    sourceType: 'media',
  });
}

writeNationwideAreas(generated);

for (const [, { area, rows }] of rowsByCity) {
  emit(rows, {
    pref: '東京都',
    prefSlug: 'tokyo',
    label: `東京フェスタ（${area.city}）`,
    checkedAt: CHECKED,
    year: 2026,
  });
}

console.log(`  市区町村不明 ${noCity} / 日付なし ${noDate} / 祭りでない ${notFestival}`);
