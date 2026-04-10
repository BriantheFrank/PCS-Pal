import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
if (!pkg?.scripts?.build) {
  throw new Error("Expected build script to exist.");
}

execFileSync(process.execPath, ["--check", "checklist-data.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "inventory-data.js"], { stdio: "inherit" });
execFileSync(process.execPath, ["--check", "logistics-data.js"], { stdio: "inherit" });
console.log("Static checks passed.");
