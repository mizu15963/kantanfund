# 記事ページ

## URL の決まり方

- 記事の URL は `/{スラッグ}/`。スラッグは microCMS の **コンテンツID** で、旧サイトの記事は旧スラッグと同じにする（例: `start_nisa` → `/start_nisa/`）。
- コンテンツIDには日本語が使えないため、旧スラッグが日本語の記事だけ `urlSlug`（URL（例外用））に旧スラッグを入れる。`urlSlug` があればそちらが URL になる（`src/libs/format.ts` の `blogSlug`）。
  - 該当は1本: `/🔰超初心者向け！株の始め方・やり方を4ステッ/`。コンテンツIDは英数字で付け（例: `kabu-start-4steps`）、`urlSlug` に `🔰超初心者向け！株の始め方・やり方を4ステッ` を入れる。
- 固定ページ（`src/pages/` 直下のページとフォルダ。`stock` `articles` `operator` など）と同じスラッグの記事や、スラッグが重なる記事があると、ビルドがエラーで止まる。
- 新しく書く記事のコンテンツIDは、半角英数字・ハイフン・アンダースコアで付ける。

## 日付

microCMS の公開日時・更新日時は、移行した記事では「microCMS に入れた日」になってしまうため、旧サイトの日付を別の項目に持たせます。

| 表示 | 使う値 |
|---|---|
| 公開日 | `originalPublishedAt`（旧サイトの公開日）。空なら microCMS の公開日時 |
| 更新日 | 移行した記事: `originalRevisedAt`（旧サイトの更新日）と、microCMS に入れた後に直した日時の新しい方。新しい記事: microCMS の更新日時 |

- 更新日は、公開日と日付が違うときだけ表示する。
- 構造化データ（datePublished・dateModified）とサイトマップの lastmod も同じ値を使う。
- 記事一覧・TOP の並び順は公開日の新しい順。

## 画像

- 旧サイトの画像は、旧サイトと同じパス（`/wp-content/uploads/...`）で `public/wp-content/uploads/` に置いて配信する（本文の画像の URL を書き換えないため）。
- 新しく書く記事の画像は microCMS のメディアに置く。本文中の microCMS の画像は、画面幅に合わせた大きさ・webp で読み込む（`BlogPost.astro`）。旧サイトの画像はそのまま。
- サムネイル: `thumbnail`（microCMS の画像）→ `legacyThumbnail`（旧サイトの画像のパス）→ 仮の画像（`/images/noimg.svg`）の順に使う。OG 画像も同じ（どちらもなければサイト共通の `/images/og.png`）。

## 本文

- 本文は microCMS のリッチエディタ（`content`）。旧サイトの本文をそのまま移す。
- 見た目は `src/styles/global.css` の `.entry-content`。
- h2・h3 から目次を作る。id のない見出し（移行した本文など）には `heading-{番号}` の id を付ける。
- 本文中のアフィリエイトリンク（tcs-asp.net・cs-a.jp など）はそのまま残す。記事の先頭に「本ページはプロモーション（広告）を含みます。」を出す。

## SEO の項目

| 項目 | 使い方 |
|---|---|
| `seoTitle` | 入っていれば `<title>` に使う（空なら記事のタイトル） |
| `description` | メタディスクリプション・記事一覧の概要。旧サイトの Yoast の description を移す |
| `noindex` | オンの記事は noindex にし、サイトマップに載せない |
