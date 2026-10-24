// microCMS からの取得（項目の定義は schema/。仕様: docs/microcms.md）
// ページはすべてビルド時に作るため、ここはビルド時にだけ呼ばれる
import type {
  MicroCMSQueries,
  MicroCMSListContent,
  MicroCMSImage,
} from "microcms-js-sdk";
import { createClient } from "microcms-js-sdk";
import { MICROCMS_API_KEY, MICROCMS_SERVICE_DOMAIN } from "astro:env/server";

export const client = createClient({
  serviceDomain: MICROCMS_SERVICE_DOMAIN,
  apiKey: MICROCMS_API_KEY,
  retry: true,
});

// 記事（schema/blog.json）
export type Blog = {
  title: string;
  description?: string | null;
  content: string;
  thumbnail?: MicroCMSImage | null;
  category?: Category[] | null;
  urlSlug?: string | null;
  seoTitle?: string | null;
  legacyThumbnail?: string | null;
  originalPublishedAt?: string | null;
  originalRevisedAt?: string | null;
  noindex?: boolean | null;
  embeds?: BlogEmbed[] | null;
} & MicroCMSListContent;

// 埋め込み HTML（blog の embeds。繰り返しフィールドのカスタムフィールド embed）
// 本文の「［埋め込み:名前］」の場所に html をそのまま出す（docs/article.md の「埋め込み HTML」）
export type BlogEmbed = {
  fieldId: "embed";
  name: string;
  html: string;
};

// カテゴリ（schema/categories.json）
export type Category = {
  name: string;
} & MicroCMSListContent;

// 一覧に出すときの項目（本文は重いので取らない）
const SUMMARY_FIELDS = [
  "id",
  "title",
  "description",
  "thumbnail",
  "category.id",
  "category.name",
  "urlSlug",
  "legacyThumbnail",
  "originalPublishedAt",
  "originalRevisedAt",
  "noindex",
  "createdAt",
  "updatedAt",
  "publishedAt",
  "revisedAt",
].join(",");

export type BlogSummary = Omit<Blog, "content" | "seoTitle" | "embeds">;

// 記事をすべて取る（記事ページを作るとき）
export const getAllBlogs = async (queries?: MicroCMSQueries) =>
  await client.getAllContents<Blog>({ endpoint: "blog", queries });

// 記事をすべて取る（一覧・サイトマップ用。本文なし）
export const getAllBlogSummaries = async (queries?: MicroCMSQueries) =>
  await client.getAllContents<BlogSummary>({
    endpoint: "blog",
    queries: { fields: SUMMARY_FIELDS, ...queries },
  });

// カテゴリをすべて取る（並び順は管理画面の並び順）
export const getAllCategories = async () =>
  await client.getAllContents<Category>({ endpoint: "categories" });
