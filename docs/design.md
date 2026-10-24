# 見た目の決まり

参考サイトは [みんなの銀行](https://www.minna-no-ginko.com/)。白・黒・蛍光イエローの配色で、どの画面幅でもスマホと同じ見た目にします。色・形の書き方は参考プロジェクト（クラファンセレクト）と同じです。

## レイアウト

- どの画面幅でも、スマホの画面幅（`max-w-app`、440px）の表示領域を中央に置く。ページの中身はすべてこの中に入るので、PC 用のレイアウトは作らない。
  - 表示領域の中では `sm:` `md:` などの画面幅の指定を使わない（PC で開くと画面幅は広いが、表示領域はスマホ幅のままのため）。
- 表示領域の左右の余った幅は黄色の背景（`bg-outside`）。PC 幅（`lg`、1024px 以上）では、左にロゴ・キャッチコピー・カテゴリのリンク（`SideNav.astro`）、右にバナー（`SideBanner.astro`）を、画面に固定して置く。PC 幅では表示領域の左右に黒い線を引く。
- ヘッダーは表示領域の上に固定。左にロゴ、右にメニューのボタン（開くとカテゴリと記事一覧へのリンク）。
- フッターは黒地に白文字。
- 表示領域の中の左右の余白は 20px（`px-5`）。背景の帯を表示領域の幅いっぱいに敷くページ（TOP）は、`Layout` の `bleed` で余白を外し、ページ側で付ける。

## 配色

- 色は `src/styles/global.css` の `@theme` で一括管理する。
- イメージカラーは蛍光イエロー（`brand-500` `#e1ff00`）。主要ボタン・選択中のチップ・フッターは黒（`primary` `#111111`）。
- 黄色は白地の上の文字には使わない（読めないため）。黄色の背景（`bg-highlight`）に黒文字（`text-highlight-foreground`）を載せる形で使う（カテゴリのバッジ、記事の h2、TOP の帯、ハブページの見出しなど）。
- リンク文字（`link`）は黒＋下線。
- ページやコンポーネントでは役割ごとの色（`bg-primary`・`text-foreground`・`bg-section`・`bg-highlight`・`text-link`・`border-line`・`bg-outside` など）を使う。
- `brand-500` の値は、CSS の変数を使えない `Layout.astro` の `theme-color` と `public/manifest.webmanifest`・`public/favicon.svg`・`public/images/noimg.svg` にも書いている。色を変えたらそちらも直す。

## 形

- 箱（カード・表・パネル）は `rounded-box`（16px）、ボタンは `rounded-button`（ピル形）。チップ・バッジだけ `rounded-full`。
- 枠線の箱・ボタンは黒の太線（`border-2 border-primary`）。区切り線は `border-line`。
- 見出しは太め（`font-black`）。
- 影は原則使わない。ホバーは背景（`hover:bg-section`）・下線・文字の色の変化で表す。

## 画像・アイコン

- ロゴは仮で文字のロゴ（黒い丸に黄色の「か」＋サイト名。`Logo.astro`）。ファビコン（`public/favicon.svg`）、サムネイルのない記事の画像（`public/images/noimg.svg`）も同じ形。正式なロゴが決まったら差し替える。
- OG 画像（`public/images/og.png`）は旧デザインの仮のまま。ロゴが決まったら作り直す。
- カテゴリのアイコンは線のアイコン（`HubIcon.astro`）。
- 記事の本文の画像は角丸（`rounded-box`）。広告（ASP）のバナー画像だけは元の大きさのまま角丸にしない（`.entry-content img.ad-image`）。

## 記事の本文

- h2 は黄色の箱、h3 は左に黒い線。目次と引用は灰色の箱（`bg-section`）。
