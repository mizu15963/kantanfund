# サイト全体

旧サイト（WordPress）を新しいデザインで作り直したサイトです。ドメイン（`https://www.kantanfund.net/`）と記事の URL は旧サイトのまま変えません。

## URL

- すべてのページの URL は末尾に `/` を付ける（`astro.config.mjs` の `trailingSlash: "always"`）。`/start_nisa` で開くと `/start_nisa/` に転送される。
- 記事は旧サイトと同じ `/{スラッグ}/`（[article.md](article.md)）。カテゴリ名を URL に入れない（お知らせの記事も `/{スラッグ}/`）。
- canonical・OGP の URL は、どこで開いても本番のドメイン（`astro.config.mjs` の `site`）を指す。

## ページ構成

すべてのページをビルド時に作ります（アクセス時に作るページはありません）。

| URL | ページ | ファイル |
|---|---|---|
| `/` | TOP | `src/pages/index.astro` |
| `/stock/` `/fx/` `/estate/` `/cryptocurrency/` | ハブページ（カテゴリの入口） | `src/pages/{id}.astro` → `src/components/HubPage.astro` |
| `/articles/` | 記事一覧 | `src/pages/articles/index.astro` |
| `/{スラッグ}/` | 記事 | `src/pages/[slug].astro` |
| `/operator/` | 運営者情報 | `src/pages/operator.astro` |
| `/sitemap.xml` | サイトマップ | `src/pages/sitemap.xml.ts` |
| `/robots.txt` | robots.txt | `src/pages/robots.txt.ts` |

- お問い合わせ・プライバシーポリシーは未作成（[todo.md](todo.md)）。
- 旧サイトのカテゴリ・タグ・月別アーカイブなどは作らず、ハブページなどへ転送する（[redirects.md](redirects.md)）。

## TOP

- 上から、キャッチコピー（`SITE.catchphrase`。黄色の帯）、カテゴリから探す（ハブページへのカード）、新着記事（`BLOG.latestCount` 本）、サイトについて（運営者情報へのリンク）。

## ハブページ

- `src/constants/index.ts` の `CATEGORY.hubs` にあるカテゴリ（株式投資・FX・不動産投資・暗号資産）ごとに1ページ。URL はカテゴリのコンテンツID（`/stock/` など）。
- 上から、見出し → 導入文 → ここがポイント（3つ）→ 始めるまでの流れ（4ステップ）→ そのカテゴリの記事すべて（新しい順）と記事一覧（絞り込み済み）へのリンク → よくある質問（開閉式）→ ほかのカテゴリ。
- 中身はすべて各ページのファイル（`src/pages/stock.astro` など）に書き、`HubPage.astro` に渡す。見出し・導入文・記事の並びの見出しは旧サイトのハブページの文をもとにしている。ポイント・流れ・よくある質問は新しく書いたもの（内容は確認中。[todo.md](todo.md)）。

## 運営者情報

- 旧サイトの `/operator/` の内容（運営者・サイトについて・注意事項）をもとにしている。お問い合わせのページを作ったら、表の「お問い合わせ」をリンクにする。

## 記事一覧

- 全記事を `/articles/` の1ページに新しい順で並べ、カテゴリのチップで絞り込む。カテゴリごとの一覧ページは作らない。
- 絞り込んだ状態は `/articles/?category={カテゴリID}` で表す（チップを押すと URL が変わるので、そのまま共有・リンクできる）。
- 絞り込みは画面の中（JavaScript）で行う。JavaScript が動かないときは全記事を表示する。
- 記事が1本もないカテゴリのチップは出さない。

## プレビュー

`main` 以外のブランチは、Cloudflare がプレビュー用のアドレス（`*.workers.dev`）にデプロイします。プレビューが検索エンジンに載らないよう、次の3つで防いでいます。

1. ビルド時に Cloudflare が入れる `WORKERS_CI_BRANCH` が `main` 以外なら、全ページに `<meta name="robots" content="noindex, nofollow">` を入れる（`src/libs/env.ts`）。
2. 同じく `robots.txt` を `Disallow: /` にする。
3. `public/_headers` で、`*.workers.dev` のアドレスで開いたときは `X-Robots-Tag: noindex` を付ける（本番のビルドを workers.dev のアドレスで開いた場合も含む）。

手元のビルド（`WORKERS_CI_BRANCH` がない）は本番と同じ扱いです。

## 公開前の noindex

公開日までは `SITE.noindex`（`src/constants/index.ts`）を `true` にしていて、`main` のビルドも含めて全ページに `<meta name="robots" content="noindex, nofollow">` が入ります。
**公開日に `false` に戻します**（戻し忘れると、本番のサイトが検索結果から消えます）。`robots.txt` は巡回を止めないので、noindex の指定は検索エンジンに届きます。

## サイトマップ

- `/sitemap.xml` をビルド時に microCMS から作る。載せるのは TOP・ハブページ・記事一覧・運営者情報と、noindex でない記事。
- 記事の `lastmod` は [article.md](article.md) の更新日。
- 旧サイトのサイトマップの URL（`/sitemap_index.xml` など）は `/sitemap.xml` に転送する。
- microCMS からの取得に失敗したらビルドを止める（ページが抜けたサイトマップを公開しないため）。

## 構造化データ

- TOP: WebSite と Organization（`siteJsonLd`）。
- 記事: BlogPosting（`blogPostingJsonLd`）。
- パンくずを置いたページ: BreadcrumbList（`Breadcrumb` 部品の中で出す）。

## アクセス解析

- 旧サイトと同じ GA4 の測定ID を `src/constants/index.ts` の `ANALYTICS.ga4MeasurementId` に入れる（未設定のあいだは計測しない）。
- 本番のドメインで開いたときだけ計測する（手元の確認や workers.dev のアクセスを混ぜないため）。
- Search Console は旧サイトの登録（URL プレフィックス）をそのまま使う（[cloudflare.md](cloudflare.md) の「本番ドメインへの切り替え」）。
