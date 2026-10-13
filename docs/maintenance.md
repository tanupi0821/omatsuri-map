# 情報を更新する手順

毎週〜隔週。**順番が大事**で、巡回を飛ばすと何も増えない。

## 1. 巡回（`--refresh` を必ず付ける）

```bash
node scripts/crawl/goguynet.mjs --refresh        # 号外NET 284 地域（約 15 分）
node scripts/crawl/tsushin.mjs --refresh         # つーしん系 12 媒体
node scripts/crawl/rarea.mjs --refresh           # レアリア
node scripts/crawl/gotouti-rss.mjs --refresh     # RSS だけの地域媒体 108 件
node scripts/crawl/hanabi-nationwide.mjs --refresh   # 花火 47 都道府県
node scripts/crawl/summer-nationwide.mjs --refresh   # 夏祭り 47 都道府県
```

**`--refresh` を付けないと 1 件も増えない。** どのクローラも既定は
「まだ取っていない地域・検索語・県だけを引く」作りで、一度ひととおり
取ったあとは二度と見に行かない。検索語を足したときには正しいが、
**新しく出た記事を拾う用途ではこれが致命的**で、2026 年 9 月以降の記事が
1 本も入っていない状態になっていた（2026-10-12 に気づいて `--refresh` を足した）。

`--refresh` は検索語ごとに 20 回叩く代わりに、**前回取れた記事の最終日以降**を
引く。goguynet は 1 地域 1〜2 回で済む（5,680 回 → 約 300 回）。

閉鎖した媒体があっても止まらない（`higashinada-journal.com` の名前解決に
失敗して 12 媒体の巡回がまるごと落ちていた。例外を握って飛ばすようにした）。

## 2. 取り込み

```bash
npm run collect     # areas → import-all → enrich-all → dedupe（確認のみ）→ validate
```

## 3. 目で見る

```bash
node scripts/dedupe.mjs              # 統合候補。中身を見てから --apply
node scripts/audit-cancellations.mjs # 中止・延期の記事と、これから開催の祭りの突き合わせ
node scripts/audit-thin.mjs          # 中身が空のページ
node scripts/audit-slug-collisions.mjs
node scripts/audit-dates.mjs
```

**中止の記事は取り込みに乗らない。** 取り込みは開催告知として読むか日付が
取れずに捨てるかのどちらかで、既にあるレコードを中止にする経路が無い。
`audit-cancellations.mjs` が候補を出すので、記事を開いて会場と主催の一致を
確かめてから、その開催回の `status` を `cancelled` / `postponed` にする。
**自動では直さない**（別の町会の同名の祭りを中止にする事故のほうが怖い）。

## 4. 写真

```bash
node scripts/crawl/commons-photos.mjs --min-scale 市   # 候補を集める（2 秒間隔）
node scripts/enrich/photos.mjs                         # ライセンスが揃ったものだけ反映
```

## 5. 出して確かめる

```bash
npm run build
node scripts/fix-redirects.mjs            # 生きているページへの転送が無いか
node scripts/gen-redirects-from-history.mjs --apply   # 消えた URL の転送を作り直す
```

ビルドが通ったらコミットして push（Cloudflare が自動で出す）。
**ビルドは 20 分で打ち切られる**ので、所要時間が伸びていないか毎回見ること。

## 検索に出すために

インデックス登録が止まっているときは、待つより手で申請するほうが速い。

```bash
node scripts/gen-index-requests.mjs <出力先.md>
```

価値の高い順に URL を並べたものが出る。Search Console の URL 検査に
1 日 10 件ずつ貼る。**被リンクがゼロだとクロール枠が増えない**ので、
外部からのリンクを作るほうが本質的な対策になる。
