import { readFileSync } from "node:fs";
import path from "node:path";

const CHECKLIST_FILE = path.join(process.cwd(), "pcs-checklist.html");
const CHECKLIST_MOJIBAKE_FIXUPS = [
  ["\u00e2\u20ac\u201c", "\u2013"],
  ["\u00e2\u20ac\u2122", "\u2019"],
  ["\u00e2\u20ac\u0153", "\u201c"],
  ["\u00e2\u20ac\u009d", "\u201d"],
  ["\u00e2\u20ac\u201d", "\u2014"],
  ["\u00e2\u20ac\u00a2", "\u2022"],
  ["\u00e2\u2013\u00be", "\u25be"],
];

const extractMainContent = (html) => {
  const match = html.match(/<main class="container">([\s\S]*?)<\/main>/i);
  if (!match) {
    throw new Error("Unable to extract checklist content from pcs-checklist.html.");
  }

  return match[1].trim();
};

const normalizeLegacyChecklistHtml = (html) =>
  CHECKLIST_MOJIBAKE_FIXUPS.reduce(
    (currentHtml, [corruptedText, normalizedText]) =>
      currentHtml.split(corruptedText).join(normalizedText),
    html
  );

export const getLegacyChecklistMainHtml = () => {
  const html = readFileSync(CHECKLIST_FILE, "utf8");
  return extractMainContent(normalizeLegacyChecklistHtml(html));
};
