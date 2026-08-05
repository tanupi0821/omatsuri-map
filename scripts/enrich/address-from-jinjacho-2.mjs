/**
 * 神社庁の住所を入れる（第2弾：社号の前に町名が付いている会場を拾う）
 *
 *   node scripts/enrich/address-from-jinjacho-2.mjs [--apply]
 *
 * `address-from-jinjacho.mjs` は会場名から取った社号と神社庁の社号が
 * **完全に一致したときだけ**住所を移す。そのため
 *
 *   池辺町杉山神社 / 勝田杉山神社 / 大熊杉山神社   ← 町名が前に付く
 *   八幡神社 境内・滝頭公園                      ← 後ろに会場が続く
 *
 * のような書き方が全部落ちていた。ここではその2つの形を拾う。
 *
 * **同名の別社をつかまないための条件**（docs/kanto-plan.md で何度も踏んだ落とし穴）:
 *
 * - 市区町村が一致することは必須。そのうえで、
 * - 同じ市に同名の社が複数あるときは、**会場名に付いている町名が
 *   神社庁の住所に出てくるもの**に限って採る。横浜市には杉山神社が
 *   いくつもあるが、「池辺町杉山神社」は住所に池辺町を含む1社に決まる
 * - 町名でも1社に絞れなければ入れない。**間違った住所を入れるより空のまま残す**
 *
 * 他の2体が担当している出典（-hanabi- / -summer- / -goguynet- / -rarea- /
 * -tokyofesta-）のファイルには触らない。同時に書き換えると衝突するため。
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ROOT, patch } from '../import/_lib.mjs';

const APPLY = process.argv.includes('--apply');
const RAW = join(ROOT, 'data', 'raw', 'jinjacho');
const OTHERS = /-hanabi-|-summer-|-goguynet-|-rarea-|-tokyofesta-/;
const SUFFIX = /(神社|神宮|八幡宮|天満宮|大社|稲荷|明神社|神明宮)$/;

if (!existsSync(RAW)) {
  console.error('data/raw/jinjacho がない');
  process.exit(1);
}

/** 「市区町村」→ [{name, address}] */
const byCity = new Map();
for (const pref of readdirSync(RAW)) {
  for (const f of readdirSync(join(RAW, pref))) {
    const j = JSON.parse(readFileSync(join(RAW, pref, f), 'utf8'));
    if (!j.name || !j.address) continue;
    // 神社庁の社号に神社IDが付いたまま入っていることがある（「皇大神宮 1206021000」）。
    // これを落とさないと社号が一致せず、その神社だけ住所を入れられない
    j.name = j.name.replace(/\s*\d{6,}\s*$/, '').trim();
    const address = j.address.replace(/\s+/g, '');
    // 「横浜市都筑区池辺町…」は市の段階で切る。データ側の area.city が「横浜市」なので
    const city = (address.match(/^(.+?[市区町村])/) ?? [])[1];
    if (!city) continue;
    if (!byCity.has(city)) byCity.set(city, []);
    byCity.get(city).push({ name: j.name, address });
  }
}
console.log(`神社庁の社 ${[...byCity.values()].reduce((a, b) => a + b.length, 0)} 件 / ${byCity.size} 市区町村`);

const targets = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;
    const f = parse(readFileSync(p, 'utf8'));
    if (!f.venue?.address && !OTHERS.test(f.id)) targets.push(f);
  }
})(join(ROOT, 'data', 'festivals'));
console.log(`  住所が空の祭り（自分の担当ぶん） ${targets.length} 件`);

/**
 * **ありふれた社号**。これだけでは同名の別社と区別できない。
 * 神社庁のデータに1社しか無くても、それはこのデータの中の話でしかない
 * （江戸川区の天祖神社は神社庁データに1社だが、区内には東小岩・中曽根・松本…と
 * いくつもある）。町名の裏づけが取れないかぎり住所を入れない。
 */
const COMMON = new Set([
  '八幡神社', '八幡宮', '稲荷神社', '天祖神社', '神明社', '神明宮', '八坂神社',
  '諏訪神社', '氷川神社', '杉山神社', '白山神社', '春日神社', '熊野神社',
  '御嶽神社', '日枝神社', '香取神社', '浅間神社', '愛宕神社', '北野神社',
  '天満宮', '山神社', '三島神社', '厳島神社', '住吉神社', '雷神社',
]);

let hit = 0;
let unresolved = 0;

for (const f of targets) {
  const cands = byCity.get(f.area.city);
  if (!cands) continue;

  // 会場名から「◯◯神社」の形の語を拾う。
  // 「大熊公園・大熊杉山神社」のように会場が2つ書かれていることがある
  const words = (f.venue?.name ?? '').split(/[\s、・／/（(）)〜～]+/).filter(Boolean);
  const shrineWords = [f.shrine, ...words].filter((w) => w && SUFFIX.test(w));
  if (!shrineWords.length) continue;
  // 社号がその祭りの会場そのものだと言えるのは、shrine 欄か会場名の先頭のときだけ。
  // 「旧中山道（新浦和橋下〜調神社）」の調神社は経路の端であって会場ではない
  const primary = new Set([f.shrine, words[0]].filter(Boolean));

  let chosen = null;
  for (const w of shrineWords) {
    // (a) 社号が完全に一致する。ありふれた社号は除く
    if (primary.has(w) && !COMMON.has(w)) {
      const uniq = [...new Set(cands.filter((c) => c.name === w).map((c) => c.address))];
      if (uniq.length === 1) { chosen = uniq[0]; break; }
      if (uniq.length > 1) unresolved++;
    }

    // (b) 「池辺町杉山神社」のように町名が前に付く。
    //     **その町名が神社庁の住所に出てくること**を条件にする
    const partial = cands.filter((c) => c.name !== w && w.endsWith(c.name));
    if (!partial.length) continue;
    const prefix = w.slice(0, w.length - partial[0].name.length);
    if (prefix.length < 2) continue;
    const narrowed = [...new Set(partial.map((c) => c.address).filter((a) => a.includes(prefix)))];
    if (narrowed.length === 1) { chosen = narrowed[0]; break; }
    if (narrowed.length > 1) unresolved++;
  }
  if (!chosen) continue;

  hit++;
  console.log(`  ${f.name}（${f.area.city}｜${f.venue.name}） → ${chosen}`);
  if (APPLY) patch(f.id, { venue: { address: chosen } });
}

console.log(`\n${APPLY ? '住所を入れた' : '入れられる候補'}: ${hit} 件`
  + `（同名が複数あって決められなかった ${unresolved} 件）`
  + `${APPLY ? '' : '\n（--apply を付けると実際に書き込む）'}`);
