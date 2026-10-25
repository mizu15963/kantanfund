# Cloudflare への接続

参考プロジェクト（クラファンセレクト）と同じく、**Cloudflare Workers Builds** で GitHub と接続し、ビルドとデプロイを Cloudflare だけで行います（GitHub Actions は使いません）。
お問い合わせフォーム（`/contact/`）以外はビルド時に作るため、Worker はほぼ静的ファイルを配信するだけです。お問い合わせフォームだけは Worker が送信を受け取るので、実行時の変数が要ります（[contact.md](contact.md) の「設定の手順」）。

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

- 実行時の変数（Settings → Variables and Secrets）は、お問い合わせフォーム用に別に入れます（[contact.md](contact.md) の「設定の手順」の5）。ビルド用の変数は実行時には読まれません。
- `WORKERS_CI_BRANCH` は Cloudflare がビルド時に自動で入れます。`main` 以外のブランチのビルドは、全ページが noindex になります（[site.md](site.md) の「プレビュー」）。

## 3. 動作を確かめる

1. `main` にプッシュすると、ビルドとデプロイが走る。
2. `https://kantan-fund.<アカウント名>.workers.dev/` で表示を確かめる（このアドレスは `X-Robots-Tag: noindex` が付くので検索エンジンには載らない）。
3. `main` 以外のブランチをプッシュすると、プレビュー用のアドレスができる（Worker の **デプロイ（Deployments）** に表示される）。

## 4. microCMS の更新で再ビルドする

1. Cloudflare: Worker の **設定 → ビルド → デプロイフック（Deploy hooks）** で、ブランチ `main` のフックを作り、URL をコピーする。
2. microCMS: `blog` と `categories` の **API 設定 → Webhook → カスタム通知** に、その URL を登録する（[microcms.md](microcms.md) の「Webhook」）。

デプロイフックの URL は、知っていれば誰でもビルドを起動できるため、外部に公開しないでください。

## 5. DNS を先に Cloudflare に移す（公開前に行う）

ドメインの契約はさくらインターネットのまま、ネームサーバー（DNS）だけを先に Cloudflare に移します。**移した後も旧サイト・メールはさくらのサーバーのまま動かし、見た目は何も変わらない状態にします**。新サイトへの切り替え（6）は公開日に別に行います。

### いまのレコード（2026-10-25 に公開 DNS で確認）

ネームサーバーは `ns1.dns.ne.jp`・`ns2.dns.ne.jp`（さくらのネームサーバー）。DNSSEC は使っていない（DS レコードなし）。

| 名前 | 種類 | 値 | Cloudflare での設定 |
|---|---|---|---|
| `kantanfund.net` | A | `182.48.49.30`（さくらのレンタルサーバー `www2120.sakura.ne.jp`） | A・**DNS のみ（灰色の雲）** |
| `www` | CNAME | `kantanfund.net` | CNAME・**DNS のみ** |
| `mail` | CNAME | `kantanfund.net` | **A `182.48.49.30` に変える**・DNS のみ |
| `ftp` | CNAME | `kantanfund.net` | **A `182.48.49.30` に変える**・DNS のみ |
| `kantanfund.net` | MX | `10 kantanfund.net` | **`10 mail.kantanfund.net` に変える** |
| `kantanfund.net` | TXT | `v=spf1 a:www2120.sakura.ne.jp mx ~all` | そのまま写す |

- 公開 DNS から見えるのは上だけです。DKIM（`〇〇._domainkey`）や Search Console の TXT など、名前を知らないと見えないレコードがあるかもしれないので、**さくらのゾーン編集画面の一覧と必ず見比べます**。
- `_dmarc` はいまはありません。
- **全部「DNS のみ（灰色の雲）」にする理由**: プロキシ（オレンジの雲）にすると、旧サイトの SSL 証明書の更新（さくらの無料 SSL）やメール・FTP に影響が出るため。公開前は Cloudflare を「DNS を答えるだけ」にしておけば、さくらの DNS と同じ答えになり、旧サイトは何も変わりません。
- **MX と mail・ftp を変える理由**: 公開日に `kantanfund.net`（www なし）を www へ転送するため、`kantanfund.net` をプロキシにします（[redirects.md](redirects.md) の「Cloudflare 側で設定する転送」）。そのとき MX が `kantanfund.net` を指したままだと、メールが Cloudflare に向かって届かなくなります。先にメール用の名前 `mail.kantanfund.net`（さくらのサーバーを直接指す・DNS のみ）に分けておきます。メールの受け取り先のサーバーは変わりません。

### 手順

1. Cloudflare ダッシュボード → **ドメインを追加（Add a domain）** → `kantanfund.net` を入れる。**DNS レコードの自動スキャン** を選び、Free プランを選ぶ。
2. 取り込まれたレコードを上の表に合わせる。
   - すべての雲を **灰色（DNS のみ）** にする（自動スキャンだと A・CNAME がオレンジになることが多い）。
   - `mail`・`ftp` を A `182.48.49.30` に、MX を `mail.kantanfund.net`（優先度 10）にする。
   - さくらのゾーン編集画面と見比べ、足りないレコード（TXT など）を足す。
3. ネームサーバーを変える前に、Cloudflare が正しく答えるかを確かめる（Cloudflare が指定したネームサーバーに直接聞く）。

   ```powershell
   Resolve-DnsName kantanfund.net -Type MX -Server 〇〇.ns.cloudflare.com   # 10 mail.kantanfund.net
   Resolve-DnsName www.kantanfund.net -Server 〇〇.ns.cloudflare.com        # 182.48.49.30（104.〜 や 172.〜 なら雲がオレンジ）
   ```

4. さくらの会員メニューで、ドメイン `kantanfund.net` のネームサーバーを Cloudflare が指定する2つ（`〇〇.ns.cloudflare.com`）に変える。
   - **さくら側のゾーン（DNS の設定）は消さない**。反映までの間（数時間〜最大2日ほど）は、さくらと Cloudflare のどちらにも問い合わせが来るため。
   - さくらのレンタルサーバーのコントロールパネルのドメイン設定もそのままにする（旧サイトとメールはそこで動いている）。
5. Cloudflare に「有効（Active）」と出るまで待つ（メールでも届く）。
6. 下の「移した後の確認」をする。
7. Cloudflare の **SSL/TLS** は、公開日まで触らない（灰色の雲のレコードには関係しないが、公開日に「フル（厳密）」にするか決める）。

### 移した後の確認

ネームサーバーの切り替え前（さくら）と切り替え後（Cloudflare）で答えが同じかを見ます。Windows の PowerShell なら次のとおりです。

```powershell
# ネームサーバーが Cloudflare になったか
Resolve-DnsName kantanfund.net -Type NS -Server 8.8.8.8
# 旧サイト・メール・SPF が前と同じか
Resolve-DnsName kantanfund.net -Type A -Server 8.8.8.8          # 182.48.49.30
Resolve-DnsName www.kantanfund.net -Server 8.8.8.8              # → kantanfund.net → 182.48.49.30
Resolve-DnsName kantanfund.net -Type MX -Server 8.8.8.8         # 10 mail.kantanfund.net
Resolve-DnsName mail.kantanfund.net -Type A -Server 8.8.8.8     # 182.48.49.30
Resolve-DnsName kantanfund.net -Type TXT -Server 8.8.8.8        # v=spf1 ...
```

ブラウザ（またはコマンド）で次を確かめます。

- `https://www.kantanfund.net/` が旧サイトで開き、鍵マークにエラーが出ない。
- `https://kantanfund.net/`（www なし）と `http://www.kantanfund.net/` が、前と同じ動き（旧サイトの www・https へ転送）をする。
- 記事を2〜3本開ける（例: `https://www.kantanfund.net/start_nisa/`）。
- Search Console の確認用ファイル `https://www.kantanfund.net/googlebd1b967076c9ab2f.html` が開ける。
- `kantanfund.net` のアドレスを使っているメールがあれば、外（Gmail など）から送って届くか、送れるかを試す。メールソフトの受信・送信サーバーに `kantanfund.net` を入れている場合は、公開日までに `mail.kantanfund.net` か `www2120.sakura.ne.jp` に変えておく（公開日に `kantanfund.net` はプロキシになるため）。

うまくいかないときは、さくらでネームサーバーを `ns1.dns.ne.jp`・`ns2.dns.ne.jp` に戻せば元に戻ります（さくらのゾーンを消していなければ）。

## 6. 本番ドメインへの切り替え（公開日に行う）

DNS は先に Cloudflare に移しておきます（5）。

1. DNS が Cloudflare に移っていて、MX が `mail.kantanfund.net`（DNS のみ）になっていることを確かめる（5）。
2. Cloudflare の DNS で、`www` の CNAME（旧サイト向け）を消す（すぐ次の3で新サイト向けのレコードが作られる。残っているとカスタムドメインを追加できない）。
3. Worker の **設定 → ドメインとルート（Domains & Routes）→ 追加 → カスタムドメイン** に `www.kantanfund.net` を追加する。ここで新サイトに切り替わる。
4. `kantanfund.net` の A レコードをプロキシ（オレンジの雲）にし、`kantanfund.net`（www なし）と http の転送を設定する（[redirects.md](redirects.md) の「Cloudflare 側で設定する転送」）。
5. GA4・Search Console・転送を確かめ、サイトマップを送信する（[analytics.md](analytics.md) の「4. 公開日の確認」。`npm run check:launch` で転送とサイトマップをまとめて確かめられる）。

Search Console の所有権の確認は、切り替えの前に新サイトでも通るようにしておきます（[analytics.md](analytics.md) の「2. 確認方法ごとの対応」）。

切り替えの前に、`SITE.noindex` を `false` に戻して `main` に出しておきます（[site.md](site.md) の「公開前の noindex」）。
