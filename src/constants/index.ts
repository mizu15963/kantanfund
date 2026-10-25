// サイト共通の定数（定数はこのファイルだけに置く。CLAUDE.md の「定数の置き場所ルール」）

// サイト全体の設定
export const SITE = {
  title: "かんたんファンド",
  // キャッチコピー（旧サイトと同じ。TOP の見出しと PC 幅の左側に出す）
  catchphrase: "投資の「わからない」を「わかる！」に変える",
  description:
    "かんたんファンドは、株式・FX・不動産・暗号資産の始め方や各サービスの特徴を、はじめての方にも分かるように解説する投資の情報メディアです。",
  // true にすると全ページを noindex にする（サイトごと検索結果から外したいときだけ使う。docs/site.md の「サイト全体の noindex」）
  // workers.dev のアドレスとプレビューのビルドは false でも検索エンジンに載らない（public/_headers・src/libs/env.ts）
  noindex: false,
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

// お問い合わせフォーム（仕様: docs/contact.md）
export const CONTACT = {
  // フォームのページと、送信完了のページ
  path: "/contact/",
  thanksPath: "/contact/thanks/",
  // microCMS の API のエンドポイント（項目定義は schema/contacts.json）
  endpoint: "contacts",
  // メールアドレスの形式チェック（サーバー側のチェックと、送信ボタンの有効化の両方で使う）
  emailPattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
  // 入力の文字数の上限（いたずらや誤送信の防止）
  maxLength: {
    name: 50,
    email: 254,
    message: 3000,
  },
} as const;

// アクセス解析
export const ANALYTICS = {
  // 旧サイトと同じ GA4 の測定ID（ページの HTML に載る公開値）。空にすると計測しない（docs/analytics.md）
  ga4MeasurementId: "G-1BD1TYK7XG",
  // Search Console の確認用 HTML タグ（<meta name="google-site-verification" content="..."> の content の値）。
  // 旧サイトの確認方法が HTML タグ（Site Kit が入れたもの）だったときだけ入れる。空のあいだはタグを出さない（docs/analytics.md）
  googleSiteVerification: "",
} as const;
