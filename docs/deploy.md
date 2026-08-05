# 公開の手順

静的サイト（HTML を全部作ってから置くだけ）なので、サーバーは要らない。
**Cloudflare Pages が一番おすすめ**。無料枠で帯域無制限、日本にも配信拠点がある。

## 事前にやること

### 1. 公開先の URL を決める

`astro.config.mjs` の `site` を直す。**ここ 1 か所で sitemap・canonical・
OGP・robots.txt がすべて追従する**。

```js
site: process.env.SITE_URL ?? 'https://matsuri-map.pages.dev',
```

既定は `https://omatsuri-map.com`。変えるならここを直す。
`SITE_URL` を環境変数で渡してもよい。

### 2. 連絡先を書く

`src/lib/site.js` の `CONTACT` に窓口を入れる。**空のままだとフッターに
連絡先の行が出ない**（「準備中」と書くより出さない方がよい）。

```js
export const CONTACT = {
  email: 'info@omatsuri-map.com',
  url: '',        // 予備。X のアカウントなど。無ければ空でよい
  urlLabel: '',
};
```

**サイト名も `src/lib/site.js` の `SITE_NAME` で決まる**。ヘッダー・パンくず・
`<title>`・パンくずの構造化データがすべてここを見る。

**誤りの指摘を受け取る窓口が無いと、間違ったまま放置される。**
出典がまとめサイトの祭りが 1000 件以上あり、日程の誤りは必ず出る。

`info@omatsuri-map.com` は **Cloudflare Email Routing**（無料）で作る。
Cloudflare のダッシュボード → ドメイン → Email → Email Routing →
転送先に普段のメール（Gmail など）を登録するだけ。個人のアドレスを晒さずに済む。

なお **OGP 画像はサイト名を焼き込んである**。名前を変えたら
`public/ogp.svg` を直して PNG を作り直すこと:

```bash
node -e "import('sharp').then(async(m)=>{const s=m.default;const fs=await import('node:fs');await s(fs.readFileSync('public/ogp.svg')).png().toFile('public/ogp.png')})"
```

### 3. ビルドが通ることを確認する

```bash
npm run build
```

`検証エラー 0` と出れば OK。エラーが出たら公開しない。

---

## Cloudflare Pages で公開する

### GitHub 経由（おすすめ・自動で再公開される）

1. GitHub にリポジトリを作って push する

```bash
git init
git add .
git commit -m "まつりマップ"
git branch -M main
git remote add origin https://github.com/<ユーザー名>/matsuri-map.git
git push -u origin main
```

2. https://dash.cloudflare.com → Workers & Pages → Create → Pages →
   Connect to Git → リポジトリを選ぶ

3. ビルド設定

| 項目 | 値 |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |

4. Save and Deploy。数分で `https://<プロジェクト名>.pages.dev` が使える

以降は `git push` するたびに自動で再公開される。

### 手元から直接上げる（GitHub を使わない場合）

```bash
npm i -D wrangler
npx wrangler pages deploy dist --project-name matsuri-map
```

初回はブラウザが開いて Cloudflare のログインを求められる。

## 他の選択肢

| サービス | 出力先 | 備考 |
|---|---|---|
| Netlify | `dist` | 設定は Cloudflare とほぼ同じ |
| Vercel | `dist` | 同上 |
| GitHub Pages | `dist` | 無料だが帯域制限あり。`astro.config.mjs` に `base` の指定が要る場合がある |

---

## 独自ドメインをつなぐ

取得したのは **`omatsuri-map.com`**（Cloudflare Registrar・年 $10.46≒1,600円）。

### なぜこの綴りか

`omatsurimap.com`（ハイフン無し）は**他人が取得済み**だった。
`omaturimap.com` は空いていたが、**訓令式の綴り**なので危ない。
日本語のローマ字入力で「おまつり」は `omatsuri` になり、口頭で伝えると
多くの人が `omatsurimap.com` と打って**別のサイトに着く**。
ハイフンを入れればヘボン式のまま取れるので `omatsuri-map.com` にした。

### レジストラの選び方（調べた結果）

| | .com 更新料/年 | 備考 |
|---|---:|---|
| **Cloudflare Registrar** | **約1,600円** | 原価販売。初年度と更新が同額 |
| Xserverドメイン | 1,721円 | 維持調整費なし |
| お名前.com | 1,774円 | **サービス維持調整費 26.0%** 込み |
| ムームードメイン | 2,178円 | 同 26.0% 込み |

**GMO 系（お名前.com・ムームー・Value Domain）は表示価格に
「サービス維持調整費」26% 台が上乗せされる**。表示だけ見て選ぶと後で効く。

**Cloudflare Registrar は `.jp` を扱っていない**。`.jp` にするなら
Xserverドメイン（更新 3,102円）で取り、DNS だけ Cloudflare に向ける。

### つなぐ手順

1. Cloudflare Pages のプロジェクト → Custom domains → Set up a custom domain
2. `omatsuri-map.com` を入力（Cloudflare で取得済みなので DNS は自動で入る）
3. `astro.config.mjs` の `site` が同じ URL になっていることを確認して push

## 公開したあとにやること

1. **Google Search Console** に登録し、`sitemap-index.xml` を送信する
   - 4700 ページあるので、送らないと見つけてもらうのに時間がかかる
2. `https://<ドメイン>/robots.txt` が正しい sitemap の URL を指しているか確認
3. OGP の見え方を確認（X の Card Validator など）

## データを更新したら

```bash
npm run collect   # 各種の取り込みと検証をまとめて実行
npm run build
git add . && git commit -m "データ更新" && git push
```

push すれば Cloudflare Pages が自動で作り直す。

## 費用

- Cloudflare Pages: **無料**（月 500 回のビルド、帯域無制限）
- 独自ドメイン: 年 1,000〜2,000 円ほど
- それ以外に維持費はかからない（サーバーもデータベースも使っていない）
