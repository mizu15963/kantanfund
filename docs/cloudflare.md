# Cloudflare への接続

参考プロジェクト（クラファンセレクト）と同じく、**Cloudflare Workers Builds** で GitHub と接続し、ビルドとデプロイを Cloudflare だけで行います（GitHub Actions は使いません）。
サイトはすべてビルド時に作るため、Worker は静的ファイルを配信するだけです（実行時の変数・シークレットは不要）。

アカウント側の操作（ログイン・GitHub 連携の許可・キーの入力）はご自身で行ってください。キーやデプロイフックの URL はチャットに貼らないでください。
画面の表記は変わることがあります。

## 1. Worker を作って GitHub とつなぐ

1. Cloudflare ダッシュボード → **Workers & Pages** → **作成（Create）** → **リポジトリをインポート（Import a repository）**。
2. GitHub を連携し、`mizu15963/kantanfund` を選ぶ。
3. 次のように設定する。

| 項目 | 値 |
|---|---|
| プロジェクト名（Worker 名） | `kantan-fund`（`package.json` の `name` と同じにする。ビルド時に作られる設定の Worker 名と合わないとデプロイが失敗する） |
| 本番のブランチ | `main` |
| ビルドコマンド | `npm run build` |
| デプロイコマンド | `npx wrangler deploy` |
| 本番以外のブランチのビルド | オン（デプロイコマンドは `npx wrangler versions upload`。プレビュー用のアドレスができる） |
| ルートディレクトリ | 空（リポジトリ直下） |

## 2. ビルド用の変数を入れる

Worker の **設定（Settings）→ ビルド（Build）→ 変数とシークレット（Variables and secrets）** に入れます。

| 名前 | 種類 | 内容 |
|---|---|---|
| `MICROCMS_SERVICE_DOMAIN` | テキスト | microCMS の管理画面の URL（`https://xxxxxxxx.microcms.io`）の `xxxxxxxx` |
| `MICROCMS_API_KEY` | シークレット | ビルド用の API キー（`blog`・`categories` の GET のみ） |
| `NODE_VERSION` | テキスト | `24` |

- 実行時の変数（Settings → Variables and Secrets）は不要です（お問い合わせフォームを作るときに追加します）。
- `WORKERS_CI_BRANCH` は Cloudflare がビルド時に自動で入れます。`main` 以外のブランチのビルドは、全ページが noindex になります（[site.md](site.md) の「プレビュー」）。

## 3. 動作を確かめる

1. `main` にプッシュすると、ビルドとデプロイが走る。
2. `https://kantan-fund.<アカウント名>.workers.dev/` で表示を確かめる（このアドレスは `X-Robots-Tag: noindex` が付くので検索エンジンには載らない）。
3. `main` 以外のブランチをプッシュすると、プレビュー用のアドレスができる（Worker の **デプロイ（Deployments）** に表示される）。

## 4. microCMS の更新で再ビルドする

1. Cloudflare: Worker の **設定 → ビルド → デプロイフック（Deploy hooks）** で、ブランチ `main` のフックを作り、URL をコピーする。
2. microCMS: `blog` と `categories` の **API 設定 → Webhook → カスタム通知** に、その URL を登録する（[microcms.md](microcms.md) の「Webhook」）。

デプロイフックの URL は、知っていれば誰でもビルドを起動できるため、外部に公開しないでください。

## 5. 本番ドメインへの切り替え（公開日に行う）

DNS はさくらインターネットから Cloudflare に移す前提です（ドメインの契約はさくらのまま）。

1. Cloudflare に `kantanfund.net` を追加し、さくらの DNS レコードをすべて写す。**メール（MX・SPF などの TXT）のレコードを必ず写す**。
2. さくらのドメイン管理で、ネームサーバーを Cloudflare が指定するものに変える。反映を待つ（この時点では旧サイトのまま）。
3. Worker の **設定 → ドメインとルート（Domains & Routes）→ 追加 → カスタムドメイン** に `www.kantanfund.net` を追加する。ここで新サイトに切り替わる。
4. `kantanfund.net`（www なし）と http の転送を設定する（[redirects.md](redirects.md) の「Cloudflare 側で設定する転送」）。
5. Search Console の確認用ファイル（`google*.html`）を旧サーバーから取り出して `public/` に置き、切り替え後も確認が通ることを見る。
6. Search Console に `https://www.kantanfund.net/sitemap.xml` を送信する。

切り替えの前に、`SITE.noindex` を `false` に戻して `main` に出しておきます（[site.md](site.md) の「公開前の noindex」）。
