/**
 * 神社庁の「例祭日」表記を実際の日付に変換する。
 *
 * 神社庁は日付をルールで持っている:
 *   「１０月第１日曜日」「9月15日に近い日曜日」「8月第一土曜日」「1月1日」
 *   「10月9日～10日」「体育の日」「4月第2土・日曜日」
 * これを指定年の実日付に落とす。落とせないものは null を返し、
 * recurrence（例祭日の決まり）だけを持たせる。
 *
 * ここで導いた日付は「神社が今年の日程として発表したもの」ではないので、
 * 呼び出し側は status: estimated にすること。
 */

const Z2H = { '０': '0', '１': '1', '２': '2', '３': '3', '４': '4', '５': '5', '６': '6', '７': '7', '８': '8', '９': '9' };
const KANJI_NUM = {
  一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
  '１': 1, '２': 2, '３': 3, '４': 4, '５': 5,
};
const WD = { 日: 0, 月: 1, 火: 2, 水: 3, 木: 4, 金: 5, 土: 6 };

/** 全角数字→半角、空白の正規化 */
export function normalize(s) {
  return String(s ?? '')
    .replace(/[０-９]/g, (c) => Z2H[c])
    // 「ー」は日付範囲の棒でもあり、カタカナの長音でもある。
    // 一律に変換すると「スポーツの日」が「スポ~ツの日」になって祝日に
    // 一致しなくなった。長音の可能性がある「ー」は数字・「日」に挟まれた
    // ときだけ範囲として扱う
    .replace(/[〜～─―]/g, '~')
    .replace(/(?<=[0-9日])ー(?=[0-9])/g, '~')
    .replace(/\s+/g, '')
    // 出典側で月が二重になっていることがある:「7月7月18日に近い日曜日」
    .replace(/^(\d{1,2})月(?=\d{1,2}月)/, '')
    .trim();
}

const iso = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const dow = (y, m, d) => new Date(Date.UTC(y, m - 1, d)).getUTCDay();
const daysInMonth = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** 第 n 週の指定曜日 */
function nthWeekday(y, m, n, w) {
  const first = dow(y, m, 1);
  const day = 1 + ((w - first + 7) % 7) + (n - 1) * 7;
  return day <= daysInMonth(y, m) ? day : null;
}

/** 月内で最後の指定曜日 */
function lastWeekday(y, m, w) {
  const last = daysInMonth(y, m);
  const back = (dow(y, m, last) - w + 7) % 7;
  return last - back;
}

/** 指定日にいちばん近い曜日 */
function nearestWeekday(y, m, d, w) {
  const base = Date.UTC(y, m - 1, d);
  for (let off = 0; off <= 3; off++) {
    for (const s of off === 0 ? [0] : [-off, off]) {
      const t = new Date(base + s * 86400000);
      if (t.getUTCDay() === w) {
        return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------- 十二支の日
// 「初午」「二ノ午」「酉の日」など、祭礼日は干支で決まっているものが多い。
// 日の十二支は 12 日周期。ユリウス通日から求められる。
// 検算: 2026年の初午は2月1日、酉の市の一の酉は11月7日（いずれも外部情報と一致）
const ETO12 = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function jdn(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy
    + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

/** その日の十二支（0=子 … 6=午 … 9=酉） */
export function etoOfDay(y, m, d) {
  return (jdn(y, m, d) + 1) % 12;
}

/** その月の n 番目の「◯の日」 */
function nthEtoDay(y, m, eto, n) {
  let count = 0;
  for (let d = 1; d <= daysInMonth(y, m); d++) {
    if (etoOfDay(y, m, d) === eto) {
      count++;
      if (count === n) return d;
    }
  }
  return null;
}

/** 日本の祝日のうち、祭礼日として使われるもの（ハッピーマンデー等） */
function holiday(y, name) {
  const nth = (m, n, w) => nthWeekday(y, m, n, w);
  switch (name) {
    case '成人の日': return { m: 1, d: nth(1, 2, 1) };
    case '建国記念の日': return { m: 2, d: 11 };
    case '春分の日': return { m: 3, d: y === 2026 ? 20 : 20 };
    case '昭和の日': return { m: 4, d: 29 };
    case '憲法記念日': return { m: 5, d: 3 };
    case 'みどりの日': return { m: 5, d: 4 };
    case 'こどもの日': return { m: 5, d: 5 };
    case '海の日': return { m: 7, d: nth(7, 3, 1) };
    case '山の日': return { m: 8, d: 11 };
    case '敬老の日': return { m: 9, d: nth(9, 3, 1) };
    case '秋分の日': return { m: 9, d: y === 2026 ? 23 : 23 };
    case 'スポーツの日':
    case '体育の日': return { m: 10, d: nth(10, 2, 1) };
    case '文化の日': return { m: 11, d: 3 };
    case '勤労感謝の日': return { m: 11, d: 23 };
    default: return null;
  }
}

const nthOf = (s) => KANJI_NUM[s] ?? Number(s) ?? null;

/**
 * @returns {{dates: string[], rule: string, exact: boolean}|null}
 *   dates: YYYY-MM-DD の配列（導けなければ空）
 *   exact: 元表記が具体的な月日だったか（ルールから導いたのではないか）
 */
export function resolveFestivalDate(raw, year) {
  const s = normalize(raw);
  if (!s) return null;

  // 祝日名
  //
  // **祝日名を含むだけで祝日当日を返してはいけない。**
  // 「10月体育の日の前の土曜日」を体育の日そのもの（月曜）に解決していて、
  // 青葉区の 7 社の推定日が月曜になっていた。祝日は起点で、
  // 「の前の◯曜日」「に近い◯曜日」「前日」が付けばそこから動く。
  for (const h of ['成人の日', '建国記念の日', '春分の日', '昭和の日', '憲法記念日', 'みどりの日',
    'こどもの日', '海の日', '山の日', '敬老の日', '秋分の日', 'スポーツの日', '体育の日',
    '文化の日', '勤労感謝の日']) {
    if (s.includes(h)) {
      const r = holiday(year, h);
      if (!r?.d) continue;
      const after = s.slice(s.indexOf(h) + h.length);
      const anchor = new Date(Date.UTC(year, r.m - 1, r.d));
      const shift = (days) => {
        const t = new Date(anchor.getTime() + days * 86400000);
        return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
      };
      // 「の前の土曜・日曜」→ 直前の土曜と、その翌日の日曜
      let m2 = after.match(/(?:の)?(?:直)?前の?土曜?[・、]日曜?/);
      if (m2) {
        const back = (anchor.getUTCDay() - 6 + 7) % 7 || 7;
        return { dates: [shift(-back), shift(-back + 1)], rule: raw, exact: false };
      }
      // 「の前の◯曜日」「前の◯曜」→ 祝日より前で一番近いその曜日
      m2 = after.match(/(?:の)?(?:直)?前の?([日月火水木金土])曜/);
      if (m2) {
        const back = (anchor.getUTCDay() - WD[m2[1]] + 7) % 7 || 7;
        return { dates: [shift(-back)], rule: raw, exact: false };
      }
      // 「に近い◯曜日」（／区切りで複数あることがある）
      const near = [...after.matchAll(/に?近い([日月火水木金土])曜/g)];
      if (near.length) {
        const dates = near.map((n) => {
          const w = WD[n[1]];
          const diff = ((w - anchor.getUTCDay() + 7) % 7 <= 3)
            ? (w - anchor.getUTCDay() + 7) % 7
            : ((w - anchor.getUTCDay() + 7) % 7) - 7;
          return shift(diff);
        }).sort();
        return { dates, rule: raw, exact: false };
      }
      // 「の前々日・前日」「の前日」「の翌日」
      if (/前々日[・、]前日/.test(after)) return { dates: [shift(-2), shift(-1)], rule: raw, exact: false };
      if (/前日/.test(after)) return { dates: [shift(-1)], rule: raw, exact: false };
      if (/翌日/.test(after)) return { dates: [shift(1)], rule: raw, exact: false };
      // 修飾なし＝祝日当日
      return { dates: [iso(year, r.m, r.d)], rule: raw, exact: false };
    }
  }

  // 十二支の日:「2月初午」「初午」「二ノ午」「11月上酉の日」「11月酉の日」
  let m = s.match(/^(?:(\d{1,2})月)?(初|一|二|三|四|上|中|下|[１-４])?[のノ]?([子丑寅卯辰巳午未申酉戌亥])(?:の)?日?/);
  if (m && (m[2] || m[3])) {
    const ORD = { 初: 1, 一: 1, 上: 1, 二: 2, 中: 2, 三: 3, 下: 3, 四: 4, '１': 1, '２': 2, '３': 3, '４': 4 };
    const eto = ETO12.indexOf(m[3]);
    // 月の指定がないときは、午は2月（初午）、酉は11月（酉の市）が通例
    const mo = m[1] ? +m[1] : (m[3] === '午' ? 2 : m[3] === '酉' ? 11 : null);
    const n = ORD[m[2]] ?? 1;
    if (mo && eto >= 0) {
      const d = nthEtoDay(year, mo, eto, n);
      if (d) return { dates: [iso(year, mo, d)], rule: raw, exact: false };
    }
  }

  // 「4月上旬日曜日」「8月下旬の土曜日」「4月中旬土・日曜日」— 旬のなかの指定曜日
  m = s.match(/^(\d{1,2})月(上旬|初旬|中旬|下旬|末)(?:の)?([日月火水木金土])(?:・([日月火水木金土]))?(?:・([日月火水木金土]))?曜日?/);
  if (m) {
    const mo = +m[1];
    const last = daysInMonth(year, mo);
    const [lo, hi] = m[2] === '上旬' || m[2] === '初旬' ? [1, 10]
      : m[2] === '中旬' ? [11, 20] : [21, last];
    const out = [];
    for (const w of [m[3], m[4], m[5]].filter(Boolean)) {
      for (let d = lo; d <= hi; d++) {
        if (dow(year, mo, d) === WD[w]) { out.push(iso(year, mo, d)); break; }
      }
    }
    if (out.length) return { dates: out.sort(), rule: raw, exact: false };
  }

  // 「7月最終金・土・日曜」— 最後の「金」から始まる連続した3日、という読み方をする。
  // 曜日ごとに独立して「月内で最後の◯曜」を取ると 7/25・7/26・7/31 のようにバラけて誤りになる。
  m = s.match(/^(\d{1,2})月最終([日月火水木金土])(?:・([日月火水木金土]))?(?:・([日月火水木金土]))?曜/);
  if (m) {
    const mo = +m[1];
    const ws = [m[2], m[3], m[4]].filter(Boolean);
    const first = lastWeekday(year, mo, WD[ws[0]]);
    const base = Date.UTC(year, mo - 1, first);
    const out = ws.map((_, i) => {
      const t = new Date(base + i * 86400000);
      return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
    });
    return { dates: out, rule: raw, exact: false };
  }

  // 「9月秋分」「3月春分」
  m = s.match(/^(\d{1,2})月?(春分|秋分)/);
  if (m) {
    const h = holiday(year, `${m[2]}の日`);
    if (h) return { dates: [iso(year, h.m, h.d)], rule: raw, exact: false };
  }

  // 「9月15日に近い日曜日」
  m = s.match(/^(\d{1,2})月(\d{1,2})日に?近い([日月火水木金土])曜日?$/);
  if (m) {
    const r = nearestWeekday(year, +m[1], +m[2], WD[m[3]]);
    return r ? { dates: [iso(r.y, r.m, r.d)], rule: raw, exact: false } : null;
  }

  // 「10月第1日曜日」「4月第2土・日曜日」「8月第一土曜日」
  m = s.match(/^(\d{1,2})月第([一二三四五六七八九十\d])(?:週)?([日月火水木金土])(?:・([日月火水木金土]))?曜日?/);
  if (m) {
    const mo = +m[1];
    const n = nthOf(m[2]);
    const out = [];
    for (const w of [m[3], m[4]].filter(Boolean)) {
      const d = nthWeekday(year, mo, n, WD[w]);
      if (d) out.push(iso(year, mo, d));
    }
    out.sort();
    return out.length ? { dates: out, rule: raw, exact: false } : null;
  }

  // 「10月最終日曜日」
  m = s.match(/^(\d{1,2})月最終([日月火水木金土])曜日?/);
  if (m) {
    const d = lastWeekday(year, +m[1], WD[m[2]]);
    return { dates: [iso(year, +m[1], d)], rule: raw, exact: false };
  }

  // 「10月9日~10日」「10月9日・10日」「9月3・4日」（1つ目の「日」が省かれることがある）
  m = s.match(/^(\d{1,2})月(\d{1,2})日?[~・、](\d{1,2})日/);
  if (m) {
    const mo = +m[1];
    const out = [];
    for (let d = +m[2]; d <= +m[3] && d <= daysInMonth(year, mo); d++) out.push(iso(year, mo, d));
    return out.length ? { dates: out, rule: raw, exact: true } : null;
  }

  // 「7月20日~8月1日」（月をまたぐ）
  m = s.match(/^(\d{1,2})月(\d{1,2})日~(\d{1,2})月(\d{1,2})日/);
  if (m) {
    return { dates: [iso(year, +m[1], +m[2]), iso(year, +m[3], +m[4])], rule: raw, exact: true };
  }

  // 「1月1日」
  m = s.match(/^(\d{1,2})月(\d{1,2})日/);
  if (m) {
    const mo = +m[1];
    const d = +m[2];
    if (mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(year, mo)) {
      return { dates: [iso(year, mo, d)], rule: raw, exact: true };
    }
  }

  // 「8月中」「秋」など、日付に落とせないもの
  return { dates: [], rule: raw, exact: false };
}
