export const BASE_OPTIONS = [
  { id: "fort-liberty", name: "Fort Liberty" },
  { id: "fort-campbell", name: "Fort Campbell" },
  { id: "fort-cavazos", name: "Fort Cavazos" },
  { id: "joint-base-lewis-mcchord", name: "Joint Base Lewis-McChord" },
  { id: "fort-moore", name: "Fort Moore" },
  { id: "fort-bliss", name: "Fort Bliss" },
  { id: "fort-carson", name: "Fort Carson" },
  { id: "fort-stewart", name: "Fort Stewart" },
  { id: "fort-drum", name: "Fort Drum" },
  { id: "fort-riley", name: "Fort Riley" },
  { id: "fort-johnson", name: "Fort Johnson" },
  { id: "fort-sill", name: "Fort Sill" },
  { id: "fort-leonard-wood", name: "Fort Leonard Wood" },
  { id: "fort-jackson", name: "Fort Jackson" },
  { id: "fort-eisenhower", name: "Fort Eisenhower" },
  { id: "fort-belvoir", name: "Fort Belvoir" },
  { id: "fort-meade", name: "Fort Meade" },
  { id: "fort-knox", name: "Fort Knox" },
  { id: "fort-huachuca", name: "Fort Huachuca" },
  { id: "fort-gregg-adams", name: "Fort Gregg-Adams" },
];

export const ORIGIN_REGION_OPTIONS = [
  { value: "northeast", label: "Northeast" },
  { value: "mid_atlantic", label: "Mid-Atlantic" },
  { value: "southeast", label: "Southeast" },
  { value: "midwest", label: "Midwest" },
  { value: "texas", label: "Texas" },
  { value: "mountain_west", label: "Mountain West" },
  { value: "pacific_northwest", label: "Pacific Northwest" },
  { value: "southwest", label: "Southwest" },
  { value: "oconus", label: "OCONUS" },
  { value: "unknown", label: "Not sure yet" },
];

export const MOVE_STAGE_OPTIONS = [
  { value: "pre_orders", label: "Pre-orders" },
  { value: "orders_received", label: "Orders received" },
  { value: "planning", label: "Planning" },
  { value: "scheduling", label: "Scheduling" },
  { value: "packout", label: "Pack-out" },
  { value: "travel", label: "Travel" },
  { value: "arrival", label: "Arrival" },
  { value: "settling_in", label: "Settling in" },
];

export const HOUSING_INTENT_OPTIONS = [
  { value: "undecided", label: "Still deciding" },
  { value: "on_base", label: "On-base housing" },
  { value: "off_base_rent", label: "Off-base rental" },
  { value: "off_base_buy", label: "Off-base purchase" },
  { value: "temporary_only", label: "Temporary lodging first" },
];

export const HOUSEHOLD_SIZE_OPTIONS = [
  { value: "solo", label: "Solo move" },
  { value: "couple", label: "Two adults" },
  { value: "small_family", label: "Small family" },
  { value: "large_family", label: "Larger family" },
];

export const SERVICE_CATEGORY_OPTIONS = [
  { value: "moving", label: "Movers" },
  { value: "storage", label: "Storage" },
  { value: "vehicle_shipping", label: "Vehicle shipping" },
  { value: "temporary_lodging", label: "Temporary lodging" },
  { value: "mortgage", label: "Mortgage" },
  { value: "rental_housing", label: "Rental housing" },
  { value: "home_services", label: "Home services" },
  { value: "pet_relocation", label: "Pet relocation" },
  { value: "childcare", label: "Childcare" },
  { value: "local_services", label: "Local services" },
  { value: "housing", label: "Housing office" },
  { value: "medical", label: "Medical and clinics" },
  { value: "id_cards", label: "DEERS and ID cards" },
  { value: "transportation", label: "Transportation" },
  { value: "schools", label: "Schools" },
  { value: "spouse_employment", label: "Spouse employment" },
  { value: "finance", label: "Finance" },
  { value: "travel", label: "Travel and arrival" },
  { value: "arrival_support", label: "Arrival support" },
];

const ARTICLE_PAGE_CONTEXT = {
  "receiving-pcs-orders": {
    pageKind: "guide_article",
    contentCategory: "orders_guide",
    suggestedMoveStage: "orders_received",
    serviceCategory: "arrival_support",
  },
  "attending-pcs-briefings": {
    pageKind: "guide_article",
    contentCategory: "briefings_guide",
    suggestedMoveStage: "planning",
    serviceCategory: "arrival_support",
  },
  "confirming-report-dates": {
    pageKind: "guide_article",
    contentCategory: "report_dates_guide",
    suggestedMoveStage: "planning",
    serviceCategory: "travel",
  },
  "applying-advance-pay": {
    pageKind: "guide_article",
    contentCategory: "advance_pay_guide",
    suggestedMoveStage: "planning",
    serviceCategory: "finance",
  },
  "updating-deers-rapids": {
    pageKind: "guide_article",
    contentCategory: "deers_guide",
    suggestedMoveStage: "settling_in",
    serviceCategory: "id_cards",
  },
};

export const buildOptionsMarkup = (options, placeholderLabel = "Select one") =>
  [
    `<option value="">${placeholderLabel}</option>`,
    ...options.map((option) => `<option value="${option.value || option.id}">${option.label || option.name}</option>`),
  ].join("");

export const getBaseIdFromPath = (pathname = "") => {
  const match = String(pathname || "").match(/base-(.+)\.html$/);
  return match ? match[1] : "";
};

export const getBaseName = (baseId) => BASE_OPTIONS.find((base) => base.id === baseId)?.name || "";

export const getServiceCategoryLabel = (serviceCategory) =>
  SERVICE_CATEGORY_OPTIONS.find((option) => option.value === serviceCategory)?.label || serviceCategory || "";

export const sanitizeOutboundUrl = (href) => {
  try {
    const url = new URL(href, window.location.origin);
    if (!/^https?:$/i.test(url.protocol)) {
      return "";
    }
    return `${url.origin}${url.pathname}`;
  } catch (error) {
    return "";
  }
};

export const getDomainFromUrl = (href) => {
  try {
    const url = new URL(href, window.location.origin);
    return url.hostname || "";
  } catch (error) {
    return "";
  }
};

export const normalizeMonthInput = (value) => {
  if (!value) {
    return null;
  }
  return /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value;
};

export const formatMonthForInput = (value) => {
  if (!value) {
    return "";
  }
  return String(value).slice(0, 7);
};

export const getPageContext = (pathname = window.location.pathname) => {
  const normalizedPath = String(pathname || "").split("?")[0];
  const baseId = getBaseIdFromPath(normalizedPath);

  if (baseId) {
    return {
      pageKind: "base_detail",
      contentCategory: "base_detail",
      suggestedMoveStage: "arrival",
      serviceCategory: "arrival_support",
      baseId,
      pageSlug: `base-${baseId}`,
    };
  }

  const slug = normalizedPath.split("/").pop()?.replace(/\.html$/, "") || "index";
  if (ARTICLE_PAGE_CONTEXT[slug]) {
    return {
      ...ARTICLE_PAGE_CONTEXT[slug],
      baseId: "",
      pageSlug: slug,
    };
  }

  switch (slug) {
    case "index":
      return {
        pageKind: "landing",
        contentCategory: "landing",
        suggestedMoveStage: "planning",
        serviceCategory: null,
        baseId: "",
        pageSlug: slug,
      };
    case "create-account":
      return {
        pageKind: "account",
        contentCategory: "account",
        suggestedMoveStage: "planning",
        serviceCategory: null,
        baseId: "",
        pageSlug: slug,
      };
    case "pcs-checklist":
      return {
        pageKind: "tool",
        contentCategory: "checklist",
        suggestedMoveStage: "planning",
        serviceCategory: null,
        baseId: "",
        pageSlug: slug,
      };
    case "move-organizer":
      return {
        pageKind: "tool",
        contentCategory: "organizer",
        suggestedMoveStage: "scheduling",
        serviceCategory: null,
        baseId: "",
        pageSlug: slug,
      };
    case "move-inventory":
      return {
        pageKind: "tool",
        contentCategory: "inventory",
        suggestedMoveStage: "packout",
        serviceCategory: null,
        baseId: "",
        pageSlug: slug,
      };
    case "move-logistics":
      return {
        pageKind: "tool",
        contentCategory: "logistics",
        suggestedMoveStage: "travel",
        serviceCategory: "travel",
        baseId: "",
        pageSlug: slug,
      };
    case "bases":
      return {
        pageKind: "base_library",
        contentCategory: "base_library",
        suggestedMoveStage: "arrival",
        serviceCategory: "arrival_support",
        baseId: "",
        pageSlug: slug,
      };
    default:
      return {
        pageKind: "page",
        contentCategory: "general",
        suggestedMoveStage: "planning",
        serviceCategory: null,
        baseId: "",
        pageSlug: slug,
      };
  }
};

export const getPlacementDisclosure = (placementKind) =>
  placementKind === "affiliate" ? "Affiliate referral" : "Sponsored placement";
