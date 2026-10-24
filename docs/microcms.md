# microCMS

## API

| API | エンドポイント | 形式 | 項目の定義 |
|---|---|---|---|
| 記事 | `blog` | リスト形式 | [schema/blog.json](../schema/blog.json) |
| カテゴリ | `categories` | リスト形式 | [schema/categories.json](../schema/categories.json) |
| お問い合わせ | `contacts` | リスト形式 | [schema/contacts.json](../schema/contacts.json) |

- `schema/` のファイルは microCMS の「スキーマの書き出し」と同じ形式です。API を作るときに、このファイルをインポートして項目を作ります（作り方は下の「API の作り方」）。
- 管理画面で項目を変えたら、スキーマを書き出して `schema/` のファイルを上書きしてください。
- Hobby プランは作れる API の数に上限があります。3つで収まる想定ですが、契約中のプランの上限を確認してください。

## blog（記事）

コンテンツID = 記事の URL のスラッグ（[article.md](article.md) の「URL の決まり方」）。

| フィールドID | 表示名 | 種類 | 必須 | 説明 |
|---|---|---|---|---|
| `title` | タイトル | テキストフィールド | ○ | 記事タイトル（h1） |
| `description` | 概要 | テキストエリア | | メタディスクリプション・記事一覧の概要 |
| `content` | 本文 | リッチエディタ | ○ | 旧サイトの本文をそのまま移す |
| `thumbnail` | サムネイル画像 | 画像 | | 新しく書く記事用 |
| `category` | カテゴリ | 複数コンテンツ参照（categories） | | 複数選べる。ハブページと記事一覧の絞り込みに使う |
| `urlSlug` | URL（例外用） | テキストフィールド | | 旧スラッグが日本語の記事だけ |
| `seoTitle` | 検索結果用のタイトル | テキストフィールド | | `<title>` を記事タイトルと変えたいときだけ |
| `legacyThumbnail` | 旧サイトのサムネイル画像 | テキストフィールド | | 使っていない（旧サイトの画像も microCMS に上げ直すことにしたため。[todo.md](todo.md)） |
| `originalPublishedAt` | 旧サイトの公開日 | 日時 | | 移行した記事用 |
| `originalRevisedAt` | 旧サイトの更新日 | 日時 | | 移行した記事用 |
| `noindex` | 検索エンジンに載せない | 真偽値 | | 既定はオフ |

移行の進め方: まず3本をリッチエディタに入れて表示を確かめ、問題なければ残りをまとめて入れる（[migration.md](migration.md)）。

## categories（カテゴリ）

コンテンツIDは URL や絞り込みの値に使うので、後から変えないでください。

| コンテンツID | カテゴリ名（仮） | ハブページ |
|---|---|---|
| `stock` | 株式投資 | `/stock/` |
| `fx` | FX | `/fx/` |
| `estate` | 不動産投資 | `/estate/` |
| `cryptocurrency` | 暗号資産 | `/cryptocurrency/` |
| `news` | お知らせ | なし |

| フィールドID | 表示名 | 種類 | 必須 |
|---|---|---|---|
| `name` | カテゴリ名 | テキストフィールド | ○ |

- 絞り込みのチップの並び順は、管理画面の並び順。
- ハブページの見出しとヘッダーのナビは `src/constants/index.ts` の `CATEGORY.hubs`（カテゴリ名とは別に管理）。

## contacts（お問い合わせ）

フォームの作り（ページの作り方・自動送信よけ・通知）は未定です（[todo.md](todo.md)）。項目は参考プロジェクトと同じ形にしています。

| フィールドID | 表示名 | 種類 |
|---|---|---|
| `name` | お名前 | テキストフィールド |
| `email` | メールアドレス | テキストフィールド |
| `category` | お問い合わせ種別 | セレクトフィールド（選択肢は仮: 記事について / 掲載・広告について / その他） |
| `message` | お問い合わせ内容 | テキストエリア |

## API の作り方

1. 管理画面で **API を作成** → **自分で決める**（またはスキーマのインポート）を選ぶ。
2. API 名・エンドポイント（`categories` → `blog` → `contacts` の順。`blog` のカテゴリが `categories` を参照するため）を入れ、リスト形式を選ぶ。
3. `schema/` の JSON をインポートする。インポートできなかった項目は、上の表のとおり手で作る。
4. `categories` に上の5件を、表のコンテンツIDで作る。

## API キー

キーはチャットやリポジトリに書かず、手元の `.env` と Cloudflare の変数にだけ入れてください。

| キー | 権限 | 使う場所 |
|---|---|---|
| ビルド用（`MICROCMS_API_KEY`） | `blog`・`categories` の GET のみ | ビルド（手元と Cloudflare） |

旧サイトの記事を取り込む間だけ、このキーに `blog` の PUT・PATCH とマネジメント API の「メディアのアップロード」を足します（Hobby プランはキーを増やせないため。[migration.md](migration.md)）。終わったら GET のみに戻してください。

お問い合わせ用のキー（`contacts` の POST のみ）は、フォームを作るときに追加します。

## Webhook

- `blog` と `categories` の **API 設定 → Webhook → カスタム通知** に、Cloudflare のデプロイフックの URL を登録する（[cloudflare.md](cloudflare.md) の「microCMS の更新で再ビルドする」）。通知のタイミングは「コンテンツの公開・公開終了・削除」など、公開中の内容が変わるもの。
- `contacts` には登録しない（お問い合わせのたびに再ビルドされるため）。
