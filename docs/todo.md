# やることリスト

## 先方・こちらで決めること

- OG 画像（`public/images/og.png`）をロゴで作り直す。ファビコンを旧サイトのアイコンに戻すか、いまの仮の「か」のままにするか
- ハブページに足した「ここがポイント」「始めるまでの流れ」「よくある質問」の内容の確認（金融の説明なので、数字や制度の書き方も含めて見直す）
- PC 幅の右側のバナーに広告を入れるとき、作り直す（いまは仮の2つ）
- お問い合わせフォーム: ページの作り（参考プロジェクトと同じくアクセス時に作るページにするか）、種別の選択肢、受付の通知先
- プライバシーポリシーのページを作るか（GA4 を使うので作る想定）

## 作業

- [ ] microCMS に `categories`・`blog`・`contacts` を作り、ビルド用の API キーを発行する（[microcms.md](microcms.md)）
- [ ] Cloudflare Workers Builds に接続し、変数を入れる（[cloudflare.md](cloudflare.md)）
- [ ] 記事を3本だけ microCMS に入れて表示を確かめる（[migration.md](migration.md)）
- [ ] 本番ドメインでの公開直前に、残りの記事をまとめて入れる（`npm run wp:export` を取り直してから `npm run wp:import -- --write --all`）
- [ ] 旧サイトで Yoast の description がない記事は抜粋が入り、【PR】の注意書きから始まるものがある。全件を入れた後に microCMS で直すか決める
- [ ] 全件を入れた後、使わなくなった `legacyThumbnail` を microCMS と `schema/blog.json`・コードから消すか決める
- [ ] GA4 の測定ID を `ANALYTICS.ga4MeasurementId` に入れる
- [ ] Search Console の確認用ファイル（`google*.html`）を `public/` に置く
- [ ] `/?p={記事ID}` の転送を作る（[redirects.md](redirects.md)）
- [ ] お問い合わせフォーム、プライバシーポリシーを作り、フッターにリンクを足す
- [ ] 公開日: `SITE.noindex` を `false` に戻して `main` に出す（戻し忘れると検索結果から消える。[site.md](site.md) の「公開前の noindex」）
- [ ] 公開日: DNS を Cloudflare に移し、本番ドメインに切り替える（[cloudflare.md](cloudflare.md) の5）
