import { readFileSync } from "node:fs";
import path from "node:path";

import {
  normalizeRichTextHtml,
  normalizeLegacySourceHtml,
  stripHtmlToText,
} from "@/lib/content/legacy-html";

const CHECKLIST_FILE = path.join(process.cwd(), "pcs-checklist.html");

let cachedChecklistPageData;

const extractMatches = (source, pattern) => Array.from(String(source || "").matchAll(pattern));

const buildItemBlocks = (sectionHtml) => {
  const matches = extractMatches(sectionHtml, /<div class="checklist-item" data-item="[^"]+">/g);

  return matches.map((match, index) => {
    const startIndex = match.index;
    const endIndex = index + 1 < matches.length ? matches[index + 1].index : sectionHtml.length;
    return sectionHtml.slice(startIndex, endIndex);
  });
};

const parseChecklistItem = (itemHtml) => {
  const itemId = itemHtml.match(/data-item="([^"]+)"/)?.[1] || "";
  const parentId = itemHtml.match(/data-id="([^"]+)"\s+data-role="parent"/)?.[1] || itemId;
  const detailsId = itemHtml.match(/aria-controls="([^"]+)"/)?.[1] || `${itemId}-details`;
  const title = stripHtmlToText(itemHtml.match(/<span class="item-title">([\s\S]*?)<\/span>/)?.[1] || "");

  const helpParagraphs = extractMatches(itemHtml, /<p>([\s\S]*?)<\/p>/g).map((match) =>
    normalizeRichTextHtml(match[1])
  );

  const subtasks = extractMatches(
    itemHtml,
    /<input[^>]+data-id="([^"]+)"[^>]*>[\s\S]*?<span>([\s\S]*?)<\/span>/g
  ).map((match) => ({
    id: match[1],
    label: stripHtmlToText(match[2]),
  }));

  const tips = extractMatches(itemHtml, /<ul class="item-tips">([\s\S]*?)<\/ul>/g)
    .flatMap((match) => extractMatches(match[1], /<li>([\s\S]*?)<\/li>/g))
    .map((match) => normalizeRichTextHtml(match[1]));

  return {
    id: itemId,
    parentId,
    detailsId,
    title,
    helpParagraphs,
    subtasks,
    tips,
  };
};

const parseChecklistSection = (sectionHtml, index) => {
  const sectionId =
    sectionHtml.match(/<details class="checklist-section" data-section="([^"]+)"/)?.[1] ||
    `section-${index + 1}`;
  const title = stripHtmlToText(sectionHtml.match(/<summary>\s*<h2>([\s\S]*?)<\/h2>/)?.[1] || "");
  const intro = stripHtmlToText(
    sectionHtml.match(/<p class="checklist-intro">([\s\S]*?)<\/p>/)?.[1] || ""
  );

  return {
    id: sectionId,
    title,
    intro,
    items: buildItemBlocks(sectionHtml).map((itemHtml) => parseChecklistItem(itemHtml)),
  };
};

const parseChecklistPageData = (html) => {
  const normalizedHtml = normalizeLegacySourceHtml(html);
  const disclaimerHtml = normalizedHtml.match(
    /<div class="disclaimer-banner">([\s\S]*?)<\/div>/
  )?.[1];
  const sidebarTitle = stripHtmlToText(
    normalizedHtml.match(/<aside class="checklist-sidebar">[\s\S]*?<h2>([\s\S]*?)<\/h2>/)?.[1] || ""
  );
  const sidebarItems = extractMatches(
    normalizedHtml.match(/<ul class="sidebar-list">([\s\S]*?)<\/ul>/)?.[1] || "",
    /<li>([\s\S]*?)<\/li>/g
  ).map((match) => stripHtmlToText(match[1]));
  const sectionMatches = extractMatches(
    normalizedHtml,
    /<details class="checklist-section" data-section="[^"]+" open>[\s\S]*?<\/details>/g
  );

  return {
    disclaimerHtml: normalizeRichTextHtml(disclaimerHtml || ""),
    sidebar: {
      title: sidebarTitle,
      items: sidebarItems,
    },
    sections: sectionMatches.map((match, index) => parseChecklistSection(match[0], index)),
  };
};

export const getChecklistPageData = () => {
  if (!cachedChecklistPageData) {
    cachedChecklistPageData = parseChecklistPageData(readFileSync(CHECKLIST_FILE, "utf8"));
  }

  return cachedChecklistPageData;
};
