/**
 * 一次情報での裏取り（第32弾：既存リンクからの格上げ その17）
 *
 *   node scripts/enrich/primary-hanabi-32.mjs
 *
 * `primary-hanabi-14.mjs` と同じやり方。
 *
 * 取れなかったもの:
 * - 江の川祭（江津商工会議所）… サイト移転の告知だけが残っていて中身が無い
 * - 氏郷まつり（日野町商工会）… TLS 証明書がホスト名と合わない（さくらの共有証明書）
 * - 壬生ふるさとまつり… リンク先が 404
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

patchAll([
  // ------------------------------------------------------------------
  // 徳島県
  // ------------------------------------------------------------------

  // 鳴門。**「鳴門の夏まつり」（8/7）と「鳴門市阿波おどり」（8/9〜11）は別の行事**
  ['tokushima-002-hanabi-ar0936e00701', {
    organizer: '鳴門市・鳴門商工会議所・鳴門市うずしお観光協会',
    links: [L('鳴門商工会議所 鳴門の夏まつり／鳴門市阿波おどり', 'https://www.narutocci.or.jp/awaodori/index.html')],
    occurrence: {
      ...src(2026, 'https://www.narutocci.or.jp/awaodori/index.html', '鳴門商工会議所', 'official'),
      status: 'confirmed',
      note: '「鳴門の夏まつり」は8月7日、「鳴門市阿波おどり」は8月9日〜11日で別の行事。花火の時刻は商工会議所のページに記載がない',
    },
  }],

  // ------------------------------------------------------------------
  // 島根県
  // ------------------------------------------------------------------

  // 弥栄ふるさとまつり。**開催は毎年お盆（8月中旬）**。会場の住所が取れた
  ['shimane-003-hanabi-ar0832e149528', {
    organizer: '弥栄ふるさとまつり実行委員会',
    recurrence: '8月中旬（お盆）',
    recurrence_source: 'https://kankou-hamada.or.jp/guidepost/10628',
    venue: { name: '浜田市役所弥栄支所前イベント広場', address: '島根県浜田市弥栄町長安本郷' },
    links: [L('浜田市観光協会 弥栄ふるさとまつり', 'https://kankou-hamada.or.jp/guidepost/10628')],
    occurrence: {
      ...src(2026, 'https://kankou-hamada.or.jp/guidepost/10628', '浜田市観光協会', 'official'),
      status: 'confirmed',
      note: '日付・時刻は観光協会のページに記載がなく、以前の発表による',
    },
  }],

  // ------------------------------------------------------------------
  // 山梨県
  // ------------------------------------------------------------------

  // 月見ヶ池弁財天祭り。**「開始・終了時間は状況により変動」**と市が明記している
  ['yamanashi-004-summer-ar0419e187238', {
    venue: { name: '月見ヶ池', address: '山梨県上野原市' },
    links: [L('上野原市 月見ヶ池弁財天祭り', 'https://www.city.uenohara.yamanashi.jp/site/kankou/1018661.html')],
    occurrence: {
      ...src(2026, 'https://www.city.uenohara.yamanashi.jp/site/kankou/1018661.html', '上野原市', 'gov'),
      status: 'confirmed',
      note: '午後から夜にかけて行われる。開始・終了の時刻は状況により変わると市が明記している',
    },
  }],

  // ------------------------------------------------------------------
  // 和歌山県
  // ------------------------------------------------------------------

  // 紀の川市民まつり。会場の番地（花野604）と花火の時刻が市のページで取れた
  ['wakayama-004-hanabi-ar0730e560621', {
    venue: { name: '紀の川市民公園多目的広場（打田若もの広場）', address: '和歌山県紀の川市花野604' },
    links: [L('紀の川市 紀の川市民まつり', 'https://www.city.kinokawa.lg.jp/032/2020-0520-1150-12.html')],
    occurrence: {
      ...src(2026, 'https://www.city.kinokawa.lg.jp/032/2020-0520-1150-12.html', '紀の川市', 'gov'),
      start_time: '20:00',
      end_time: '20:30',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 埼玉県
  // ------------------------------------------------------------------

  // 秩父夜祭の花火。**12月2日（宵宮）と3日（本祭）の両方に上がる**のに、
  // データは3日の分しか持っていなかった。時間帯も日によって違う
  ['chichibu-hanabi-ar0311e360635', {
    station: '西武秩父線 西武秩父駅',
    recurrence: '12月2日（宵宮）・12月3日（本祭）',
    recurrence_source: 'https://navi.city.chichibu.lg.jp/info/2025/11/28217/',
    venue: { name: '羊山公園ほか秩父市街地', address: '埼玉県秩父市' },
    links: [L('秩父市観光ナビ 秩父夜祭', 'https://navi.city.chichibu.lg.jp/info/2025/11/28217/')],
    occurrence: {
      ...src(2025, 'https://navi.city.chichibu.lg.jp/info/2025/11/28217/', '秩父市', 'gov'),
      dates: ['2025-12-02', '2025-12-03'],
      start_time: '19:00',
      end_time: '21:55',
      status: 'confirmed',
      note: '12月2日（宵宮）は19:00〜20:00、3日（本祭）は19:30〜21:55。データは3日の分しか持っていなかった',
    },
  }],

  // 春日部の納涼夏祭り。**会場は市役所の「まちのリビング」ほか**
  ['kasukabe-goguynet-82764', {
    station: '東武スカイツリーライン 春日部駅',
    venue: { name: '春日部市役所 まちのリビング・まちなかひろば・ひだまりホール', address: '埼玉県春日部市中央七丁目2番地1' },
    links: [L('春日部市 納涼夏祭り', 'https://www.city.kasukabe.lg.jp/eventjoho/eventjoho_kanko_omatsuri/37655.html')],
    occurrence: {
      ...src(2026, 'https://www.city.kasukabe.lg.jp/eventjoho/eventjoho_kanko_omatsuri/37655.html', '春日部市', 'gov'),
      start_time: '16:00',
      end_time: '20:00',
      status: 'confirmed',
    },
  }],

  // ------------------------------------------------------------------
  // 富山県
  // ------------------------------------------------------------------

  // ふるさと龍宮まつり。**祭りは7月18日・19日の2日間で、花火は20:10から**
  ['toyama-005-hanabi-ar0516e01049', {
    organizer: 'ふるさと龍宮まつり実行委員会',
    links: [L('滑川商工会議所 ふるさと龍宮まつり', 'https://namerikawa.ccis-toyama.or.jp/ryugu/')],
    occurrence: {
      ...src(2026, 'https://namerikawa.ccis-toyama.or.jp/ryugu/', '滑川商工会議所', 'official'),
      start_time: '20:10',
      status: 'confirmed',
      note: '祭り自体は7月18日・19日の2日間。花火は20:10から。終了時刻は商工会議所のページに記載がない',
    },
  }],
  ['toyama-005-summer-ar0516e188678', {
    organizer: 'ふるさと龍宮まつり実行委員会',
    links: [L('滑川商工会議所 ふるさと龍宮まつり', 'https://namerikawa.ccis-toyama.or.jp/ryugu/')],
    occurrence: {
      ...src(2026, 'https://namerikawa.ccis-toyama.or.jp/ryugu/', '滑川商工会議所', 'official'),
      status: 'confirmed',
      note: '花火は20:10から',
    },
  }],
], '既存リンクからの格上げ（17）');
