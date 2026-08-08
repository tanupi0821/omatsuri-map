/**
 * 花火大会の有料観覧席の有無を入れる（ウォーカープラスの詳細ページから）
 *
 *   node scripts/enrich/paid-seats-01-walker.mjs
 *
 * ## なぜこれが一番先か
 *
 * ウォーカープラスの花火大会の詳細ページ `/detail/<id>/data.html` には
 * **「有料席」という欄があり、「あり」か「なし」がはっきり書いてある。**
 * 記事の本文から読み取るのではなく、**出典が項目として持っている値**なので、
 * 「有料席の記述が見つからない」＝「無い」という危ない推測をしなくて済む。
 *
 * - 「なし」… **出典が有料席を設けないと言っている**ので `paid_seats: no`
 * - 「あり」… `paid_seats: yes`。欄に席種や料金が添えられていれば note に書く
 * - 欄が無い／値が空 … `unknown` のまま**何も書かない**
 *
 * **「有料席」の欄そのものが無いページは触らない。** 分からないものを
 * 無料と申告するのが、この作業でいちばんやってはいけないこと。
 *
 * ## 「有料席なし」がそのまま「無料」にならない場合がある
 *
 * `paid_seats: no` は詳細ページの構造化データで `isAccessibleForFree`（入場無料）
 * になる。ところが**遊園地・動物園・テーマパークの花火は、有料席は無くても
 * 施設の入園料が要る**（リトルワールド、明治村、ハウステンボスなど）。
 * ここで `no` にすると「無料で入れる」と嘘をつくことになるので、
 * **会場が入場料を取る施設らしいものは `unknown` のままにして、理由を note に残す。**
 * ウォーカープラスの花火の詳細ページには料金の欄が無いので、
 * 入園料の有無はこのページからは分からない。
 *
 * ## 取ってきかた
 *
 * HTML は `data/raw/walker-detail/hanabi-<id>.data.html` に置いてある
 * （`scripts/crawl/hanabi-detail.mjs` と同じ行儀・3.5 秒あけて取得したもの）。
 * このスクリプトはディスク上の HTML を読むだけで、ネットワークには出ない。
 * **取得が途中でも、そこまでのぶんだけ反映される**ので、何度流してもよい。
 *
 * 料金は年で変わるので、note には必ず「2026年は」と年を書く。
 */
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RAW = join(ROOT, 'data', 'raw', 'walker-detail');

/** HTML の実体参照とタグを落として素の文字にする */
const text = (html) =>
  html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

/** data.html から <th>見出し</th><td>値</td> を引く */
const cell = (html, th) => {
  const re = new RegExp(`<th>\\s*${th}\\s*</th>\\s*<td[^>]*>([\\s\\S]*?)</td>`, 'i');
  const m = re.exec(html);
  return m ? text(m[1]) : null;
};

// --- 取得済みの HTML から「有料席」の値を集める ------------------------------
const seats = new Map(); // walker id → { value, raw }
if (existsSync(RAW)) {
  for (const e of readdirSync(RAW)) {
    const m = /^hanabi-([a-z0-9]+)\.data\.html$/i.exec(e);
    if (!m) continue;
    const html = readFileSync(join(RAW, e), 'utf8');
    const v = cell(html, '有料席');
    if (!v) continue;
    seats.set(m[1], v);
  }
}
console.log(`ウォーカープラスの詳細ページから「有料席」欄を読めたもの: ${seats.size} 件`);

// --- 祭りを走査して書き込む --------------------------------------------------
const walk = (d, out = []) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.yml')) out.push(p);
  }
  return out;
};

const walkerId = (f) => {
  const urls = [
    f.occurrences?.[0]?.source_url,
    ...(f.links || []).map((l) => (typeof l === 'string' ? l : l?.url)),
  ].filter(Boolean);
  for (const u of urls) {
    const m = /hanabi\.walkerplus\.com\/detail\/([a-z0-9]+)/i.exec(u);
    if (m && seats.has(m[1])) return m[1];
  }
  // **出典を一次情報に格上げしたときにウォーカープラスの URL が消えていることがある。**
  // id は取り込み時にウォーカープラスの id から作っているので、そこからも引く
  // （`aichi-002-hanabi-ar0623e00816` の `ar0623e00816`）
  const m = /-hanabi-([a-z0-9]+)$/i.exec(f.id || '');
  if (m && seats.has(m[1])) return m[1];
  return null;
};

/**
 * 入場料を取る施設が会場のものは「有料席なし＝無料」とは言えない。
 * 遊園地・動物園・水族館・テーマパーク・野球場など、
 * **入るのにお金が要るのが普通の場所**を拾う。
 * 河川敷・公園・港・海岸のような、ふだん誰でも入れる場所は対象外。
 */
const PAID_VENUE = /リトルワールド|明治村|ハウステンボス|ラグーナ|ナガシマ|よみうりランド|としまえん|ディズニー|USJ|ユニバーサル|シーパラ|八景島|東武動物公園|那須ハイランド|富士急|ひらかたパーク|鈴鹿サーキット|モビリティリゾート|西武園|グリーンランド|スペースワールド|レオマ|ネスタリゾート|東京ドーム|スタジアム|球場|水族館|動物園|遊園地|テーマパーク|遊園|ランド|パーク[^ァ-ヶ]|園地|サーキット|スキー場|ゴルフ/;
const isPaidVenue = (f) => PAID_VENUE.test(`${f.name || ''} ${f.venue?.name || ''}`);

let yes = 0;
let no = 0;
let facility = 0;
let skipped = 0;
for (const p of walk(join(ROOT, 'data', 'festivals'))) {
  let f;
  try {
    f = parse(readFileSync(p, 'utf8'));
  } catch {
    continue;
  }
  if (f.kind !== '花火' && !/花火/.test(f.name || '')) continue;
  const id = walkerId(f);
  if (!id) continue;
  const v = seats.get(id);

  let val = null;
  let note = null;
  if (/^なし/.test(v)) {
    if (isPaidVenue(f)) {
      // 有料席は無いが、会場そのものが入場料を取る施設。無料とは言えない
      val = 'unknown';
      note = '出典の「有料席」欄は「なし」だが、会場が入場料の要る施設なので無料とは言えない。施設の入場料については別途確認が要る';
      facility++;
    } else {
      val = 'no';
      note = '2026年は有料観覧席を設けない（出典の「有料席」欄が「なし」）';
    }
  } else if (/^あり/.test(v)) {
    val = 'yes';
    // 「あり」のあとに席種や料金が続くことがある。頭の「あり」だけ落とす
    const extra = v.replace(/^あり[\s。、,・]*/, '').trim();
    note = extra && !/^詳細未定$/.test(extra)
      ? `2026年は有料観覧席あり（${extra}）`
      : '2026年は有料観覧席あり（席種・料金は出典に記載なし）';
  } else {
    skipped++;
    continue; // 「あり」「なし」以外は分からない扱いにして触らない
  }

  if (f.paid_seats === val && f.paid_seats_note === note) continue;
  f.paid_seats = val;
  f.paid_seats_note = note;
  writeFileSync(p, stringify(f, { lineWidth: 0 }), 'utf8');
  if (val === 'yes') yes++;
  else if (val === 'no') no++;
}
console.log(`有料席あり ${yes} 件 / 無し ${no} 件 / 入場料の要る施設なので unknown にした ${facility} 件 / 値が「あり・なし」でなく触らなかった ${skipped} 件`);
