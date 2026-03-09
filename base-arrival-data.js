const REPORTING_NOTE =
  "Reporting procedures can change. Confirm details with your gaining unit and official installation guidance before arrival.";

const ID_CARD_OFFICE_LOCATOR = "https://idco.dmdc.osd.mil/idco/locator";

const mapSearch = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const militaryInstallations = (slug) =>
  `https://installations.militaryonesource.mil/military-installation/${slug}`;

const inDepthOverview = (slug) =>
  `https://installations.militaryonesource.mil/in-depth-overview/${slug}`;

const housingLink = (slug) => `${militaryInstallations(slug)}/housing/housing`;
const temporaryHousingLink = (slug) =>
  `${militaryInstallations(slug)}/housing/temporary-housing`;
const healthCareLink = (slug) => `${militaryInstallations(slug)}/health/health-care`;
const householdGoodsLink = (slug) =>
  `${militaryInstallations(slug)}/moving/household-goods`;

const withCommonLinks = (supportSlug, installationName, lodgingQuery = installationName) => ({
  reportingInfoNote: REPORTING_NOTE,
  newcomerLink: inDepthOverview(supportSlug),
  baseHomepageLink: militaryInstallations(supportSlug),
  lodgingTitle: "Temporary lodging",
  lodgingLink: temporaryHousingLink(supportSlug),
  lodgingGoogleMapsLink: mapSearch(`${lodgingQuery} temporary lodging`),
  housingLink: housingLink(supportSlug),
  medicalLink: healthCareLink(supportSlug),
  transportationLink: householdGoodsLink(supportSlug),
  deersIdCardLink: ID_CARD_OFFICE_LOCATOR,
});

const baseArrivalData = {
  "fort-liberty": {
    ...withCommonLinks("fort-bragg", "Fort Liberty", "Airborne Inn Fort Liberty NC"),
    installationName: "Fort Liberty",
    state: "North Carolina",
    receptionTitle: "XVIII Airborne Corps Reception Company",
    receptionDescription:
      "Most permanent-party Soldiers begin at the XVIII Airborne Corps Reception Company, Building 4-1437 on Normandy Drive. Student, medical-hold, and other special assignments should still confirm unit-specific exceptions before travel day.",
    receptionOfficialLink:
      "https://home.army.mil/bragg/units-tenants/xviii-airborne-co/xviii-airborne-corps-reception-company",
    receptionGoogleMapsLink: mapSearch(
      "XVIII Airborne Corps Reception Company Building 4-1437 Normandy Drive Fort Liberty NC 28310"
    ),
    visitorCenterTitle: "All American Visitor Control Center",
    visitorCenterLink: militaryInstallations("fort-bragg"),
    visitorCenterGoogleMapsLink: mapSearch("All American Visitor Control Center Fort Liberty NC"),
  },
  "fort-campbell": {
    ...withCommonLinks("fort-campbell", "Fort Campbell", "Fort Campbell Army Lodging"),
    installationName: "Fort Campbell",
    state: "Kentucky / Tennessee",
    receptionTitle: "KALSU Replacement Company",
    receptionDescription:
      "Incoming Soldiers normally report to KALSU Replacement Company, 2443 20th Street, no later than the report date on orders. Transportation from Nashville is not provided, so plan your ride before wheels down.",
    receptionOfficialLink:
      "https://installations.militaryonesource.mil/military-installation/fort-campbell/base-essentials/check-in-procedures",
    receptionGoogleMapsLink: mapSearch("KALSU Replacement Company 2443 20th Street Fort Campbell KY"),
    visitorCenterTitle: "Gate 4 Visitor Control Center",
    visitorCenterLink: militaryInstallations("fort-campbell"),
    visitorCenterGoogleMapsLink: mapSearch("Gate 4 Visitor Control Center Fort Campbell KY"),
  },
  "fort-cavazos": {
    ...withCommonLinks("fort-cavazos", "Fort Cavazos", "Fort Cavazos IHG Army Hotels"),
    installationName: "Fort Cavazos",
    state: "Texas",
    receptionTitle: "Installation Reception Center",
    receptionDescription:
      "All incoming Soldiers should in-process through the Installation Reception Center at Building 16008 on 42nd Street. The center operates 24/7 and is the first stop for most III Armored Corps, 1st Cavalry Division, and tenant-unit arrivals.",
    receptionOfficialLink:
      "https://installations.militaryonesource.mil/military-installation/fort-hood/base-essentials/check-in-procedures",
    receptionGoogleMapsLink: mapSearch(
      "Installation Reception Center Building 16008 42nd Street Fort Cavazos TX 76544"
    ),
    visitorCenterTitle: "Marvin Leath Visitors Center",
    visitorCenterLink: "https://home.army.mil/hood/index.php/my-fort/visitor-information",
    visitorCenterGoogleMapsLink: mapSearch(
      "Marvin Leath Visitors Center T.J. Mills Boulevard Fort Cavazos TX 76544"
    ),
  },
  "joint-base-lewis-mcchord": {
    ...withCommonLinks(
      "joint-base-lewis-mcchord",
      "Joint Base Lewis-McChord",
      "Rainier Inn Joint Base Lewis-McChord WA"
    ),
    installationName: "Joint Base Lewis-McChord",
    state: "Washington",
    receptionTitle: "Installation Reception Center",
    receptionDescription:
      "Army arrivals report to the Installation Reception Center, Building 2021 on Pendleton Avenue, Lewis Main, regardless of unit assignment. Keep your orders, DA 31, and medical/dental records with you when you check in.",
    receptionOfficialLink:
      "https://home.army.mil/lewis-mcchord/about/Directorates-support-offices/dhr/mpd/inprocessing",
    receptionGoogleMapsLink: mapSearch(
      "Installation Reception Center Building 2021 Pendleton Avenue Lewis Main Joint Base Lewis-McChord WA"
    ),
    visitorCenterTitle: "McChord Field Main Gate / Visitor Access",
    visitorCenterLink:
      "https://home.army.mil/lewis-mcchord/about/Directorates-support-offices/directorate-emergency-services/provost-marshal/gate-information",
    visitorCenterGoogleMapsLink: mapSearch(
      "McChord Field Main Gate I-5 Exit 125 Bridgeport Way Joint Base Lewis-McChord WA 98438"
    ),
  },
  "fort-moore": {
    ...withCommonLinks("fort-benning", "Fort Moore", "Fort Moore Army Lodging"),
    installationName: "Fort Moore",
    state: "Georgia",
    receptionTitle: "Ridgway Hall / Installation Reception Center",
    receptionDescription:
      "During duty hours, permanent-party Soldiers usually start at Ridgway Hall, Building 35, Room 239, to begin installation reception. After hours, arrivals shift to McGinnis-Wickam Hall, Building 4, for staff-duty accountability.",
    receptionOfficialLink: "https://home.army.mil/benning/my-fort/newcomers/reception",
    receptionGoogleMapsLink: mapSearch(
      "Ridgway Hall Building 35 Room 239 Ridgway Loop Fort Moore GA"
    ),
    newcomerLink: "https://home.army.mil/benning/my-fort/newcomers",
    deersIdCardLink: "https://home.army.mil/benning/About/garrison/DHR/id-cards/schedule-cac",
  },
  "fort-bliss": {
    ...withCommonLinks("fort-bliss", "Fort Bliss", "Fort Bliss IHG Army Hotels"),
    installationName: "Fort Bliss",
    state: "Texas",
    receptionTitle: "Reception Company",
    receptionDescription:
      "Most incoming Soldiers report to the Fort Bliss Reception Company, Building 1006 on Carter Road, no later than the report date on assignment instructions. If you fly into El Paso and need help getting to post, the staff-duty desk can coordinate pickup.",
    receptionOfficialLink:
      "https://installations.militaryonesource.mil/military-installation/fort-bliss/base-essentials/check-in-procedures",
    receptionGoogleMapsLink: mapSearch("Reception Company 1006 Carter Road Fort Bliss TX 79916"),
  },
  "fort-carson": {
    ...withCommonLinks("fort-carson", "Fort Carson", "Candlewood Suites Fort Carson CO"),
    installationName: "Fort Carson",
    state: "Colorado",
    receptionTitle: "Fort Carson Welcome Center (Replacement Center)",
    receptionDescription:
      "Inbound Soldiers, colonel and below, normally sign in at the Replacement Center, Building 1456, 1783 Nelson Boulevard. The center also coordinates airport pickup questions, finance touchpoints, and the early in-processing schedule.",
    receptionOfficialLink: "https://home.army.mil/carson/my-fort/newcomers",
    receptionGoogleMapsLink: mapSearch(
      "Fort Carson Welcome Center Replacement Center 1783 Nelson Boulevard Building 1456 Fort Carson CO 80913"
    ),
    visitorCenterTitle: "Gate 1 Welcome Center",
    visitorCenterLink: "https://home.army.mil/carson/my-fort/newcomers",
    visitorCenterGoogleMapsLink: mapSearch("Gate 1 Welcome Center Fort Carson CO"),
  },
  "fort-stewart": {
    ...withCommonLinks("fort-stewart", "Fort Stewart", "Fort Stewart Army Lodging"),
    installationName: "Fort Stewart",
    state: "Georgia",
    receptionTitle: "Marne Reception Center / Soldier Service Center",
    receptionDescription:
      "Whether you are assigned to Fort Stewart or Hunter Army Airfield, most Soldiers sign in through the Marne Reception Center on Fort Stewart. The Soldier Service Center at 55 Pony Soldier Road is the key arrival touchpoint for first-stop guidance.",
    receptionOfficialLink: "https://home.army.mil/stewart/index.php/my-fort/newcomers-1/SAMSSC",
    receptionGoogleMapsLink: mapSearch(
      "Soldier Service Center 55 Pony Soldier Road Building 253 Fort Stewart GA 31314"
    ),
  },
  "fort-drum": {
    ...withCommonLinks("fort-drum", "Fort Drum", "Fort Drum IHG Army Hotels"),
    installationName: "Fort Drum",
    state: "New York",
    receptionTitle: "Reception Activity Barracks / MTN Reception Company",
    receptionDescription:
      "Fort Drum arrivals sign in at the Reception Activity Barracks, 4412 Camp Swift Road, with MTN Reception Company support available 24/7. Day 0 and Day 1 activities then move into unit and Clark Hall in-processing.",
    receptionOfficialLink:
      "https://installations.militaryonesource.mil/military-installation/fort-drum/base-essentials/check-in-procedures",
    receptionGoogleMapsLink: mapSearch("4412 Camp Swift Road Fort Drum NY 13602"),
  },
  "fort-riley": {
    ...withCommonLinks("fort-riley", "Fort Riley", "Fort Riley Army Lodging"),
    installationName: "Fort Riley",
    state: "Kansas",
    receptionTitle: "Victory Reception Company Staff Duty",
    receptionDescription:
      "All Soldiers with orders to Fort Riley should sign in through Victory Reception Company Staff Duty in Building 210 on Custer Avenue. If you have approved PTDY for house hunting, complete that before signing into the installation.",
    receptionOfficialLink:
      "https://installations.militaryonesource.mil/military-installation/fort-riley/base-essentials/check-in-procedures",
    receptionGoogleMapsLink: mapSearch(
      "Victory Reception Company Building 210 Custer Avenue Fort Riley KS"
    ),
    visitorCenterTitle: "Visitor Control Center",
    visitorCenterLink: "https://home.army.mil/riley/index.php/about/visitor-info",
    visitorCenterGoogleMapsLink: mapSearch(
      "Visitor Control Center 885 Henry Drive Marshall Air Field Fort Riley KS 66442"
    ),
  },
  "fort-johnson": {
    ...withCommonLinks("fort-johnson", "Fort Johnson", "Warriors Keep Fort Johnson LA"),
    installationName: "Fort Johnson",
    state: "Louisiana",
    receptionTitle: "In/Out Processing Center",
    receptionDescription:
      "During duty hours, most arrivals report to the In/Out Processing Center, Building 250 at 1716 3rd Street. After hours, sign in next door at Building 240, Warriors Keep, and use the next duty day to finish arrival processing.",
    receptionOfficialLink:
      "https://installations.militaryonesource.mil/military-installation/fort-polk/base-essentials/check-in-procedures",
    receptionGoogleMapsLink: mapSearch(
      "In Out Processing Center Building 250 1716 3rd Street Fort Johnson LA 71459"
    ),
    visitorCenterTitle: "Main Gate / Visitor Information",
    visitorCenterLink: "https://home.army.mil/johnson/Johnson/about/visitor-information",
    visitorCenterGoogleMapsLink: mapSearch("Main Gate Visitor Center Fort Johnson LA"),
  },
  "fort-sill": {
    ...withCommonLinks("fort-sill", "Fort Sill", "Fort Sill Army Lodging"),
    installationName: "Fort Sill",
    state: "Oklahoma",
    receptionTitle: "Welcome Center (Bldg. 4700)",
    receptionDescription:
      "Permanent-party Soldiers arriving to Fort Sill typically in-process through the Welcome Center, Building 4700. If you arrive after normal duty hours, posted instructions at the entrance explain how to contact your gaining unit and continue day 0 processing.",
    receptionOfficialLink:
      "https://installations.militaryonesource.mil/military-installation/fort-sill/base-essentials/check-in-procedures",
    receptionGoogleMapsLink: mapSearch("Welcome Center Building 4700 Fort Sill OK"),
    visitorCenterTitle: "Welcome / Visitor Center",
    visitorCenterGoogleMapsLink: mapSearch(
      "Welcome Visitor Center 6701 Sheridan Road Fort Sill OK 73503"
    ),
  },
  "fort-leonard-wood": {
    ...withCommonLinks(
      "fort-leonard-wood",
      "Fort Leonard Wood",
      "Fort Leonard Wood Army Lodging"
    ),
    installationName: "Fort Leonard Wood",
    state: "Missouri",
    receptionTitle: "Central In/Out Processing Office",
    receptionDescription:
      "Active Army personnel generally begin at the Central In/Out Processing Office, Building 470, Room 2102, during duty hours. Keep your orders handy so the installation can start accountability and checklist issue quickly.",
    receptionOfficialLink:
      "https://installations.militaryonesource.mil/military-installation/fort-leonard-wood/base-essentials/check-in-procedures",
    receptionGoogleMapsLink: mapSearch(
      "Central In Out Processing Office Building 470 Room 2102 Fort Leonard Wood MO 65473"
    ),
    visitorCenterTitle: "Visitor Center",
    visitorCenterLink: "https://www.wood.army.mil",
    visitorCenterGoogleMapsLink: mapSearch(
      "Visitor Center Main Gate Office Building Fort Leonard Wood MO 65473"
    ),
  },
  "fort-jackson": {
    ...withCommonLinks("fort-jackson", "Fort Jackson", "Fort Jackson Inn 7550 Benning Road"),
    installationName: "Fort Jackson",
    state: "South Carolina",
    receptionTitle: "Building 5450 / OSIP Center",
    receptionDescription:
      "Permanent-party Soldiers normally report to Building 5450, Room 200, on Strom Thurmond Boulevard during duty hours. After-hours arrivals without a sponsor or clear unit instructions use the Fort Jackson Inn front desk as the initial sign-in point before returning to Building 5450 the next duty day.",
    receptionOfficialLink:
      "https://installations.militaryonesource.mil/military-installation/fort-jackson/base-essentials/check-in-procedures",
    receptionGoogleMapsLink: mapSearch(
      "Building 5450 Strom Thurmond Boulevard Room 200 Fort Jackson SC 29207"
    ),
    visitorCenterTitle: "IHG Army Hotel / Welcome Center",
    visitorCenterLink: "https://www.ihg.com/armyhotels/hotels/us/en/reservation",
    visitorCenterGoogleMapsLink: mapSearch("Fort Jackson Inn 7550 Benning Road Fort Jackson SC"),
  },
  "fort-eisenhower": {
    ...withCommonLinks("fort-gordon", "Fort Eisenhower", "Fort Eisenhower IHG Army Hotels"),
    installationName: "Fort Eisenhower",
    state: "Georgia",
    receptionTitle: "Darling Hall / unit-directed reporting",
    receptionDescription:
      "Reporting steps vary by command at Fort Eisenhower, but most permanent-party arrivals use Darling Hall after any approved PTDY and then work through a seven-day in-processing flow. Review the unit-specific reporting list before you drive through the gate.",
    receptionOfficialLink:
      "https://installations.militaryonesource.mil/military-installation/fort-gordon/base-essentials/check-in-procedures",
    receptionGoogleMapsLink: mapSearch("Darling Hall Fort Eisenhower GA"),
    visitorCenterTitle: "Gate 6 Visitor Control Center",
    visitorCenterGoogleMapsLink: mapSearch("Gate 6 Visitor Control Center Fort Eisenhower GA"),
    deersIdCardLink: "https://home.army.mil/gordon/id-cards",
  },
  "fort-belvoir": {
    ...withCommonLinks("fort-belvoir", "Fort Belvoir", "Fort Belvoir Lodging"),
    installationName: "Fort Belvoir",
    state: "Virginia",
    receptionTitle: "Unit sign-in first, then Fort Belvoir Welcome Center",
    receptionDescription:
      "Soldiers should report to their assigned unit first and then move to the Fort Belvoir Welcome Center, Building 1189 at 9625 Middleton Road, for installation in-processing. The same location also supports finance, passports, household goods, and several early-arrival tasks.",
    receptionOfficialLink: "https://home.army.mil/belvoir/my-fort-belvoir/newcomers",
    receptionGoogleMapsLink: mapSearch(
      "Fort Belvoir Welcome Center 9625 Middleton Road Building 1189 Fort Belvoir VA 22060"
    ),
    visitorCenterTitle: "Fort Belvoir Welcome Center",
    visitorCenterLink: "https://home.army.mil/belvoir/my-fort-belvoir/newcomers",
    visitorCenterGoogleMapsLink: mapSearch(
      "Fort Belvoir Welcome Center 9625 Middleton Road Building 1189 Fort Belvoir VA 22060"
    ),
    medicalLink: "https://tricare.mil/mtf/BelvoirHospital",
  },
  "fort-meade": {
    ...withCommonLinks(
      "fort-george-g-meade",
      "Fort Meade",
      "Fort Meade temporary lodging"
    ),
    installationName: "Fort Meade",
    state: "Maryland",
    receptionTitle: "Mandatory Army in-processing briefing at Smallwood Hall",
    receptionDescription:
      "Army arrivals at Fort Meade sign into their assigned unit first and then attend the mandatory in-person Army in-processing briefing, normally every Tuesday at 8:00 a.m. at Smallwood Hall. Use the Fort Meade personnel-services page to confirm any schedule changes before you arrive.",
    receptionOfficialLink:
      "https://home.army.mil/meade/about/Garrison/directorate-human-resources/military-personnel-division/personnel-services/person-army-processing-briefing",
    receptionGoogleMapsLink: mapSearch("Smallwood Hall 4650 Williams Road Fort Meade MD 20755"),
    newcomerLink: "https://home.army.mil/meade/index.php/my-fort/newcomers",
    visitorCenterTitle: "Welcome / Visitors Center",
    visitorCenterLink: "https://home.army.mil/meade",
    visitorCenterGoogleMapsLink: mapSearch("Welcome Visitors Center 902 Reece Road Fort Meade MD"),
  },
  "fort-knox": {
    ...withCommonLinks("fort-knox", "Fort Knox", "New Garden Inn Fort Knox"),
    installationName: "Fort Knox",
    state: "Kentucky",
    receptionTitle: "Rockenbach Hall / Process Control Station",
    receptionDescription:
      "After your gaining unit arrives you in IPPS-A, report to Rockenbach Hall, Building 2020, Room 130, to start installation in-processing. Soldiers arriving after normal duty hours sign in at the Department of Emergency Services in Building 298 on Gold Vault Road.",
    receptionOfficialLink:
      "https://installations.militaryonesource.mil/military-installation/fort-knox/base-essentials/check-in-procedures",
    receptionGoogleMapsLink: mapSearch(
      "Rockenbach Hall Building 2020 Room 130 159 Black Horse Regiment Road Fort Knox KY"
    ),
    lodgingTitle: "New Garden Inn / temporary lodging",
    lodgingLink: temporaryHousingLink("fort-knox"),
    lodgingGoogleMapsLink: mapSearch("New Garden Inn 406 North Knox Street Fort Knox KY"),
  },
  "fort-huachuca": {
    ...withCommonLinks("fort-huachuca", "Fort Huachuca", "Fort Huachuca temporary lodging"),
    installationName: "Fort Huachuca",
    state: "Arizona",
    receptionTitle: "Unit sign-in with Personnel Processing Center follow-up",
    receptionDescription:
      "Fort Huachuca arrivals start with unit-directed sign-in and then move into the Personnel Processing Center briefing flow. If you need directions the Van Deman Gate Welcome Center is the best first stop, and TAPS at 908 Butler Road is the anchor point for arrival processing events.",
    receptionOfficialLink:
      "https://installations.militaryonesource.mil/military-installation/fort-huachuca/base-essentials/check-in-procedures",
    receptionGoogleMapsLink: mapSearch("TAPS 908 Butler Road Fort Huachuca AZ"),
    visitorCenterTitle: "Van Deman Gate Welcome Center",
    visitorCenterGoogleMapsLink: mapSearch("Van Deman Gate Welcome Center Fort Huachuca AZ"),
  },
  "fort-gregg-adams": {
    ...withCommonLinks("fort-lee", "Fort Gregg-Adams", "Fort Gregg-Adams Army Lodging"),
    installationName: "Fort Gregg-Adams",
    state: "Virginia",
    receptionTitle: "Soldier Support Center",
    receptionDescription:
      "Permanent-party Soldiers usually begin at the Soldier Support Center, Building 3400, 1401 Barefoot Avenue, during duty hours. After-hours arrivals shift to the Installation Operations Center, Building 1107, before continuing the next duty day.",
    receptionOfficialLink:
      "https://installations.militaryonesource.mil/military-installation/fort-lee/base-essentials/check-in-procedures",
    receptionGoogleMapsLink: mapSearch(
      "Soldier Support Center Building 3400 1401 Barefoot Avenue Fort Gregg-Adams VA 23801"
    ),
    visitorCenterTitle: "Visitor Control Center",
    visitorCenterLink: "https://home.army.mil/lee/index.php/about/visitor-information",
    visitorCenterGoogleMapsLink: mapSearch(
      "Visitor Control Center 500 Gregg Avenue Building 5228 Fort Gregg-Adams VA 23801"
    ),
  },
};

export { baseArrivalData, ID_CARD_OFFICE_LOCATOR, REPORTING_NOTE, mapSearch };
