import { baseArrivalData } from "@/base-arrival-data";
import { getNativeBaseDetailPath } from "@/lib/bases/base-route-map";

const BASE_ALIASES = Object.freeze({
  "fort-bragg": ["Fort Liberty", "Bragg"],
  "fort-hood": ["Fort Cavazos", "Hood"],
  "fort-benning": ["Fort Moore", "Benning"],
  "fort-polk": ["Fort Johnson", "Polk"],
  "fort-gordon": ["Fort Eisenhower", "Gordon"],
  "fort-lee": ["Fort Gregg-Adams", "Lee"],
});

const BASE_PREVIEW_SECTIONS = Object.freeze([
  "Lodging",
  "Housing",
  "Transportation",
  "Medical / ID cards",
  "Local arrival basics",
]);

const BASE_INDEX_ORDER = [
  {
    slug: "fort-bragg",
    units: [
      "XVIII Airborne Corps",
      "82nd Airborne Division",
      "U.S. Army Special Operations Command",
    ],
  },
  {
    slug: "fort-campbell",
    units: [
      "101st Airborne Division (Air Assault)",
      "5th Special Forces Group (Airborne)",
      "160th Special Operations Aviation Regiment",
    ],
  },
  {
    slug: "fort-hood",
    units: ["III Armored Corps", "1st Cavalry Division", "3rd Cavalry Regiment"],
  },
  {
    slug: "joint-base-lewis-mcchord",
    units: ["I Corps", "7th Infantry Division", "2nd Stryker Brigade Combat Team"],
  },
  {
    slug: "fort-benning",
    units: [
      "Maneuver Center of Excellence",
      "U.S. Army Infantry School",
      "U.S. Army Armor School",
    ],
  },
  {
    slug: "fort-bliss",
    units: [
      "1st Armored Division",
      "32nd Army Air & Missile Defense Command",
      "U.S. Army Sergeants Major Academy",
    ],
  },
  {
    slug: "fort-carson",
    units: [
      "4th Infantry Division",
      "10th Special Forces Group (Airborne)",
      "4th Security Force Assistance Brigade",
    ],
  },
  {
    slug: "fort-stewart",
    units: ["3rd Infantry Division", "24th Combat Aviation Brigade", "3rd Sustainment Brigade"],
  },
  {
    slug: "fort-drum",
    units: [
      "10th Mountain Division",
      "1st Brigade Combat Team, 10th MTN",
      "2nd Brigade Combat Team, 10th MTN",
    ],
  },
  {
    slug: "fort-riley",
    units: [
      "1st Infantry Division",
      "1st Infantry Division Sustainment Brigade",
      "Combat Aviation Brigade, 1st ID",
    ],
  },
  {
    slug: "fort-polk",
    units: [
      "Joint Readiness Training Center",
      "3rd Brigade Combat Team, 10th MTN",
      "509th Infantry Regiment (Airborne)",
    ],
  },
  {
    slug: "fort-sill",
    units: [
      "Fires Center of Excellence",
      "U.S. Army Field Artillery School",
      "31st Air Defense Artillery Brigade",
    ],
  },
  {
    slug: "fort-leonard-wood",
    units: [
      "Maneuver Support Center of Excellence",
      "U.S. Army Engineer School",
      "U.S. Army Chemical, Biological, Radiological and Nuclear School",
    ],
  },
  {
    slug: "fort-jackson",
    units: [
      "U.S. Army Training Center",
      "Initial Entry Training Brigade",
      "Soldier Support Institute",
    ],
  },
  {
    slug: "fort-gordon",
    units: [
      "U.S. Army Cyber Command",
      "U.S. Army Signal Center of Excellence",
      "15th Signal Brigade",
    ],
  },
  {
    slug: "fort-belvoir",
    units: [
      "U.S. Army Intelligence and Security Command",
      "Defense Logistics Agency Headquarters",
      "Defense Threat Reduction Agency",
    ],
  },
  {
    slug: "fort-meade",
    units: [
      "U.S. Cyber Command",
      "National Security Agency",
      "U.S. Army Network Enterprise Technology Command",
    ],
  },
  {
    slug: "fort-knox",
    units: [
      "U.S. Army Human Resources Command",
      "U.S. Army Cadet Command",
      "U.S. Army Recruiting Command",
    ],
  },
  {
    slug: "fort-huachuca",
    units: [
      "U.S. Army Intelligence Center of Excellence",
      "111th Military Intelligence Brigade",
      "Electronic Proving Ground",
    ],
  },
  {
    slug: "fort-lee",
    units: [
      "Combined Arms Support Command",
      "Army Logistics University",
      "Quartermaster, Ordnance, and Transportation Schools",
    ],
  },
  { slug: "naval-station-norfolk", branch: "Navy", units: ["U.S. Fleet Forces Command", "Naval Air Force Atlantic"] },
  { slug: "naval-base-san-diego", branch: "Navy", units: ["Pacific Surface Fleet", "Amphibious Squadron support"] },
  { slug: "nas-pensacola", branch: "Navy", units: ["Naval Education and Training Command", "Naval Aviation Schools"] },
  { slug: "naval-base-kitsap", branch: "Navy", units: ["Submarine Group 9", "Naval Base Kitsap commands"] },
  { slug: "naval-station-pearl-harbor", branch: "Navy", units: ["Pacific Fleet", "Joint Base support"] },
  { slug: "nas-jacksonville", branch: "Navy", units: ["Patrol and Reconnaissance Wing 11", "Fleet Readiness Center Southeast"] },
  { slug: "camp-lejeune", branch: "Marine Corps", units: ["II Marine Expeditionary Force", "2nd Marine Division"] },
  { slug: "camp-pendleton", branch: "Marine Corps", units: ["I Marine Expeditionary Force", "1st Marine Division"] },
  { slug: "mcb-quantico", branch: "Marine Corps", units: ["Training and Education Command", "Marine Corps University"] },
  { slug: "mcas-miramar", branch: "Marine Corps", units: ["3rd Marine Aircraft Wing", "Marine aviation support"] },
  { slug: "camp-butler", branch: "Marine Corps", units: ["III Marine Expeditionary Force", "Marine Corps Installations Pacific"] },
  { slug: "eglin-afb", branch: "Air Force", units: ["96th Test Wing", "33rd Fighter Wing"] },
  { slug: "lackland-afb-jbsa", branch: "Air Force", units: ["37th Training Wing", "Joint Base San Antonio"] },
  { slug: "travis-afb", branch: "Air Force", units: ["60th Air Mobility Wing", "349th Air Mobility Wing"] },
  { slug: "ramstein-ab", branch: "Air Force", units: ["86th Airlift Wing", "U.S. Air Forces in Europe"] },
  { slug: "kadena-ab", branch: "Air Force", units: ["18th Wing", "Pacific Air Forces support"] },
  { slug: "peterson-schriever-sfb", branch: "Air Force", units: ["Space Base Delta 1", "U.S. Space Command support"] },
  { slug: "andrews-afb-jba", branch: "Air Force", units: ["11th Wing", "89th Airlift Wing"] },
  { slug: "base-cape-cod", branch: "Coast Guard", units: ["Sector Southeastern New England", "Air Station Cape Cod"] },
  { slug: "sector-san-francisco", branch: "Coast Guard", units: ["Sector San Francisco command", "Bay area maritime safety"] },
];

export const baseIndexItems = BASE_INDEX_ORDER.map(({ slug, units, branch = "Army" }) => {
  const detail = baseArrivalData[slug];
  const title = detail?.installationName || slug;
  const state = detail?.state || "";
  const aliases = BASE_ALIASES[slug] || [];

  return {
    slug,
    href: getNativeBaseDetailPath(slug),
    title,
    state,
    aliases,
    previewSections: BASE_PREVIEW_SECTIONS,
    units,
    branch,
    searchText: [title, state, ...aliases, ...units].join(" ").toLowerCase(),
  };
});
