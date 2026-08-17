/**
 * 例祭日ルールから導いた推定日を、いまの規則で引き直す
 *
 *   node scripts/enrich/refresh-estimated-dates.mjs [--apply]
 *
 * `jpdate.mjs` に 2 つの誤りがあった:
 *   1. 「体育の日の前の土曜日」を体育の日そのもの（月曜）にしていた
 *   2. 「スポーツの日」の長音「ー」を範囲記号に変えてしまい、解決できなかった
 * 取り込みは既存ファイルを上書きしないので、**保存済みの推定日は誤ったまま**。
 * status が estimated（＝ルールから導いた推定）の開催回だけを引き直す。
 * 主催者が発表した日付（confirmed）には触らない。
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse, stringify } from 'yaml';
import { ROOT } from '../import/_lib.mjs';
import { resolveFestivalDate } from '../lib/jpdate.mjs';

const APPLY = process.argv.includes('--apply');
let checked = 0; let changed = 0;

(function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!e.endsWith('.yml')) continue;
    const f = parse(readFileSync(p, 'utf8'));
    if (!f.recurrence) continue;
    let dirty = false;
    for (const o of f.occurrences ?? []) {
      if (o.status !== 'estimated' || !o.year) continue;
      checked++;
      // 「4月第3日曜日／10月第3日曜日」のように複数のルールが／で並ぶ。
      // まとめて渡すと前半しか解決されず、**10月の開催日が消える**ところだった。
      // 分けて解いて合わせる
      const dates = [...new Set(
        f.recurrence.split(/[／/]/)
          .flatMap((part) => resolveFestivalDate(part, o.year)?.dates ?? []),
      )].sort();
      if (!dates.length) continue;
      // 「10月第2土曜日を中日とする金・土・日の3日間」のような言い回しは
      // 解けないので土曜 1 日だけが返る。**保存済みの 3 日間を 1 日に
      // 削ってしまう**ところだった。解決結果が保存済みの部分集合なら、
      // 情報が減るだけなので触らない
      if (dates.every((d) => (o.dates ?? []).includes(d))
        && dates.length < (o.dates ?? []).length) continue;
      const now = JSON.stringify(dates);
      if (now === JSON.stringify(o.dates)) continue;
      console.log(`${f.id}: ${JSON.stringify(o.dates)} → ${now}（${f.recurrence}）`);
      changed++;
      if (!APPLY) continue;
      o.dates = dates;
      dirty = true;
    }
    if (APPLY && dirty) writeFileSync(p, stringify(f, { lineWidth: 0 }), 'utf8');
  }
})(join(ROOT, 'data', 'festivals'));

console.log(`\n推定の開催回 ${checked} 件を確認、${APPLY ? '直した' : '直す候補'} ${changed} 件${APPLY ? '' : '\n（--apply で実行）'}`);
