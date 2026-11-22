// bring-the-humans-03 entrypoint: hand VIDEO.json to the grader via /output.
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const botDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

try {
  mkdirSync(outputDir, { recursive: true });
  copyFileSync(join(botDir, "VIDEO.json"), join(outputDir, "VIDEO.json"));
} catch (error) {
  console.error("failed to copy VIDEO.json:", error);
  process.exit(1);
}
