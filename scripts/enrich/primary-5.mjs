/**
 * 一次情報での裏取り（第5弾）— **既に載っている祭りの中身を厚くする**
 *
 *   node scripts/enrich/primary-5.mjs
 *
 * 対象は `occurrences[0].source_type` が official / gov のもの**だけ**。
 * media / aggregator 由来には触れない（出典の格上げは別の工程が担当している）。
 *
 * 埋める優先順は 住所 → 時刻 → 主催 → 最寄駅 → リンク → 例祭日の決まり。
 *
 * --- ここに書く前に必ず確かめたこと ---
 *
 * - **そのページが本当にその市区町村のその祭りか**。ページ内の住所か市区町村名で照合した。
 *   確かめられなかったものは埋めずに残してある（末尾の「埋めなかったもの」を見ること）。
 *   実際、佐原（香取市）の諏訪神社を調べていて**睦沢町の諏訪神社**のページを掴みかけた。
 *   社号は全国で重複するので、名前が一致しただけでは採らない。
 * - **拾うのは事実の項目だけ**（住所・時刻・主催者名・最寄駅・URL）。
 *   出典の文章は持ち込まない。`description` は全件 null のまま。
 * - **時刻は同じ年の発表から取る**。曜日が今年と合うことまで確かめた
 *   （例: 多古祇園祭「7月25日（土）」は 2026 年の並びと一致する）。
 *   年が特定できないものは `note` にその旨を書いてから入れる。
 * - 一日の中で時間帯が分かれるもの（宵宮と本宮、子どもみこしと大人みこし）は
 *   全体を start_time / end_time にし、内訳は `note` に書く。
 * - `links` は `{title, url}` で統一する。素の文字列と混ぜると `[object Object]` になる。
 */
import { patchAll } from '../import/_lib.mjs';

const L = (title, url) => ({ title, url });
const CHECKED = '2026-08-06';

// 出典を差し替えるときの定型。source_url を替えたら source_name と格も一緒に替える
const src = (year, url, name, type) => ({
  year, source_url: url, source_name: name, source_type: type, checked_at: CHECKED,
});

// 千葉県公式観光サイト（(公社)千葉県観光物産協会）。住所・開催時間・アクセスを
// 欄として持っているので、市町村ページに時刻が無いものをここで補える
const CHIBA_NAVI = 'ちば観光ナビ（千葉県公式観光サイト）';

patchAll([
  // ==================================================================
  // 千葉県
  // ==================================================================

  // 八坂神社周辺の 4 町（本町・新町・仲町・高根）の山車。
  // 町のページには日付しか無く、住所と時刻は県公式観光サイトの欄にあった。
  // 「7月25日（土）」が 2026 年の曜日と一致するので今年の発表と判断した。
  ['tako-tako-gion', {
    shrine: '八坂神社',
    venue: { name: '八坂神社周辺（多古町本町・新町・仲町・高根）', address: '香取郡多古町多古2696' },
    links: [
      L('多古町 多古祇園祭', 'https://www.town.tako.chiba.jp/docs/2018012900186/'),
      L(`${CHIBA_NAVI} 多古祇園祭`, 'https://maruchiba.jp/event/detail_12859.html'),
    ],
    occurrence: {
      ...src(2026, 'https://maruchiba.jp/event/detail_12859.html', CHIBA_NAVI, 'gov'),
      start_time: '08:00',
      end_time: '22:00',
      note: '初日（7月25日）は12時から22時、2日目（7月26日）は8時から22時',
    },
  }],

  // 成田市観光協会の公式ページに日ごとの時間が出ている。3 日で時間帯が違うので
  // 全体を start/end にし、内訳は note に置いた
  ['narita-narita-gion-sai', {
    station: 'JR成田線・京成本線「成田駅」',
    links: [L('成田市観光協会 成田祇園祭', 'http://www.nrtk.jp/enjoy/shikisaisai/gion-festival.html')],
    occurrence: {
      year: 2026,
      start_time: '09:00',
      end_time: '23:00',
      checked_at: CHECKED,
      note: '7月10日は13時30分から22時ごろ、11日は9時から22時ごろ、12日は13時から23時ごろ',
    },
  }],

  // 香取市の祭り紹介ページに「午前10時から午後10時まで」とある。
  // **佐原の諏訪神社の住所は入れていない**。県公式観光サイトで諏訪神社を引くと
  // 長生郡睦沢町の同名社が出てきて、佐原のものだと確かめられなかったため
  ['katori-sawara-taisai-aki', {
    station: 'JR成田線「佐原駅」（駅前が祭り区域）',
    links: [L('香取市 佐原の大祭 秋祭り', 'https://www.city.katori.lg.jp/sightseeing/matsuri/introduction/aki.html')],
    occurrence: {
      year: 2026,
      start_time: '10:00',
      end_time: '22:00',
      checked_at: CHECKED,
      note: '時刻は香取市の祭り紹介ページの記載による（山車の曳き廻しの時間帯）',
    },
  }],

  // 銚子市のページ（この祭りの出典そのもの）に時刻が書いてある。
  // 県公式観光サイトは「14:00〜19:30」としているが、市の記載の方が細かいので市を採る
  ['choshi-choshi-minato-matsuri-mikoshi', {
    links: [L('銚子市 銚子みなとまつり', 'https://www.city.choshi.chiba.jp/event/page1103_00084.html')],
    occurrence: {
      year: 2026,
      start_time: '13:40',
      end_time: '19:00',
      checked_at: CHECKED,
      note: 'みこしの出発は14時ごろの予定',
    },
  }],

  // 県公式観光サイトに住所・時刻・最寄駅が揃っている。
  // 子どもみこしと大人みこしで時間帯が分かれるので全体を start/end にした
  ['noda-noda-mikoshi-parade', {
    venue: { name: '野田市 本町通り周辺', address: '野田市野田' },
    station: '東武アーバンパークライン「愛宕駅」徒歩約5分',
    links: [
      L('野田市 野田みこしパレード', 'https://www.city.noda.chiba.jp/shisei/profile/bunkazai/matsuri/1000829.html'),
      L(`${CHIBA_NAVI} 野田みこしパレード`, 'https://maruchiba.jp/event/detail_12907.html'),
    ],
    occurrence: {
      ...src(2026, 'https://maruchiba.jp/event/detail_12907.html', CHIBA_NAVI, 'gov'),
      start_time: '15:30',
      end_time: '22:00',
      note: '子どもみこしは16時から、大人みこしは17時40分から',
    },
  }],

  // 千葉市のページに「8月15日11時00分から8月16日20時00分」とある。
  // 会場は中央公園だが住所の記載が無いので住所は入れていない
  ['chiba-chuo-oyako-sandai-natsumatsuri', {
    station: 'JR「千葉駅」徒歩約7分／千葉都市モノレール「葭川公園駅」徒歩約3分',
    links: [L('千葉市 千葉の親子三代夏祭り', 'https://www.city.chiba.jp/shimin/shimin/jichi/event/documents/oyakosandai50.html')],
    occurrence: {
      year: 2026,
      start_time: '11:00',
      end_time: '20:00',
      checked_at: CHECKED,
      note: '初日（8月15日）は11時開始、2日目（8月16日）は20時終了',
    },
  }],

  // ==================================================================
  // 茨城県
  // ==================================================================

  // 会場の大宝八幡宮が自前のサイトを持っていて、そこに住所が出ている。
  // 下妻市で一致するので採用。風鈴まつりの時刻・主催は書かれていなかった
  ['shimotsuma-shimotsuma-furin-matsuri', {
    shrine: '大宝八幡宮',
    venue: { name: '大宝八幡宮', address: '下妻市大宝667' },
    links: [L('大宝八幡宮', 'https://www.daiho.or.jp/')],
  }],

  // 村のページに「令和8年8月8日（土曜日）19時から20時まで」とある（この祭りの出典そのもの）
  ['tokai-tokai-matsuri-hanabi', {
    occurrence: {
      year: 2026,
      start_time: '19:00',
      end_time: '20:00',
      checked_at: CHECKED,
    },
  }],
  // ==================================================================
  // 群馬県
  // ==================================================================

  // 町のページに「１８時００分～２０時５０分」と会場が出ている。時刻は既に入っていたので住所だけ
  ['chiyoda-gunma-chiyoda-kawasegaki', {
    venue: { name: '赤岩地先 利根川河畔（赤岩渡船付近）', address: '邑楽郡千代田町赤岩' },
    links: [L('千代田町 千代田の祭 川せがき', 'https://www.town.chiyoda.gunma.jp/keizai/syoko/syoko007.html')],
  }],

  // 市のページに日ごとの時刻と「水沼駅より徒歩1分」がある。
  // 2 日で時間帯が違うので全体を start/end にして内訳を note へ
  ['kiryu-kurohone-natsumatsuri', {
    station: 'わたらせ渓谷鐵道「水沼駅」徒歩1分',
    occurrence: {
      year: 2026,
      start_time: '13:30',
      end_time: '21:00',
      checked_at: CHECKED,
      note: '初日（8月15日）は18時から21時、2日目（8月16日）は13時30分から21時',
    },
  }],

  // 市のページに「群馬県前橋市富士見町赤城山」（県立赤城公園 赤城大沼周辺）とある。
  // 最寄駅は前橋駅からバスで、鉄道の最寄りとは言えないので station は入れない
  ['maebashi-akagisan-lantern', {
    venue: { name: '赤城大沼湖畔（県立赤城公園）', address: '前橋市富士見町赤城山' },
  }],

  // ==================================================================
  // 茨城県
  // ==================================================================

  // 市のページの会場は磯原駅周辺。駅名だけ入っていたので路線と駅の形に直した
  ['kitaibaraki-kitaibaraki-shimin-natsumatsuri', {
    station: 'JR常磐線「磯原駅」',
  }],

  // ==================================================================
  // 神奈川県
  // ==================================================================

  // 会場の薬師殿やすらぎ広場は川崎大師平間寺の境内。寺の公式サイトに住所がある
  ['kawasakiku-kawasaki-daishi-kodomo-bonodori', {
    venue: { name: '川崎大師 薬師殿やすらぎ広場', address: '川崎市川崎区大師町4-48' },
    links: [L('川崎大師平間寺 8月の行事', 'https://www.kawasakidaishi.com/event/aug/')],
  }],

  // 川崎市民プラザの公式サイトに住所が出ている
  ['takatsu-shinsaku-1-bonodori', {
    venue: { name: '川崎市民プラザ 屋内広場', address: '川崎市高津区新作1-19-1' },
    links: [L('川崎市民プラザ 新作第一町内会 納涼盆踊り大会', 'https://www.kawasaki-shiminplaza.jp/event/detail?id=15821')],
  }],

  // 主催者の公式サイトに「相模原市中央区水郷田名　相模川高田橋上流」とある
  ['sagamihara-chuo-sagamihara-noryo-hanabi', {
    venue: { name: '相模川 高田橋上流', address: '相模原市中央区水郷田名' },
    links: [L('相模原納涼花火大会', 'https://sagamiharahanabi.com/')],
  }],

  // 実行委員会の公式サイトに鹿沼公園の住所と淵野辺駅からの徒歩がある。
  // station は「淵野辺」とだけ入っていたので路線と出口の形に直した
  ['sagamihara-chuo-onokita-ginga-matsuri', {
    venue: { name: '鹿沼公園', address: '相模原市中央区鹿沼台2-15-1' },
    station: 'JR横浜線「淵野辺駅」南口 徒歩約3分',
  }],

  // 市のページに「小田急電鉄東林間駅すぐ」とある
  ['sagamihara-minami-torinma-summer-warnival', {
    station: '小田急電鉄「東林間駅」すぐ',
  }],
  // 石岡市観光協会のページに總社宮の住所と最寄駅がある。石岡市で一致するので採用。
  // 時刻（9:00〜21:00）は既に入っていた値と同じだったので触っていない
  ['ishioka-ishioka-no-omatsuri', {
    venue: { name: '常陸國總社宮および石岡市中心部', address: '石岡市総社2-8-1' },
    station: 'JR常磐線「石岡駅」徒歩20分（約1.2km）',
    links: [L('石岡市観光協会 石岡のおまつり', 'https://www.ishioka-kankou.com/events/ishioka-matsuri/')],
  }],

  // 鹿島神宮の公式サイトに鎮座地が出ている
  ['kashima-kashima-jingu-saitosai', {
    venue: { name: '鹿島神宮および大町通り', address: '鹿嶋市宮中2306-1' },
    links: [L('鹿島神宮', 'https://kashimajingu.jp/')],
  }],

  // ==================================================================
  // 千葉県（追加）
  // ==================================================================

  // 会場の遠見岬神社の住所と最寄駅が県公式観光サイトの欄にある
  ['katsuura-katsuura-wakashio-noryosai', {
    shrine: '遠見岬神社',
    venue: { name: '遠見岬神社 駐車場（勝浦会場）', address: '勝浦市浜勝浦1' },
    station: 'JR外房線「勝浦駅」徒歩約10分',
    links: [L(`${CHIBA_NAVI} 遠見岬神社`, 'https://maruchiba.jp/spot/detail_10398.html')],
  }],

  // ==================================================================
  // 栃木県
  // ==================================================================

  // とちぎ旅ネット（栃木県観光物産協会）に東照宮の住所とアクセスがある。
  // **時刻は入れていない**。同じページの日程が「5月17日（月）・18日（火）」で
  // 2026 年の曜日と合わず、今年の発表ではないと分かるため
  ['nikko-toshogu-shunki-reitaisai', {
    venue: { name: '日光東照宮および表参道', address: '日光市山内2301' },
    station: 'JR日光線「日光駅」・東武日光線「東武日光駅」からバス約6分「安川町」下車 徒歩約5分',
    links: [L('とちぎ旅ネット 日光東照宮春季例大祭', 'https://www.tochigiji.or.jp/event/e15062/')],
  }],

  // 鹿沼市の公式ページと とちぎ旅ネット の双方が今宮神社を鹿沼市今宮町1692としている
  ['kanuma-kanuma-imamiya-yatai', {
    venue: { name: '今宮神社および鹿沼市街地', address: '鹿沼市今宮町1692' },
    links: [L('鹿沼市 鹿沼今宮神社祭の屋台行事', 'https://www.city.kanuma.tochigi.jp/0299/info-0000001964-1.html')],
  }],

  // とちぎ旅ネットに烏山駅からの徒歩が出ている。住所は市名までしか無いので入れない
  ['nasukarasuyama-karasuyama-yamaage', {
    station: 'JR烏山線「烏山駅」徒歩約5分〜30分',
  }],

  // 市の観光ページに駅からの徒歩が出ている。station は「栃木」とだけ入っていた
  ['tochigi-shi-tochigi-aki-matsuri', {
    station: 'JR・東武「栃木駅」徒歩約15分／東武「新栃木駅」徒歩約20分',
  }],
  // 市のページに会場の住所と時刻がある。「令和８年７月２５日（土曜日）」は
  // 2026 年の曜日と一致するので今年の発表
  ['tochigi-shi-tochigi-bon-matsuri', {
    venue: { name: '栃木市大平運動公園', address: '栃木市大平町蔵井1547' },
    station: '東武日光線「新大平下駅」東口から徒歩約25分（シャトルバス約10分）',
    occurrence: {
      year: 2026,
      start_time: '10:00',
      end_time: '21:30',
      checked_at: CHECKED,
    },
  }],

  // ==================================================================
  // 東京都（島しょ・多摩）
  // ==================================================================

  // 町のページに会場の住所と「奥多摩駅下車すぐ」がある
  ['okutama-okutama-noryo-hanabi', {
    venue: { name: '愛宕山広場', address: '西多摩郡奥多摩町氷川' },
    station: 'JR青梅線「奥多摩駅」下車すぐ',
  }],

  // ==================================================================
  // 埼玉県
  // ==================================================================

  // さいたま市花火大会は 3 会場が別々の日に開かれる。市のページに会場ごとの
  // 最寄駅が出ている（住所は記載が無いので入れない）。
  // **同じ市の同じ名前の大会なので、会場ごとに駅を取り違えないよう 1 件ずつ書いた**
  ['omiya-hanabi-owada', {
    station: '東武アーバンパークライン「大宮公園駅」「大和田駅」徒歩約15分',
  }],
  ['saitama-midori-saitama-hanabi-omagi-midori', {
    station: 'JR武蔵野線「東浦和駅」徒歩約15分',
  }],
  ['iwatsuki-hanabi-iwatsuki', {
    station: '東武アーバンパークライン「岩槻駅」「東岩槻駅」徒歩約40分',
  }],
  // ==================================================================
  // 神奈川県（最寄駅の書き方を、出典の記載どおりに直す）
  // ==================================================================
  // station に駅名だけが入っていたものを、路線と所要時間まで含む形にした。
  // 「淵野辺」「茅ケ崎」だけでは、そこから歩けるのかバスなのかが分からない

  ['chigasaki-southern-beach-hanabi', {
    station: 'JR東海道線「茅ケ崎駅」徒歩20分',
  }],

  // 平塚は駅からバス。徒歩で行ける駅は無いので、そのことが分かる書き方にする
  ['hiratsuka-shonan-hiratsuka-hanabi', {
    station: 'JR東海道線「平塚駅」南口から須賀港行きバス10分、下車徒歩5分',
  }],

  // 大山阿夫利神社は自前のサイトを持っている。住所は既に入っていたのでリンクだけ足す
  ['isehara-oyama-afuri-kaki-taisai', {
    links: [L('大山阿夫利神社', 'https://www.afuri.or.jp/')],
  }],
  ['isehara-oyama-afuri-shuki-reitaisai', {
    links: [L('大山阿夫利神社', 'https://www.afuri.or.jp/')],
  }],
], 'primary-5（一次情報で中身を厚くする）');

/*
 * --- 埋めなかったもの と その理由 ---
 *
 * | 祭り | 埋めなかった項目 | 理由 |
 * |---|---|---|
 * | 佐原の大祭 秋祭り | venue.address | 佐原の諏訪神社の住所を一次情報で確かめられなかった。
 * |                  |                | 「諏訪神社」で引くと睦沢町の別社が出る |
 * | 成田祇園祭        | organizer      | 成田市観光協会のページに主催の記載が無い。
 * |                  |                | 「成田祇園祭実行委員会」はメディア側の記述しか見つからなかった |
 * | 銚子みなとまつり  | organizer      | 市のページは問い合わせ先（銚子商工会議所）を出しているだけで、
 * |                  |                | 主催としては書かれていない |
 * | 千葉の親子三代夏祭り | venue.address | 会場は中央公園だが市のページに住所の記載が無い |
 * | 多古祇園祭        | organizer      | 町・県のどちらのページにも主催の記載が無い |
 * | 風鈴まつり（大宝八幡宮） | start_time / organizer | 神社のサイトに時刻の記載が無い |
 * | 利根町民納涼花火大会 | organizer    | 町のページに主催の記載が無い（問い合わせ先のみ） |
 */
