/**
 * エリアページの説明文を、**持っているデータから言える事実だけ**で組み立てる
 *
 * 詳細ページ 4000 件は「稲荷神社 例祭」のように他と見分けが付かず、
 * 検索から人が来る見込みが薄い。一方「足立区 盆踊り 2026」のような
 * 探し方には競合がほとんどおらず、エリアページが入口になる。
 * そこに中身が無いと登録すらされないので、文章を持たせる。
 *
 * **水増しの文章は書かない。** 数えれば分かることだけを書く。
 * 件数が少ないエリアで「傾向」を語ると嘘になるので、件数で書き分ける。
 */

const MONTH_NAME = (m) => `${m}月`;

/** 上位 n 件を「A が 12 件、B が 8 件」の形に */
function topList(counts, n = 3) {
  return [...Object.entries(counts)]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => `${k}が${v}件`);
}

export function areaSummary(festivals, placeName) {
  const n = festivals.length;
  if (!n) return '';

  const kinds = {};
  const months = {};
  const venues = new Set();
  const organizers = new Set();
  let stalls = 0;
  let machi = 0;
  let shrine = 0;

  for (const f of festivals) {
    kinds[f.kind] = (kinds[f.kind] ?? 0) + 1;
    venues.add(f.venue?.name);
    if (f.organizer) organizers.add(f.organizer);
    if (f.stalls === 'yes') stalls++;
    if (f.scale === '町内会') machi++;
    if (f.shrine) shrine++;
    for (const d of f.occurrences?.[0]?.dates ?? []) {
      const m = Number(d.slice(5, 7));
      months[m] = (months[m] ?? 0) + 1;
    }
  }

  const s = [];

  // 1 件しかないエリアで「もっとも多いのは」と書くと滑稽なので分ける
  if (n === 1) {
    const f = festivals[0];
    s.push(`${placeName}で確認できている祭りは 1 件です。`);
    s.push(`${f.venue?.name ?? ''}で開かれる${f.kind}「${f.name}」を掲載しています。`);
  } else {
    s.push(`${placeName}の祭り・盆踊りを ${n} 件掲載しています。`);
    if (n >= 5) s.push(`内訳は${topList(kinds).join('、')}です。`);
    else s.push(`種別は${[...new Set(festivals.map((f) => f.kind))].join('・')}です。`);
  }

  // 開催が集中する月。夏祭りのサイトなので「いつ行けるか」が要る
  const top = [...Object.entries(months)].sort((a, b) => b[1] - a[1]).slice(0, 2);
  if (top.length && n >= 3) {
    s.push(`開催は${top.map(([m, c]) => `${MONTH_NAME(m)}に${c}件`).join('、')}が多くなっています。`);
  }

  // 1 件しか無いのに「すべて」と書くと大げさになる
  if (machi > 0 && n > 1) {
    s.push(n === machi
      ? 'すべて町会・自治会が開く小規模なものです。'
      : `うち ${machi} 件は町会・自治会が開くもので、大手のイベントサイトには載りません。`);
  } else if (machi === 1 && n === 1) {
    s.push('町会・自治会が開く小規模なもので、大手のイベントサイトには載りません。');
  }
  if (shrine >= 3) s.push(`神社の例祭・例大祭が ${shrine} 件あります。`);
  if (venues.size >= 5) s.push(`会場は ${venues.size} か所にわたります。`);

  if (n === 1) {
    s.push(stalls === 1
      ? '屋台・露店が出ると出典に記載があります。'
      : '屋台・露店が出るかどうかは、まだ確認できていません。');
  } else {
    s.push(stalls > 0
      ? `屋台・露店が出ると出典に記載があるものは ${stalls} 件です。`
      : '屋台・露店の有無は、いずれもまだ確認できていません。');
  }

  return s.join('');
}

/** 都道府県ページ用。市区町村の広がりを足す */
export function prefSummary(festivals, prefName, cityCount) {
  const base = areaSummary(festivals, prefName);
  if (!base || cityCount < 2) return base;
  return base.replace(
    /^(.+?掲載しています。)/,
    `$1${cityCount} の市区町村にわたります。`,
  );
}
