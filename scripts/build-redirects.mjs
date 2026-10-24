// data/redirects.csv（旧サイトの URL の転送表）から public/_redirects を作る（仕様: docs/redirects.md）
// 使い方: npm run redirects（CSV を直したら実行し、できた public/_redirects も一緒にコミットする）
import { readFileSync, writeFileSync } from "node:fs";

const CSV = new URL("../data/redirects.csv", import.meta.url);
const OUTPUT = new URL("../public/_redirects", import.meta.url);

// CSV の1行を列に分ける（項目に「,」を含む場合の "..." にも対応）
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

const lines = [];
const skipped = [];
for (const row of rows) {
  const from = row[column("from")];
  const to = row[column("to")];
  const status = row[column("status")];
  const match = row[column("match")];
  switch (match) {
    case "exact":
    case "prefix":
      // prefix は from の末尾が「*」（splat）。_redirects の書き方そのまま
      lines.push(`${from} ${to} ${status}`);
      break;
    case "pattern":
      // {slug} は _redirects のプレースホルダ（:slug）にする
      lines.push(
        `${from.replaceAll("{slug}", ":slug")} ${to.replaceAll("{slug}", ":slug")} ${status}`
      );
      break;
    default:
      // host（非www・http）と query（/?p=ID）は _redirects では書けないため、Cloudflare 側で設定する（docs/redirects.md）
      skipped.push(`${match}: ${from} -> ${to}`);
  }
}

// 固定の転送（exact・prefix）を先、プレースホルダを使う転送を後にする（上から順に最初に合ったものが使われるため）
lines.sort((a, b) => Number(a.includes(":slug")) - Number(b.includes(":slug")));

writeFileSync(
  OUTPUT,
  [
    "# 旧サイトの URL の転送（data/redirects.csv から scripts/build-redirects.mjs で作ったもの。直接編集しない）",
    "# 仕様: docs/redirects.md",
    ...lines,
    "",
  ].join("\n")
);
console.log(`public/_redirects に ${lines.length} 件を書き出しました`);
if (skipped.length) {
  console.log(
    `_redirects に書けないため Cloudflare 側で設定するもの（${skipped.length} 件）:`
  );
  skipped.forEach((line) => console.log(`  ${line}`));
}
