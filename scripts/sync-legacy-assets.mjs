import { cp, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { legacyCopiedFiles } from "../lib/legacy-route-manifest.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const publicDir = path.join(repoRoot, "public");

await mkdir(publicDir, { recursive: true });

for (const relativeFile of legacyCopiedFiles) {
  const sourcePath = path.join(repoRoot, relativeFile);
  const targetPath = path.join(publicDir, relativeFile);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await cp(sourcePath, targetPath, { force: true });
}
