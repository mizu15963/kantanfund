# 見た目の決まり

新デザインが決まるまでの仮の決まりです。色・形の書き方は参考プロジェクト（クラファンセレクト）と同じにしています。

## 配色

- 色は `src/styles/global.css` の `@theme` で一括管理する。いまのイメージカラー（`brand-500` `#1a7f75`、緑みの青）は仮。
- ページやコンポーネントでは役割ごとの色（`bg-primary`・`text-foreground`・`bg-section`・`bg-highlight`・`text-link`・`border-line` など）を使う。
- `brand-500` は白文字とのコントラスト比 4.84、`link`（`brand-700`）は白背景とのコントラスト比 7.6。
- `brand-500` の値は、CSS の変数を使えない `Layout.astro` の `theme-color` と `public/manifest.webmanifest`・`public/favicon.svg`・`public/images/noimg.svg` にも書いている。色を変えたらそちらも直す。

## 形

- 箱（カード・表・パネル）は `rounded-box`（4px）、ボタンは `rounded-button`（6px）。チップ・バッジだけ `rounded-full`。
- 影は原則使わない。ホバーは枠線や文字の色の変化で表す。
- スマホ幅（375px 前後）を基準にし、PC 幅は広げる形で対応する。

## 画像・アイコン

- ファビコン（`public/favicon.svg`）、OG 画像（`public/images/og.png`）、サムネイルのない記事の画像（`public/images/noimg.svg`）は仮。ロゴが決まったら差し替える。
- 記事の本文の画像は角丸（`rounded-box`）。広告（ASP）のバナー画像だけは元の大きさのまま角丸にしない（`.entry-content img.ad-image`）。
- 本文の埋め込み HTML（広告タグ）は段落と同じ間隔をあけ、横にはみ出すときはその中だけ横に動かせる（`.entry-content .embed`）。段落ごとの埋め込みには、上に小さな「PR」のチップ（枠線・薄い文字）を付ける（`.entry-content .embed-label`）。
