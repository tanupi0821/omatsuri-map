/**
 * 同じ花火大会の重複レコードへ、有料観覧席の有無を配る
 *
 *   node scripts/enrich/paid-seats-03-samename.mjs
 *
 * ひとつの花火大会が、出典の違いで何件にも分かれている。
 * 市川市民納涼花火大会は6件、立川まつりの花火大会は5件あった。
 * **そのうち1件だけがウォーカープラスの詳細ページを出典に持っていて、
 * 残りは地域メディア由来で有料席の欄を持たない。**
 *
 * 同じ市区町村の、名前を正規化すると一致する花火大会は同じ大会なので、
 * **すでに確かめた値をそのまま配る**。新しい主張はしていない
 * （出典も同じものを指す）。
 *
 * 名前の正規化は控えめにする:
 *
 * - 「第◯回」「2026」「令和8年」などの回数・年を落とす
 * - 記号と空白を落とす
 * - **それでも一致しないものは配らない。** 「◯◯まつり花火大会」と
 *   「◯◯花火大会」を同じ扱いにすると、別の大会を巻き込む恐れがある
 *
 * `unknown`（入場料の要る施設）は配らない。会場ごとに事情が違うため。
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const walk = (d, out = []) => {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.yml')) out.push(p);
  }
  return out;
};

/** 回数・年・記号を落として、大会の名前だけにする */
const norm = (s) =>
  (s || '')
    .replace(/第\s*[0-9０-９]+\s*回/g, '')
    .replace(/[0-9０-９]{4}年?/g, '')
    .replace(/令和\s*[0-9０-９]+\s*年(度)?/g, '')
    .replace(/[「」『』（）()【】\[\]・,、.。\s　_\-—–~〜！!？?]/g, '')
    .replace(/まつり|祭り|祭/g, 'まつり')
    .toLowerCase();

const items = [];
for (const p of walk(join(ROOT, 'data', 'festivals'))) {
  let f;
  try {
    f = parse(readFileSync(p, 'utf8'));
  } catch {
    continue;
  }
  if (f.kind !== '花火' && !/花火/.test(f.name || '')) continue;
  items.push({ p, f });
}

// 「市区町村＋正規化した名前」で束ねる
const groups = new Map();
for (const it of items) {
  const key = `${it.f.area?.pref}|${it.f.area?.city}|${norm(it.f.name)}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(it);
}

let spread = 0;
for (const g of groups.values()) {
  if (g.length < 2) continue;
  // 確かめ済みのもの（yes / no）を1つ選ぶ。複数あって食い違うときは配らない
  const known = g.filter((x) => x.f.paid_seats === 'yes' || x.f.paid_seats === 'no');
  if (!known.length) continue;
  const vals = new Set(known.map((x) => x.f.paid_seats));
  if (vals.size > 1) continue; // 食い違うものは触らない
  const src = known[0];
  for (const x of g) {
    if (x.f.paid_seats) continue;
    x.f.paid_seats = src.f.paid_seats;
    x.f.paid_seats_note = src.f.paid_seats_note;
    writeFileSync(x.p, stringify(x.f, { lineWidth: 0 }), 'utf8');
    spread++;
  }
}
console.log(`同じ大会の重複レコードへ配った: ${spread} 件`);
