// @ts-check
import { defineConfig, envField, sessionDrivers } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  site: "https://www.kantanfund.net/",
  // URL は旧サイトと同じく末尾に「/」を付ける（/start_nisa/ など。docs/site.md の「URL」）
  trailingSlash: "always",
  build: { format: "directory" },
  // セッション機能は使っていない。指定しないと Cloudflare アダプターが KV（SESSION）を自動で足し、プレビューのデプロイが失敗するため、メモリに置く lruCache にしている（Astro 7 では memory がないため）
  session: { driver: sessionDrivers.lruCache() },
  // 画像の変換（astro:assets）は使わないため passthrough にする（Cloudflare Images の IMAGES バインディングを作らないため）
  adapter: cloudflare({
    prerenderEnvironment: "node",
    imageService: "passthrough",
  }),
  env: {
    schema: {
      MICROCMS_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      MICROCMS_SERVICE_DOMAIN: envField.string({
        context: "server",
        access: "secret",
      }),
      // Cloudflare Workers Builds がビルド時に入れるブランチ名。main 以外（プレビュー）のときは全ページを noindex にする（docs/site.md の「プレビュー」）
      WORKERS_CI_BRANCH: envField.string({
        context: "server",
        access: "public",
        optional: true,
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
