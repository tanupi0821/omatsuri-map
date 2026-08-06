/**
 * 同じ祭りが複数の出典から入ってしまったものを 1 件にまとめる
 *
 *   node scripts/dedupe.mjs [--apply]
 *
 * 全国のまとめサイトを取り込んだら、関東で既に一次情報から入れていた祭りと
 * 重なった（例: 手賀沼花火大会が 2 件）。
 *
 * **同じ市に同じ名前の祭りが複数あるのは普通のこと**なので、
 * 名前が一致するだけでは統合しない。平塚市には八坂神社例祭が 3 つあり、
 * それぞれ別の神社（東八幡・飯島・纒）の祭り。
 *
 * そこで、**まとめサイト由来の項目を含む組だけ**を統合対象にする。
 * 神社庁由来どうしの同名は別の神社なので触らない。実際、
 * まとめサイトを含む 44 組に例祭型は 1 つも無かった。
 *
 * 残す方は出典の質で決める（公式 > 行政 > メディア > まとめ）。
 * 消す方が持っていた屋台の有無・写真・リンク・日付は残す方に移す。
 */
import { readdirSync, readFileSync, writeFileSync, statSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { ROOT } from './import/_lib.mjs';

const APPLY = process.argv.includes('--apply');

/**
 * **統合済みの記録**。これが無いと、消しても次の `npm run collect` で
 * 取り込み側が同じ祭りを作り直してしまう（実際に 238 件が復活した）。
 * 消した id と、その代わりに残した id を覚えておき、
 * 復活したものは毎回だまって片付ける。
 *
 * 「新しく統合する」のは --apply のときだけ。**一度も人の目を通していない
 * 統合を勝手に実行しない**（小さな祭りが黙って減るのが一番こわい）。
 */
const MERGED = join(ROOT, 'data', 'merged.json');
const mergedInto = existsSync(MERGED) ? JSON.parse(readFileSync(MERGED, 'utf8')) : {};

/**
 * 統合してよい組の目印になる id。
 *
 * まとめサイト（hanabi/summer）は一次情報と重なる。
 * 号外NET は**同じ祭りを複数回記事にする**（告知と当日レポートなど）ので、
 * 号外NET どうしでも重なる。いずれも「同じ市の同名は別の祭り」という
 * 神社庁データとは事情が違う。
 */
// 名鑑（gotouti）由来も記事媒体なので同じ事情。**行政の一覧と同じ祭りが重なる**
// （江東区の町会盆踊りが、区の PDF と地域情報サイトの両方から入っている）。
// つーしん系も同様に、告知と当日レポートで同じ祭りを 2 度記事にする
const FROM_AGGREGATOR = /-(hanabi|summer)-(ar\d|\d)|-(goguynet|rarea|tokyofesta)-\d|-gotouti-[a-z0-9-]+-\d|-tsushin-/;
const TIER = { official: 3, gov: 2, media: 1, aggregator: 0 };

// 括弧は全角・半角が混ざる。「入谷朝顔まつり」と「入谷朝顔まつり(入谷朝顔市)」が
// 別物として残り、同じ写真が 2 件に付いて両方から外れていた
// 全角数字は半角に直してから「第N回」を落とす。
// 「第３７回小田原酒匂川花火大会」が素通りしていた
const han = (s) => s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));

const norm = (s) => han(s)
  .replace(/（[^）]*）/g, '')
  .replace(/\([^)]*\)/g, '')
  .replace(/第\d+回/g, '')
  .replace(/20\d\d/g, '')
  // 「令和7年度  流山花火大会」の年度も名前ではない
  .replace(/[令平]\s*[和成]\s*\d{1,2}\s*年度?/g, '')
  // 「関宿祇園夏まつり」と「関宿祇園夏祭り」は同じもの
  .replace(/まつり/g, '祭り')
  .replace(/おどり/g, '踊り')
  // 「納涼盆踊り大会」と「納涼盆踊り」も同じ
  .replace(/大会$/, '')
  .replace(/[\s　・「」『』]/g, '')
  .trim();

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith('.yml')) files.push(p);
  }
})(join(ROOT, 'data', 'festivals'));

// 取り込みで復活した統合済みの id を片付ける
let revived = 0;
for (let i = files.length - 1; i >= 0; i--) {
  const f = parse(readFileSync(files[i], 'utf8'));
  if (!mergedInto[f.id]) continue;
  unlinkSync(files[i]);
  files.splice(i, 1);
  revived++;
}
if (revived) console.log(`統合済みなのに取り込みで戻っていた ${revived} 件を片付けた`);

const groups = new Map();
const bySource = new Map();
// 出典 URL で作った組の目印。こちらは「同じページから 2 回作られた」証拠なので、
// 出典の格や会場名の食い違いに関係なく統合してよい
const sourceKeys = new Set();
for (const path of files) {
  const f = parse(readFileSync(path, 'utf8'));
  const key = `${f.area.pref}|${f.area.city}|${norm(f.name)}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push({ path, f });

  /**
   * **出典 URL と名前が両方同じなら、同じ祭り。**
   *
   * 名前が同じだけでは統合しない（同じ市に同名の神社がいくつもある）が、
   * **出典の URL まで同じなら、同じページから 2 回作られた**ということ。
   * 実際に神奈川県神社庁の 1 社が `aoba-jinjacho-…` と
   * `yokohama-jinjacho-…` の 2 件になっていた。区を市として扱っていた
   * 頃の取り込みが残ったもので、125 組 250 件あった。
   *
   * この規則は出典の格を問わない（神社庁どうしでも成り立つ）。
   */
  const u = f.occurrences?.[0]?.source_url;
  if (u) {
    const sk = `${u}|${norm(f.name)}`;
    if (!bySource.has(sk)) bySource.set(sk, []);
    bySource.get(sk).push({ path, f });
  }
}
// 出典が同じ組は、名前で作った組より確実なので先に入れておく
for (const [sk, list] of bySource) {
  if (list.length < 2) continue;
  if (groups.has(sk)) continue;
  groups.set(sk, list);
  sourceKeys.add(sk);
}

/** 出典の質・写真の有無で「残す方」を選ぶ */
const bestTier = (f) => Math.max(...f.occurrences.map((o) => TIER[o.source_type] ?? 0));

/**
 * 会場名がちゃんと取れているか。記事から切り出したものは
 * 「・時間：」のような切れ端になっていることがあり、そちらを残すと劣化する。
 */
const venueOk = (f) => {
  const v = f.venue?.name ?? '';
  if (!v || /^[・、。：:\s]/.test(v) || /[：:]$/.test(v)) return 0;
  if (/内$/.test(v)) return 1; // 「◯◯市内」は会場が分からないのと同じ
  return 2;
};

function pickKeeper(items) {
  return [...items].sort((a, b) => {
    // **中身の質を先に見る**。出典の格だけで決めると、
    // 会場が「・時間：」の記事版が公式版を押しのけることがあった
    const v = venueOk(b.f) - venueOk(a.f);
    if (v) return v;
    // 日程が多いほうが情報として厚い（3 日間の祭りを 1 日と書く出典がある）
    const d = (b.f.occurrences?.[0]?.dates?.length ?? 0) - (a.f.occurrences?.[0]?.dates?.length ?? 0);
    if (d) return d;
    const addr = Number(Boolean(b.f.venue?.address)) - Number(Boolean(a.f.venue?.address));
    if (addr) return addr;
    const t = bestTier(b.f) - bestTier(a.f);
    if (t) return t;
    const p = (b.f.photos?.length ?? 0) - (a.f.photos?.length ?? 0);
    if (p) return p;
    // まとめサイト由来の機械的な id より、手で付けた読める id を残す
    return Number(FROM_AGGREGATOR.test(a.f.id)) - Number(FROM_AGGREGATOR.test(b.f.id));
  })[0];
}

let merged = 0; let removed = 0;
// 1 つのファイルが「名前で作った組」と「出典で作った組」の両方に入ることがある。
// 2 度消そうとして落ちたので、消したものを覚えておく
const gone = new Set();
for (const [key, rawItems] of groups) {
  const items = rawItems.filter((x) => !gone.has(x.path));
  if (items.length < 2) continue;
  // まとめサイト由来を含まない組は、同名の別の祭り（別の神社）なので触らない。
  // ただし出典 URL が同じ組は別（同じページから 2 回作られたことが確定している）
  if (!sourceKeys.has(key) && !items.some((x) => FROM_AGGREGATOR.test(x.f.id))) continue;

  /**
   * **政令市の区が違えば別の祭り**。`area.city` が「横浜市」で揃っていても、
   * 青葉区の「夏祭り」と港南区の「夏祭り」は無関係。
   * 名前が総称のときにこれが効く。
   */
  const wards = new Set(items.map((x) => x.f.area?.ward ?? ''));
  if (wards.size > 1) continue;

  /**
   * **会場が食い違う組は統合しない。**
   *
   * 「納涼盆踊り」「夏祭り」のような総称は、同じ市に町会の数だけ存在する。
   * 実際、松戸市の「納涼盆踊り」8 件を 1 件に潰しかけた。**別々の町会の
   * 盆踊りで、全部残さなければならないもの**だった。区の判定は政令市にしか
   * 効かないので、松戸市のような市ではこれが唯一の歯止めになる。
   *
   * 同じ祭りを別の出典から取ると会場名の書き方は揺れる（「そうか公園」と
   * 「そうか公園 芝生広場」）ので、**片方がもう片方を含むなら同じ**とみなす。
   * 会場が「◯◯市内」のものは会場が分からないのと同じなので判定に使わない。
   */
  const vkey = (x) => han(x.f.venue?.name ?? '').replace(/[\s　・（）()]/g, '');
  const venues = [...new Set(items.map(vkey).filter((v) => v && !/[市区町村]内$/.test(v)))];
  const conflict = !sourceKeys.has(key)
    && venues.some((p) => venues.some((q) => p !== q && !p.includes(q) && !q.includes(p)));
  if (conflict) {
    console.log(`会場が違うので触らない: ${key.split('|').slice(1).join(' ')}`
      + `（${venues.join(' / ')}）`);
    continue;
  }

  const keep = pickKeeper(items);
  const others = items.filter((x) => x !== keep);
  const k = keep.f;

  for (const { f: o } of others) {
    // 屋台は「出る」と分かっている方を採る
    if (o.stalls === 'yes') k.stalls = 'yes';

    if (o.photos?.length) {
      const have = new Set((k.photos ?? []).map((p) => p.url));
      k.photos = [...(k.photos ?? []), ...o.photos.filter((p) => !have.has(p.url))];
    }

    /**
     * **統合で情報を減らさない。** 消す方にしか無い項目を引き取る。
     *
     * 花火大会の 924 件は、地図埋め込みの緯度経度を逆ジオコーディングして
     * ようやく住所を入れたもの。ここで引き取らないと、記事版が残ったときに
     * 住所・最寄駅・主催がまるごと消える。
     * 残す方に入っている値は正しいものとして扱い、上書きはしない。
     */
    if (!k.venue.address && o.venue?.address) k.venue.address = o.venue.address;
    if (k.venue.lat == null && o.venue?.lat != null) {
      k.venue.lat = o.venue.lat;
      k.venue.lng = o.venue.lng;
    }
    if (!k.organizer && o.organizer) k.organizer = o.organizer;
    if (!k.station && o.station) k.station = o.station;
    if (!k.shrine && o.shrine) k.shrine = o.shrine;
    if (!k.recurrence && o.recurrence) {
      k.recurrence = o.recurrence;
      k.recurrence_source = o.recurrence_source;
    }
    if (o.tags?.length) k.tags = [...new Set([...(k.tags ?? []), ...o.tags])];

    // 消す方の出典は、裏取りの手がかりとしてリンクに残す
    const links = k.links ?? [];
    for (const oc of o.occurrences) {
      if (!oc.source_url) continue;
      if (links.some((l) => l.url === oc.source_url)) continue;
      links.push({ title: oc.source_name ?? '別の出典', url: oc.source_url });
    }
    k.links = links;

    // 残す方に日付が無く、消す方にあるなら日付をもらう
    for (const oc of o.occurrences) {
      const mine = k.occurrences.find((x) => x.year === oc.year);
      if (!mine) { k.occurrences.push(oc); continue; }
      if (!mine.dates?.length && oc.dates?.length) {
        mine.dates = oc.dates;
        mine.status = oc.status;
        mine.note = [mine.note, `日付は${oc.source_name ?? '別の出典'}による`].filter(Boolean).join('／');
      }
      // 時刻も同じ。片方にしか無いことが多い
      if (!mine.start_time && oc.start_time) {
        mine.start_time = oc.start_time;
        mine.end_time = mine.end_time ?? oc.end_time;
      }
    }
    k.occurrences.sort((a, b) => b.year - a.year);
  }

  merged++;
  removed += others.length;
  console.log(`まとめる: ${key.split('|').slice(1).join(' ')} → ${k.id}`
    + `（消す: ${others.map((x) => x.f.id).join(', ')}）`);

  if (APPLY) {
    writeFileSync(keep.path, stringify(k, { lineWidth: 0 }), 'utf8');
    for (const x of others) {
      mergedInto[x.f.id] = k.id;
      if (existsSync(x.path)) unlinkSync(x.path);
      gone.add(x.path);
    }
  }
}

console.log(`\n${APPLY ? 'まとめた' : 'まとめる候補'}: ${merged} 組 / ${removed} 件を削除`
  + `${APPLY ? '' : '\n（--apply を付けると実際に書き換える）'}`);

if (APPLY) {
  writeFileSync(MERGED, `${JSON.stringify(mergedInto, null, 2)}
`, 'utf8');
}
