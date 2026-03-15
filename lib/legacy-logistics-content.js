import { readFileSync } from "node:fs";
import path from "node:path";

const LOGISTICS_FILE = path.join(process.cwd(), "move-logistics.html");

const extractMainContent = (html) => {
  const match = html.match(/<main class="container logistics-layout">([\s\S]*?)<\/main>/i);
  if (!match) {
    throw new Error("Unable to extract logistics content from move-logistics.html.");
  }

  return match[1]
    .trim()
    .replace(/href="move-organizer\.html"/g, 'href="/organizer"');
};

const extractTemplates = (html) => {
  const templates = html.match(
    /<template id="(?:itinerary-stop-template|custom-event-template)">[\s\S]*?<\/template>/gi
  );

  if (!templates || templates.length !== 2) {
    throw new Error("Unable to extract logistics templates from move-logistics.html.");
  }

  return templates.join("\n\n");
};

export const getLegacyLogisticsHtml = () => {
  const html = readFileSync(LOGISTICS_FILE, "utf8");
  return `${extractMainContent(html)}\n\n${extractTemplates(html)}`.trim();
};
