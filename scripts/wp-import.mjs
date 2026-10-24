// 書き出した旧サイトの記事（wp-export/）を microCMS の blog に入れる（仕様: docs/migration.md）
// 先に npm run wp:export で wp-export/ を作っておく
//
// 使い方:
//   npm run wp:import -- start_nisa fx_about      確認だけ（microCMS には送らない。wp-export/import-preview/ に送る内容を書き出す）
//   npm run wp:import -- --write start_nisa       microCMS に入れる（同じコンテンツIDがあれば上書き）
//   npm run wp:import -- --write --all            全記事を入れる
//   --draft を付けると下書きで入れる（既定は公開）
//   記事は旧スラッグかコンテンツIDで指定する
//
// --write のときは .env の MICROCMS_SERVICE_DOMAIN とキーを使う（MICROCMS_IMPORT_API_KEY、なければビルド用の MICROCMS_API_KEY）
// （取り込み用のキー。blog の PUT・PATCH と、マネジメント API のメディアのアップロードを許可する。ビルド用のキーとは分ける）
import fs from "node:fs";
import path from "node:path";

const EXPORT_DIR = "wp-export";
const PREVIEW_DIR = path.join(EXPORT_DIR, "import-preview");
// 画像の URL の対応（旧サイトの URL → microCMS の URL）。2回目以降は同じ画像を上げ直さない
const MEDIA_MAP_FILE = path.join(EXPORT_DIR, "media-map.json");
const OLD_HOST = "https://www.kantanfund.net";
const isOldSiteImage = (url) =>
  url.startsWith(`${OLD_HOST}/wp-content/uploads/`);
// microCMS への書き込みの間隔（ミリ秒）
const WAIT = 1000;

// 旧サイトのカテゴリ → microCMS の categories のコンテンツID
const CATEGORY_MAP = {
  toushi: "stock",
  fx: "fx",
  fudosan: "estate",
  "crypto-assets": "cryptocurrency",
  uncategorized: "news",
};
// 旧スラッグがコンテンツIDに使えない記事（日本語など）のコンテンツID。旧スラッグは urlSlug に入れる
const CONTENT_ID_MAP = {
  "🔰超初心者向け！株の始め方・やり方を4ステッ": "kabu-start-4steps",
};
// Yoast の title の末尾に付いているサイト名（新サイトでは Layout で付ける）
const SITE_SUFFIX = /\s*[|｜\-–—]\s*かんたんファンド\s*$/;

const args = process.argv.slice(2);
const doWrite = args.includes("--write");
const asDraft = args.includes("--draft");
const all = args.includes("--all");
const targets = args.filter((a) => !a.startsWith("--"));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const decodeEntities = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(parseInt(h, 16))
    )
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(
      /&(nbsp|quot|lt|gt|amp|hellip);/g,
      (_, name) =>
        ({
          nbsp: " ",
          quot: '"',
          lt: "<",
          gt: ">",
          amp: "&",
          hellip: "…",
        })[name]
    );

const stripTags = (html) => decodeEntities(html.replace(/<[^>]*>/g, "")).trim();

const attrsOf = (attrs) => {
  const result = {};
  for (const [, key, , dq, sq, bare] of attrs.matchAll(
    /([\w:-]+)(\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
  )) {
    result[key.toLowerCase()] = decodeEntities(dq ?? sq ?? bare ?? "");
  }
  return result;
};

const escapeAttr = (v) =>
  String(v).replaceAll("&", "&amp;").replaceAll('"', "&quot;");

const buildAttrs = (attrs) =>
  Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => ` ${k}="${escapeAttr(v)}"`)
    .join("");

const textAlign = (a) => {
  const fromClass = (a.class ?? "").match(
    /(?:has-text-align|align)-?(center|right|left)\b/
  );
  const fromStyle = (a.style ?? "").match(/text-align:\s*(center|right|left)/);
  const align = fromStyle?.[1] ?? fromClass?.[1];
  return align ? `text-align: ${align}` : undefined;
};

// 画像の元の URL（旧サイトの画像は srcset に大きいものがあればそれ。遅延読み込みは data-* を見る）
const imageSource = (a) => {
  const plain = a["data-src"] || a.src;
  if (
    plain &&
    !plain.startsWith("data:") &&
    !isOldSiteImage(new URL(plain, OLD_HOST).href)
  ) {
    return new URL(plain, OLD_HOST).href;
  }
  const srcset = a["data-srcset"] || a.srcset;
  if (srcset) {
    const largest = srcset
      .split(",")
      .map((part) => part.trim().split(/\s+/))
      .filter(([url]) => url)
      .sort(([, w1], [, w2]) => parseInt(w2) - parseInt(w1))[0];
    if (largest) return new URL(largest[0], OLD_HOST).href;
  }
  const src = a["data-src"] || a.src;
  return src && !src.startsWith("data:") ? new URL(src, OLD_HOST).href : null;
};

// ---- microCMS ----

const env = () => {
  try {
    process.loadEnvFile(".env");
  } catch {}
  const domain = process.env.MICROCMS_SERVICE_DOMAIN;
  // 取り込み用のキーがなければビルド用のキーを使う（Hobby プランはキーを増やせないため、取り込みの間だけ権限を足す）
  const key =
    process.env.MICROCMS_IMPORT_API_KEY || process.env.MICROCMS_API_KEY;
  if (!domain || !key) {
    throw new Error(
      ".env に MICROCMS_SERVICE_DOMAIN と API キーを入れてください"
    );
  }
  return { domain, key };
};

const mediaMap = fs.existsSync(MEDIA_MAP_FILE)
  ? JSON.parse(fs.readFileSync(MEDIA_MAP_FILE, "utf-8"))
  : {};

// 旧サイトの画像を microCMS のメディアに上げ、その URL を返す（確認だけのときは元の URL のまま）
const uploadImage = async (url, warnings) => {
  if (mediaMap[url]) return mediaMap[url];
  if (!doWrite) return url;
  const { domain, key } = env();
  const { pathname } = new URL(url);
  const local = path.join(
    EXPORT_DIR,
    decodeURIComponent(pathname).replace(/^\/wp-content\//, "")
  );
  let data;
  if (fs.existsSync(local)) {
    data = fs.readFileSync(local);
  } else {
    const res = await fetch(url);
    if (!res.ok) {
      warnings.push(`画像を取れませんでした（${res.status}）: ${url}`);
      return null;
    }
    data = Buffer.from(await res.arrayBuffer());
  }
  const ext = path.extname(pathname).slice(1).toLowerCase();
  const type = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  }[ext];
  if (!type) {
    warnings.push(`画像ではないので上げませんでした: ${url}`);
    return null;
  }
  const form = new FormData();
  form.append(
    "file",
    new Blob([data], { type }),
    path.basename(decodeURIComponent(pathname))
  );
  await sleep(WAIT);
  const res = await fetch(
    `https://${domain}.microcms-management.io/api/v1/media`,
    {
      method: "POST",
      headers: { "X-MICROCMS-API-KEY": key },
      body: form,
    }
  );
  if (!res.ok) {
    throw new Error(
      `画像のアップロードに失敗しました（${res.status} ${await res.text()}）: ${url}`
    );
  }
  const { url: uploaded } = await res.json();
  mediaMap[url] = uploaded;
  fs.writeFileSync(MEDIA_MAP_FILE, JSON.stringify(mediaMap, null, 2));
  return uploaded;
};

const sendContent = async (contentId, body) => {
  const { domain, key } = env();
  const query = asDraft ? "?status=draft" : "";
  const endpoint = `https://${domain}.microcms.io/api/v1/blog/${contentId}${query}`;
  const headers = {
    "X-MICROCMS-API-KEY": key,
    "Content-Type": "application/json",
  };
  await sleep(WAIT);
  // 新しく作る（PUT）。同じコンテンツIDがあって作れなければ上書き（PATCH）
  const put = await fetch(endpoint, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  if (put.ok) return "作成";
  const putError = `${put.status} ${await put.text()}`;
  if (put.status === 401 || put.status === 403)
    throw new Error(`PUT ${putError}`);
  await sleep(WAIT);
  const patch = await fetch(endpoint, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  if (patch.ok) return "上書き";
  throw new Error(
    `PUT ${putError} / PATCH ${patch.status} ${await patch.text()}`
  );
};

// ---- 本文の変換（microCMS のリッチエディタが受け付ける HTML にする） ----
// 受け付けるタグ: document.microcms.io/manual/rich-editor-write-api

const KEEP_PLAIN = new Set([
  "ul",
  "ol",
  "li",
  "blockquote",
  "hr",
  "br",
  "code",
  "pre",
  "table",
  "tbody",
  "tr",
  "figcaption",
  "strong",
  "em",
  "u",
  "s",
]);
const RENAME = { b: "strong", i: "em", del: "s", strike: "s", h6: "h5" };

const convertContent = async (html, warnings) => {
  let s = html;
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  // 遅延読み込みの <noscript> は同じ画像の重複なので消す
  s = s.replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, "");
  // 埋め込み（YouTube など）は入れられないので、リンクにする
  s = s.replace(/<iframe\b([^>]*)>[\s\S]*?<\/iframe>/gi, (_, attrs) => {
    const src = attrsOf(attrs).src ?? "";
    warnings.push(`埋め込みをリンクに変えました: ${src}`);
    return src ? `<p><a href="${escapeAttr(src)}">${src}</a></p>` : "";
  });
  // 表: figure を外し、見出し行も含めて table > tbody > tr にまとめる。表の説明（figcaption）は段落にする
  s = s.replace(
    /<figure\b[^>]*>\s*(<table\b[\s\S]*?<\/table>)\s*(?:<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/gi,
    (_, table, caption) => table + (caption ? `<p>${caption}</p>` : "")
  );
  // ボタン（wp-block-button）は段落の中のリンクにする
  s = s.replace(
    /<div\b[^>]*class="[^"]*\bwp-block-button\b(?!s)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    "<p>$1</p>"
  );
  s = s.replace(/<\/?(thead|tbody|tfoot)\b[^>]*>/gi, "");
  s = s
    .replace(/<table\b[^>]*>/gi, "<table><tbody>")
    .replace(/<\/table>/gi, "</tbody></table>");

  // 画像は先に microCMS に上げて、src を差し替えておく
  const imageUrls = new Map();
  for (const [, attrs] of s.matchAll(/<img\b([^>]*)>/gi)) {
    const src = imageSource(attrsOf(attrs));
    if (src && isOldSiteImage(src) && !imageUrls.has(src)) {
      imageUrls.set(src, await uploadImage(src, warnings));
    }
  }

  const spanStack = [];
  // タグごとに、受け付ける属性だけ残す。受け付けないタグ（div・span・mark など）は外して中身だけ残す
  s = s.replace(
    /<(\/?)([a-zA-Z][a-zA-Z0-9]*)([^>]*?)\/?>/g,
    (_, close, rawTag, rawAttrs) => {
      const tag = RENAME[rawTag.toLowerCase()] ?? rawTag.toLowerCase();
      const a = close ? {} : attrsOf(rawAttrs);
      if (KEEP_PLAIN.has(tag)) return close ? `</${tag}>` : `<${tag}>`;
      switch (tag) {
        case "p":
        case "h1":
        case "h2":
        case "h3":
        case "h4":
        case "h5":
          return close
            ? `</${tag}>`
            : `<${tag}${buildAttrs({ style: textAlign(a) })}>`;
        case "th":
        case "td":
          return close
            ? `</${tag}>`
            : `<${tag}${buildAttrs({ colspan: a.colspan, rowspan: a.rowspan })}>`;
        case "a":
          if (close) return "</a>";
          return `<a${buildAttrs({ href: a.href, target: a.target === "_blank" ? "_blank" : undefined, rel: a.rel })}>`;
        case "figure":
          return close
            ? "</figure>"
            : `<figure${buildAttrs({ style: textAlign(a) })}>`;
        case "img": {
          const source = imageSource(a);
          // 外部の画像（ASP のバナー・計測用画像）は microCMS に上げず、印にしてサイトの表示で画像に戻す（docs/article.md の「広告の画像」）
          if (source && !isOldSiteImage(source)) {
            const size = a.width && a.height ? `|${a.width}x${a.height}` : "";
            return `［広告画像:${source}${size}］`;
          }
          const src = imageUrls.get(source);
          if (!src) return "";
          return `<img${buildAttrs({ src, alt: a.alt ?? "", width: a.width, height: a.height })}>`;
        }
        case "span":
        case "mark": {
          // 文字色だけは残す（背景色・マーカーは入れられない）。閉じタグは開いたときに合わせる
          if (close) return spanStack.pop() ? "</span>" : "";
          const color = (a.style ?? "")
            .match(/(?:^|;)\s*color:\s*([^;]+)/)?.[1]
            ?.trim();
          spanStack.push(Boolean(color));
          return color ? `<span style="color: ${escapeAttr(color)}">` : "";
        }
        default:
          return "";
      }
    }
  );
  // 画像のない figure（埋め込みなど）は外す
  s = s.replace(
    /<figure(?: [^>]*)?>((?:(?!<figure)[\s\S])*?)<\/figure>/g,
    (m, inner) => (inner.includes("<img") ? m : inner)
  );
  s = s.replace(/\s*\n\s*/g, " ").replace(/>\s+</g, "><");
  // 中身のない段落を消す
  s = s.replace(/<p(?: [^>]*)?>(?:\s|&nbsp;|<br>)*<\/p>/g, "");
  return s.trim();
};

// ---- 記事 ----

const posts = JSON.parse(
  fs.readFileSync(path.join(EXPORT_DIR, "posts.json"), "utf-8")
);

const contentIdOf = (slug) => {
  if (CONTENT_ID_MAP[slug]) return CONTENT_ID_MAP[slug];
  if (/^[A-Za-z0-9_-]+$/.test(slug)) return slug;
  throw new Error(
    `スラッグ「${slug}」はコンテンツIDに使えません。scripts/wp-import.mjs の CONTENT_ID_MAP に足してください`
  );
};

// 日時は UTC（*_gmt）を ISO 形式で。古い書き出しで *_gmt がなければ日本時間として扱う
const isoDate = (gmt, local) =>
  new Date(gmt ? `${gmt}Z` : `${local}+09:00`).toISOString();

const buildContent = async (post, warnings) => {
  const html = fs.readFileSync(
    path.join(EXPORT_DIR, "html", `${post.slug}.html`),
    "utf-8"
  );
  const contentId = contentIdOf(post.slug);
  const title = stripTags(post.title);
  const seoTitle = post.seo_title
    ? decodeEntities(post.seo_title).replace(SITE_SUFFIX, "").trim()
    : "";
  const categories = [
    ...new Set(post.categories.map((c) => CATEGORY_MAP[c]).filter(Boolean)),
  ];
  for (const c of post.categories.filter((c) => !CATEGORY_MAP[c])) {
    warnings.push(`対応するカテゴリがありません: ${c}`);
  }
  const thumbnailSource = post.featured_image
    ? new URL(post.featured_image, OLD_HOST).href
    : null;
  const thumbnail = thumbnailSource
    ? await uploadImage(thumbnailSource, warnings)
    : null;
  return {
    contentId,
    body: {
      title,
      description:
        decodeEntities(post.seo_description ?? "").trim() ||
        stripTags(post.excerpt).replace(/\s*\[…\]$/, ""),
      content: await convertContent(html, warnings),
      // 確認だけのときは旧サイトの URL のまま（microCMS には送らない）
      thumbnail: thumbnail ?? undefined,
      category: categories,
      urlSlug: contentId === post.slug ? undefined : post.slug,
      seoTitle: seoTitle && seoTitle !== title ? seoTitle : undefined,
      originalPublishedAt: isoDate(post.date_gmt, post.date),
      originalRevisedAt: isoDate(post.modified_gmt, post.modified),
      noindex: post.robots?.index === "noindex" ? true : undefined,
    },
  };
};

const selected = all
  ? posts
  : targets.map((t) => {
      const post = posts.find(
        (p) => p.slug === t || CONTENT_ID_MAP[p.slug] === t
      );
      if (!post)
        throw new Error(`wp-export/posts.json に記事「${t}」がありません`);
      return post;
    });
if (selected.length === 0) {
  console.log(
    "入れる記事を指定してください（例: npm run wp:import -- start_nisa / --all）"
  );
  process.exit(1);
}

fs.mkdirSync(PREVIEW_DIR, { recursive: true });
let failed = 0;
for (const post of selected) {
  const warnings = [];
  try {
    const { contentId, body } = await buildContent(post, warnings);
    fs.writeFileSync(
      path.join(PREVIEW_DIR, `${contentId}.json`),
      JSON.stringify(body, null, 2)
    );
    fs.writeFileSync(path.join(PREVIEW_DIR, `${contentId}.html`), body.content);
    const result = doWrite ? await sendContent(contentId, body) : "確認のみ";
    console.log(`[${result}] ${contentId}  ${body.title}`);
  } catch (e) {
    failed++;
    console.log(`[失敗] ${post.slug}  ${e.message}`);
  }
  warnings.forEach((w) => console.log(`    ※ ${w}`));
}
console.log(
  `${selected.length - failed}/${selected.length} 件${doWrite ? "を microCMS に入れました" : "の送る内容を wp-export/import-preview/ に書き出しました"}`
);
if (failed) process.exit(1);
