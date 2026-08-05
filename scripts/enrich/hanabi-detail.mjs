/**
 * ウォーカープラス（花火・夏祭り）の詳細ページから、中身の無いページを埋める
 *
 *   node scripts/crawl/hanabi-detail.mjs             # HTML を取る（3.5 秒間隔・約 67 分）
 *   node scripts/crawl/hanabi-detail.mjs --geocode   # 緯度経度→住所（国土地理院）
 *   node scripts/enrich/hanabi-detail.mjs            # 書き込む（ここは通信しない）
 *
 * 担当は **id に `-hanabi-` / `-summer-` を含む祭りだけ**。
 * 一覧の JSON-LD からは県と市区町村しか取れず、名前・日付・会場名だけの
 * ページになっていた。詳細ページには次が入っている（実際に 1 枚開いて確認済み）。
 *
 * | 埋める項目 | 出どころ |
 * |---|---|
 * | `venue.address` | 夏祭りは「住所」欄。**花火には住所欄が無い**ので地図の緯度経度を国土地理院で逆引き |
 * | `venue.lat/lng` | 地図埋め込みの `q=<lat>,<lng>` |
 * | `occurrences[].start_time/end_time` | 「開催時間」（花火はヘッダ、夏祭りは data.html の表） |
 * | `organizer` | 「問い合わせ」欄の団体名 |
 * | `links` | 「公式サイト」欄のリンク先 |
 * | `station` | 「会場アクセス」の【電車】の部分 |
 *
 * ## 別の市の情報を入れない
 *
 * 住所は**必ず掲載市と突き合わせる**。
 * - 夏祭りの「住所」欄は、掲載市の名前を含んでいなければ捨てる
 * - 逆引きした住所は、国土地理院が返した市区町村コードが掲載市と一致したときだけ使う
 *   （川の対岸・海上に落ちた座標はここで落ちる）
 *
 * 一致しなかったときは緯度経度も入れない。座標が信用できないのに
 * 座標だけ残すと、あとから地図を出すときに同じ間違いをする。
 *
 * ## 上書きの方針
 *
 * `emit()` は既存を上書きしないので、ここは `patch()` を使う。
 * ただし**既に値が入っている項目には触れない**。より格の高い出典（公式・行政）で
 * 埋めた主催者名を、まとめサイトの問い合わせ先で潰さないため。
 */
import { patch } from '../import/_lib.mjs';
import { inScopeFestivals, parseDetail, loadGsiCache, parseHeaderDates } from '../crawl/hanabi-detail.mjs';

const CHECKED = '2026-08-05';
const APPLY = !process.argv.includes('--dry-run');

const gsi = loadGsiCache();
const muni = gsi._muni ?? {};

/** 全角の空白・記号を落として比較用にそろえる */
const norm = (s) => String(s ?? '').replace(/[\s　]/g, '');

/**
 * 逆引き結果を「掲載市と同じか」で選別して住所にする。
 * @returns {{address:string}|{reject:string}|null}
 */
function addressFromGeo(geo, pref, city, ward) {
  if (!geo) return null;
  const r = gsi[`${geo.lat},${geo.lng}`];
  if (!r || !r.muniCd) return null;
  const m = muni[String(Number(r.muniCd))];
  if (!m) return null;

  // 都道府県が違えば問答無用で捨てる
  if (norm(m.pref) !== norm(pref)) return { reject: `${m.pref}${m.name}` };
  // 政令市は「横浜市青葉区」まで、郡部は「東栄町」まで一致させる。
  // **こちらのデータは「北設楽郡東栄町」と郡付き、国土地理院は「東栄町」**なので、
  // 郡を落とした形も候補に入れる。落とさないと郡部が全部「別の市」になる
  const dropGun = (s) => s.replace(/^.*?郡/, '');
  const want = new Set([
    norm(`${city}${ward ?? ''}`), norm(city),
    dropGun(norm(`${city}${ward ?? ''}`)), dropGun(norm(city)),
  ]);
  const got = norm(m.name);
  if (!want.has(got) && !want.has(dropGun(got))) return { reject: `${m.pref}${m.name}` };

  const town = norm(r.lv01Nm);
  // 町丁目が取れなければ市区町村名だけになる。それは既に分かっていることなので入れない
  if (!town) return null;
  // 既存データの書き方に合わせ、都道府県は付けず市区町村から書く。
  // 郡は住所の一部なので、こちら側の city（郡付き）を使う
  return { address: `${city}${ward ?? ''}${town}` };
}

/**
 * 夏祭りの「住所」欄。「愛知県 津島市宮川町1丁目地内外」の形。
 * 都道府県を落とし、**掲載市の名前を含んでいることを確かめる**。
 */
function addressFromField(raw, pref, city, ward) {
  if (!raw) return null;
  const v = norm(raw).replace(new RegExp(`^${norm(pref)}`), '');
  if (!v) return null;
  const key = norm(`${city}${ward ?? ''}`);
  if (!v.startsWith(norm(city))) return { reject: v };
  // 「愛知県一宮市」のように市名で終わるものは住所になっていない
  if (v === norm(city) || v === key) return null;
  return { address: v };
}

const targets = inScopeFestivals();
const stat = {
  address: 0, addrFromField: 0, addrFromGeo: 0, addrReject: 0,
  time: 0, organizer: 0, links: 0, station: 0, venue: 0, geo: 0,
  noCache: 0, touched: 0,
};
const rejects = [];
const dateMismatch = [];

for (const t of targets) {
  const d = parseDetail(t.kind, t.eventId);
  if (!d) { stat.noCache++; continue; }

  const f = t.f;
  const { pref, city, ward } = f.area;
  const occ = f.occurrences.find((o) => o.year === 2026) ?? f.occurrences[0];
  const ch = {};
  const venuePatch = {};

  // 取り込み済みの日付が詳細ページと食い違っていないかを見る（報告するだけ）。
  // 一覧の JSON-LD は初日と最終日しか持たないので、間の日が抜けている分は数えない
  const shown = parseHeaderDates(d.headerPeriod);
  if (shown.length && (occ?.dates ?? []).length) {
    const miss = occ.dates.filter((x) => !shown.includes(x));
    if (miss.length) dateMismatch.push(`${t.id}: 取り込み ${occ.dates.join('・')} / 出典 ${d.headerPeriod}`);
  }

  // ---- 住所・緯度経度 ----
  if (!f.venue?.address) {
    const field = addressFromField(d.address, pref, city, ward);
    // 住所欄が別の市を指していても、緯度経度の逆引きは別途試す
    const geoA = field?.address ? null : addressFromGeo(d.geo, pref, city, ward);
    const a = field?.address ? field : (geoA ?? field);
    if (a?.address) {
      venuePatch.address = a.address;
      stat.address++;
      if (field?.address) stat.addrFromField++; else stat.addrFromGeo++;
    } else if (a?.reject) {
      stat.addrReject++;
      if (rejects.length < 25) rejects.push(`${t.id}: 掲載は ${pref}${city}${ward ?? ''} なのに ${a.reject}`);
    }
  }
  // 座標は、逆引きが掲載市と食い違ったときは入れない（住所と同じ理由）
  const geoOk = d.geo && !(addressFromGeo(d.geo, pref, city, ward) ?? {}).reject;
  if (geoOk && f.venue?.lat == null) {
    venuePatch.lat = d.geo.lat;
    venuePatch.lng = d.geo.lng;
    stat.geo++;
  }
  // 会場名が「◯◯市内」しか無いものは、詳細ページの会場名で置き換える
  if (d.venue && f.venue?.name === `${city}内` && d.venue !== `${city}内`) {
    venuePatch.name = d.venue;
    stat.venue++;
  }
  if (Object.keys(venuePatch).length) ch.venue = venuePatch;

  // ---- 開催時間 ----
  if (d.start && !occ?.start_time) {
    ch.occurrence = {
      year: occ.year,
      start_time: d.start,
      ...(d.end ? { end_time: d.end } : {}),
    };
    stat.time++;
  }

  // ---- 主催（問い合わせ先の団体名）----
  if (d.organizer && !f.organizer) { ch.organizer = d.organizer; stat.organizer++; }

  // ---- 最寄駅 ----
  if (d.station && !f.station) { ch.station = d.station; stat.station++; }

  // ---- 公式サイト ----
  // patch() の links は参照で重複を見るので、同じ URL を毎回足してしまう。
  // ここで既にあるかを URL で確かめてから渡す。
  if (d.official && !/walkerplus\.com/.test(d.official)) {
    const have = (f.links ?? []).some((l) => (typeof l === 'string' ? l : l?.url) === d.official);
    if (!have) { ch.links = [{ title: '公式サイト', url: d.official }]; stat.links++; }
  }

  if (!Object.keys(ch).length) continue;
  // 詳細ページを今日読み直しているので、確認日を更新する
  ch.occurrence = { year: occ.year, ...(ch.occurrence ?? {}), checked_at: CHECKED };
  stat.touched++;
  if (APPLY) patch(t.id, ch);
}

console.log(`\n花火・夏祭りの詳細（ウォーカープラス）: ${stat.touched} 件を更新${APPLY ? '' : '（--dry-run のため書いていない）'}`);
console.log(`  住所        ${stat.address}（住所欄 ${stat.addrFromField} / 緯度経度の逆引き ${stat.addrFromGeo}）`);
console.log(`  緯度経度    ${stat.geo}`);
console.log(`  開催時間    ${stat.time}`);
console.log(`  主催        ${stat.organizer}`);
console.log(`  公式サイト  ${stat.links}`);
console.log(`  最寄駅      ${stat.station}`);
console.log(`  会場名の補完 ${stat.venue}`);
console.log(`  住所を捨てた ${stat.addrReject}（掲載市と違う市区町村だったもの）`);
console.log(`  未取得       ${stat.noCache} 件（クロールがまだ届いていない）`);
for (const r of rejects) console.log(`    - ${r}`);
if (dateMismatch.length) {
  console.log(`  ※ 出典の「開催期間」と取り込み済みの日付が食い違うもの ${dateMismatch.length} 件（書き換えていない）`);
  for (const m of dateMismatch.slice(0, 10)) console.log(`    - ${m}`);
}
