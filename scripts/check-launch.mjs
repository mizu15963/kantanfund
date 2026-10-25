// 公開日の確認（仕様: docs/analytics.md の「公開日の確認」）
// data/redirects.csv の転送が 301 で正しい転送先に行くか、/sitemap.xml の URL がすべて 200 で開けるかを確かめる
// 使い方: npm run check:launch（本番） / npm run check:launch -- https://kantan-fund.xxxx.workers.dev（公開前の確認。www なし・http の転送は確かめない）
import { readFileSync } from "node:fs";

const PRODUCTION = "https://www.kantanfund.net";
const base = (process.argv[2] ?? PRODUCTION).replace(/\/$/, "");
const isProduction = base === PRODUCTION;
// {slug} の転送を確かめるときに使う記事（旧サイトからある記事）
const SAMPLE_SLUG = "start_nisa";

const CSV = new URL("../data/redirects.csv", import.meta.url);

// CSV の1行を列に分ける（scripts/build-redirects.mjs と同じ。"..." の中の「,」に対応）
const parseLine = (line) => {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
};

const [header, ...rows] = readFileSync(CSV, "utf8")
  .replace(/^﻿/, "")
  .trim()
  .split(/\r?\n/)
  .map(parseLine);
const column = (name) => header.indexOf(name);

// 確かめる転送（開く URL と、期待する転送先）
const cases = [];
for (const row of rows) {
  const from = row[column("from")];
  const to = row[column("to")];
  switch (row[column("match")]) {
    case "exact":
      cases.push({ url: base + from, expected: base + to });
      break;
    case "prefix":
      // 「*」には適当な続き（ページ送りの2ページ目）を入れる
      cases.push({ url: base + from.replace("*", "2/"), expected: base + to });
      break;
    case "pattern":
      cases.push({
        url: base + from.replaceAll("{slug}", SAMPLE_SLUG),
        expected: base + to.replaceAll("{slug}", SAMPLE_SLUG),
      });
      break;
    case "host":
      // www なし・http の転送は Cloudflare 側の設定なので、本番のドメインでだけ確かめる
      if (isProduction) {
        const path = `/${SAMPLE_SLUG}/?utm_source=check`;
        cases.push({
          url: from.replace("/*", path),
          expected: to.replace("/*", path),
        });
      }
      break;
    // query（/?p={記事ID}）は対応表ができてから足す（docs/redirects.md）
  }
}

let failures = 0;
const fail = (message) => {
  failures++;
  console.log(`NG ${message}`);
};

console.log(`確認先: ${base}\n\n## 転送（${cases.length} 件）`);
for (const { url, expected } of cases) {
  try {
    const response = await fetch(url, { redirect: "manual" });
    const location = response.headers.get("location");
    const actual = location ? new URL(location, url).href : "";
    if (response.status !== 301 || actual !== new URL(expected).href) {
      fail(`${url} → ${response.status} ${actual}（期待: 301 ${expected}）`);
    }
  } catch (error) {
    fail(`${url} → ${error.message}`);
  }
}

// サイトマップの URL は、転送なしで 200 になるはず（転送や 404 があると Search Console でエラーになる）
const sitemap = await fetch(`${base}/sitemap.xml`)
  .then((r) => (r.ok ? r.text() : ""))
  .catch(() => "");
if (!sitemap) fail(`${base}/sitemap.xml を取得できない`);
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
  // サイトマップの URL は常に本番のドメイン。workers.dev で確かめるときは置き換える
  m[1].replace(PRODUCTION, base)
);
console.log(`\n## サイトマップの URL（${locs.length} 件）`);
for (const url of locs) {
  try {
    const response = await fetch(url, { redirect: "manual" });
    if (response.status !== 200) fail(`${url} → ${response.status}`);
    else if (isProduction) {
      // 本番では noindex が残っていないことも見る（SITE.noindex の戻し忘れ）
      const html = await response.text();
      if (/<meta name="robots" content="noindex/.test(html)) {
        fail(`${url} → noindex が付いている`);
      }
    }
  } catch (error) {
    fail(`${url} → ${error.message}`);
  }
}

console.log(
  failures ? `\n${failures} 件の問題があります` : "\nすべて問題ありません"
);
process.exitCode = failures ? 1 : 0;
