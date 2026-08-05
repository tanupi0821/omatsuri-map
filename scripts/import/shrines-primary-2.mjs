/**
 * 神社の一次情報からの直接収集 その2
 *
 * 出典: 神奈川県神社庁（各神社の詳細ページ）、および各神社の公式サイト
 *
 * 神社庁は例祭日をルールの形で持っているので、まとめサイトが一切扱わない
 * 秋の例大祭や冬の神事まで拾える。日付をルールから導いたものは status: estimated。
 *
 * これで幸区（それまで1件）と高津区の秋祭りが埋まる。
 */
import { emit } from './_lib.mjs';

const J = (id) => `https://www.kanagawa-jinja.or.jp/shrine/${id}/`;

const ROWS = [
  // --- 高津区 ---
  { ward: '高津区', wardSlug: 'takatsu', slug: 'chitose-jinja-reitaisai',
    name: '千年神社 秋季例大祭', kind: '例大祭',
    organizer: '千年神社', venue: '千年神社', address: '千年539',
    shrine: '千年神社', scale: '地区', tags: ['神輿'],
    recurrence: '10月9日〜10日', recurrenceSource: J('1201070-000'),
    dates: ['2026-10-09', '2026-10-10'], status: 'estimated',
    note: '10/9 宵宮祭・神幸祭、10/10 例祭。日付は神社庁の例祭日から導いたもので、神社が2026年の日程として発表したものではない',
    source: J('1201070-000'), sourceName: '神奈川県神社庁', sourceType: 'official' },

  { ward: '高津区', wardSlug: 'takatsu', slug: 'futako-jinja-reitaisai',
    name: '二子神社 例大祭', kind: '例大祭',
    organizer: '二子神社', venue: '二子神社', address: '二子1-4-1',
    shrine: '二子神社', scale: '地区',
    recurrence: '10月第2日曜日', recurrenceSource: J('1201061-000'),
    dates: ['2026-10-11'], status: 'estimated',
    note: '日付は神社庁の例祭日（10月第2日曜日）から導いたもの',
    source: J('1201061-000'), sourceName: '神奈川県神社庁', sourceType: 'official' },

  { ward: '高津区', wardSlug: 'takatsu', slug: 'tachibana-jinja-reitaisai',
    name: '橘樹神社 例大祭', kind: '例大祭',
    organizer: '橘樹神社', venue: '橘樹神社', address: '子母口122',
    shrine: '橘樹神社', scale: '地区',
    recurrence: '10月8日', recurrenceSource: J('1201053-000'),
    dates: ['2026-10-08'], status: 'estimated',
    note: '武蔵国橘樹郡の郡衙があった地とされる。日付は神社庁の例祭日から導いたもの',
    source: J('1201053-000'), sourceName: '神奈川県神社庁', sourceType: 'official' },

  // --- 幸区 ---
  { ward: '幸区', wardSlug: 'saiwai', slug: 'kashima-daijin-shuki-reitaisai',
    name: '鹿島大神 秋季例大祭', kind: '例大祭',
    organizer: '鹿島大神', venue: '鹿島大神', address: '鹿島田2-22-44',
    shrine: '鹿島大神', scale: '地区', tags: ['神輿', '屋台'],
    recurrence: '10月第2日曜日', recurrenceSource: J('1201016-000'),
    dates: ['2026-10-11'], status: 'estimated',
    note: '日付は神社庁の例祭日（10月第2日曜日）から導いたもの',
    source: J('1201016-000'), sourceName: '神奈川県神社庁', sourceType: 'official' },

  { ward: '幸区', wardSlug: 'saiwai', slug: 'kashima-daijin-kaki-reisai',
    name: '鹿島大神 夏季例祭', kind: '例大祭',
    organizer: '鹿島大神', venue: '鹿島大神', address: '鹿島田2-22-44',
    shrine: '鹿島大神', scale: '地区',
    recurrence: '7月第2日曜日', recurrenceSource: J('1201016-000'),
    dates: ['2026-07-12'], status: 'estimated',
    note: '日付は神社庁の例祭日（7月第2日曜日）から導いたもの',
    source: J('1201016-000'), sourceName: '神奈川県神社庁', sourceType: 'official' },

  // --- 麻生区 ---
  { ward: '麻生区', wardSlug: 'asao', slug: 'takaishi-jinja-shuki-reitaisai',
    name: '高石神社 秋季例大祭', kind: '例大祭',
    organizer: '高石神社', venue: '高石神社', address: '高石1-31-1',
    shrine: '高石神社', scale: '地区', tags: ['神輿', '獅子舞'],
    recurrence: '9月21日', recurrenceSource: J('1201085-000'),
    dates: ['2026-09-21'], status: 'estimated',
    note: '神輿渡御・獅子舞などの伝統行事。日付は神社庁の例祭日から導いたもの',
    links: ['https://takaishijinja.com/'],
    source: J('1201085-000'), sourceName: '神奈川県神社庁', sourceType: 'official' },

  { ward: '麻生区', wardSlug: 'asao', slug: 'takaishi-jinja-tennosai',
    name: '高石神社 夏季大祭（天王祭）', kind: '例大祭',
    organizer: '高石神社', venue: '高石神社', address: '高石1-31-1',
    shrine: '高石神社', scale: '地区',
    recurrence: '7月27日', recurrenceSource: J('1201085-000'),
    dates: ['2026-07-27'], status: 'estimated',
    note: '日付は神社庁の祭事日から導いたもの',
    links: ['https://takaishijinja.com/'],
    source: J('1201085-000'), sourceName: '神奈川県神社庁', sourceType: 'official' },

  { ward: '麻生区', wardSlug: 'asao', slug: 'takaishi-jinja-kinensai-yabusame',
    name: '高石神社 祈年祭（流鏑馬神事）', kind: '神事',
    organizer: '高石神社', venue: '高石神社', address: '高石1-31-1',
    shrine: '高石神社', scale: '地区', tags: ['流鏑馬'],
    recurrence: '1月15日', recurrenceSource: J('1201085-000'),
    dates: ['2026-01-15'], status: 'estimated',
    note: '流鏑馬の伝統が受け継がれている。日付は神社庁の祭事日から導いたもの',
    links: ['https://takaishijinja.com/'],
    source: J('1201085-000'), sourceName: '神奈川県神社庁', sourceType: 'official' },
];

emit(ROWS, {
  pref: '神奈川県', city: '川崎市',
  prefSlug: 'kanagawa', citySlug: 'kawasaki',
  label: '神社の一次情報 その2（川崎市）',
  checkedAt: '2026-08-02',
  year: 2026,
});
