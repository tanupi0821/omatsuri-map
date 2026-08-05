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
import { readdirSync, readFileSync, writeFileSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { ROOT } from './import/_lib.mjs';

const APPLY = process.argv.includes('--apply');

/**
 * 統合してよい組の目印になる id。
 *
 * まとめサイト（hanabi/summer）は一次情報と重なる。
 * 号外NET は**同じ祭りを複数回記事にする**（告知と当日レポートなど）ので、
 * 号外NET どうしでも重なる。いずれも「同じ市の同名は別の祭り」という
 * 神社庁データとは事情が違う。
 */
const FROM_AGGREGATOR = /-(hanabi|summer)-(ar\d|\d)|-goguynet-\d/;
const TIER = { official: 3, gov: 2, media: 1, aggregator: 0 };

// 括弧は全角・半角が混ざる。「入谷朝顔まつり」と「入谷朝顔まつり(入谷朝顔市)」が
// 別物として残り、同じ写真が 2 件に付いて両方から外れていた
const norm = (s) => s
  .replace(/（[^）]*）/g, '')
  .replace(/\([^)]*\)/g, '')
  .replace(/第\d+回/g, '')
  .replace(/20\d\d/g, '')
  .replace(/[\s　・]/g, '')
  .trim();

const files = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith('.yml')) files.push(p);
  }
})(join(ROOT, 'data', 'festivals'));

const groups = new Map();
for (const path of files) {
  const f = parse(readFileSync(path, 'utf8'));
  const key = `${f.area.pref}|${f.area.city}|${norm(f.name)}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push({ path, f });
}

/** 出典の質・写真の有無で「残す方」を選ぶ */
const bestTier = (f) => Math.max(...f.occurrences.map((o) => TIER[o.source_type] ?? 0));
function pickKeeper(items) {
  return [...items].sort((a, b) => {
    const t = bestTier(b.f) - bestTier(a.f);
    if (t) return t;
    const p = (b.f.photos?.length ?? 0) - (a.f.photos?.length ?? 0);
    if (p) return p;
    // まとめサイト由来の機械的な id より、手で付けた読める id を残す
    return Number(FROM_AGGREGATOR.test(a.f.id)) - Number(FROM_AGGREGATOR.test(b.f.id));
  })[0];
}

let merged = 0; let removed = 0;
for (const [key, items] of groups) {
  if (items.length < 2) continue;
  // まとめサイト由来を含まない組は、同名の別の祭り（別の神社）なので触らない
  if (!items.some((x) => FROM_AGGREGATOR.test(x.f.id))) continue;

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
    }
    k.occurrences.sort((a, b) => b.year - a.year);
  }

  merged++;
  removed += others.length;
  console.log(`まとめる: ${key.split('|').slice(1).join(' ')} → ${k.id}`
    + `（消す: ${others.map((x) => x.f.id).join(', ')}）`);

  if (APPLY) {
    writeFileSync(keep.path, stringify(k, { lineWidth: 0 }), 'utf8');
    for (const x of others) unlinkSync(x.path);
  }
}

console.log(`\n${APPLY ? 'まとめた' : 'まとめる候補'}: ${merged} 組 / ${removed} 件を削除`
  + `${APPLY ? '' : '\n（--apply を付けると実際に書き換える）'}`);
