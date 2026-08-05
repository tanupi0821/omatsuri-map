import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, parseAllDocuments } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DATA_DIR = join(ROOT, 'data');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (entry.endsWith('.yml') || entry.endsWith('.yaml')) out.push(p);
  }
  return out;
}

export function loadFestivals() {
  const dir = join(DATA_DIR, 'festivals');
  return walk(dir)
    .map((p) => {
      // 置き場所が data/festivals/<県>/<市>[/<区>]/*.yml なので、
      // そのままエリアページの URL に使える。名前から作り直さなくてよい
      const rel = p.slice(dir.length + 1).split(/[\\/]/);
      return {
        ...parse(readFileSync(p, 'utf8')),
        _file: basename(p),
        _prefSlug: rel[0],
        _citySlug: rel[1],
      };
    })
    .sort((a, b) => (firstDate(a) ?? '9999').localeCompare(firstDate(b) ?? '9999'));
}

export function loadArea(slug) {
  return parse(readFileSync(join(DATA_DIR, 'areas', `${slug}.yml`), 'utf8'));
}

/**
 * data/areas/*.yml を全部読み、市町村の配列に正規化する。
 * ファイルは「1市＝1ファイル（政令市）」と「複数市町村をまとめた1ファイル」の
 * どちらの形もとれる。区のない市町村は wards が空。
 */
export function loadAreas() {
  const dir = join(DATA_DIR, 'areas');
  const out = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.yml'))) {
    // 1 ファイルに複数の都県を `---` 区切りで入れられる
    for (const d of parseAllDocuments(readFileSync(join(dir, file), 'utf8'))) {
    const doc = d.toJS();
    const list = doc.cities ?? [doc];
    for (const c of list) {
      out.push({
        pref: doc.pref,
        city: c.city ?? c.name,
        slug: c.city_slug ?? c.slug,
        wards: c.wards ?? [],
        sources: c.sources ?? c.city_sources ?? [],
      });
    }
    }
  }
  return out;
}

/** その祭りの最新の開催回（年が一番大きいもの） */
export function latestOccurrence(f) {
  return [...(f.occurrences ?? [])].sort((a, b) => b.year - a.year)[0] ?? null;
}

export function firstDate(f) {
  const o = latestOccurrence(f);
  return o?.dates?.[0] ?? null;
}

/** 「7月17日(金)・18日(土)」のような表示文字列 */
const WD = ['日', '月', '火', '水', '木', '金', '土'];
export function formatDates(occ) {
  if (!occ?.dates?.length) return occ?.date_note ?? '日程未定';
  return occ.dates
    .map((d) => {
      const [y, m, day] = d.split('-').map(Number);
      const w = WD[new Date(Date.UTC(y, m - 1, day)).getUTCDay()];
      return `${m}月${day}日(${w})`;
    })
    .join('・');
}

export function formatTime(occ) {
  if (!occ?.start_time) return null;
  return occ.end_time ? `${occ.start_time}〜${occ.end_time}` : `${occ.start_time}〜`;
}

export const STATUS_LABEL = {
  confirmed: null, // 確定はバッジを出さない
  estimated: '日程は例年からの推定',
  unconfirmed: '未確認',
  cancelled: '中止',
  postponed: '延期',
};

/** 最終確認からの経過日数 */
export function staleDays(occ, today = new Date()) {
  if (!occ?.checked_at) return Infinity;
  const d = new Date(`${occ.checked_at}T00:00:00Z`);
  return Math.floor((today - d) / 86400000);
}
