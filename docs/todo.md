# やることリスト

## 先方・こちらで決めること

- 新デザイン（配色・ロゴ・TOP・ハブページ・運営者情報の中身）
- お問い合わせフォーム: ページの作り（参考プロジェクトと同じくアクセス時に作るページにするか）、種別の選択肢、受付の通知先
- プライバシーポリシーのページを作るか（GA4 を使うので作る想定）

## 作業

- [ ] microCMS に `categories`・`blog`・`contacts` を作り、ビルド用の API キーを発行する（[microcms.md](microcms.md)）
- [ ] Cloudflare Workers Builds に接続し、変数を入れる（[cloudflare.md](cloudflare.md)）
- [ ] 記事を3本だけ microCMS に入れて表示を確かめ、問題なければ残りを入れる（旧サイトの日付・サムネイル・description も入れる）
- [ ] 旧サイトの画像を `public/wp-content/uploads/` に置く
- [ ] GA4 の測定ID を `ANALYTICS.ga4MeasurementId` に入れる
- [ ] Search Console の確認用ファイル（`google*.html`）を `public/` に置く
- [ ] `/?p={記事ID}` の転送を作る（[redirects.md](redirects.md)）
- [ ] TOP・ハブページ・運営者情報を新デザインで作る
- [ ] お問い合わせフォーム、プライバシーポリシーを作り、フッターにリンクを足す
- [ ] 公開日: DNS を Cloudflare に移し、本番ドメインに切り替える（[cloudflare.md](cloudflare.md) の5）
