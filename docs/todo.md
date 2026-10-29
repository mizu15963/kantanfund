# やることリスト

## 先方・こちらで決めること

- PC 幅の右側のバナーに広告を入れるとき、作り直す（いまは仮の2つ）
- お問い合わせフォーム: 種別の選択肢の確認、通知メールの宛先、返信の運用、自動返信メールを送るか（[contact.md](contact.md) の「決まっていないこと」）
- プライバシーポリシーの文面の確認（制定日は公開日の 2026年10月25日）

## 作業

- [ ] 全件を入れた後、使わなくなった `legacyThumbnail` を microCMS と `schema/blog.json`・コードから消すか決める
- [ ] DNS を Cloudflare に移した後、Search Console に TXT レコードでの所有権の確認も足す（おすすめ。[analytics.md](analytics.md) の2）
- [ ] Search Console にサイトマップを送信し、GA4 のリアルタイムと所有権の確認を見る（[analytics.md](analytics.md) の4。転送とサイトマップの確認は 2026-10-25 に済み）
- [ ] 「かんたんファンド」で検索すると運営者情報が TOP より上に出る（旧サイトのころから）。Search Console の URL 検査で TOP のインデックス登録をリクエストし、数週間後に「検索パフォーマンス」でクエリ「かんたんファンド」の表示ページと順位を見る
- [ ] `/?p={記事ID}` の転送を作る（[redirects.md](redirects.md)）
- [ ] さくら側の旧サイト（WordPress・ドメイン設定・ゾーン）を片付け、Cloudflare のメールのレコードをなりすまし防止（Null MX・`v=spf1 -all`・DMARC）に変える（[cloudflare.md](cloudflare.md) の7）
- 公開後もさくらのレンタルサーバー（`www2120.sakura.ne.jp`）は解約しない。同じサーバーで `hive-member.jp` のメールが動いている
