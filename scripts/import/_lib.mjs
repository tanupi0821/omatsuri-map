/**
 * インポーター共通処理。
 * 各インポーターは「出典から読み取った事実」の配列を作って emit() に渡すだけにする。
 *
 * 既存ファイルは上書きしない（手で足した description・緯度経度・タグを潰さないため）。
 * 出典元の更新を取り込み直したいときだけ --force。
 */
import { writeFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify, parse } from 'yaml';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FORCE = process.argv.includes('--force');

/**
 * @param {object[]} rows 祭りの配列
 * @param {object} ctx { pref, city, ward, prefSlug, citySlug, wardSlug, source, sourceName, checkedAt, year }
 */
export function emit(rows, ctx) {
  let written = 0;
  let skipped = 0;

  for (const r of rows) {
    // 複数の市区町村をまたぐ出典（県全体のまとめ記事など）は行ごとに指定できる
    const city = r.city ?? ctx.city;
    const citySlug = r.citySlug ?? ctx.citySlug;
    // 政令市以外は区がない。その場合は市の直下に置き、id も市の slug で始める
    const ward = r.ward ?? ctx.ward ?? null;
    const wardSlug = r.wardSlug ?? ctx.wardSlug ?? null;

    const outDir = wardSlug
      ? join(ROOT, 'data', 'festivals', ctx.prefSlug, citySlug, wardSlug)
      : join(ROOT, 'data', 'festivals', ctx.prefSlug, citySlug);
    mkdirSync(outDir, { recursive: true });

    const id = `${wardSlug ?? citySlug}-${r.slug}`;
    const path = join(outDir, `${id}.yml`);
    if (existsSync(path) && !FORCE) {
      skipped++;
      continue;
    }

    const festival = {
      id,
      name: r.name,
      kind: r.kind,
      scale: r.scale ?? '町内会',
      area: { pref: ctx.pref, city, ward },
      venue: {
        name: r.venue,
        address: r.address ? `${city}${ward ?? ''}${r.address}` : null,
        lat: null,
        lng: null,
      },
      ...(r.station ? { station: r.station } : {}),
      ...(r.recurrence ? { recurrence: r.recurrence } : {}),
      ...(r.recurrenceSource ? { recurrence_source: r.recurrenceSource } : {}),
      organizer: r.organizer ?? null,
      ...(r.shrine ? { shrine: r.shrine } : {}),
      stalls: r.stalls ?? 'unknown',
      tags: r.tags ?? [],
      ...(r.photos ? { photos: r.photos } : {}),
      description: null, // 自分の言葉で後から書く。出典の文章はコピーしない
      links: r.links ?? [],
      occurrences: [
        {
          year: r.year ?? ctx.year,
          dates: r.dates ?? [],
          ...(r.date_note ? { date_note: r.date_note } : {}),
          start_time: r.start ?? null,
          end_time: r.end ?? null,
          status: r.status ?? (r.dates?.length ? 'confirmed' : 'estimated'),
          source_url: r.source ?? ctx.source,
          source_name: r.sourceName ?? ctx.sourceName,
          source_type: r.sourceType ?? ctx.sourceType ?? 'media',
          checked_at: ctx.checkedAt,
          ...(r.note ? { note: r.note } : {}),
        },
      ],
    };

    writeFileSync(path, stringify(festival, { lineWidth: 0 }), 'utf8');
    written++;
  }

  console.log(`${ctx.label ?? ctx.ward}: ${written} 件書き出し / ${skipped} 件スキップ（既存）`);
  return { written, skipped };
}

// ---------------------------------------------------------------------------
// 一次情報での裏取り（enrich）用
// ---------------------------------------------------------------------------

function walkYml(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walkYml(p));
    else if (e.endsWith('.yml')) out.push(p);
  }
  return out;
}

let indexCache = null;
function fileIndex() {
  if (!indexCache) {
    indexCache = new Map(
      walkYml(join(ROOT, 'data', 'festivals')).map((p) => [basename(p, '.yml'), p]),
    );
  }
  return indexCache;
}

const uniq = (a) => [...new Set(a)];

/**
 * 既存の祭りに、一次情報（神社・主催者の公式サイト）で裏を取った内容を上書きする。
 *
 * まとめサイト経由で入れたデータを、あとから公式発表で置き換えるための入口。
 * emit() と違ってこちらは意図的に上書きする。出典の格を上げる操作だから。
 *
 * @param {string} id 対象の祭り id
 * @param {object} ch {
 *   name, shrine, organizer, description, station,
 *   links: string[]            既存に追加（重複は除去）
 *   tags: string[]             既存に追加
 *   venue: {name, address}     部分上書き
 *   occurrence: {              year で既存の開催回を探して上書き。無ければ追加
 *     year, dates, start_time, end_time, status, note,
 *     source_url, source_name, source_type, checked_at
 *   }
 * }
 */
export function patch(id, ch) {
  const path = fileIndex().get(id);
  if (!path) {
    console.warn(`  ! ${id} が見つからない（id を確認）`);
    return false;
  }

  const f = parse(readFileSync(path, 'utf8'));

  const SCALAR_KEYS = [
    'name', 'shrine', 'organizer', 'description', 'station', 'scale', 'kind',
    'recurrence', 'recurrence_source', 'stalls',
  ];
  for (const k of SCALAR_KEYS) {
    if (ch[k] != null) f[k] = ch[k];
  }
  // リンクは URL で重ならないようにする。
  // **Set では {title,url} の重複を落とせない**（別のオブジェクトは常に別物扱い）。
  // enrich を流すたびに同じリンクが積み上がり、1 件に 15 本並んでいた。
  // 素の文字列と {title,url} が同じ URL を指していたら、題のある方を残す
  if (ch.links) {
    const byUrl = new Map();
    for (const l of [...(f.links ?? []), ...ch.links]) {
      const url = typeof l === 'string' ? l : l?.url;
      if (!url) continue;
      const prev = byUrl.get(url);
      if (!prev || (typeof prev === 'string' && typeof l === 'object')) byUrl.set(url, l);
    }
    f.links = [...byUrl.values()];
  }
  // 写真は既定では足すだけ。誤って付いたものを外すときは photos_set で置き換える
  if (ch.photos) {
    const have = new Set((f.photos ?? []).map((p) => p.url));
    f.photos = [...(f.photos ?? []), ...ch.photos.filter((p) => !have.has(p.url))];
  }
  if (ch.photos_set !== undefined) {
    if (ch.photos_set?.length) f.photos = ch.photos_set;
    else delete f.photos;
  }
  // links は既定では足すだけ。素の URL 文字列を {title,url} に直すなど、
  // 既存の要素そのものを差し替えたいときは links_set で置き換える（photos_set と同じ）
  if (ch.links_set !== undefined) f.links = ch.links_set;
  if (ch.tags) f.tags = uniq([...(f.tags ?? []), ...ch.tags]);
  if (ch.venue) f.venue = { ...f.venue, ...ch.venue };

  if (ch.occurrence) {
    const o = ch.occurrence;
    const i = f.occurrences.findIndex((x) => x.year === o.year);
    if (i >= 0) f.occurrences[i] = { ...f.occurrences[i], ...o };
    else f.occurrences.push({ ...o });
    f.occurrences.sort((a, b) => b.year - a.year);
  }

  writeFileSync(path, stringify(f, { lineWidth: 0 }), 'utf8');
  return true;
}

/** patch() をまとめて流し、結果を数える */
export function patchAll(entries, label) {
  let ok = 0;
  let miss = 0;
  for (const [id, ch] of entries) {
    if (patch(id, ch)) ok++;
    else miss++;
  }
  console.log(`${label}: ${ok} 件を一次情報で更新${miss ? ` / ${miss} 件は対象なし` : ''}`);
}
