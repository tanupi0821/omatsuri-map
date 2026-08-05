/**
 * 一次情報での裏取り（第23弾：既存リンクからの格上げ その10）
 *
 *   node scripts/enrich/primary-hanabi-23.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。この回は 10 件すべて当たった。
 * **`links` に個別ページのリンクが入っているものは、ほぼそのまま格上げできる。**
 * リンクが一覧ページ（`.../kanko/index.html` のような形）のものは
 * 個別の告知に届かないので、そこが分かれ目になる。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 長野県
  // ------------------------------------------------------------------

  // 伊那まつり。市のページは日付だけで時刻・会場の記載がない
  ['nagano-003-hanabi-ar0420e00442', {
    links: [L('伊那市 第69回伊那まつり', 'https://www.inacity.jp/kankojoho/event_kanko/inamatsuri/dai69inamatsuri/index.html')],
    occurrence: {
      ...src(2026, 'https://www.inacity.jp/kankojoho/event_kanko/inamatsuri/dai69inamatsuri/index.html', '伊那市', 'gov'),
      status: 'confirmed',
      note: '花火は約600発。時刻・会場は市のページに記載がない',
    },
  }],

  // 塩尻。**協賛は観光協会、運営は市の観光プロモーション課**と分かれている
  ['nagano-010-hanabi-ar0420e409637', {
    organizer: '塩尻市観光協会・塩尻市観光プロモーション課',
    station: 'JR中央本線 みどり湖駅（徒歩約20分）',
    venue: { name: '小坂田公園および小坂田池周辺', address: '長野県塩尻市' },
    links: [L('時めぐり（塩尻市観光協会）第56回小坂田公園納涼花火大会', 'https://tokimeguri.jp/guide/dai56-osakadakoennouryouhanabi2026/')],
    occurrence: {
      ...src(2026, 'https://tokimeguri.jp/guide/dai56-osakadakoennouryouhanabi2026/', '塩尻市観光協会', 'official'),
      start_time: '19:00',
      end_time: '20:00',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 長崎県
  // ------------------------------------------------------------------

  // 長与町。花火は20:20から20:50
  ['nagasaki-007-hanabi-ar1042e00497', {
    organizer: '長与川まつり実行委員会',
    venue: { name: '長与町総合公園ふれあい広場', address: '長崎県西彼杵郡長与町' },
    links: [L('長与町 第46回長与川まつり', 'https://webtown.nagayo.jp/kiji0035942/index.html')],
    occurrence: {
      ...src(2026, 'https://webtown.nagayo.jp/kiji0035942/index.html', '長与町', 'gov'),
      start_time: '20:20',
      end_time: '20:50',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 新潟県
  // ------------------------------------------------------------------

  // 燕市。主催はつばめ商工会吉田本所内の協賛会
  ['niigata-005-summer-ar0415e193819', {
    organizer: '吉田まつり協賛会（つばめ商工会吉田本所）',
    venue: { name: '吉田駅前広場ほか', address: '新潟県燕市吉田' },
    links: [L('燕市 第67回吉田まつり', 'https://www.city.tsubame.niigata.jp/soshiki/sangyo_shinko/1/3/14427.html')],
    occurrence: {
      ...src(2026, 'https://www.city.tsubame.niigata.jp/soshiki/sangyo_shinko/1/3/14427.html', '燕市', 'gov'),
      status: 'confirmed',
      note: '時刻は燕市のページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 沖縄県
  // ------------------------------------------------------------------

  // 本部町。**初日は14:00から、2日目は10:00から**で時間帯が違う
  ['okinawa-010-summer-ar1047e42311', {
    organizer: '本部まつり実行委員会（本部町企画商工観光課内）',
    venue: { name: '大浜多目的広場・沖縄県栽培漁業センター・渡久地港', address: '沖縄県国頭郡本部町字大浜872番地5' },
    links: [L('本部町 第53回本部海洋まつり', 'https://www.town.motobu.okinawa.jp/doc/2026060300025/')],
    occurrence: {
      ...src(2026, 'https://www.town.motobu.okinawa.jp/doc/2026060300025/', '本部町', 'gov'),
      start_time: '14:00',
      end_time: '21:00',
      status: 'confirmed',
      note: '7月18日は14:00〜21:00、19日は10:00〜21:00',
    },
  }],

  // ------------------------------------------------------------------
  // 大阪府
  // ------------------------------------------------------------------

  // 門真。**総合体育館（12:00〜18:00）と市役所敷地内（16:00〜21:00）で時間帯が違う**
  ['osaka-017-goguynet-161854', {
    organizer: 'ふるさと門真まつり実行委員会',
    venue: { name: '門真市立総合体育館・門真市役所敷地内・旧第六中学校運動広場', address: '大阪府門真市中町1-1' },
    links: [L('門真市 第8回ふるさと門真まつり', 'https://www.city.kadoma.osaka.jp/soshiki/shiminbunkabu/9/5/3_1/furusatokadomamaturi/8kadomamasuri/37683.html')],
    occurrence: {
      ...src(2026, 'https://www.city.kadoma.osaka.jp/soshiki/shiminbunkabu/9/5/3_1/furusatokadomamaturi/8kadomamasuri/37683.html', '門真市', 'gov'),
      start_time: '12:00',
      end_time: '21:00',
      status: 'confirmed',
      note: '総合体育館は12:00〜18:00、市役所敷地内と旧第六中学校運動広場は16:00〜21:00',
    },
  }],

  // ------------------------------------------------------------------
  // 佐賀県
  // ------------------------------------------------------------------

  // 太良町。会場の住所と最寄駅が取れた
  ['saga-003-hanabi-ar1041e00376', {
    station: 'JR長崎本線 多良駅（徒歩約15分）',
    venue: { name: '太良町役場・太良町B&G海洋センター運動広場', address: '佐賀県藤津郡太良町多良1-6' },
    links: [L('太良町観光協会 第35回太良町納涼夏まつり', 'https://tara-kankou.jp/spot/35.html')],
    occurrence: {
      ...src(2026, 'https://tara-kankou.jp/spot/35.html', '太良町観光協会', 'official'),
      start_time: '20:00',
      status: 'confirmed',
      note: '花火の打上げは20:00頃から',
    },
  }],

  // ------------------------------------------------------------------
  // 静岡県
  // ------------------------------------------------------------------

  // 牧之原。**正式名称は「2026 RIDE ON MAKINOHARA〜いい波に乗ろう!さがら海上花火大会」**
  ['shizuoka-011-hanabi-ar0622e07619', {
    venue: { name: 'さがらサンビーチ', address: '静岡県牧之原市相良' },
    links: [L('牧之原市観光協会 さがら海上花火大会', 'https://msckc.jp/kankou/contents/event/event_9-2_sag-fireworks.html')],
    occurrence: {
      ...src(2026, 'https://msckc.jp/kankou/contents/event/event_9-2_sag-fireworks.html', '牧之原市観光協会', 'official'),
      start_time: '19:00',
      end_time: '20:00',
      status: 'confirmed',
    },
  }],

  // 堂ヶ島火祭り。夕映えの花火と同じ西伊豆町観光協会が主催
  ['shizuoka-012-hanabi-ar0622e07620', {
    organizer: '西伊豆町観光協会',
    venue: { name: '堂ヶ島公園', address: '静岡県賀茂郡西伊豆町仁科2910-2' },
    links: [L('西伊豆町観光協会 堂ヶ島火祭り', 'https://www.nishiizu-kankou.com/event/himatsuri')],
    occurrence: {
      ...src(2026, 'https://www.nishiizu-kankou.com/event/himatsuri', '一般社団法人西伊豆町観光協会', 'official'),
      start_time: '18:00',
      end_time: '21:00',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 和歌山県
  // ------------------------------------------------------------------

  // 那智勝浦。**観覧はブルービーチ那智、打上げは那智漁港**
  ['wakayama-001-hanabi-ar0730e00161', {
    organizer: '那智勝浦町花火大会実行委員会',
    venue: { name: 'ブルービーチ那智（打上げは那智漁港）', address: '和歌山県東牟婁郡那智勝浦町大字築地7丁目1-1' },
    links: [L('那智勝浦町 第17回那智勝浦町花火大会', 'https://www.town.nachikatsuura.wakayama.jp/info/596')],
    occurrence: {
      ...src(2026, 'https://www.town.nachikatsuura.wakayama.jp/info/596', '那智勝浦町', 'gov'),
      start_time: '20:15',
      status: 'confirmed',
    },
  }],
], '既存リンクからの格上げ（10）');
