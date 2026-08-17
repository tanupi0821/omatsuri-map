/**
 * 市区町村の slug を採る（全インポーター共通）
 *
 * **同じ市区町村には必ず同じ slug を、違う市区町村には必ず違う slug を。**
 * slug はそのまま URL（`/a/<県>/<市>/`）とファイルの置き場所になるので、
 * ここがずれると**別の市の祭りが同じページに並ぶ**。
 *
 * 以前は 6 本のインポーターがそれぞれ連番を持っていて、しかも
 * **使用済みかどうかを見ずに毎回 001 から振り直していた**。
 * `npm run collect` を流すたびに新しい衝突が生まれ、95 件が巻き込まれていた。
 *
 * 起点（`base`）をインポーターごとに変えてあるのは、
 * 同じ回で複数のインポーターが新しい市を作ったときに番号がぶつからないようにするため。
 * どのインポーターが作った slug かの目印にもなる。
 *
 *   goguynet   1〜    hanabi   300〜   summer  500〜
 *   gotouti  700〜    tsushin  800〜   city-ward 900〜
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { loadAreaList } from '../lib/areas.mjs';
import { citySlug } from '../lib/romaji.mjs';
import { PREFS } from '../lib/prefs.mjs';

const PREF_SLUG = new Map(PREFS.map((p) => [p.slug, p.name]));

/**
 * **エリア定義だけを見ていては足りない。**
 * `src/lib/data.js` は市区町村の slug を**ファイルの置き場所**（パスの 2 階層目）
 * から決めている。定義に無いディレクトリが実在するので、そこも「使用済み」に入れる。
 * さらに、既にファイルが置かれている市区町村は**その置き場所を使い続ける**
 * （新しい slug を振ると、同じ祭りが 2 か所に増える）。
 */
function scanFestivalDirs(root) {
  const dirUsed = new Map(); // pref名 -> Set<slug>
  const placed = new Map(); // `${pref}|${city}` -> Map<slug, 件数>
  const base = join(root, 'data', 'festivals');
  if (!existsSync(base)) return { dirUsed, placed };

  for (const prefSlug of readdirSync(base)) {
    const prefName = PREF_SLUG.get(prefSlug);
    if (!prefName) continue;
    const prefDir = join(base, prefSlug);
    if (!statSync(prefDir).isDirectory()) continue;
    if (!dirUsed.has(prefName)) dirUsed.set(prefName, new Set());

    for (const slug of readdirSync(prefDir)) {
      const cityDir = join(prefDir, slug);
      if (!statSync(cityDir).isDirectory()) continue;
      dirUsed.get(prefName).add(slug);

      // 中の 1 件ずつから area.city を読む。YAML を全部パースすると遅いので
      // 「  city: ◯◯」の行だけを見る
      const stack = [cityDir];
      while (stack.length) {
        const d = stack.pop();
        for (const e of readdirSync(d)) {
          const p = join(d, e);
          if (statSync(p).isDirectory()) { stack.push(p); continue; }
          if (!e.endsWith('.yml')) continue;
          const m = readFileSync(p, 'utf8').match(/^ {2}city:\s*(.+)$/m);
          if (!m) continue;
          const key = `${prefName}|${m[1].trim()}`;
          if (!placed.has(key)) placed.set(key, new Map());
          const byslug = placed.get(key);
          byslug.set(slug, (byslug.get(slug) ?? 0) + 1);
        }
      }
    }
  }
  return { dirUsed, placed };
}

/**
 * @param {string} root リポジトリのルート
 * @returns {{get(pref,city):string|null, assign(pref,city,prefSlug,base?):string}}
 */
/**
 * **政令市の区は、市の slug に割ってから引く。**
 *
 * 「千葉市美浜区」を市の名前のまま引くと、定義にもディレクトリにも無いので
 * 新しい連番を発行してしまう。しかも前回発行したディレクトリは統合で消えて
 * いるから、**実行のたびに別の番号**（chiba-906 → chiba-908 …）になり、
 * 統合の記録（merged.json）では追えない重複が毎回 17 組再生していた。
 * `src/lib/data.js` の splitWard と同じ判定で、先に市へ寄せる。
 */
const SEIREI = [
  '札幌市', '仙台市', 'さいたま市', '千葉市', '横浜市', '川崎市', '相模原市',
  '新潟市', '静岡市', '浜松市', '名古屋市', '京都市', '大阪市', '堺市', '神戸市',
  '岡山市', '広島市', '北九州市', '福岡市', '熊本市',
];
export function cityOfWard(raw) {
  return SEIREI.find((c) => raw !== c && raw.startsWith(c) && raw.endsWith('区')) ?? null;
}

export function makeSlugPool(root) {
  /** `${pref}|${city}` → slug。既に決まっているものは絶対に変えない */
  const known = new Map();
  /**
   * 使用済み slug。**県ごとではなく全国で 1 つ**にする。
   * 置き場所は `<県>/<市>` なので県が違えば衝突しないが、
   * **祭りの id は `<市の slug>-<出典の id>` で全国一意**でなければならない。
   * 県ごとに管理していたら、東京都府中市と広島県府中市がどちらも `fuchu` を取り、
   * `fuchu-goguynet-32700` という同じ id が 2 つできて validate が落ちた。
   */
  const used = new Set();
  const reserve = (_pref, slug) => used.add(slug);

  for (const a of loadAreaList(root)) {
    known.set(`${a.pref}|${a.city}`, a.slug);
    reserve(a.pref, a.slug);
  }

  const { dirUsed, placed } = scanFestivalDirs(root);
  for (const [pref, slugs] of dirUsed) for (const s of slugs) reserve(pref, s);
  // 既にファイルが置かれている市区町村は、その置き場所（いちばん多いもの）を使う
  for (const [key, byslug] of placed) {
    if (known.has(key)) continue;
    const best = [...byslug].sort((a, b) => b[1] - a[1])[0][0];
    known.set(key, best);
  }

  const seq = new Map();

  return {
    /** 既に決まっている slug（無ければ null） */
    get(pref, city) {
      const c = cityOfWard(city) ?? city;
      return known.get(`${pref}|${c}`) ?? null;
    },

    /**
     * 市区町村の slug を返す。決まっていなければ**空いているものを採って登録**する。
     * @param {string} pref 県名（「愛知県」）
     * @param {string} city 市区町村名（「豊川市」「名古屋市名東区」）
     * @param {string} prefSlug 県の slug（「aichi」）
     * @param {number} base 連番の起点（インポーターごとに変える）
     */
    assign(pref, city, prefSlug, base = 1) {
      // 政令市の区は市に寄せる（「千葉市美浜区」→ 千葉市の slug）。
      // ここで寄せないと、区の名前に毎回新しい連番を発行してしまう
      const c = cityOfWard(city) ?? city;
      const key = `${pref}|${c}`;
      if (known.has(key)) return known.get(key);
      const set = used;

      // まずはローマ字表があればそれ。空いていなければ県ごとの連番
      let slug = citySlug(c);
      if (!slug || set.has(slug)) {
        let n = Math.max(seq.get(prefSlug) ?? 0, base - 1);
        do {
          n += 1;
          slug = `${prefSlug}-${String(n).padStart(3, '0')}`;
        } while (set.has(slug));
        seq.set(prefSlug, n);
      }
      known.set(key, slug);
      set.add(slug);
      return slug;
    },
  };
}
