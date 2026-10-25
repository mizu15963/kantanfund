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
      // status が 200 の行は転送せずに中身を返すもの（Search Console の確認用ファイル）。転送先ではなく 200 を期待する
      cases.push(
        row[column("status")] === "200"
          ? { url: base + from, expected: null }
          : { url: base + from, expected: base + to }
      );
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
        const expected = to.replace("/*", path);
        // http://* は www あり・なしの両方で確かめる
        const froms =
          from === "http://*"
            ? ["http://www.kantanfund.net/*", "http://kantanfund.net/*"]
            : [from];
        for (const url of froms) {
          cases.push({ url: url.replace("/*", path), expected });
        }
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
    let actual = location ? new URL(location, url).href : "";
    if (expected === null) {
      if (response.status !== 200)
        fail(`${url} → ${response.status} ${actual}（期待: 200）`);
      continue;
    }
    // 転送が2段になるもの（/comments/feed/ → /comments/ → /）は、301 が続く限りたどって最後の転送先を見る
    const status = response.status;
    for (let hop = 0; status === 301 && actual !== new URL(expected).href && hop < 3; hop++) {
      const next = await fetch(actual, { redirect: "manual" });
      if (next.status !== 301) break;
      actual = new URL(next.headers.get("location") ?? "", actual).href;
    }
    if (status !== 301 || actual !== new URL(expected).href) {
      fail(`${url} → ${status} ${actual}（期待: 301 ${expected}）`);
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
    const robotsHeader = response.headers.get("x-robots-tag") ?? "";
    if (response.status !== 200) fail(`${url} → ${response.status}`);
    else if (isProduction) {
      // 本番では noindex が残っていないことも見る（SITE.noindex・X-Robots-Tag）
      const html = await response.text();
      if (/<meta name="robots" content="noindex/.test(html)) {
        fail(`${url} → noindex が付いている`);
      }
      if (/noindex/.test(robotsHeader)) {
        fail(`${url} → X-Robots-Tag: ${robotsHeader} が付いている`);
      }
    } else if (!/noindex/.test(robotsHeader)) {
      // workers.dev は X-Robots-Tag で検索エンジンに載せない（docs/site.md の「プレビュー」）
      fail(`${url} → X-Robots-Tag: noindex が付いていない`);
    }
  } catch (error) {
    fail(`${url} → ${error.message}`);
  }
}

// User-agent: * のグループに Disallow: / があるか（Cloudflare が AI のクローラー向けに足す行は対象外）
const disallowsAll = (text) => {
  let inAll = false;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, "").trim();
    const [key, ...rest] = line.split(":");
    const value = rest.join(":").trim();
    if (/^user-agent$/i.test(key)) {
      inAll = (lastWasAgent && inAll) || value === "*";
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (inAll && /^disallow$/i.test(key) && value === "/") return true;
  }
  return false;
};

// robots.txt が巡回を止めていないか（止めていると noindex の指定も検索エンジンに届かない）
console.log("\n## robots.txt");
const robots = await fetch(`${base}/robots.txt`)
  .then((r) => (r.ok ? r.text() : ""))
  .catch(() => "");
if (!robots) fail(`${base}/robots.txt を取得できない`);
else if (disallowsAll(robots)) {
  fail(`${base}/robots.txt → Disallow: / になっている`);
}

console.log(
  failures ? `\n${failures} 件の問題があります` : "\nすべて問題ありません"
);
process.exitCode = failures ? 1 : 0;
