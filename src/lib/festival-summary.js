/**
 * 祭りの詳細ページ（/f/<id>）の説明文を、**持っているデータから言える事実だけ**で組み立てる
 *
 * 詳細ページは表と出典しか無く、文章が 1 行も無い。Google は中身の薄いページを
 * 登録しないので、4000 ページ作っても大半が検索に載らない。AdSense の審査でも
 * 「価値の低いコンテンツ」に見える。
 *
 * **水増しの美文は書かない。** このサイトは全ページに出典と最終確認日を出して
 * 信頼性を担保しているので、説明文だけ想像で書くと台無しになる。
 * 「地域の人々に愛され続けている」のような、確かめていないことは 1 文字も書かない。
 * 書いてよいのは YAML に入っている値と、そこから機械的に導けることだけ。
 *
 * 項目の埋まり方には大きな差がある（住所 40% / 開始時刻 17% / 主催 49% /
 * 会場が「◯◯市内」で不明なもの 573 件）。**無い項目には触れない**のが基本。
 * 例外は 2 つだけで、どちらも「無いこと自体が利用者にとっての情報」だから書く:
 *   - 屋台の有無が unknown（出るか出ないかが最大の関心事なので、未確認と明示する）
 *   - 会場が「◯◯市内」（詳しい場所が分からないと分かった方が親切）
 *
 * 最寄駅（station）は 584 件あるが使っていない。
 * 「都バス業⑩「立川」 3分」のような生の表記で、文章に混ぜると読めなくなる。表のままでよい。
 *
 * 開催回の note も使っていない。出典側が書いた文をそのまま本文に混ぜると
 * どこまでが自分の記述か分からなくなるし、表の「備考」に既に出ている。
 */

import { formatDates, latestOccurrence } from './data.js';

/** kind をそのまま文に置くと座りが悪いものがあるので言い換える（「花火」→「花火大会」） */
const KIND_PHRASE = {
  花火: '花火大会',
  こどもまつり: '子ども向けの祭り',
  商店街: '商店街の祭り',
  神事: '神事',
};

/**
 * scale の言い換え。主催者も神社も分からない祭りでは、これが規模を伝える唯一の材料になる。
 * summary.js（エリアページ）が「町会・自治会が開く」と書いているのに合わせる。
 */
const SCALE_PHRASE = {
  町内会: '町会・自治会規模の',
  地区: '地区の',
  市: '市町村全体の',
  区: '区全体の',
};

const SOURCE_TIER_PHRASE = {
  official: '主催者の公式発表',
  gov: '行政の発表',
  media: '地域メディア',
  aggregator: 'まとめサイト',
};

/**
 * id から決まる疑似乱数。**ビルドのたびに文が変わっては困る**ので Math.random は使わない。
 *
 * 項目の組み合わせで文の構成は変えているが、それでも神社庁由来の
 * 「例大祭＋例祭日＋屋台unknown」のように、同じ構成の祭りが数百件ある。
 * そこだけは言い回しを振り分けないと、続けて何ページか見た人に機械生成が露骨に見える。
 * 振り分けるのは**同じ事実の言い換え**に限る。内容は変えない。
 */
function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
const pick = (id, arr) => arr[hash(id) % arr.length];

/**
 * 会場名が「茅ヶ崎市内」「北九州市門司区内」のように、市区町村までしか分かっていないもの。
 * これを会場として「◯◯市内で開かれます」と書くと、場所が分かっているように読めてしまう。
 */
const isVagueVenue = (name) => !!name && /[都道府県市区町村]内$/.test(name);

/** 「川崎市高津区」。ward は区の無い市では null。素朴に繋ぐと「茂原市null」になる */
const placeOf = (f) => `${f.area.pref}${f.area.city}${f.area.ward ?? ''}`;

/** 掲載日程がすべて過去か。文末を「開かれます」にすると、終わった祭りで嘘になる */
function allPast(dates, today) {
  const t = today.toISOString().slice(0, 10);
  return dates.length > 0 && dates.every((d) => d < t);
}

export function festivalSummary(f, today = new Date()) {
  if (!f) return '';

  const occ = latestOccurrence(f);
  const place = placeOf(f);
  const kind = KIND_PHRASE[f.kind] ?? f.kind;
  const venue = f.venue?.name ?? null;
  const vague = isVagueVenue(venue);
  const dates = occ?.dates ?? [];
  const thisYear = today.getFullYear();
  const id = f.id ?? f.name ?? '';

  // 会場が神社そのもののことが多い（1355 件中 1294 件）。
  // 「◯◯神社の例大祭です。会場は◯◯神社です。」と 2 回書かないための判定
  const venueIsShrine = !!f.shrine && venue === f.shrine;
  // 祭りの名前に主催者・神社名が入っていることが多い（主催 1986 件のうち 1787 件）。
  // 説明文は <h1> の真下に出るので、名前をもう一度書くと同じ語が 3 行で 3 回並ぶ
  const nameHasOrganizer = !!f.organizer && f.name.includes(f.organizer);

  // 会場名が「東尾久赤土町会・東尾久一丁目町会・…・東尾久二丁東町会 地域内」のように
  // 長いものが 233 件ある。書き出しに埋め込むと主語がどこか分からない文になるので、
  // 長いものは会場だけの文に分けて置く
  const shortVenue = !!venue && !vague && venue.length <= 16;

  const s = [];
  let venueInOpening = false;

  // ---- 書き出し。持っている項目で主語を変える。ここが文型の分かれ目 ----
  if (f.shrine) {
    // 神社の祭りは「どの神社の祭りか」が一番の情報
    if (venueIsShrine || !shortVenue) {
      s.push(pick(id, [
        `${place}に鎮座する${f.shrine}の${kind}です。`,
        `${f.shrine}（${place}）で行われる${kind}です。`,
      ]));
      venueInOpening = venueIsShrine;
    } else {
      // 神社の祭りだが会場が境内ではない（公園・小学校など）
      s.push(`${place}の${f.shrine}の${kind}で、会場は${venue}です。`);
      venueInOpening = true;
    }
  } else if (f.organizer && nameHasOrganizer) {
    s.push(pick(id, [
      `${place}の${f.organizer}が開く${kind}です。`,
      `${place}の${f.organizer}による${kind}です。`,
    ]));
  } else if (f.organizer) {
    s.push(`${place}で${f.organizer}が開く${kind}「${f.name}」です。`);
  } else if (shortVenue) {
    s.push(pick(id, [
      `${place}の${venue}で開かれる${kind}です。`,
      `${place}・${venue}の${kind}です。`,
    ]));
    venueInOpening = true;
  } else {
    // 主催も神社も会場も分からない。残る材料は規模だけ
    s.push(`${place}で開かれる${SCALE_PHRASE[f.scale] ?? ''}${kind}です。`);
  }

  // ---- 会場・住所。神社の祭りは例祭日を先に出したいので、あとに回す ----
  const placeSentences = [];
  if (vague && !f.venue?.address) {
    // 「無い項目に触れない」の例外。詳しい場所が分からないと分かった方が親切。
    // ただし住所が入っているなら場所は分かっているので、この文を出すと矛盾する
    placeSentences.push(`会場の詳しい場所までは出典に記載がなく、${venue}とだけ分かっています。`);
  } else if (venue && !vague && !venueIsShrine && !venueInOpening) {
    placeSentences.push(`会場は${venue}です。`);
  }
  if (f.venue?.address) {
    placeSentences.push(pick(id, [
      `所在地は${f.venue.address}です。`,
      `住所は${f.venue.address}。`,
    ]));
  }

  // ---- 例祭日。神社の祭りは日付そのものより「毎年いつか」の方が長く使える情報 ----
  const recSentences = [];
  if (f.recurrence) {
    if (!f.shrine) {
      // 商工会の祭りなど神社でないものにも recurrence が入っている（7 件）。
      // 「例祭日」は神社の言葉なので使わない
      recSentences.push(`出典には例年${f.recurrence.replaceAll('／', '・')}とあります。`);
    } else if (f.recurrence.includes('／')) {
      // 「1月6日／5月11日／9月22日」のように、その神社の祭日が複数まとまっていることがある。
      // これを 1 つの例祭日のように書くと嘘になる
      recSentences.push(`出典にはこの神社の祭日として${f.recurrence.replaceAll('／', '・')}が挙げられています。`);
    } else {
      recSentences.push(pick(id, [
        `例祭日は毎年${f.recurrence}です。`,
        `例祭日は毎年${f.recurrence}と決まっています。`,
      ]));
    }
  }

  // ---- 日程 ----
  const dateSentences = [];
  if (!dates.length) {
    dateSentences.push(occ?.date_note
      ? `${occ.year}年の開催は「${occ.date_note}」とあるだけで、日付はまだ確認できていません。`
      : '開催日はまだ確認できていません。');
  } else if (occ.status === 'estimated') {
    // 例祭日から機械的に導いた日付。**確定した日程のように書いてはいけない**。
    // 直前の例祭日の文を「これ」で受けると、祭日が複数ある神社（109 件）で
    // どれを指すのか分からなくなるので、この文だけで意味が通るようにする
    const basis = f.recurrence ? '例祭日' : '例年の日程';
    const who = f.shrine ?? f.organizer ?? '主催者';
    dateSentences.push(pick(id, [
      `${occ.year}年の日程としては${formatDates(occ)}を掲載していますが、`
        + `これは${basis}から割り出した推定で、${who}が発表した日程ではありません。`,
      `${basis}から割り出すと${occ.year}年は${formatDates(occ)}にあたりますが、`
        + `${who}が${occ.year}年の日程として発表したものではありません。`,
    ]));
  } else if (occ.status === 'cancelled') {
    dateSentences.push(`${occ.year}年の${formatDates(occ)}の開催は、中止と発表されています。`);
  } else if (occ.status === 'postponed') {
    dateSentences.push(`${occ.year}年は${formatDates(occ)}の予定でしたが、延期と発表されています。`);
  } else if (occ.status === 'unconfirmed') {
    dateSentences.push(`${occ.year}年の日程として${formatDates(occ)}を掲載していますが、まだ裏が取れていません。`);
  } else if (occ.year < thisYear) {
    // 今年の発表がまだ無いもの。今年の日程と誤解させないこと
    dateSentences.push(
      `確認できている直近の開催は${occ.year}年の${formatDates(occ)}で、`
      + `${thisYear}年の日程はまだ確認できていません。`,
    );
  } else if (allPast(dates, today)) {
    dateSentences.push(`${occ.year}年の開催日は${formatDates(occ)}でした。`);
  } else {
    dateSentences.push(pick(id, [
      `${occ.year}年は${formatDates(occ)}に開かれます。`,
      `${occ.year}年の開催日は${formatDates(occ)}です。`,
    ]));
  }

  // 時刻は 17% にしか入っていない。入っているときだけ、日程の文に続ける
  if (occ?.start_time) {
    dateSentences.push(occ.end_time
      ? `時間は${occ.start_time}から${occ.end_time}まで。`
      : `開始は${occ.start_time}です。`);
  }
  // 何日も開催がある祭りは、日付の羅列だけだと日数が伝わらない。
  // 2 日は「7月18日(金)・7月19日(土)」を読めば分かるので、3 日以上のときだけ書く。
  // **「N 日間」とは書かない**。川崎山王祭の 6/14・15・20・21 や伊勢佐木町の縁日（毎月 1・6・16・26 日）
  // のように、日付が飛んでいることがあり、連続開催のように読めてしまう。
  // 推定日程（estimated）は複数の祭日をまとめた結果なので、そもそも 1 つの祭りの日数ではない
  if (dates.length >= 3 && occ?.status !== 'estimated') {
    dateSentences.push(occ.year < thisYear || allPast(dates, today)
      ? `開催日は全部で${dates.length}日ありました。`
      : `開催日は全部で${dates.length}日あります。`);
  }

  // ---- 組み立て。神社の祭りは 例祭日 → 日程 → 会場、それ以外は 会場 → 日程 ----
  if (f.shrine) s.push(...recSentences, ...dateSentences, ...placeSentences);
  else s.push(...placeSentences, ...recSentences, ...dateSentences);

  // ---- 屋台・露店。このサイトを使う理由そのものなので必ず 1 文置く ----
  // unknown は「出ません」ではない。出るとも出ないとも分かっていないという意味
  if (f.stalls === 'yes') {
    s.push(pick(id, [
      '屋台・露店が出ると出典に記載があります。',
      '出典には屋台・露店が出ると書かれています。',
    ]));
  } else if (f.stalls === 'no') {
    s.push('屋台・露店は出ないと出典に記載があります。');
  } else {
    s.push('屋台・露店が出るかどうかは、出典に記載がなく確認できていません。');
  }

  // ---- タグ。kind と同じことを言っているものは落とす（花火大会に「花火」タグ） ----
  const tags = (f.tags ?? []).filter((t) => t && !f.kind.includes(t) && !kind.includes(t));
  if (tags.length) s.push(`出典には${tags.join('・')}の記載があります。`);

  // ---- 出典の格。まとめサイト・メディアは主催者の発表ではない、と本文でも言う ----
  const tier = SOURCE_TIER_PHRASE[occ?.source_type];
  // 出典名そのものに括弧が入っていることがある（「みやまえご近所さん（宮前区役所運営）」）。
  // そこへ格の括弧を足すと括弧が二重になって読めない
  const tierParen = occ?.source_name?.includes('（') ? '' : `（${tier}）`;
  if (occ?.source_type === 'aggregator' || occ?.source_type === 'media') {
    s.push(occ.source_name
      ? `この情報は「${occ.source_name}」${tierParen}から拾ったもので、主催者の発表そのものではありません。`
      : `この情報は${tier}から拾ったもので、主催者の発表そのものではありません。`);
  } else if (tier && occ?.source_name) {
    s.push(`情報は${occ.source_name}${tierParen}にもとづきます。`);
  }

  return s.join('');
}

/**
 * meta description 用に説明文の冒頭を切り出す。
 * 途中で切ると読めなくなるので**文の切れ目（。）でしか切らない**。
 * 1 文だけで上限を超えるときは、その 1 文をそのまま返す（切るより長い方がまし）。
 */
export function festivalMetaDescription(f, limit = 120) {
  const text = festivalSummary(f);
  if (text.length <= limit) return text;
  let out = '';
  for (const part of text.split(/(?<=。)/)) {
    if (out && out.length + part.length > limit) break;
    out += part;
  }
  return out || text;
}
