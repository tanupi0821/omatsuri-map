/**
 * 市区町村名の辞書と、「記事が実際にどの市区町村の話か」を決める処理
 *
 * 号外NET・名鑑（gotouti）の両方で同じ問題に当たるので切り出した。
 *
 * **地域メディアは自分の版の名前と違う市町村の祭りも記事にする。**
 * 号外NET 帯広版は題名を必ず「【帯広市】」で始めるが、中身は
 * 大樹町の歴舟川清流まつり・広尾町の十勝港まつり・更別村のすももの里まつりで、
 * **版の名前で市区町村を決めると全部が帯広市の祭りになる**。
 *
 * 辞書は `data/areas` と、名鑑（news.gotouti.jp）の「行政区域」欄から作る。
 * 全国の市区町村表を別に持ち込むより、出典と同じ表記で揃うぶん確実。
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadAreaList } from '../lib/areas.mjs';
import { PREFS } from '../lib/prefs.mjs';

const PREF_NAMES = PREFS.map((p) => p.name);

/** @type {Map<string, Set<string>>} 県名 → 市区町村名の集合 */
export const GAZETTEER = new Map();

export function buildGazetteer(root) {
  if (GAZETTEER.size) return GAZETTEER;
  buildFamily(root);
  const put = (pref, city) => {
    if (!pref || !city) return;
    if (!GAZETTEER.has(pref)) GAZETTEER.set(pref, new Set());
    GAZETTEER.get(pref).add(city);
  };

  for (const a of loadAreaList(root)) {
    put(a.pref, a.city);
    for (const w of a.wards ?? []) put(a.pref, w.name);
  }

  const idx = join(root, 'data', 'raw', 'gotouti', 'index.json');
  if (existsSync(idx)) {
    for (const it of JSON.parse(readFileSync(idx, 'utf8')).items) {
      for (const a of it.areas ?? []) {
        const pref = PREF_NAMES.find((p) => a.startsWith(p));
        if (!pref) continue;
        // 「北海道広尾郡広尾町」→ 郡を落として「広尾町」
        const rest = a.slice(pref.length).replace(/[（(].*$/, '').replace(/^.+?郡/, '');
        const m = rest.match(/^(.+?[市区町村])/);
        if (!m) continue;
        let city = m[1];
        const w = rest.slice(city.length).match(/^(.+?区)/);
        if (w && /市$/.test(city)) city = city + w[1];
        put(pref, city);
      }
    }
  }
  return GAZETTEER;
}

/**
 * 政令市の一族（「川崎市」と「中原区」「高津区」…）。
 *
 * 版が「【中原区】」で本文に「川崎市」が何度も出るのは当たり前で、
 * **区を市に置き換えてはいけない**（細かい方が正しい）。
 * 一族の中での言い換えは無視する。
 * @type {Map<string, string>} 市区町村名 → 一族の代表名
 */
const FAMILY = new Map();

function buildFamily(root) {
  for (const a of loadAreaList(root)) {
    if (!a.wards?.length) continue;
    FAMILY.set(a.city, a.city);
    for (const w of a.wards) FAMILY.set(w.name, a.city);
  }
}

/** 同じ政令市の一族か（「福岡市」と「福岡市中央区」のような表記も含む） */
function sameFamily(a, b) {
  if (!a || !b) return false;
  if (FAMILY.has(a) && FAMILY.has(b) && FAMILY.get(a) === FAMILY.get(b)) return true;
  /**
   * 「福岡市」と「福岡市中央区」。**長いほうが区で終わるときだけ**にする。
   * 素朴に前方一致で見ると、版の名前が「遠野市・北上市」のような
   * 複数市の並びのときに「遠野市」まで一族とみなして消してしまう。
   */
  const [s, l] = a.length <= b.length ? [a, b] : [b, a];
  return /市$/.test(s) && /区$/.test(l) && l.startsWith(s);
}

/** その県の市区町村名（郡付きの表記も郡なしに均す） */
function citiesOf(pref) {
  const out = new Set();
  for (const c of GAZETTEER.get(pref) ?? []) out.add(c.replace(/^.+?郡/, ''));
  return out;
}

/**
 * 文中に出てくる**実在する市区町村名**を全部返す。
 *
 * 正規表現で `.{2,6}[市区町村]` と書くと貪欲に伸びて、
 * 「西都市中心市街地」から「西都市中心市」という実在しない名前を作ってしまう。
 * 市区町村で終わる位置ごとに、長い方から辞書に当てること。
 */
export function citiesIn(text, pref = null) {
  const dict = pref
    ? citiesOf(pref)
    : new Set([...GAZETTEER.values()].flatMap((s) => [...s].map((c) => c.replace(/^.+?郡/, ''))));
  const out = [];
  const s = String(text ?? '');
  for (let i = 0; i < s.length; i++) {
    if (!/[市区町村]/.test(s[i])) continue;
    for (let L = 7; L >= 2; L--) {
      if (i - L + 1 < 0) continue;
      const c = s.slice(i - L + 1, i + 1);
      if (dict.has(c)) { out.push(c); break; }
    }
  }
  return [...new Set(out)];
}

/** 「帯広市」→「帯広」。本文は市町村名を略して書くことが多い */
const stem = (c) => c.replace(/[市区町村]$/, '').replace(/^.+?郡/, '');

const countOf = (text, word) => {
  if (!word) return 0;
  let n = 0;
  let i = text.indexOf(word);
  while (i >= 0) { n++; i = text.indexOf(word, i + word.length); }
  return n;
};

/**
 * 記事が実際にどの市区町村の話かを決める。
 *
 * @param {string} editionCity 版の名前から取った既定の市区町村（【帯広市】）
 * @param {string} title       題名（【】は呼び出し側で外さなくてよい）
 * @param {string} body        本文
 * @param {string} pref        県名
 * @returns {string} 採用する市区町村名
 *
 * 判定は**言及の重み付け**。題名は 3 倍、本文の頭 600 字は 1 倍で数える。
 * 「【帯広市】…広尾町「十勝港まつり」へGO！」は広尾町が勝つ。
 * どこも言及されていなければ既定（版の名前）のまま。
 *
 * 略称で数えるのは、本文が「帯広の」「広尾の」と書くため。
 * 略称は候補すべてに同じ規則で使うので、どれかが不利になることはない。
 */
export function actualCity(editionCity, title, body, pref) {
  // 題名の先頭の【】は版の名札であって記事の中身ではない。証拠から外す
  const t = String(title ?? '').replace(/^【[^】]*】/, '');
  const head = String(body ?? '').slice(0, 600);

  const cands = new Set([editionCity, ...citiesIn(t, pref), ...citiesIn(head, pref)]);
  cands.delete(undefined);
  // **同じ政令市の一族への言い換えは採らない。**「【中原区】…川崎市…」で
  // 川崎市に置き換えると、区まで分かっていたものを市に丸めてしまう
  for (const c of [...cands]) if (c !== editionCity && sameFamily(c, editionCity)) cands.delete(c);
  if (cands.size <= 1) return editionCity;

  const scoreOf = (c) => 3 * countOf(t, stem(c)) + countOf(head, stem(c));
  const editionScore = scoreOf(editionCity);

  let best = editionCity;
  let bestScore = editionScore;
  for (const c of cands) {
    if (c === editionCity) continue;
    const score = scoreOf(c);
    if (score > bestScore) { bestScore = score; best = c; }
  }

  /**
   * **版の名前を覆すには 3 点以上要る。**
   * 実データで測ると、正しい置き換え（帯広版の大樹町・広尾町・更別村・幕別町・
   * 中札内村・陸別町）はどれも 3〜11 点で、版の名前は 0 点だった。
   * 一方、誤った置き換え（印西市→柏市、久米田池夏まつりの岸和田市→貝塚市）は
   * すべて 1 点で、本文に一度出てきただけだった。
   */
  return bestScore >= 3 && best !== editionCity ? best : editionCity;
}
