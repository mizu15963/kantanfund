// 旧サイト（WordPress）から記事を書き出す（読み取りのみ。仕様: docs/migration.md）
// 公開されている REST API（/wp-json/wp/v2/）に GET するだけで、旧サイトには何も書き込まない
// 使い方: npm run wp:export   （出力先は wp-export/。git には入れない）
//
// 出力:
//   posts.json        記事のメタデータ（スラッグ・日付・カテゴリ・Yoast の title/description など）
//   html/<slug>.html  記事の本文（WordPress が出力した HTML のまま）
//   uploads/...       画像（/wp-content/uploads/ 以下と同じパス。保存済みのものは取り直さない）
//   images.csv        画像の URL・使っている記事・保存先
//   links.csv         本文中のリンク（内部・外部・アフィリエイト）
//   id_map.csv        記事ID → URL（/?p={記事ID} の転送用）
import fs from "node:fs";
import path from "node:path";

const BASE = "https://www.kantanfund.net";
const API = `${BASE}/wp-json/wp/v2/`;
const OUT = "wp-export";
const UA = "kantanfund-migration/1.0 (read-only export)";
// リクエストの間隔（ミリ秒）。旧サイトのサーバーに負荷をかけないため
const WAIT = 1000;
const AFFILIATE_HOSTS = [
  "tcs-asp.net",
  "cs-a.jp",
  "a8.net",
  "afi-b.com",
  "moshimo.com",
  "valuecommerce.com",
  "accesstrade.net",
  "felmat.net",
  "rentracks.jp",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const get = async (url) => {
  await sleep(WAIT);
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
};

const getAll = async (endpoint, params = {}) => {
  const items = [];
  for (let page = 1; ; page++) {
    const query = new URLSearchParams({ ...params, per_page: 100, page });
    const res = await get(`${API}${endpoint}?${query}`);
    items.push(...(await res.json()));
    if (page >= Number(res.headers.get("X-WP-TotalPages") ?? 1)) return items;
  }
};

// 本文の画像（src・srcset・遅延読み込みの data-*）とリンク
const collect = (html) => {
  const images = new Set();
  const links = [];
  for (const [, attrs] of html.matchAll(/<img\b([^>]*)>/gi)) {
    for (const [, key, value] of attrs.matchAll(
      /\s(src|data-src|srcset|data-srcset)\s*=\s*"([^"]*)"/gi
    )) {
      const urls = key.toLowerCase().endsWith("srcset")
        ? value.split(",").map((part) => part.trim().split(/\s+/)[0])
        : [value];
      urls.filter(Boolean).forEach((url) => images.add(url));
    }
  }
  for (const [, href] of html.matchAll(/<a\b[^>]*\shref\s*=\s*"([^"]*)"/gi)) {
    links.push(href);
  }
  return { images, links };
};

const linkKind = (href) => {
  const host = new URL(href, BASE).hostname;
  if (host.endsWith("kantanfund.net")) return "internal";
  if (AFFILIATE_HOSTS.some((h) => host.endsWith(h))) return "affiliate";
  return "external";
};

const decodeEntities = (s) => s.replaceAll("&amp;", "&");

const csv = (rows) =>
  rows
    .map((row) =>
      row.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")
    )
    .join("\n") + "\n";

const write = (name, data) =>
  fs.writeFileSync(path.join(OUT, name), data, "utf-8");

fs.mkdirSync(path.join(OUT, "html"), { recursive: true });

const terms = new Map();
for (const t of [...(await getAll("categories")), ...(await getAll("tags"))]) {
  terms.set(t.id, t.slug);
}
const posts = await getAll("posts", {
  status: "publish",
  _embed: "wp:featuredmedia",
});

const meta = [];
const images = new Map();
const links = [];
for (const p of posts) {
  const yoast = p.yoast_head_json ?? {};
  const featured = p._embedded?.["wp:featuredmedia"]?.[0] ?? {};
  const ogImage = yoast.og_image?.[0]?.url ?? null;
  const slug = decodeURIComponent(p.slug);
  const m = {
    id: p.id,
    slug,
    path: new URL(p.link).pathname,
    title: p.title.rendered,
    // date・modified は旧サイトの時刻（日本時間）、*_gmt は UTC
    date: p.date,
    date_gmt: p.date_gmt,
    modified: p.modified,
    modified_gmt: p.modified_gmt,
    categories: p.categories.map((id) => terms.get(id)).filter(Boolean),
    tags: p.tags.map((id) => terms.get(id)).filter(Boolean),
    excerpt: p.excerpt.rendered,
    featured_image: featured.source_url ?? ogImage,
    featured_alt: featured.alt_text ?? "",
    seo_title: yoast.title ?? null,
    seo_description: yoast.description ?? yoast.og_description ?? null,
    og_image: ogImage,
    canonical: yoast.canonical ?? null,
    robots: yoast.robots ?? null,
  };
  meta.push(m);
  const html = p.content.rendered;
  write(path.join("html", `${slug}.html`), html);
  const found = collect(html);
  for (const src of [...found.images, m.featured_image, ogImage]) {
    if (!src) continue;
    const url = new URL(decodeEntities(src), BASE).href;
    if (!images.has(url)) images.set(url, new Set());
    images.get(url).add(slug);
  }
  links.push(...found.links.map((href) => [slug, href, linkKind(href)]));
}

write("posts.json", JSON.stringify(meta, null, 2));
write("id_map.csv", csv([["id", "path"], ...meta.map((m) => [m.id, m.path])]));
write("links.csv", csv([["slug", "href", "kind"], ...links]));

const imageRows = [["url", "used_in", "saved_as", "status"]];
for (const [url, used] of [...images].sort(([a], [b]) => a.localeCompare(b))) {
  const { hostname, pathname } = new URL(url);
  const usedIn = [...used].sort().join(" ");
  if (
    hostname !== "www.kantanfund.net" ||
    !pathname.startsWith("/wp-content/uploads/")
  ) {
    imageRows.push([url, usedIn, "", "外部画像（保存しない）"]);
    continue;
  }
  const dest = path.join(
    OUT,
    decodeURIComponent(pathname).replace(/^\/wp-content\//, "")
  );
  let status = "skip（保存済み）";
  if (!fs.existsSync(dest)) {
    try {
      const res = await get(url);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      status = "ok";
    } catch (e) {
      status = `error: ${e.message}`;
    }
  }
  imageRows.push([url, usedIn, dest, status]);
}
write("images.csv", csv(imageRows));

console.log(
  `posts=${meta.length} images=${images.size} links=${links.length} -> ${OUT}/`
);
