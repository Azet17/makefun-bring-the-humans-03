// main.ts — entrypoint for make.fun competition bring-the-humans-03.
//
// Job: read VIDEO.json from the repository root and copy it, unchanged,
// into the output directory the harness provides. The video itself is the
// entry; this program only hands its TikTok address to the house.
//
// Usage (local check):
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The harness runs it the same way, with MAKEFUN_BOT_DIR pointing at the
// checked-out repository and MAKEFUN_OUTPUT_DIR at /output.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

// The canonical TikTok video address, plus the two mobile forms the
// competition accepts. Short links (vm.tiktok.com, vt.tiktok.com,
// tiktok.com/t/...) and photo posts (/photo/<id>) are NOT accepted.
const VIDEO_URL_PATTERN =
  /^https:\/\/(?:www\.tiktok\.com\/@[^/\s]+\/video\/\d+|m\.tiktok\.com\/@[^/\s]+\/video\/\d+|m\.tiktok\.com\/v\/\d+\.html)$/;

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function main(): void {
  const botDir = process.env.MAKEFUN_BOT_DIR ?? ".";
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "out";

  const sourcePath = resolve(botDir, "VIDEO.json");
  if (!existsSync(sourcePath)) {
    fail(`VIDEO.json not found at ${sourcePath}`);
  }

  let raw: string;
  try {
    raw = readFileSync(sourcePath, "utf8");
  } catch (error) {
    fail(`could not read VIDEO.json: ${(error as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    fail(`VIDEO.json is not valid JSON: ${(error as Error).message}`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    fail("VIDEO.json must be a JSON object like {\"url\": \"https://www.tiktok.com/@handle/video/123\"}");
  }

  const url = (parsed as Record<string, unknown>).url;
  if (typeof url !== "string" || url.length === 0) {
    fail("VIDEO.json must contain a non-empty string field \"url\"");
  }
  // Short links (vm.tiktok.com, vt.tiktok.com, tiktok.com/t/...) name no
  // video until opened in a browser: refuse them with a hint instead of
  // the generic shape error, so the fix is obvious.
  if (/^https:\/\/(?:vm|vt)\.tiktok\.com\//.test(url) || /^https:\/\/tiktok\.com\/t\//.test(url)) {
    fail(
      `url ${JSON.stringify(url)} is a TikTok short link; open it in a browser and use the full address it lands on (https://www.tiktok.com/@<handle>/video/<digits>)`,
    );
  }
  if (/tiktok\.com\/@[^/\s]+\/photo\/\d+/.test(url)) {
    fail(`url ${JSON.stringify(url)} is a photo post, not a video; the entry must name a video`);
  }
  // A query string or fragment after the address is read past by the
  // house, so it is tolerated here; the address itself must still match.
  const bareUrl = url.split(/[?#]/, 1)[0];
  if (!VIDEO_URL_PATTERN.test(bareUrl)) {
    fail(
      `url ${JSON.stringify(url)} is not a TikTok video address; ` +
        `expected https://www.tiktok.com/@<handle>/video/<digits>`,
    );
  }

  mkdirSync(outDir, { recursive: true });
  const destPath = join(outDir, "VIDEO.json");
  writeFileSync(destPath, raw, "utf8");
  console.log(`main.ts: copied VIDEO.json -> ${destPath}`);
  console.log(`main.ts: video url is ${url}`);
}

main();
