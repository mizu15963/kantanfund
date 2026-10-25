// サイト共通の定数（定数はこのファイルだけに置く。CLAUDE.md の「定数の置き場所ルール」）

// サイト全体の設定
export const SITE = {
  title: "かんたんファンド",
  // キャッチコピー（旧サイトと同じ。TOP の見出しと PC 幅の左側に出す）
  catchphrase: "投資の「わからない」を「わかる！」に変える",
  description:
    "かんたんファンドは、株式・FX・不動産・暗号資産の始め方や各サービスの特徴を、はじめての方にも分かるように解説する投資の情報メディアです。",
  // true にすると全ページを noindex にする。公開前は true のままにし、公開日に false にする（docs/todo.md・docs/site.md の「公開前の noindex」）
  // プレビューのビルドは false でも自動で noindex になる（src/libs/env.ts）
  noindex: true,
} as const;

// 記事
export const BLOG = {
  // 記事一覧（カテゴリでの絞り込みもこのページだけで行う。docs/site.md の「記事一覧」）
  listPath: "/articles/",
  // TOP とハブページに出す新着記事の数（続きは記事一覧で見る）
  latestCount: 6,
} as const;

// カテゴリ（microCMS の categories のコンテンツID）
export const CATEGORY = {
  // ハブページ（/{id}/）があるカテゴリと、ハブページの見出し（ヘッダーのナビにも使う）
  // ここにないカテゴリ（news）は記事一覧の絞り込みだけ
  hubs: [
    { id: "stock", title: "株式投資" },
    { id: "fx", title: "FX" },
    { id: "estate", title: "不動産投資" },
    { id: "cryptocurrency", title: "暗号資産" },
  ],
} as const;

// アクセス解析
export const ANALYTICS = {
  // 旧サイトと同じ GA4 の測定ID（G- で始まる。ページの HTML に載る公開値）。空のあいだは計測しない（docs/todo.md）
  ga4MeasurementId: "",
} as const;
