# 旧サイトの記事の取り込み

旧サイト（WordPress）の記事を microCMS の `blog` に入れる手順です。2段階に分けています。

| 手順 | コマンド | すること |
|---|---|---|
| 1. 書き出し | `npm run wp:export` | 旧サイトの公開 REST API（`/wp-json/wp/v2/`）から全記事と画像を `wp-export/` に保存する（読み取りのみ） |
| 2. 取り込み | `npm run wp:import -- ...` | `wp-export/` の記事を microCMS 用に変換し、画像を microCMS のメディアに上げてから記事を入れる |

- `wp-export/` は git に入れません（`.gitignore`）。
- 旧サイトへのアクセスは手元の PC から行います（クラウドの作業環境からは旧サイトに接続できないため）。

## 進め方

1. いまは3本だけ入れて、表示を確かめる。
2. 本番ドメインでの公開直前に、書き出しを取り直してから全件を入れる（その間に旧サイトで直された記事も反映される）。

## 1. 書き出し

```sh
npm run wp:export
```

| 出力 | 内容 |
|---|---|
| `posts.json` | 記事のメタデータ（スラッグ・日付・カテゴリ・Yoast の title/description など） |
| `html/{スラッグ}.html` | 本文（WordPress が出力した HTML のまま） |
| `uploads/...` | 画像（`/wp-content/uploads/` と同じパス。保存済みのものは取り直さない） |
| `images.csv` / `links.csv` / `id_map.csv` | 画像の一覧、本文中のリンク、記事ID → URL（`/?p=` の転送用） |

## 2. 取り込み

```sh
npm run wp:import -- start_nisa fx_about            # 確認だけ（送らない）
npm run wp:import -- --write start_nisa fx_about    # microCMS に入れる
npm run wp:import -- --write --all                  # 全件
```

- 記事は旧スラッグかコンテンツIDで指定します。`--draft` を付けると下書きで入れます（既定は公開）。
- `--write` を付けないときは、送る内容を `wp-export/import-preview/{コンテンツID}.json`・`.html` に書き出すだけです。
- 同じコンテンツIDの記事がすでにあれば上書きします。何度実行しても記事は増えません。
- 上げた画像は `wp-export/media-map.json` に記録し、2回目以降は上げ直しません（全件のときも同じフォルダで実行する）。

### キー

`--write` のときは、手元の `.env` の `MICROCMS_SERVICE_DOMAIN` とビルド用のキー（`MICROCMS_API_KEY`）を使います。Hobby プランはキーを増やせないため、取り込みの間だけ、管理画面でこのキーに次の権限を足します。

| 足す権限 | 使う場面 |
|---|---|
| `blog` の PUT・PATCH | 記事を作る・上書きする |
| マネジメント API の「メディアのアップロード」 | 旧サイトの画像を上げる |

- 取り込みが終わったら、`blog`・`categories` の GET のみに戻してください（このキーはビルドにも使うため）。
- 別のキーを使いたいときは `.env` に `MICROCMS_IMPORT_API_KEY` を入れると、そちらを使います。

### 入れる値

| microCMS の項目 | 旧サイトの値 |
|---|---|
| コンテンツID | スラッグ。日本語のスラッグは `scripts/wp-import.mjs` の `CONTENT_ID_MAP` で決めた ID（`kabu-start-4steps`） |
| `urlSlug` | コンテンツIDとスラッグが違う記事だけ、旧スラッグ |
| `title` | タイトル |
| `description` | Yoast の description（なければ抜粋） |
| `seoTitle` | Yoast の title から「 \| かんたんファンド」を除いたもの。タイトルと同じなら空 |
| `content` | 本文（下の「本文の変換」） |
| `thumbnail` | アイキャッチ画像（なければ OG 画像）を microCMS に上げたもの |
| `category` | `toushi`→`stock`、`fx`→`fx`、`fudosan`→`estate`、`crypto-assets`→`cryptocurrency`、`uncategorized`→`news`（タグは使わない） |
| `originalPublishedAt` / `originalRevisedAt` | 公開日時・更新日時 |
| `noindex` | Yoast で noindex の記事だけオン |

### 本文の変換

microCMS のリッチエディタは、受け付ける HTML が決まっています（[リッチエディタの WRITE API](https://document.microcms.io/manual/rich-editor-write-api)）。

- 外部の画像（ASP のバナー・計測用画像）は上げ直さず、`［広告画像:URL|幅x高さ］` の印にする（[article.md](article.md) の「広告の画像」）。
- 画像: microCMS の画像しか入れられないため、旧サイトの画像を microCMS のメディアに上げて `src` を差し替える（srcset に大きいものがあれば元の大きさの画像を使う）。`alt`・`width`・`height`、リンク付きの画像、キャプション（`figcaption`）、中央寄せは残る。
- 表: `figure` を外し、見出し行も含めて `table > tbody > tr` にまとめる。表の説明は表の下の段落にする。
- 埋め込み（YouTube などの `iframe`）は入れられないため、リンクにする（実行時に表示される注意で分かる）。
- ボタン（`wp-block-button`）は段落の中のリンクにする。
- 文字色は残す。背景色・マーカー、`div`、`class` は外す。
- アフィリエイトリンクの URL はそのまま残る。
