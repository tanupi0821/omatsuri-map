/**
 * 会場と掲載市区町村が食い違うレコードを、正しい場所へ動かす
 *
 *   node scripts/enrich/area-fix-04-ward.mjs
 *
 * 会場名を直したときに見つかった2件。
 * **どちらも「記事を配信しているメディアの地域」で市区町村を決めているため、
 * 会場の実際の場所とずれている。**
 *
 * - 晴海ふ頭公園盆踊り大会 … 出典は豊洲（江東区）のメディアだが、
 *   会場の晴海ふ頭公園は**中央区晴海**
 * - OHASHI HILL 1st アニバーサリーフェスタ … 会場は**福岡市南区**大橋。
 *   いまは区の無い「福岡市」に置かれている（福岡市は区ごとの枠がある）
 *
 * 動かすと id とパスが変わるので、元の id は `data/merged.json` に記録する。
 * 冪等（すでに動いていれば何もしない）。
 */
import { readdirSync, readFileSync, writeFileSync, unlinkSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FEST = join(ROOT, 'data', 'festivals');
const MERGED = join(ROOT, 'data', 'merged.json');
const CHECKED = '2026-08-06';

const findById = (id) => {
  const stack = [FEST];
  while (stack.length) {
    const dir = stack.pop();
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) stack.push(p);
      else if (e === `${id}.yml`) return p;
    }
  }
  return null;
};

const MOVES = [
  {
    from: 'koto-gotouti-toyosu-93500',
    toDir: join(FEST, 'tokyo', 'chuou'),
    toId: 'chuou-gotouti-toyosu-93500',
    patch: (f) => {
      f.area = { pref: '東京都', city: '中央区', ward: null };
      f.venue = { ...f.venue, name: '晴海ふ頭公園', address: '中央区晴海5-7-1' };
      f.station = 'ゆりかもめ 市場前駅／都営大江戸線 勝どき駅';
      const o = f.occurrences?.[0];
      if (o) {
        o.checked_at = CHECKED;
        o.note = '会場の晴海ふ頭公園は中央区晴海。出典が豊洲（江東区）のメディアのため掲載区が江東区になっていたので中央区へ移した';
      }
      return f;
    },
  },
  {
    from: 'fukuoka-019-gotouti-fukuoka-leapup-77242',
    // 福岡市は区ごとに枠がある（fukuoka-023＝中央区、fukuoka-025＝博多区）。
    // 南区の枠がまだ無いので、空いている番号で作る
    toDir: join(FEST, 'fukuoka', 'fukuoka-037'),
    toId: 'fukuoka-037-gotouti-fukuoka-leapup-77242',
    patch: (f) => {
      f.area = { pref: '福岡県', city: '福岡市南区', ward: null };
      const o = f.occurrences?.[0];
      if (o) {
        o.checked_at = CHECKED;
        o.note = '4月18日（土）10:30〜17:00、会場はOHASHI HILL（福岡市南区大橋1-3-3）。会場名が「感」の1文字だけになっていたので直し、区の無い「福岡市」から南区へ移した';
      }
      return f;
    },
  },
];

// おおはしヒル夏まつり（同じ OHASHI HILL の別記事）も南区へ
MOVES.push({
  from: 'fukuoka-019-gotouti-fukuoka-leapup-84206',
  toDir: join(FEST, 'fukuoka', 'fukuoka-037'),
  toId: 'fukuoka-037-gotouti-fukuoka-leapup-84206',
  patch: (f) => {
    f.area = { pref: '福岡県', city: '福岡市南区', ward: null };
    const o = f.occurrences?.[0];
    if (o) o.checked_at = CHECKED;
    return f;
  },
});

const merged = existsSync(MERGED) ? JSON.parse(readFileSync(MERGED, 'utf8')) : {};
let moved = 0;
for (const m of MOVES) {
  const p = findById(m.from);
  if (!p) continue;
  const f = m.patch(parse(readFileSync(p, 'utf8')));
  f.id = m.toId;
  mkdirSync(m.toDir, { recursive: true });
  writeFileSync(join(m.toDir, `${m.toId}.yml`), stringify(f, { lineWidth: 0 }), 'utf8');
  unlinkSync(p);
  merged[m.from] = m.toId;
  moved++;
  console.log(`  移動 ${m.from} → ${m.toId}`);
}
if (moved) writeFileSync(MERGED, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
console.log(`会場と掲載市区町村の食い違い: ${moved} 件を移動`);
