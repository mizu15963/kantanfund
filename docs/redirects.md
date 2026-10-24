# 旧サイトの URL の転送

旧サイト（WordPress）の URL のうち、新サイトにないもの（カテゴリ・タグ・月別アーカイブ・フィードなど）を、近いページへ 301 で転送します。記事の URL は変わらないため転送しません。

## 転送表

- 元データは [data/redirects.csv](../data/redirects.csv)（URL の棚卸しで作った表）。
- `npm run redirects` で `public/_redirects`（Cloudflare の転送の書き方）を作る。CSV を直したら実行し、`public/_redirects` も一緒にコミットする。`public/_redirects` は直接編集しない。

| CSV の match | `_redirects` での書き方 |
|---|---|
| `exact` | そのまま |
| `prefix`（末尾が `*`） | そのまま（`*` は「以下すべて」） |
| `pattern`（`{slug}` を含む） | `{slug}` を `:slug` にする（例: `/:slug/feed/ /:slug/ 301`） |
| `host`・`query` | 書けないので Cloudflare 側で設定する（下） |

主な転送先:

| 旧 URL | 転送先 |
|---|---|
| `/category/toushi/` `/tag/nisa/` など | ハブページ（`/stock/` など） |
| `/author/hayata_ito/` | `/operator/` |
| `/2026/10/` などの月別アーカイブ、`/feed/` | `/` |
| `/sitemap/`（HTML のサイトマップ） | `/` |
| `/sitemap_index.xml` などのサイトマップ | `/sitemap.xml` |
| `/{スラッグ}/feed/`・`/{スラッグ}/amp/` | `/{スラッグ}/` |

## Cloudflare 側で設定する転送

| 旧 URL | 設定 |
|---|---|
| `https://kantanfund.net/*`（www なし） | **ルール → リダイレクトルール** で `https://www.kantanfund.net/${1}` へ 301（パスとクエリを保持）。`kantanfund.net` の DNS レコードはプロキシ（オレンジの雲）にしておく |
| `http://*` | **SSL/TLS → エッジ証明書 → 常に HTTPS を使用** をオン |
| `/?p={記事ID}`（WordPress の短縮 URL） | 記事を抜き出した後、記事IDとスラッグの対応表（`id_map.csv`）からリダイレクトルールを作る（[todo.md](todo.md)） |

## 確かめたこと（手元の `wrangler dev`、仮データ）

- `/category/fx/` → `/fx/`、`/category/fx/page/3/` → `/fx/`、`/start_nisa/feed/` → `/start_nisa/`、`/sitemap/` → `/`、`/sitemap_index.xml` → `/sitemap.xml` が 301。
- `/start_nisa`（末尾の `/` なし）は `/start_nisa/` へ転送される（Cloudflare の静的ファイル配信の動きで 307）。
- 日本語のスラッグの記事は、旧サイトと同じ小文字の `%xx` の URL で開くと、大文字の `%XX` の URL へ 307 で転送されて表示される（同じ URL として扱われる。canonical とサイトマップは大文字の形）。
