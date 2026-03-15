import { readFileSync } from "node:fs";
import path from "node:path";

const CHECKLIST_FILE = path.join(process.cwd(), "pcs-checklist.html");

const extractMainContent = (html) => {
  const match = html.match(/<main class="container">([\s\S]*?)<\/main>/i);
  if (!match) {
    throw new Error("Unable to extract checklist content from pcs-checklist.html.");
  }

  return match[1].trim();
};

export const getLegacyChecklistMainHtml = () => {
  const html = readFileSync(CHECKLIST_FILE, "utf8");
  return extractMainContent(html);
};
