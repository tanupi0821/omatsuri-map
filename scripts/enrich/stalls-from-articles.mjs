/**
 * 集めた記事から、既にある祭りの「屋台が出るか」を埋める
 *
 *   node scripts/enrich/stalls-from-articles.mjs [--apply]
 *
 * 号外NET・レアリアの記事は 1500 件あるが、祭りとして取り込めたのは一部。
 * 取り込まれなかった記事にも、**既にある祭りの屋台の記述**が入っていることがある。
 * 神社の例祭は神社庁からは屋台の有無が分からないので、ここで埋められると大きい。
 *
 * 誤って yes にしないよう、次を全部満たすときだけ上げる。
 *  - 記事の市区町村が祭りの市区町村と一致する
 *  - **社号ではなく固有の名前**が記事に出てくる（「八幡神社」だけでは駄目）
 *  - 本文に屋台・露店・模擬店などの記述がある
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ROOT, patch } from '../import/_lib.mjs';
import { hasStalls, pickDates } from '../import/_article.mjs';

const APPLY = process.argv.includes('--apply');

/** 全国に何千とある社号。これだけ一致しても同じ神社とは限らない */
const COMMON_SHRINE = /^(八幡神社|八幡宮|稲荷神社|稲荷社|諏訪神社|神明社|神明神社|八坂神社|天満宮|天神社|熊野神社|春日神社|日枝神社|山王神社|白山神社|御嶽神社|御霊神社|厳島神社|水神社|愛宕神社|浅間神社|三島神社|杉山神社|氷川神社|香取神社|鹿島神社|住吉神社|第六天神社|金刀比羅神社|貴船神社|水天宮|三輪神社|石川神社|赤城神社|榛名神社|大宮神社|二宮神社|二子神社|岡崎神社|松原神社)$/;

// ---- 記事を集める ----
const articles = [];
for (const [dir, cityOf] of [
  ['goguynet', (it) => (it.title.match(/^【([^】]{2,10})】/) ?? [])[1] ?? null],
  ['rarea', () => null], // レアリアは題名に素で市名が出るので本文照合で見る
]) {
  const base = join(ROOT, 'data', 'raw', dir);
  if (!existsSync(base)) continue;
  for (const f of readdirSync(base).filter((x) => x.endsWith('.json') && x !== '_areas.json')) {
    const j = JSON.parse(readFileSync(join(base, f), 'utf8'));
    for (const it of j.items ?? []) {
      articles.push({
        city: cityOf(it),
        title: it.title,
        body: it.body,
        url: it.url,
        // 同じ神社に祭りが複数あるとき、日付が合えばどれのことか決まる
        dates: pickDates(it.body, it.title, it.date),
      });
    }
  }
}
console.log(`記事 ${articles.length} 件を照合する`);

// ---- 屋台の記述がある記事だけに絞る ----
const withStalls = articles.filter((a) => hasStalls(`${a.title} ${a.body}`));
console.log(`  うち屋台の記述があるもの ${withStalls.length} 件`);

// ---- 未確認の祭りと突き合わせる ----
const targets = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;
    const f = parse(readFileSync(p, 'utf8'));
    if (f.stalls === 'unknown') targets.push(f);
  }
})(join(ROOT, 'data', 'festivals'));
console.log(`  屋台が未確認の祭り ${targets.length} 件`);

/**
 * 同じ神社に祭りが複数ある場合は、記事がどれのことか決められない。
 * 白旗神社（藤沢市）には例祭・どんど祭・秋祭があり、7 月の白旗まつりの記事で
 * 3 つとも屋台ありにしてしまった。**同じ神社でも祭りが違えば屋台の有無は違う**
 *（馬絹神社の 7 月は神事のみ、10 月は露店が多い）。
 */
const shrineCount = new Map();
for (const f of targets) {
  if (!f.shrine) continue;
  const k = `${f.area?.pref}|${f.area?.city}|${f.shrine}`;
  shrineCount.set(k, (shrineCount.get(k) ?? 0) + 1);
}

/** その祭りの開催日（年をまたいで比べたいので月日だけ見る） */
const mdOf = (dates) => (dates ?? []).map((d) => d.slice(5));

let hit = 0; let skippedGeneric = 0; let skippedAmbiguous = 0; let byDate = 0;
for (const f of targets) {
  // 同じ神社に祭りが複数あるときは、**日付が合う記事だけ**を使う。
  // 白旗神社（藤沢市）の例祭・どんど祭・秋祭を 7 月の記事で全部 yes にしていた
  const ambiguous = f.shrine
    && shrineCount.get(`${f.area?.pref}|${f.area?.city}|${f.shrine}`) > 1;
  const myMd = mdOf(f.occurrences?.[0]?.dates);
  if (ambiguous && !myMd.length) { skippedAmbiguous++; continue; }
  // 照合に使う語。社号だけのものは同名の別社をつかむので使わない
  const key = (f.shrine ?? f.name).replace(/\s*(例大祭|例祭|大祭|祭礼|祭典)\s*$/, '').trim();

  /**
   * ありふれた社号でも、**鎮座地の町名**を伴えば一意に決まる。
   * 「厚木市及川624」の八幡神社なら、題名に「及川」と「八幡神社」が
   * 両方出ている記事だけを使う。これで 537 件のうち住所のあるものを救える。
   */
  const town = (f.venue?.address ?? '')
    .replace(/^.*?[市区町村]/, '')
    .replace(/[0-9０-９\-ー－].*$/, '')
    .trim();
  const needTown = COMMON_SHRINE.test(key) || key.length < 4;
  if (needTown && town.length < 2) { skippedGeneric++; continue; }

  const city = f.area?.ward ?? f.area?.city ?? '';
  const bare = city.replace(/[市区町村]$/, '');

  const a = withStalls.find((x) => {
    const sameCity = x.city
      ? (x.city === city || x.city === f.area?.city)
      : (x.title.includes(city) || (bare.length >= 2 && x.title.includes(bare)));
    // **題名に出ていること**を要求する。本文のどこかに出ているだけだと、
    // 別の祭りの記事で言及されただけのものを拾う
    //（石濱神社納涼大会の記事で諏方神社の屋台を yes にしていた）
    if (!sameCity || !x.title.includes(key)) return false;
    // ありふれた社号は、鎮座地の町名も題名に出ていること
    if (needTown && !x.title.includes(town)) return false;
    // 同じ神社に複数あるときは日付の一致まで求める
    if (!ambiguous) return true;
    return mdOf(x.dates).some((md) => myMd.includes(md));
  });
  if (!a) { if (ambiguous) skippedAmbiguous++; continue; }

  hit++;
  if (ambiguous) byDate++;
  console.log(`  ${f.name}（${city}）${ambiguous ? '［日付一致］' : ''} ← ${a.title.slice(0, 42)}`);
  if (APPLY) {
    patch(f.id, {
      stalls: 'yes',
      links: [{ title: '屋台の記述がある記事', url: a.url }],
    });
  }
}

console.log(`\n${APPLY ? '屋台ありに更新' : '更新できる候補'}: ${hit} 件`
  + `（うち日付の一致で決めたもの ${byDate} 件 / 社号だけで照合できない ${skippedGeneric} 件 / 同じ神社に複数あって日付も合わない ${skippedAmbiguous} 件）`
  + `${APPLY ? '' : '\n（--apply を付けると実際に更新する）'}`);
