import { access, copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  legacyCopiedFiles,
  legacyManagedFiles,
} from "../lib/legacy-route-manifest.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const publicDir = path.join(repoRoot, "public");

const copiedFiles = Array.from(new Set(legacyCopiedFiles));
const managedFiles = Array.from(new Set(legacyManagedFiles));
const copiedFileSet = new Set(copiedFiles);

const ensureSourceFile = async (sourcePath, relativeFile) => {
  try {
    await access(sourcePath);
  } catch (error) {
    throw new Error(
      `[sync-legacy-assets] Missing source file for legacy sync: ${relativeFile} (${sourcePath})`
    );
  }
};

await mkdir(publicDir, { recursive: true });

console.log(
  `[sync-legacy-assets] Starting legacy asset sync. ${copiedFiles.length} file(s) will be copied.`
);

let removedCount = 0;
for (const relativeFile of managedFiles) {
  if (copiedFileSet.has(relativeFile)) {
    continue;
  }

  const targetPath = path.join(publicDir, relativeFile);
  await rm(targetPath, { force: true });
  removedCount += 1;
}

let copiedCount = 0;
for (const relativeFile of copiedFiles) {
  const sourcePath = path.join(repoRoot, relativeFile);
  const targetPath = path.join(publicDir, relativeFile);

  await ensureSourceFile(sourcePath, relativeFile);
  await mkdir(path.dirname(targetPath), { recursive: true });
  await copyFile(sourcePath, targetPath);
  copiedCount += 1;
}

console.log(
  `[sync-legacy-assets] Completed. Copied ${copiedCount} file(s); removed ${removedCount} stale generated file(s).`
);
