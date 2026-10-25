# やることリスト

## 先方・こちらで決めること

- PC 幅の右側のバナーに広告を入れるとき、作り直す（いまは仮の2つ）
- お問い合わせフォーム: 種別の選択肢の確認、通知メールの宛先、返信の運用、自動返信メールを送るか（[contact.md](contact.md) の「決まっていないこと」）
- プライバシーポリシーの文面の確認（制定日は公開日に合わせて直す）

## 作業

- [ ] microCMS に `categories`・`blog`・`contacts` を作り、ビルド用の API キーを発行する（[microcms.md](microcms.md)）
- [ ] Cloudflare Workers Builds に接続し、変数を入れる（[cloudflare.md](cloudflare.md)）
- [ ] 記事を3本だけ microCMS に入れて表示を確かめる（[migration.md](migration.md)）
- [ ] 本番ドメインでの公開直前に、残りの記事をまとめて入れる（`npm run wp:export` を取り直してから `npm run wp:import -- --write --all`）
- [ ] 旧サイトで Yoast の description がない記事は抜粋が入り、【PR】の注意書きから始まるものがある。全件を入れた後に microCMS で直すか決める
- [ ] 全件を入れた後、使わなくなった `legacyThumbnail` を microCMS と `schema/blog.json`・コードから消すか決める
- [ ] DNS を Cloudflare に移した後、Search Console に TXT レコードでの所有権の確認も足す（おすすめ。[analytics.md](analytics.md) の2）
- [ ] 公開日: `npm run check:launch` で転送とサイトマップを確かめ、Search Console にサイトマップを送信する（[analytics.md](analytics.md) の4）
- [ ] `/?p={記事ID}` の転送を作る（[redirects.md](redirects.md)）
- [ ] 公開日: `SITE.noindex` を `false` に戻して `main` に出す（戻し忘れると検索結果から消える。[site.md](site.md) の「公開前の noindex」）
- [ ] 公開日: 本番ドメインを新サイトに切り替える（[cloudflare.md](cloudflare.md) の6）
- [ ] `@kantanfund.net` のメールは使っていない（先方のメールは別ドメイン `hive-member.jp`）。公開後に MX・`mail` を消し、なりすまし防止（MX なし・`v=spf1 -all`・DMARC）に変える
- 公開後もさくらのレンタルサーバー（`www2120.sakura.ne.jp`）は解約しない。同じサーバーで `hive-member.jp` のメールが動いている
