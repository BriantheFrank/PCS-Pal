import { baseArrivalData } from "./base-arrival-data.js";

const getBaseKeyFromPath = () => {
  const match = window.location.pathname.match(/base-(.+)\.html$/);
  return match ? match[1] : "";
};

const createExternalLink = (label, href, trackingContext = {}) => {
  const link = document.createElement("a");
  link.className = "card-link";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  link.dataset.trackResource = "true";
  link.dataset.baseId = trackingContext.baseId || "";
  link.dataset.resourceCategory = trackingContext.category || "";
  link.dataset.resourceKind = trackingContext.resourceKind || "official";
  link.dataset.resourceLabel = trackingContext.resourceLabel || label;
  return link;
};

const createLinkStack = (links, trackingContext) => {
  const stack = document.createElement("div");
  stack.className = "base-link-stack";

  links
    .filter((link) => Boolean(link?.href))
    .forEach((link) => {
      stack.appendChild(
        createExternalLink(link.label, link.href, {
          ...trackingContext,
          resourceLabel: link.label,
        })
      );
    });

  return stack.childElementCount > 0 ? stack : null;
};

const createResourceCard = ({ title, description, links, category, baseId }) => {
  const card = document.createElement("article");
  card.className = "base-card";
  if (category) {
    card.dataset.serviceCategory = category;
  }

  const heading = document.createElement("h3");
  heading.textContent = title;
  card.appendChild(heading);

  if (description) {
    const paragraph = document.createElement("p");
    paragraph.className = "base-resource-copy";
    paragraph.textContent = description;
    card.appendChild(paragraph);
  }

  const stack = createLinkStack(links, {
    baseId,
    category,
    resourceKind: "official",
  });
  if (stack) {
    card.appendChild(stack);
  }

  return card;
};

const createSection = (title, intro, cards) => {
  const section = document.createElement("section");
  section.className = "base-detail base-enhancement-section";

  const heading = document.createElement("h2");
  heading.textContent = title;
  section.appendChild(heading);

  if (intro) {
    const introCopy = document.createElement("p");
    introCopy.className = "base-enhancement-intro";
    introCopy.textContent = intro;
    section.appendChild(introCopy);
  }

  const grid = document.createElement("div");
  grid.className = "base-grid";
  cards.forEach((card) => {
    grid.appendChild(createResourceCard(card));
  });
  section.appendChild(grid);

  return section;
};

const createSponsoredPlacementSlot = (baseId) => {
  const section = document.createElement("section");
  section.className = "base-detail base-enhancement-section base-sponsored-section";
  section.dataset.sponsoredPlacements = "true";
  section.dataset.baseId = baseId;
  section.hidden = true;
  return section;
};

const buildArrivalCards = (baseKey, base) => [
  {
    title: "Where to report on arrival",
    description: base.receptionDescription,
    category: "arrival_support",
    baseId: baseKey,
    links: [
      { label: "Official reception guidance", href: base.receptionOfficialLink },
      { label: "Open in Google Maps", href: base.receptionGoogleMapsLink },
    ],
  },
  {
    title: "Official installation guidance",
    description: base.reportingInfoNote,
    category: "travel",
    baseId: baseKey,
    links: [
      { label: "Installation overview", href: base.baseHomepageLink },
      { label: "Newcomer / overview page", href: base.newcomerLink },
    ],
  },
];

const buildHelpfulStopCards = (baseKey, base) => {
  const cards = [];

  if (base.visitorCenterTitle || base.visitorCenterLink || base.visitorCenterGoogleMapsLink) {
    cards.push({
      title: base.visitorCenterTitle || "Visitor center / gate access",
      description:
        "Keep the gate or visitor-control location handy in case you need directions, temporary pass support, or the clearest first stop onto post.",
      category: "arrival_support",
      baseId: baseKey,
      links: [
        { label: "Official visitor guidance", href: base.visitorCenterLink },
        { label: "Open in Google Maps", href: base.visitorCenterGoogleMapsLink },
      ],
    });
  }

  if (base.lodgingLink || base.lodgingGoogleMapsLink) {
    cards.push({
      title: base.lodgingTitle || "Temporary lodging",
      description:
        "If housing is not ready on arrival, keep the post temporary-lodging option and driving directions saved before travel day.",
      category: "temporary_lodging",
      baseId: baseKey,
      links: [
        { label: "Official lodging page", href: base.lodgingLink },
        { label: "Open in Google Maps", href: base.lodgingGoogleMapsLink },
      ],
    });
  }

  if (base.housingLink) {
    cards.push({
      title: "Housing",
      description:
        "Use the housing office link for waitlists, family housing guidance, and first-week lease or neighborhood questions.",
      category: "housing",
      baseId: baseKey,
      links: [{ label: "Official housing page", href: base.housingLink }],
    });
  }

  if (base.medicalLink) {
    cards.push({
      title: "Medical and clinics",
      description:
        "Confirm the installation hospital or clinic and any TRICARE enrollment steps before the first week fills up.",
      category: "medical",
      baseId: baseKey,
      links: [{ label: "Official medical guidance", href: base.medicalLink }],
    });
  }

  if (base.transportationLink) {
    cards.push({
      title: "Transportation / household goods",
      description:
        "Keep the household goods office page close for shipment delivery, storage-in-transit, and travel-day questions.",
      category: "transportation",
      baseId: baseKey,
      links: [{ label: "Official transportation page", href: base.transportationLink }],
    });
  }

  if (base.deersIdCardLink) {
    cards.push({
      title: "DEERS / ID cards",
      description:
        "If you need RAPIDS or ID-card support early, use the official locator before you arrive on post.",
      category: "id_cards",
      baseId: baseKey,
      links: [{ label: "Official ID card locator", href: base.deersIdCardLink }],
    });
  }

  return cards;
};

const enhanceBasePage = () => {
  const baseKey = getBaseKeyFromPath();
  if (!baseKey) {
    return;
  }

  const base = baseArrivalData[baseKey];
  if (!base) {
    return;
  }

  const main = document.querySelector("main.container");
  const anchor = main?.querySelector(".base-detail");
  if (!main || !anchor) {
    return;
  }

  if (main.querySelector("[data-base-enhanced='true']")) {
    return;
  }

  const arrivalSection = createSection(
    "Arrival & Reporting",
    `${base.installationName} arrival details are most useful when they answer one question quickly: where do I start on day one?`,
    buildArrivalCards(baseKey, base)
  );
  arrivalSection.dataset.baseEnhanced = "true";

  const sponsoredSection = createSponsoredPlacementSlot(baseKey);
  sponsoredSection.dataset.baseEnhanced = "true";

  const helpfulStops = buildHelpfulStopCards(baseKey, base);
  const helpfulStopsSection = createSection(
    "Helpful First-Week Stops",
    "These links cover the on-post offices and services that are most likely to matter as soon as you arrive.",
    helpfulStops
  );
  helpfulStopsSection.dataset.baseEnhanced = "true";

  main.insertBefore(helpfulStopsSection, anchor);
  main.insertBefore(sponsoredSection, helpfulStopsSection);
  main.insertBefore(arrivalSection, sponsoredSection);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", enhanceBasePage);
} else {
  enhanceBasePage();
}
