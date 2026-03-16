"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";
import { resolveLegalDocumentHref } from "@/lib/auth/create-account";
import { LEGAL_DOC_TYPES } from "@/legal-documents";
import {
  BASE_OPTIONS,
  HOUSEHOLD_SIZE_OPTIONS,
  HOUSING_INTENT_OPTIONS,
  MOVE_STAGE_OPTIONS,
  ORIGIN_REGION_OPTIONS,
  formatMonthForInput,
} from "@/pcs-reference-data";

const buildMoveProfileState = (moveProfile) => ({
  destination_base_id: moveProfile?.destination_base_id || "",
  origin_region: moveProfile?.origin_region || "",
  move_month: formatMonthForInput(moveProfile?.move_month),
  move_stage: moveProfile?.move_stage || "planning",
  housing_intent: moveProfile?.housing_intent || "",
  lodging_needed: Boolean(moveProfile?.lodging_needed),
  vehicle_shipment_needed: Boolean(moveProfile?.vehicle_shipment_needed),
  pets_flag: Boolean(moveProfile?.pets_flag),
  school_age_flag: Boolean(moveProfile?.school_age_flag),
  spouse_employment_flag: Boolean(moveProfile?.spouse_employment_flag),
});

const initialStatus = {
  message: "",
  tone: "neutral",
};

export function AccountSettingsPage() {
  const router = useRouter();
  const {
    status,
    user,
    profile,
    moveProfile,
    legalStatus,
    legalDocs,
    legalDocsAuthoritative,
    displayName,
    providerLabel,
    profileFullName,
    householdProfile,
    errorMessage,
    saveProfile,
    savePrivacySettings,
    saveMoveProfile,
    saveCurrentLegalAcceptance,
  } = useNativeAuth();
  const [identityName, setIdentityName] = useState("");
  const [privacyState, setPrivacyState] = useState({
    analyticsConsent: false,
    marketingConsent: false,
    dataSaleOptOut: true,
    householdSizeBucket: "",
  });
  const [moveState, setMoveState] = useState(buildMoveProfileState(null));
  const [legalChecked, setLegalChecked] = useState(false);
  const [identityStatus, setIdentityStatus] = useState(initialStatus);
  const [privacyStatus, setPrivacyStatus] = useState(initialStatus);
  const [moveStatus, setMoveStatus] = useState(initialStatus);
  const [legalUiStatus, setLegalUiStatus] = useState(initialStatus);

  useEffect(() => {
    if (status === "ready" && !user) {
      router.replace("/sign-in?next=/account");
    }
  }, [router, status, user]);

  useEffect(() => {
    setIdentityName(profileFullName);
  }, [profileFullName]);

  useEffect(() => {
    setPrivacyState({
      analyticsConsent: Boolean(profile?.analytics_consent),
      marketingConsent: Boolean(profile?.marketing_consent),
      dataSaleOptOut: profile?.data_sale_opt_out !== false,
      householdSizeBucket: householdProfile.household_size_bucket || "",
    });
  }, [householdProfile.household_size_bucket, profile]);

  useEffect(() => {
    setMoveState(buildMoveProfileState(moveProfile));
  }, [moveProfile]);

  const needsReacceptance = legalStatus.some((row) => row.needs_reacceptance);
  const hasLegalStatusRows = legalStatus.length > 0;
  const termsHref = useMemo(
    () => resolveLegalDocumentHref(LEGAL_DOC_TYPES.terms, legalDocs),
    [legalDocs]
  );
  const privacyHref = useMemo(
    () => resolveLegalDocumentHref(LEGAL_DOC_TYPES.privacy, legalDocs),
    [legalDocs]
  );

  if (status === "loading") {
    return (
      <div className="info-panel signup-page-card">
        <p className="eyebrow">Account</p>
        <h2>Loading your account settings</h2>
        <p className="signup-page-status" aria-live="polite">
          Checking your session and loading the latest account details.
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="info-panel signup-page-card">
        <p className="eyebrow">Account</p>
        <h2>Redirecting to sign in</h2>
        <p className="signup-page-status" aria-live="polite">
          You need to sign in before viewing account settings.
        </p>
      </div>
    );
  }

  const handleIdentitySubmit = async (event) => {
    event.preventDefault();
    setIdentityStatus({
      message: "Saving account details...",
      tone: "neutral",
    });

    try {
      await saveProfile(identityName);
      setIdentityStatus({
        message: "Account details updated.",
        tone: "success",
      });
    } catch (error) {
      setIdentityStatus({
        message: error.message || "Unable to update account details.",
        tone: "error",
      });
    }
  };

  const handlePrivacySubmit = async (event) => {
    event.preventDefault();
    setPrivacyStatus({
      message: "Saving privacy settings...",
      tone: "neutral",
    });

    try {
      await savePrivacySettings(privacyState);
      setPrivacyStatus({
        message: "Privacy settings updated.",
        tone: "success",
      });
    } catch (error) {
      setPrivacyStatus({
        message: error.message || "Unable to update privacy settings.",
        tone: "error",
      });
    }
  };

  const handleMoveSubmit = async (event) => {
    event.preventDefault();
    setMoveStatus({
      message: "Saving move profile...",
      tone: "neutral",
    });

    try {
      await saveMoveProfile(moveState);
      setMoveStatus({
        message: "Move profile updated.",
        tone: "success",
      });
    } catch (error) {
      setMoveStatus({
        message: error.message || "Unable to update the move profile right now.",
        tone: "error",
      });
    }
  };

  const handleLegalSave = async () => {
    if (!legalChecked) {
      setLegalUiStatus({
        message:
          "Please agree to the current Terms of Use and acknowledge the current Privacy Policy before saving.",
        tone: "error",
      });
      return;
    }

    setLegalUiStatus({
      message: "Saving legal acknowledgment...",
      tone: "neutral",
    });

    try {
      await saveCurrentLegalAcceptance();
      setLegalChecked(false);
      setLegalUiStatus({
        message: "Current legal acknowledgment saved.",
        tone: "success",
      });
    } catch (error) {
      setLegalUiStatus({
        message: error.message || "Unable to save the current legal acknowledgment right now.",
        tone: "error",
      });
    }
  };

  return (
    <div className="account-page-layout">
      <section className="info-panel signup-page-card account-page-column">
        <p className="eyebrow">Account</p>
        <h2>Account settings and move profile</h2>
        <p>
          These settings are tied to your signed-in PCS Pal account and support cross-device
          continuity across the migrated native planning tools.
        </p>
        {errorMessage ? (
          <p className="signup-page-status" data-tone="error" aria-live="polite">
            {errorMessage}
          </p>
        ) : null}

        <section className="account-summary">
          <h3>Account summary</h3>
          <dl className="account-meta">
            <div>
              <dt>Name</dt>
              <dd>{displayName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email || ""}</dd>
            </div>
            <div>
              <dt>Access</dt>
              <dd>{providerLabel}</dd>
            </div>
          </dl>
        </section>

        <section className="account-settings-block">
          <h3>Identity</h3>
          <p className="account-copy">Keep your name current across the native shell and legacy tools.</p>
          <p className="legal-settings-status" data-tone={identityStatus.tone} aria-live="polite">
            {identityStatus.message}
          </p>
          <form className="profile-form" onSubmit={handleIdentitySubmit}>
            <label>
              Full name
              <input
                type="text"
                name="full_name"
                autoComplete="name"
                value={identityName}
                onChange={(event) => setIdentityName(event.target.value)}
                required
              />
            </label>
            <button type="submit">Save account details</button>
          </form>
        </section>

        <section className="account-settings-block">
          <h3>Privacy Settings</h3>
          <p className="account-copy">
            Control analytics, partner updates, and the coarse household detail PCS Pal uses for planning.
          </p>
          <p className="legal-settings-status" data-tone={privacyStatus.tone} aria-live="polite">
            {privacyStatus.message}
          </p>
          <form className="profile-form preference-form" onSubmit={handlePrivacySubmit}>
            <div className="account-checkbox-grid">
              <label className="account-checkbox">
                <input
                  type="checkbox"
                  checked={privacyState.analyticsConsent}
                  onChange={(event) =>
                    setPrivacyState((current) => ({
                      ...current,
                      analyticsConsent: event.target.checked,
                    }))
                  }
                />
                <span>Allow analytics for product improvement</span>
              </label>
              <label className="account-checkbox">
                <input
                  type="checkbox"
                  checked={privacyState.marketingConsent}
                  onChange={(event) =>
                    setPrivacyState((current) => ({
                      ...current,
                      marketingConsent: event.target.checked,
                    }))
                  }
                />
                <span>Allow occasional PCS Pal updates and partner offers</span>
              </label>
              <label className="account-checkbox">
                <input
                  type="checkbox"
                  checked={privacyState.dataSaleOptOut}
                  onChange={(event) =>
                    setPrivacyState((current) => ({
                      ...current,
                      dataSaleOptOut: event.target.checked,
                    }))
                  }
                />
                <span>Keep my coarse profile out of any future data-sale programs</span>
              </label>
            </div>
            <label>
              Household size
              <select
                value={privacyState.householdSizeBucket}
                onChange={(event) =>
                  setPrivacyState((current) => ({
                    ...current,
                    householdSizeBucket: event.target.value,
                  }))
                }
              >
                <option value="">Choose a household size</option>
                {HOUSEHOLD_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Save privacy settings</button>
          </form>
        </section>

        <section className="account-settings-block">
          <h3>Legal and Compliance</h3>
          <p className="account-copy">
            Review the current documents and the acceptance history currently tied to this account.
          </p>
          <div className="legal-link-row">
            <Link className="legal-link-pill" href={termsHref}>
              Terms of Use
            </Link>
            <Link className="legal-link-pill" href={privacyHref}>
              Privacy Policy
            </Link>
          </div>
          <p className="legal-settings-status" data-tone={legalUiStatus.tone} aria-live="polite">
            {legalUiStatus.message ||
              (!legalDocsAuthoritative
                ? "Current legal versions are not fully configured right now."
                : !hasLegalStatusRows
                  ? "Current legal versions are available above. Acceptance history will appear after the legal migration is applied and data is available."
                  : needsReacceptance
                    ? "This account does not yet have a recorded acknowledgment for the current legal versions."
                    : "This account has a recorded acknowledgment for the current Terms of Use and Privacy Policy."
              )}
          </p>
          {hasLegalStatusRows ? (
            <div className="legal-acceptance-list">
              {legalStatus.map((row) => (
                <article className="legal-acceptance-item" key={row.doc_type}>
                  <h4>{row.title || "Legal Document"}</h4>
                  <dl className="account-meta legal-acceptance-meta">
                    <div>
                      <dt>Current version</dt>
                      <dd>{row.current_version || "Not set"}</dd>
                    </div>
                    <div>
                      <dt>Accepted version</dt>
                      <dd>{row.accepted_version || "No acceptance recorded for this account yet"}</dd>
                    </div>
                    <div>
                      <dt>Accepted on</dt>
                      <dd>{row.accepted_at ? new Date(row.accepted_at).toLocaleDateString("en-US") : "Not recorded"}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          ) : null}
          {hasLegalStatusRows && needsReacceptance ? (
            <>
              <label className="account-checkbox legal-reacceptance-control">
                <input
                  type="checkbox"
                  checked={legalChecked}
                  onChange={(event) => setLegalChecked(event.target.checked)}
                />
                <span>
                  I agree to the current <Link href={termsHref}>Terms of Use</Link> and acknowledge
                  the current <Link href={privacyHref}>Privacy Policy</Link>.
                </span>
              </label>
              <button type="button" className="legal-acknowledge-button" onClick={handleLegalSave}>
                Save current legal acknowledgment
              </button>
            </>
          ) : null}
        </section>

        <section className="account-settings-block">
          <h3>Move Profile</h3>
          <p className="account-copy">
            Save only the coarse move details needed for planning, partner referrals, and aggregate trend reporting.
          </p>
          <p className="legal-settings-status" data-tone={moveStatus.tone} aria-live="polite">
            {moveStatus.message}
          </p>
          <form className="profile-form move-profile-form" onSubmit={handleMoveSubmit}>
            <label>
              Destination base
              <select
                value={moveState.destination_base_id}
                onChange={(event) =>
                  setMoveState((current) => ({
                    ...current,
                    destination_base_id: event.target.value,
                  }))
                }
              >
                <option value="">Not sure yet</option>
                {BASE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Origin region
              <select
                value={moveState.origin_region}
                onChange={(event) =>
                  setMoveState((current) => ({
                    ...current,
                    origin_region: event.target.value,
                  }))
                }
              >
                <option value="">Choose a region</option>
                {ORIGIN_REGION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Move month
              <input
                type="month"
                value={moveState.move_month}
                onChange={(event) =>
                  setMoveState((current) => ({
                    ...current,
                    move_month: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              Current move stage
              <select
                value={moveState.move_stage}
                onChange={(event) =>
                  setMoveState((current) => ({
                    ...current,
                    move_stage: event.target.value,
                  }))
                }
              >
                <option value="">Choose the current stage</option>
                {MOVE_STAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Housing plan
              <select
                value={moveState.housing_intent}
                onChange={(event) =>
                  setMoveState((current) => ({
                    ...current,
                    housing_intent: event.target.value,
                  }))
                }
              >
                <option value="">Choose a housing plan</option>
                {HOUSING_INTENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="account-checkbox-grid">
              {[
                ["lodging_needed", "Temporary lodging likely needed"],
                ["vehicle_shipment_needed", "Vehicle shipment likely needed"],
                ["pets_flag", "Moving with pets"],
                ["school_age_flag", "School-age children in household"],
                ["spouse_employment_flag", "Spouse employment support may be needed"],
              ].map(([field, label]) => (
                <label className="account-checkbox" key={field}>
                  <input
                    type="checkbox"
                    checked={Boolean(moveState[field])}
                    onChange={(event) =>
                      setMoveState((current) => ({
                        ...current,
                        [field]: event.target.checked,
                      }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <button type="submit">Save move profile</button>
          </form>
        </section>
      </section>

      <aside className="info-panel signup-page-card account-page-side">
        <p className="eyebrow">Native Account Ownership</p>
        <h2>These settings now live on the Next side of the migration</h2>
        <p>
          Sign-in, logout, account settings, privacy controls, move profile, and legal acknowledgment
          now render natively on migrated pages. The checklist, organizer, inventory, logistics, and
          destination bases all run through the native Next.js side of the migration.
        </p>
        <ul className="signup-page-list">
          <li>
            Continue to the native <a href="/checklist">PCS Checklist</a> with your current session
          </li>
          <li>
            Open the native <a href="/inventory">Move Inventory</a>,{" "}
            <a href="/logistics">Move Logistics</a>, or <a href="/organizer">Move Organizer</a> to continue planning
          </li>
          <li>
            Review <a href="/bases">Destination Bases</a> after saving coarse move preferences here
          </li>
        </ul>
      </aside>
    </div>
  );
}




