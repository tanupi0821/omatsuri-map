/**
 * 記事本文から祭りの名前・日付・会場・屋台の有無を取り出す
 *
 * 号外NET とレアリアで同じ処理が要るので分けた。
 * どちらも WordPress の記事で、書き方の癖も似ている。
 *
 * ここに入っている条件はすべて**実データで誤りを見つけて足したもの**。
 * 消すときは、その誤りが再発しないことを確かめること。
 */

// 「万灯みたま祭」「吉原祇園祭」「妙見大祭」のように**送り仮名の無い「祭」**で
// 終わる名前がある。これを入れないと神社の祭りがまとめて落ちる。
export const IS_FESTIVAL = /盆踊り|盆おどり|夏祭り|夏まつり|納涼|縁日|例大祭|祭礼|花火大会|祭り|まつり|フェスタ|よいち|夜市|大祭|祇園祭|天王祭|祭$|祭典/;

// 芸術祭・音楽祭は「祭」が付くだけ。店舗の集客企画も地域の祭りではない
export const NOT_FESTIVAL = /コンサート|ワークショップ|セール|オープン|閉店|開店|コーナー|レッスン|練習会|教室|展$|フェア|芸術祭|映画祭|音楽祭|文化祭|映画|ファミリーDay|感謝祭|試写/;

const GENERIC_NAME = /^(夏祭り|夏まつり|春祭り|秋祭り|縁日|盆踊り|まつり|祭り|花火大会|納涼祭|夜市|サマーフェスタ)$/;

export const KIND = (n) => {
  if (/盆踊り|盆おどり|音頭/.test(n)) return '盆踊り';
  if (/納涼/.test(n)) return '納涼祭';
  if (/花火/.test(n)) return '花火';
  if (/例大祭|例祭|祭礼/.test(n)) return '例大祭';
  return '夏祭り';
};

/** 屋台が出ると書いてあるか。キッチンカーも屋台のうち */
export const hasStalls = (text) => /屋台|露店|模擬店|夜店|売店|出店|キッチンカー|縁日ブース/.test(text);

export const strip = (h) => String(h ?? '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ').trim();

/** 全角数字を半角に。「6月６日（土）」のように混在する */
const han = (s) => s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));

/**
 * 和暦を西暦に直す。**九州の媒体は「令和8年7月25日」と書く**。
 * これを読めないと、その地域の記事がまとめて落ちる。
 */
const toSeireki = (s) => han(s)
  .replace(/令和\s*(\d{1,2})\s*年/g, (_, n) => `${2018 + Number(n)}年`)
  .replace(/令和\s*元\s*年/g, '2019年');

/**
 * 「7月24日・25日」「7月27日と28日」のように、2 日目以降の月が省かれる。
 * 月を補って「7月24日 7月25日」の形にしておく。
 */
function expandSameMonth(s) {
  const re = /(\d{1,2})月\s*(\d{1,2})日(?:[（(][^）)]*[）)])?\s*[・、と]\s*(\d{1,2})日/;
  let out = s;
  for (let i = 0; i < 6 && re.test(out); i++) {
    out = out.replace(re, (_, m, d1, d2) => `${m}月${d1}日 ${m}月${d2}日`);
  }
  return out;
}

function scanDates(rawSeg, defaultYear = null) {
  const seg = expandSameMonth(toSeireki(rawSeg));
  const out = [];
  // 「５月９日㈯」のように年が書かれないことがある。**記事の掲載年**を既定にする。
  // 本文に出てくる年を拾うと、回顧の文（「2025年は…」）の年を付けてしまう。
  let year = defaultYear;
  // 「7月31日から8月2日まで」のように 2 つ目に年が無い書き方もあるので繰り越す
  for (const g of seg.matchAll(/(?:(20\d\d)年)?\s*(\d{1,2})月\s*(\d{1,2})日/g)) {
    if (g[1]) year = g[1];
    if (!year) continue; // 年が分からないものは推測しない
    out.push(`${year}-${String(g[2]).padStart(2, '0')}-${String(g[3]).padStart(2, '0')}`);
  }
  return [...new Set(out)];
}

/**
 * 「日時 2026年8月1日（土）…」の欄があればそれを、無ければ地の文の頭から。
 * 欄があるのは一部の記事だけで、欄が無いという理由で捨てたら 377 件落ちていた。
 */
export function pickDates(body, title = '', pubDate = null) {
  // 年が書かれていないときに使う既定の年（記事の掲載年）
  const y = pubDate ? Number(String(pubDate).slice(0, 4)) : null;

  // 「日時：」「開催日時：」のように全角コロンで書く媒体もある
  const m = body.match(/(?:開催)?日\s*時[：:]?[^0-9]{0,6}([\s\S]{0,80})/);
  if (m) {
    // 「場所」以降は別項目。「雨天の場合は8月2日に順延」の予備日も開催日ではない
    const d = scanDates(m[1].split(/場\s*所|会\s*場|内\s*容|主\s*催|雨天|順延|中止|予備/)[0], y);
    if (d.length) return d;
  }
  // 題名に日付が入っている媒体もある（「2026年8月15日 厚木市 …で夏祭り」）
  const fromTitle = scanDates(title.split(/雨天|順延/)[0], y);
  if (fromTitle.length) return fromTitle.slice(0, 4);
  // 地の文から。「昨年」以降は今年の日程ではない
  return scanDates(body.slice(0, 400).split(/昨年|去年|例年|過去/)[0], y).slice(0, 4);
}

/**
 * 会場を取る。**「場所」は地の文にも出る**ので、助詞や文末表現が混ざるものは捨てる。
 * 「場所には多数の売店も出店予定となっており…」を会場にしてしまった。
 */
export function pickVenue(body) {
  // 「・時間：」「(両日)：」のように記号や項目名の切れ端になることがある
  const bad = (v) => /^[・、。：:（(\s]/.test(v) || /[：:]$/.test(v) || /時間|日時|料金/.test(v)
    || /^(は|には|が|で|を|に|も|と|の|から|内|外|付近|周辺|：|:)/.test(v)
    || /では|ため|など|により|ので|です|ます|ました|ており|行わ|撮影/.test(v)
    || /[をやへ]|から|まで|はじめ|囲む|楽し/.test(v)
    // 「９月26日・27日に美しが丘公園」のように日付が前に付いてくることがある
    || /[0-9０-９]+\s*[月日]/.test(v);

  for (const m of body.matchAll(/(?:場\s*所|会\s*場|開催場所)[^\S\n]{0,4}[：:]?\s*([^\s、。]{2,40})/g)) {
    if (!bad(m[1])) return m[1];
  }
  // 「◯◯公園で開催されます」の形。地の文を拾わないよう場所らしい語で終わるものに限る
  const PLACE_END = /(公園|会場|広場|神社|神宮|寺|小学校|中学校|高校|学園|グラウンド|グランド|駐車場|通り|商店街|センター|ホール|駅|海岸|河川敷|球場|スタジアム|ミュージアム|プラザ|城|港|川|浜|沿い|前)$/;
  for (const m of body.matchAll(/([^\s、。「」]{3,25})(?:で|にて)開催/g)) {
    if (!bad(m[1]) && !/^\d/.test(m[1]) && PLACE_END.test(m[1])) return m[1];
  }
  return null;
}

/**
 * 主催団体。「主催：京橋一の部連合町会」の形で書く媒体がある。
 * 町会名が取れると、町内会の祭りかどうかを規模の判定に使える。
 */
export function pickOrganizer(body) {
  const m = body.match(/主\s*催[：:]\s*([^\s、。]{2,30})/);
  if (!m) return null;
  const v = m[1].trim();
  if (/^[：:]|^後援|^協力/.test(v)) return null; // 「主催：後援：」のように空で続く
  // 本文の英語部分を拾って「主催：Park」「主催：BUBBLE」になっていた。
  // 団体名なら日本語が入る
  if (!/[ぁ-んァ-ヶ一-鿿]/.test(v)) return null;
  return v;
}

/**
 * 祭りの名前。**題名の鉤括弧を先に見る**。
 * 地の文から切り出すと「多くの人で賑わう「八坂神社祭」のように途中で切れる。
 */
export function pickName(body, title) {
  const clean = (s) => s
    .replace(/^[「『]|[」』]$/g, '').replace(/^[^「『]*[「『]/, '')
    // 「2026年胡録神社例大祭」の年は名前ではない。これを残すと
    // 「日付が混ざっている」として落としてしまい、神社の祭りが消える。
    // 「2026まちなか夏祭り」のように年だけ前置される書き方もある
    .replace(/^20\d\d年の?/, '').replace(/^20\d\d(?=[^\d])/, '')
    // 「夏はホークス！天神夏まつり2026」の煽り文句を落とす。
    // 感嘆符の後ろに本題が来る書き方が多い
    .replace(/^.*[！!♪]\s*(?=.*[祭ま])/, '')
    // 「今年は覚王山夏祭」の頭の言葉も名前ではない
    .replace(/^(今年[はもにの]?|本年度?|本日|いよいよ|ついに|待望の|恒例の|話題の)/, '')
    // 「絶品グルメ☆ビール＆日本酒祭り＠神田明神納涼祭り」のように
    // 記号でつないだ前半が煽り文句のことがある
    .replace(/^.*[＠@]\s*/, '')
    // 「7月30日は美奈宜神社で夏越祭」「4月11日は二日市八幡宮の春季大祭」
    // のように日付が前に付く。日付は名前ではない
    .replace(/^\d{1,2}月\s*\d{1,2}日(?:[（(][^）)]*[）)])?\s*[はにのでも、]?\s*/, '')
    .trim();
  const quoted = (s) => [...s.matchAll(/[「『]\s*([^」』]{3,40}?)\s*[」』]/g)]
    .map((q) => q[1].trim())
    .filter((q) => IS_FESTIVAL.test(q));

  const m = body.match(/[～〜]\s*([^～〜]{3,40}?)\s*[～〜]/);
  if (m && IS_FESTIVAL.test(m[1])) return clean(m[1]);

  const fromTitle = quoted(title);
  if (fromTitle.length) return withOwner(clean(fromTitle[0]), title);

  const fromBody = quoted(body.slice(0, 500));
  if (fromBody.length) return withOwner(clean(fromBody[0]), title);

  // 最後の手段として題名から切り出す。ここは文を拾いやすいので、
  //「龍城ケ丘自治会が初の夏まつり」「川崎港で夏の納涼祭」のような
  // 主語・場所からの言い回しは名前にしない。
  // **祭りの名前は題名の終わりの方に置かれる**ので、候補が複数あれば後ろを採る
  //（「子供みこしや提灯山笠が…♪ 7月14日 二日市八幡宮夏季大祭」）
  const t = title.replace(/^【[^】]*】\s*/, '').replace(/^\d{1,2}月\d{1,2}日（.）[、,]?\s*/, '');
  const cands = [...t.matchAll(/([^、。！!？?\s]{3,30}?(?:祭り|まつり|祭|盆踊り|フェスタ|大会))/g)]
    .map((x) => clean(x[1]))
    // 「◯◯で△△祭」の△△だけを採る案も試したが、△△が総称のときに
    //「川崎港で夏の納涼祭」→「夏の納涼祭」となって悪化した。文の断片は捨てる
    .filter((c) => c && !/[がをにへは]\s*[初今開行実]|^[^\s]{2,10}[がで]/.test(c));
  return cands.length ? cands[cands.length - 1] : null;
}

/**
 * 鉤括弧の中が「夏祭り」だけのことがある。町名も分からないので
 * 直前の主催者・会場を前に付ける（「紅葉八幡宮で「夏祭り」開催へ」）。
 */
function withOwner(name, title) {
  if (!GENERIC_NAME.test(name)) return name;
  // 鉤括弧の直前に主催者・会場が来る形（「紅葉八幡宮で「夏祭り」開催へ」）
  const m = title.match(new RegExp(`([^\\s、。！!？?（）「」]{2,15})(?:で|の)[「『]${name}`));
  if (m) return `${m[1]} ${name}`;
  // 離れていることもある（「我孫子市民プラザで、7月25日(土)に「夏まつり」が開催」）
  const v = title.match(/([^\s、。！!？?（）「」【】]{3,20})(?:で|にて)[、,]?/);
  return v ? `${v[1]} ${name}` : name;
}

/** 名前として使えるか（抜き出し損ねと総称を落とす） */
export function usableName(n) {
  if (!n || n.length < 4) return false;
  if (GENERIC_NAME.test(n)) return false;
  if (/午前|午後|\d時|^\d/.test(n)) return false;
  // 本文の時刻表から切り出してしまったもの
  //（「祭典 17:00過ぎ」「屋台・縁日 18:00」「盆踊り：18:00」）
  if (/[:：]\d|\d[:：]/.test(n)) return false;
  // 鉤括弧の切り出しに失敗して日付や閉じ括弧が混ざったもの
  if (/[」』]|\d+[年月日⽉⽇]/.test(n)) return false;
  // 記事の呼びかけ文をそのまま名前にしてしまったもの
  //（「今年は蒲郡花火大会へ行こう！」「レシートを集めて夏まつり」）
  if (/行こう|遊ぼう|楽しもう|集めて|やります|囲まれた|しませんか|どうぞ/.test(n)) return false;
  if (/見よう|しよう|来てね|始まる|だよ|ぞー|ですよ/.test(n)) return false;
  // 「盆踊りエリア」「縁日ブース」「おまつり広場」は会場の区分であって
  // 祭りの名前ではない
  if (/(エリア|ブース|会場|コーナー|ステージ|広場|通り)$/.test(n)) return false;
  return true;
}
