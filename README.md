# かんたんファンド

株式・FX・不動産・暗号資産の始め方や各サービスの特徴を解説する情報サイト（`https://www.kantanfund.net/`）を、WordPress から作り直すためのリポジトリです。記事の URL は旧サイトのまま変えません。

- サイトの仕様: [docs/](docs/README.md)（目次）
- 残っている作業: [docs/todo.md](docs/todo.md)（やることリスト）
- 開発のルール（定数・色・形・仕様書の更新など）: [CLAUDE.md](CLAUDE.md)

## 構成

| 役割 | 使っているもの |
|---|---|
| サイトの生成 | Astro 7（`@astrojs/cloudflare` アダプター。すべてのページをビルド時に作る） |
| 見た目 | Tailwind CSS 4（色・形は `src/styles/global.css` の `@theme` で一括管理） |
| コンテンツ管理 | microCMS（`blog`・`categories`・`contacts` の 3 API） |
| 配信 | Cloudflare Workers（Workers Builds で GitHub と接続） |
| アクセス解析 | Google アナリティクス 4（旧サイトと同じ測定ID。本番のドメインでだけ計測） |

参考プロジェクト（クラファンセレクト）と同じ構成です。Astro は、参考プロジェクトの Astro 6 に重大な脆弱性の報告が出ているため 7 にしています。

## フォルダ構成

| フォルダ | 中身 |
|---|---|
| `src/pages/` | ページ（URL と同じ並び。記事は `[slug].astro`） |
| `src/components/` | 部品（ページ見出し、記事のリスト、パンくずなど） |
| `src/layouts/` | 全ページ共通の枠（head・ヘッダー・フッター） |
| `src/libs/` | microCMS の取得、表示の整形、構造化データ、ビルド環境の判定 |
| `src/constants/index.ts` | サイト共通の定数（定数はこのファイルだけに置く） |
| `src/styles/global.css` | 色・形の定義（`@theme`）と、記事本文の見た目 |
| `schema/` | microCMS の項目定義（スキーマの書き出し形式） |
| `data/redirects.csv` | 旧サイトの URL の転送表（`public/_redirects` の元） |
| `scripts/` | `public/_redirects` を作るスクリプト |
| `public/` | そのまま配信するファイル（画像・アイコン・`_redirects`・`_headers`） |
| `docs/` | 仕様書 |

## 開発の仕方

Node.js 24 以上が必要です。

1. パッケージをインストールします。

   ```bash
   npm install
   ```

2. ルート直下に `.env` を作り、次の値を入れます（値は Cloudflare に登録しているものと同じ。リポジトリには含めない）。

   ```
   MICROCMS_API_KEY=xxxxxxxxxx
   MICROCMS_SERVICE_DOMAIN=xxxxxxxxxx
   ```

   | 名前 | 内容 |
   |---|---|
   | `MICROCMS_API_KEY` | microCMS の API キー（`blog`・`categories` の GET のみ許可） |
   | `MICROCMS_SERVICE_DOMAIN` | microCMS の管理画面の URL（`https://xxxxxxxx.microcms.io`）の `xxxxxxxx` の部分 |

3. 開発用のサーバーを起動し、http://localhost:4321 を開きます。

   ```bash
   npm run dev
   ```

### 本番と同じ形で確かめる

```bash
npm run build
npx astro preview
```

`astro preview` は Cloudflare と同じ仕組み（wrangler）で `dist/` を配信するので、`public/_redirects` の転送や末尾の `/` の扱いも確かめられます。

- ビルドは microCMS からデータを取るため、通信が不安定だと失敗することがあります。その場合はやり直してください。
- 固定ページと同じ URL の記事や、URL が重なる記事があると、ビルドがエラーで止まります（[docs/article.md](docs/article.md)）。

### 旧サイトの URL の転送を直す

`data/redirects.csv` を直してから、次を実行して `public/_redirects` を作り直します（両方をコミットする）。

```bash
npm run redirects
```

## ブランチの運用

| ブランチ | 役割 |
|---|---|
| `develop` | ふだんの作業用。変更はここに入れる |
| `main` | 本番用。プッシュすると Cloudflare で自動でビルド・デプロイされる |

- 本番に出すときだけ、`develop` を `main` に取り込んでプッシュします。
- `main` 以外のブランチはビルドしません（ビルド回数を節約するため、Cloudflare の本番以外のブランチのビルドはオフ）。PR はマージ前に手元で確認します。

## 本番への反映（自動ビルド）

GitHub Actions は使わず、Cloudflare Workers Builds だけでビルド・デプロイします。接続の手順は [docs/cloudflare.md](docs/cloudflare.md) です。

| きっかけ | 動き |
|---|---|
| `main` ブランチへのプッシュ | Cloudflare が GitHub 連携で検知し、自動でビルド・デプロイ |
| microCMS で記事を公開・更新 | Webhook から Cloudflare のデプロイフックを呼び出し、再ビルド（サイトマップも作り直される） |

デプロイフックの URL は、知っていれば誰でもビルドを起動できるため、外部に公開しないでください。
