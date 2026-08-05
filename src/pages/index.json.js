/**
 * 検索用の索引（全国 4000 件）
 *
 * 全部を HTML に出すとトップが 2.9MB になる。かといって市区町村ページに
 * 割ると「県をまたいで探す」ができない。そこで**索引だけを別ファイル**にして、
 * 検索を使うときにだけ読み込む。
 *
 * 鍵は 1 文字にしてある。4000 件 × 十数項目なので、名前の長さがそのまま効く。
 *   i=id / n=名前 / p=都道府県 / c=市区町村 / w=区 / k=種別 / v=会場
 *   s=屋台(1=出る) / d=開催日 / r=地方 / a=エリアのURL
 */
import { loadFestivals, latestOccurrence } from '../lib/data.js';
import { byName } from '../../scripts/lib/prefs.mjs';

export function GET() {
  const rows = loadFestivals().map((f) => {
    const o = latestOccurrence(f);
    return {
      i: f.id,
      n: f.name,
      p: f.area.pref,
      c: f.area.city,
      ...(f.area.ward ? { w: f.area.ward } : {}),
      k: f.kind,
      v: f.venue?.name ?? '',
      ...(f.stalls === 'yes' ? { s: 1 } : {}),
      d: o?.dates ?? [],
      r: byName(f.area.pref)?.region ?? '',
      a: `${f._prefSlug}/${f._citySlug}`,
    };
  });

  return new Response(JSON.stringify(rows), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
