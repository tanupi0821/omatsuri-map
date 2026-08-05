/**
 * 手元のデータと出典PDFの備考から、屋台・露店の有無を機械的に確定させる
 *
 *   node scripts/enrich/stalls-from-notes.mjs
 *
 * 行政の一覧には備考欄があり、「模擬店あり（ラムネ、かき氷、綿あめ、焼きそば等）」
 * のように書かれていることが多い。取り込み時に本文へ入れてあるので、
 * そこを走査すれば個別に調べ直さなくても yes を立てられる。
 *
 * 判定は**書いてあるものだけ yes**。書いていないものは unknown のままにする。
 * 「書いていない＝出ない」ではないので no にはしない。
 *
 * 模擬店（町会が自分で出す店）と露店・夜店（専門の露天商）は厳密には別物だが、
 * 「食べ物や遊びがあるか」という利用者の関心では同じなので yes にまとめる。
 * どちらだったかは備考の原文が残るので個別ページで分かる。
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { ROOT } from '../import/_lib.mjs';

// 屋台・露店があると読み取れる表現
const YES = /模擬店|屋台|夜店|露店|出店|キッチンカー|夜市|縁日|飲食ブース|パン販売|かき氷|焼きそば/;
// 「露店が出るかは未確認」のように否定・保留の文脈は拾わない
const NEGATIVE = /出るかは未確認|未確認|出ません|なし/;

let yes = 0;
let kept = 0;
const changed = [];

(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;

    const f = parse(readFileSync(p, 'utf8'));
    if (f.stalls === 'yes' || f.stalls === 'no') { kept++; continue; }

    // 名前と備考を見る（備考に出典の備考欄がそのまま入っている）
    for (const o of f.occurrences ?? []) {
      const txt = `${f.name} ${o.note ?? ''}`;
      if (!YES.test(txt)) continue;
      // 「露店が出るかは未確認」のような文は除く
      const m = txt.match(new RegExp(`.{0,12}(${YES.source}).{0,12}`));
      if (m && NEGATIVE.test(m[0])) continue;

      f.stalls = 'yes';
      writeFileSync(p, stringify(f, { lineWidth: 0 }), 'utf8');
      yes++;
      changed.push(`${f.id}: ${(m ?? [''])[0].trim()}`);
      break;
    }
  }
})(join(ROOT, 'data', 'festivals'));

console.log(`備考から屋台ありと確定: ${yes} 件（すでに確定済み ${kept} 件は据え置き）`);
for (const c of changed.slice(0, 15)) console.log(`  ${c}`);
if (changed.length > 15) console.log(`  ... ほか ${changed.length - 15} 件`);
