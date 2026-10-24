// ビルドする環境の判定（仕様: docs/site.md の「プレビュー」）
import { WORKERS_CI_BRANCH } from "astro:env/server";

// 本番のブランチ（push すると www.kantanfund.net に反映される）
const PRODUCTION_BRANCH = "main";

// Cloudflare Workers Builds で main 以外のブランチをビルドしているとき true（手元のビルドは false）
// true のときは全ページを noindex にし、robots.txt で巡回も止める
export const isPreviewBuild =
  Boolean(WORKERS_CI_BRANCH) && WORKERS_CI_BRANCH !== PRODUCTION_BRANCH;
