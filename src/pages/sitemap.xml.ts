// サイトマップ（/sitemap.xml。仕様: docs/site.md の「サイトマップ」）
// 旧サイトの /sitemap_index.xml なども、ここへ 301 で転送している（public/_redirects）
// microCMS からの取得に失敗したらビルドを止める（ページが抜けたサイトマップを公開しないため）
import type { APIRoute } from "astro";
import { getAllBlogSummaries } from "@libs/microcms.ts";
import { blogPath, blogRevisedAt } from "@libs/format.ts";
import { BLOG, CATEGORY } from "@constants/index.ts";
export const prerender = true;

type Entry = { path: string; lastmod?: string };

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL("https://www.kantanfund.net/");
  const blogs = await getAllBlogSummaries();

  // 載せないページ: noindex の記事、404
  const entries: Entry[] = [
    { path: "/" },
    ...CATEGORY.hubs.map((hub) => ({ path: `/${hub.id}/` })),
    { path: BLOG.listPath },
    { path: "/operator/" },
    ...blogs
      .filter((blog) => !blog.noindex)
      .map((blog) => ({ path: blogPath(blog), lastmod: blogRevisedAt(blog) })),
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map((entry) =>
      [
        "  <url>",
        // 日本語の URL は、旧サイトのサイトマップと同じくエンコードした形で載せる
        `    <loc>${escapeXml(new URL(entry.path, base).href)}</loc>`,
        ...(entry.lastmod
          ? [`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`]
          : []),
        "  </url>",
      ].join("\n")
    ),
    "</urlset>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
