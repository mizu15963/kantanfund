# 旧サイトの記事の取り込み

旧サイト（WordPress）の記事を microCMS の `blog` に入れる手順です。2段階に分けています。

| 手順 | コマンド | すること |
|---|---|---|
| 1. 書き出し | `npm run wp:export` | 旧サイトの公開 REST API（`/wp-json/wp/v2/`）から全記事と画像を `wp-export/` に保存する（読み取りのみ） |
| 2. 取り込み | `npm run wp:import -- ...` | `wp-export/` の記事を microCMS 用に変換し、画像を microCMS のメディアに上げてから記事を入れる |

- `wp-export/` は git に入れません（`.gitignore`）。
- 旧サイトへのアクセスは手元の PC から行います（クラウドの作業環境からは旧サイトに接続できないため）。

## 進め方

1. 3本だけ入れて、表示を確かめる（済み: `torches_reezin`・`matsui_fxtf`・`kabu-start-4steps`）。
2. 本番ドメインでの公開直前に、書き出しを取り直してから全件を入れる（その間に旧サイトで直された記事も反映される）。手順は下の「全件の取り込み」。

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
| `description` | 本文の最初の段落から作る（下の「要約の作り方」） |
| `seoTitle` | Yoast の title から「 \| かんたんファンド」を除いたもの。タイトルと同じなら空 |
| `content` | 本文（下の「本文の変換」） |
| `thumbnail` | アイキャッチ画像（なければ OG 画像）を microCMS に上げたもの |
| `category` | `toushi`→`stock`、`fx`→`fx`、`fudosan`→`estate`、`crypto-assets`→`cryptocurrency`、`uncategorized`→`news`（タグは使わない） |
| `originalPublishedAt` / `originalRevisedAt` | 公開日時・更新日時 |
| `noindex` | Yoast で noindex の記事だけオン |

### 要約の作り方

旧サイトの description は、どの記事も Yoast が抜粋から自動で作ったもので、末尾が「[…]」で切れていたり、「【PR】本ページは…」「PR：本記事には広告…」などの注意書きから始まったりしていました。そのため自動のものは使わず、次のように作り直します。

- 本文の段落を前から順に使い、120字を超えたら、120字までの最後の「。」で切る（「。」がなければ120字で切って「…」）。
- 広告の注意書き・免責・登録の案内（「PR」「広告」「プロモーション」「アフィリエイト」「こちら」「▼」「↓」などを含む段落）とリンクを含む段落は使わない。
- 旧サイトで手で書いた description（末尾が「[…]」でないもの）があれば、それを使う。
- 気になる要約は、取り込んだ後に microCMS の管理画面で直してください。

### 旧サイトで壊れていた所の直し

`scripts/wp-import.mjs` の `CONTENT_FIXES` で、変換の前に本文を置き換えます。

| 記事 | 直す所 |
|---|---|
| `tsonvscloudbank` | TSON FUNDING の A8 のバナー画像とリンクが別の段落に分かれていて、画像を押しても広告に飛ばない → 画像をリンクで囲む |

### 本文の変換

microCMS のリッチエディタは、受け付ける HTML が決まっています（[リッチエディタの WRITE API](https://document.microcms.io/manual/rich-editor-write-api)）。

- 外部の画像（ASP のバナー・計測用画像）は上げ直さず、`［広告画像:URL|幅x高さ］` の印にする（[article.md](article.md) の「広告の画像」）。
- 画像: microCMS の画像しか入れられないため、旧サイトの画像を microCMS のメディアに上げて `src` を差し替える（srcset に大きいものがあれば元の大きさの画像を使う）。`alt`・`width`・`height`、リンク付きの画像、キャプション（`figcaption`）、中央寄せは残る。
- 表: `figure` を外し、見出し行も含めて `table > tbody > tr` にまとめる。表の説明は表の下の段落にする。
- 埋め込み（YouTube などの `iframe`）は入れられないため、リンクにする（実行時に表示される注意で分かる）。
- ボタン（`wp-block-button`）は段落の中のリンクにする。
- 文字色は残す。背景色・マーカー、`div`、`class` は外す。
- アフィリエイトリンクの URL はそのまま残る。

## 全件の取り込み（公開直前）

手元の PC（`D:\ito_project\kantan-fund-astro`）の PowerShell で行います。クラウドの作業環境からは旧サイトにも microCMS にも接続できないため、コマンドはご自身で実行してください。

### 1. microCMS のキーに権限を足す

ビルド用のキー（`MICROCMS_API_KEY`）に、上の「キー」の2つ（`blog` の PUT・PATCH、メディアのアップロード）を足します。`blog`・`categories` の GET と `contacts` の POST はそのまま残します。

### 2. 手元のリポジトリを最新の `main` にする

```powershell
cd D:\ito_project\kantan-fund-astro
git status              # 直しかけの変更があれば、先に git stash で退避する
git switch main
git pull
npm install
```

`wp-export/` は git の管理外なので、`git stash`・`git switch` で消えません（前回の `media-map.json` も残るため、3本分の画像は上げ直しません）。

### 3. 書き出しを取り直す

```powershell
npm run wp:export
```

最後に「47 件」と出ることを確かめます（旧サイトで記事を増やしていれば、その数）。

### 4. 確認だけ（送らない）

```powershell
npm run wp:import -- --all
```

- 最後が `47/47 件の送る内容を wp-export/import-preview/ に書き出しました` になることを確かめる。
- `[失敗]` や `※`（注意）が出た記事は、内容を確かめてから進める（日本語のスラッグの記事が増えていたら `CONTENT_ID_MAP` に足す）。
- 要約は `wp-export/import-preview/{コンテンツID}.json` の `description` で見られる。

### 5. microCMS に入れる

```powershell
npm run wp:import -- --write --all
```

- 1件ごとに1秒あけるので、画像のアップロードを含めて数分かかります。
- 先に入れた3本も、同じコンテンツIDなので上書きされます（記事は増えません）。
- 途中で失敗した記事があっても、同じコマンドをもう一度実行すれば大丈夫です（上げた画像は上げ直さず、記事は上書き）。失敗した記事だけ `npm run wp:import -- --write {スラッグ}` で入れ直すこともできます。
- microCMS の Webhook（Cloudflare のデプロイフック）を設定済みのときは、1件ごとにビルドが動きます。気になるときは取り込みの間だけ Webhook を止め、最後に管理画面で1回ビルドします。

### 6. キーの権限を戻す

1 で足した2つ（`blog` の PUT・PATCH、メディアのアップロード）を外し、`blog`・`categories` の GET と `contacts` の POST だけにします。

### 7. 表示を確かめる

- microCMS の `blog` が 47 件、すべて公開になっていること。
- サイトをビルドし直し、記事一覧・各ハブ・何本かの記事（表・画像・広告バナー）を確かめる。`tsonvscloudbank` の TSON FUNDING のバナーを押して広告に飛ぶこと。
