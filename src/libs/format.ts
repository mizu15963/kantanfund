// 表示の整形（URL・日付・画像）
import type { BlogSummary } from "@libs/microcms.ts";

// 記事の URL（旧サイトと同じ /{スラッグ}/）。日本語のスラッグはコンテンツIDに使えないため urlSlug を優先する（docs/microcms.md の「URL の決まり方」）
export const blogSlug = (blog: Pick<BlogSummary, "id" | "urlSlug">) =>
  blog.urlSlug?.trim() || blog.id;
export const blogPath = (blog: Pick<BlogSummary, "id" | "urlSlug">) =>
  `/${blogSlug(blog)}/`;

// 公開日・更新日。移行した記事は旧サイトの日付を使う（microCMS の日付は移行した日になるため）
export const blogPublishedAt = (blog: BlogSummary) =>
  blog.originalPublishedAt ?? blog.publishedAt ?? blog.createdAt;
// 移行した記事は、旧サイトの更新日と「microCMS に入れた後に直した日時」の新しい方（入れた日だけでは更新扱いにしない）
export const blogRevisedAt = (blog: BlogSummary) => {
  if (!blog.originalPublishedAt) return blog.revisedAt ?? blogPublishedAt(blog);
  const editedInCms =
    blog.revisedAt && blog.publishedAt && blog.revisedAt > blog.publishedAt
      ? blog.revisedAt
      : undefined;
  return [blog.originalRevisedAt, editedInCms, blog.originalPublishedAt]
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1)!;
};

// サムネイル（16:9 に切り抜く）。新しい記事は microCMS の画像、移行した記事は旧サイトの画像、どちらもなければ仮の画像
export const blogThumbnail = (blog: BlogSummary, width: number) => {
  if (blog.thumbnail?.url) {
    return `${blog.thumbnail.url}?w=${width}&h=${Math.round((width * 9) / 16)}&fit=crop&q=70`;
  }
  return blog.legacyThumbnail || "/images/noimg.svg";
};
