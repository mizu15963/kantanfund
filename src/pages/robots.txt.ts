// robots.txt（仕様: docs/site.md の「プレビュー」）
// プレビューのビルドでは巡回をすべて止める。本番ではサイトマップの場所を伝える
import type { APIRoute } from "astro";
import { isPreviewBuild } from "@libs/env.ts";
export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const body = isPreviewBuild
    ? ["User-agent: *", "Disallow: /", ""]
    : [
        "User-agent: *",
        "Allow: /",
        "",
        `Sitemap: ${new URL("/sitemap.xml", site).href}`,
        "",
      ];
  return new Response(body.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
