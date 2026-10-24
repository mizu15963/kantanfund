// 構造化データ（JSON-LD）を作る（仕様: docs/site.md の「構造化データ」）
// 記事の本文には左右されず、microCMS の項目だけで作る
import { SITE } from "@constants/index.ts";
import type { Blog } from "@libs/microcms.ts";
import { blogPublishedAt, blogRevisedAt } from "@libs/format.ts";

type JsonLd = Record<string, unknown>;

// パンくずの1段（url がない段は、いま見ているページ）
export type BreadcrumbItem = { name: string; url?: string };

// <script type="application/ld+json"> に入れる文字列。
// 本文に「</script>」などが入っていても HTML として壊れないよう、< > & を \uXXXX に置き換える
export const toJsonLdString = (data: JsonLd) =>
  JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

const absolute = (path: string, site: URL) => new URL(path, site).href;

// 運営者（TOP のサイト情報、記事の書き手・発行元で共通）。@id で TOP の運営者と同じものだと示す
const organization = (site: URL): JsonLd => ({
  "@type": "Organization",
  "@id": absolute("/#organization", site),
  name: SITE.title,
  url: absolute("/", site),
});

// サイト（WebSite）と運営者（Organization）。TOP にだけ出す（Google は TOP のデータからサイト名を決めるため）
export const siteJsonLd = (site: URL): JsonLd => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": absolute("/#website", site),
      name: SITE.title,
      url: absolute("/", site),
      description: SITE.description,
      inLanguage: "ja",
      publisher: { "@id": absolute("/#organization", site) },
    },
    organization(site),
  ],
});

// 記事（BlogPosting）
export const blogPostingJsonLd = (
  blog: Blog,
  pageUrl: string,
  image: string,
  site: URL
): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: blog.title,
  ...(blog.description ? { description: blog.description } : {}),
  image: [absolute(image, site)],
  datePublished: blogPublishedAt(blog),
  dateModified: blogRevisedAt(blog),
  mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  author: organization(site),
  publisher: organization(site),
  ...(blog.category?.length
    ? { articleSection: blog.category.map((category) => category.name) }
    : {}),
});

// パンくず（BreadcrumbList）。画面に表示するパンくずと同じ項目から作る（Breadcrumb 部品の中で出す）
export const breadcrumbJsonLd = (
  items: BreadcrumbItem[],
  site: URL
): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    ...(item.url ? { item: absolute(item.url, site) } : {}),
  })),
});
