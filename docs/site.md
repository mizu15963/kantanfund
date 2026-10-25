# サイト全体

旧サイト（WordPress）を新しいデザインで作り直したサイトです。ドメイン（`https://www.kantanfund.net/`）と記事の URL は旧サイトのまま変えません。

## URL

- すべてのページの URL は末尾に `/` を付ける（`astro.config.mjs` の `trailingSlash: "always"`）。`/start_nisa` で開くと `/start_nisa/` に転送される。
- 記事は旧サイトと同じ `/{スラッグ}/`（[article.md](article.md)）。カテゴリ名を URL に入れない（お知らせの記事も `/{スラッグ}/`）。
- canonical・OGP の URL は、どこで開いても本番のドメイン（`astro.config.mjs` の `site`）を指す。

## ページ構成

お問い合わせフォーム（`/contact/`）以外のすべてのページをビルド時に作ります。お問い合わせフォームだけは、送信を受け取るためアクセス時に作ります（[contact.md](contact.md)）。

| URL | ページ | ファイル |
|---|---|---|
| `/` | TOP | `src/pages/index.astro` |
| `/stock/` `/fx/` `/estate/` `/cryptocurrency/` | ハブページ（カテゴリの入口） | `src/pages/{id}.astro` → `src/components/HubPage.astro` |
| `/articles/` | 記事一覧 | `src/pages/articles/index.astro` |
| `/{スラッグ}/` | 記事 | `src/pages/[slug].astro` |
| `/operator/` | 運営者情報 | `src/pages/operator.astro` |
| `/privacy-policy/` | プライバシーポリシー | `src/pages/privacy-policy.astro` |
| `/contact/` `/contact/thanks/` | お問い合わせフォーム・送信完了 | `src/pages/contact/`（[contact.md](contact.md)） |
| `/sitemap.xml` | サイトマップ | `src/pages/sitemap.xml.ts` |
| `/robots.txt` | robots.txt | `src/pages/robots.txt.ts` |

- 旧サイトのカテゴリ・タグ・月別アーカイブなどは作らず、ハブページなどへ転送する（[redirects.md](redirects.md)）。

## TOP

- 上から、キャッチコピー（`SITE.catchphrase`。「わかる！」に水色のマーカー）、カテゴリから探す（ハブページへのカード）、新着記事（`BLOG.latestCount` 本）、サイトについて（運営者情報へのリンク）、よくある質問（開閉式。5問）。

## ハブページ

- `src/constants/index.ts` の `CATEGORY.hubs` にあるカテゴリ（株式投資・FX・不動産投資・暗号資産）ごとに1ページ。URL はカテゴリのコンテンツID（`/stock/` など）。
- 上から、見出し → ページ内の目次（記事・ポイント・始め方・質問へ移動するボタン）→ 導入文 → そのカテゴリの新着記事（`BLOG.latestCount` 本。いまは6本）と、続きを見る記事一覧（絞り込み済み）へのリンク → ここがポイント（3つ）→ 始めるまでの流れ（4ステップ）→ よくある質問（開閉式）→ ほかのカテゴリ。
- 記事を探しに来た人がスクロールせずに記事にたどり着けるよう、記事を導入文のすぐ下に置いている。
- 中身はすべて各ページのファイル（`src/pages/stock.astro` など）に書き、`HubPage.astro` に渡す。見出し・導入文・記事の並びの見出しは旧サイトのハブページの文をもとにしている。ポイント・流れ・よくある質問は新しく書いたもの（2026-10-25 に先方の了承済み）。

## 運営者情報

- 旧サイトの `/operator/` の内容（運営者・サイトについて・注意事項）をもとにしている。表の「お問い合わせ」はお問い合わせフォームへのリンク。

## プライバシーポリシー

- 旧サイトにはなかったページ（URL は参考プロジェクトと同じ `/privacy-policy/`）。フッターの「サイトについて」からリンクする。
- 項目は、個人情報の利用目的・管理（お問い合わせは microCMS に保存）・第三者への提供・開示などの請求・アクセス解析（GA4）・広告（アフィリエイトと Cookie）・ポリシーの変更・お問い合わせ窓口。
- 内容を変えたら、ページの下の改定日を足す。「お問い合わせ窓口」からお問い合わせフォームへリンクする。

## 記事一覧

- 全記事を `/articles/` の1ページに新しい順で並べ、カテゴリのチップで絞り込む。カテゴリごとの一覧ページは作らない。
- 絞り込んだ状態は `/articles/?category={カテゴリID}` で表す（チップを押すと URL が変わるので、そのまま共有・リンクできる）。
- 絞り込みは画面の中（JavaScript）で行う。JavaScript が動かないときは全記事を表示する。
- 記事が1本もないカテゴリのチップは出さない。

## プレビュー

`main` 以外のブランチは、Cloudflare がプレビュー用のアドレス（`*.workers.dev`）にデプロイします。プレビューが検索エンジンに載らないよう、次の3つで防いでいます。

1. ビルド時に Cloudflare が入れる `WORKERS_CI_BRANCH` が `main` 以外なら、全ページに `<meta name="robots" content="noindex, nofollow">` を入れる（`src/libs/env.ts`）。
2. 同じく `robots.txt` を `Disallow: /` にする。
3. `public/_headers` で、`*.workers.dev` のアドレスで開いたときは `X-Robots-Tag: noindex` を付ける（本番のビルドを workers.dev のアドレスで開いた場合も含む）。アクセス時に作るお問い合わせフォームには `_headers` が効かないため、ページの中で同じヘッダーを付ける。

手元のビルド（`WORKERS_CI_BRANCH` がない）は本番と同じ扱いです。

## 公開前の noindex

公開日までは `SITE.noindex`（`src/constants/index.ts`）を `true` にしていて、`main` のビルドも含めて全ページに `<meta name="robots" content="noindex, nofollow">` が入ります。
**公開日に `false` に戻します**（戻し忘れると、本番のサイトが検索結果から消えます）。`robots.txt` は巡回を止めないので、noindex の指定は検索エンジンに届きます。

## サイトマップ

- `/sitemap.xml` をビルド時に microCMS から作る。載せるのは TOP・ハブページ・記事一覧・運営者情報・プライバシーポリシー・お問い合わせと、noindex でない記事（送信完了のページは載せない）。
- 記事の `lastmod` は [article.md](article.md) の更新日。
- 旧サイトのサイトマップの URL（`/sitemap_index.xml` など）は `/sitemap.xml` に転送する。
- microCMS からの取得に失敗したらビルドを止める（ページが抜けたサイトマップを公開しないため）。

## 構造化データ

- TOP: WebSite と Organization（`siteJsonLd`）。
- 記事: BlogPosting（`blogPostingJsonLd`）。
- パンくずを置いたページ: BreadcrumbList（`Breadcrumb` 部品の中で出す）。
- よくある質問を置いたページ（TOP・ハブページ）: FAQPage（`Faq` 部品の中で、画面に表示する質問と同じ項目から出す）。質問はページのファイルに書く。データにだけ入れて画面に出さない質問は作らない（Google のガイドライン違反になるため）。
  - Google は FAQ のリッチリザルト（検索結果で質問が開く表示）を政府・医療系の権威あるサイトに限っているため、このサイトでは表示されない見込み。検索エンジンや AI 検索がページの中身を読み取る手がかりとして入れている。

## アクセス解析

- 旧サイトと同じ GA4 の測定ID を `src/constants/index.ts` の `ANALYTICS.ga4MeasurementId` に入れる（`G-1BD1TYK7XG`。空にすると計測しない）。
- 本番のドメインで開いたときだけ計測する（手元の確認や workers.dev のアクセスを混ぜないため）。
- Search Console は旧サイトのプロパティをそのまま使う。所有権の確認の引き継ぎ方・公開日の確認・公開後に見ることは [analytics.md](analytics.md)。
