import { normalizeMonthInput } from "./pcs-reference-data.js";

const toTitleCase = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");

const coerceBoolean = (value) => value === true || value === "true" || value === "on";

export const normalizeFullName = (value) => {
  const normalized = toTitleCase(value);
  return normalized || "";
};

export const getProfileFullName = ({ profile, user }) =>
  normalizeFullName(
    profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || ""
  );

export const getFallbackName = (user) => {
  const emailPrefix = String(user?.email || "").split("@")[0];
  return normalizeFullName(emailPrefix.replace(/[._-]+/g, " "));
};

export const getDisplayName = ({ profile, user }) =>
  getProfileFullName({ profile, user }) || getFallbackName(user) || "PCS Planner";

export const getHouseholdProfile = (profile) => ({
  household_size_bucket: profile?.household_profile_coarse?.household_size_bucket || "",
});

export const getMoveProfile = (moveProfile) => ({
  destination_base_id: moveProfile?.destination_base_id || "",
  origin_region: moveProfile?.origin_region || "",
  move_month: moveProfile?.move_month || "",
  move_stage: moveProfile?.move_stage || "planning",
  housing_intent: moveProfile?.housing_intent || "",
  lodging_needed: Boolean(moveProfile?.lodging_needed),
  vehicle_shipment_needed: Boolean(moveProfile?.vehicle_shipment_needed),
  pets_flag: Boolean(moveProfile?.pets_flag),
  school_age_flag: Boolean(moveProfile?.school_age_flag),
  spouse_employment_flag: Boolean(moveProfile?.spouse_employment_flag),
});

export const getProviderLabel = (user) => {
  const provider = user?.app_metadata?.provider || "email";
  return provider === "google" ? "Google account" : "Email account";
};

export const upsertProfile = async ({ supabase, user }) => {
  const fullName = normalizeFullName(user?.user_metadata?.full_name || user?.user_metadata?.name || "");
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email || null,
      full_name: fullName || null,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
};

export const fetchProfile = async ({ supabase, userId }) => {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
};

export const saveProfile = async ({ supabase, user, profile, fullNameInput }) => {
  const fullName = normalizeFullName(fullNameInput);
  const authUpdate = await supabase.auth.updateUser({
    data: {
      full_name: fullName || null,
      name: fullName || null,
    },
  });

  if (authUpdate.error) {
    throw authUpdate.error;
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email || null,
      full_name: fullName || null,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }

  return {
    fullName,
    profile: {
      ...(profile || {}),
      id: user.id,
      email: user.email || null,
      full_name: fullName || null,
    },
    user: {
      ...user,
      user_metadata: {
        ...(user?.user_metadata || {}),
        full_name: fullName || null,
        name: fullName || null,
      },
    },
  };
};

export const savePrivacySettings = async ({
  supabase,
  user,
  profile,
  analyticsConsent,
  marketingConsent,
  dataSaleOptOut,
  householdSizeBucket,
}) => {
  const nextHouseholdProfile = {
    ...getHouseholdProfile(profile),
    household_size_bucket: householdSizeBucket || "",
  };

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email || null,
      full_name: getProfileFullName({ profile, user }) || null,
      analytics_consent: analyticsConsent,
      marketing_consent: marketingConsent,
      data_sale_opt_out: dataSaleOptOut,
      household_profile_coarse: nextHouseholdProfile,
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }

  return {
    ...(profile || {}),
    id: user.id,
    email: user.email || null,
    full_name: getProfileFullName({ profile, user }) || null,
    analytics_consent: analyticsConsent,
    marketing_consent: marketingConsent,
    data_sale_opt_out: dataSaleOptOut,
    household_profile_coarse: nextHouseholdProfile,
  };
};

export const fetchMoveProfile = async ({ supabase, userId }) => {
  const { data, error } = await supabase.from("moves").select("*").eq("user_id", userId).maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
};

export const saveMoveProfile = async ({ supabase, userId, moveProfileInput }) => {
  const payload = {
    user_id: userId,
    destination_base_id: moveProfileInput.destination_base_id || null,
    origin_region: moveProfileInput.origin_region || null,
    move_month: normalizeMonthInput(moveProfileInput.move_month),
    move_stage: moveProfileInput.move_stage || "planning",
    housing_intent: moveProfileInput.housing_intent || null,
    lodging_needed: coerceBoolean(moveProfileInput.lodging_needed),
    vehicle_shipment_needed: coerceBoolean(moveProfileInput.vehicle_shipment_needed),
    pets_flag: coerceBoolean(moveProfileInput.pets_flag),
    school_age_flag: coerceBoolean(moveProfileInput.school_age_flag),
    spouse_employment_flag: coerceBoolean(moveProfileInput.spouse_employment_flag),
  };

  const { data, error } = await supabase
    .from("moves")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data || null;
};

export const fetchCurrentUserLegalStatus = async ({ supabase }) => {
  const { data, error } = await supabase.rpc("get_current_user_legal_status");

  if (error) {
    throw error;
  }

  return data || [];
};

export const recordCurrentLegalAcceptance = async ({
  supabase,
  versionSnapshot,
  legalContext,
  userAgent,
  sessionId,
  acceptanceMethod,
  sourceFlow,
}) => {
  const { data, error } = await supabase.rpc("record_current_legal_acceptance", {
    accepted_terms_version: versionSnapshot.termsVersion,
    accepted_privacy_version: versionSnapshot.privacyVersion,
    acceptance_method: acceptanceMethod,
    source_flow: sourceFlow,
    ip_hash: legalContext.ipHash,
    ip_hash_method: legalContext.ipHashMethod,
    user_agent: legalContext.userAgent || userAgent || "",
    session_id: sessionId,
  });

  if (error) {
    throw error;
  }

  return data || null;
};
