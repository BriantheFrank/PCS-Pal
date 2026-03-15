"use client";

import { useEffect, useMemo, useState } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import {
  formatMonthForInput,
  getBaseName,
  getDomainFromUrl,
  getPlacementDisclosure,
  getServiceCategoryLabel,
  normalizeMonthInput,
  sanitizeOutboundUrl,
} from "@/pcs-reference-data";

const PARTNER_INTRO_COPY =
  "These partner placements are clearly labeled, base-aware when configured, and only generate a lead when you explicitly request one.";

const sanitizeMetadata = (metadata) =>
  Object.fromEntries(
    Object.entries(metadata || {}).filter(([, value]) => value !== null && value !== undefined && value !== "")
  );

const canTrackAnalytics = (profile) => Boolean(profile?.analytics_consent);

const loadPartnerPlacements = async ({ supabase, baseId }) => {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("partner_placements")
    .select(
      "id, base_id, service_category, placement_kind, placement_label, cta_label, priority, active, starts_at, ends_at, partner:partners!inner(id, display_name, partner_category, referral_url, website_url, disclosure_label, lead_enabled, active)"
    )
    .eq("active", true)
    .lte("starts_at", nowIso)
    .or(`base_id.eq.${baseId},base_id.is.null`)
    .order("priority", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).filter((placement) => {
    if (!placement?.partner?.active) {
      return false;
    }
    if (!placement.ends_at) {
      return true;
    }
    return new Date(placement.ends_at).getTime() >= Date.now();
  });
};

const insertEvent = async ({ supabase, eventType, baseId, serviceCategory, metadata }) => {
  const { error } = await supabase.from("events").insert({
    event_type: eventType,
    base_id: baseId || null,
    service_category: serviceCategory || null,
    metadata_jsonb: sanitizeMetadata(metadata),
  });

  if (error) {
    console.warn("Unable to log native base event.", error);
  }
};

const insertResourceClick = async ({ supabase, baseId, category, partnerId, targetUrl }) => {
  const { error } = await supabase.from("resource_clicks").insert({
    base_id: baseId || null,
    category: category || null,
    partner_id: partnerId || null,
    target_url: sanitizeOutboundUrl(targetUrl) || null,
  });

  if (error) {
    console.warn("Unable to log native base resource click.", error);
  }
};

function PartnerLeadForm({ placement, baseId, defaultEmail, defaultMoveMonth, onSubmitted }) {
  const { user, moveProfile } = useNativeAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [moveMonth, setMoveMonth] = useState(defaultMoveMonth);
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState({
    message:
      "Only the minimum contact and coarse move details are sent when you request an intro.",
    tone: "neutral",
  });

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail]);

  useEffect(() => {
    setMoveMonth(defaultMoveMonth);
  }, [defaultMoveMonth]);

  if (!placement?.partner?.lead_enabled) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user) {
      setStatus({
        message: "Sign in before requesting a vetted intro.",
        tone: "error",
      });
      return;
    }

    setStatus({
      message: "Submitting request...",
      tone: "neutral",
    });

    try {
      const supabase = await getBrowserSupabaseClient();
      const payload = sanitizeMetadata({
        contact_email: email.trim(),
        preferred_contact_method: "email",
        destination_base_id: baseId || moveProfile?.destination_base_id,
        move_month: normalizeMonthInput(moveMonth || moveProfile?.move_month),
        service_category: placement.service_category || placement.partner.partner_category || "",
        housing_intent: moveProfile?.housing_intent || "",
        lodging_needed: moveProfile?.lodging_needed || null,
        vehicle_shipment_needed: moveProfile?.vehicle_shipment_needed || null,
        pets_flag: moveProfile?.pets_flag || null,
        school_age_flag: moveProfile?.school_age_flag || null,
        spouse_employment_flag: moveProfile?.spouse_employment_flag || null,
      });

      const { error } = await supabase.from("partner_leads").insert({
        user_id: user.id,
        partner_id: placement.partner.id,
        consent_timestamp: new Date().toISOString(),
        lead_payload_minimized: payload,
      });

      if (error) {
        throw error;
      }

      await insertEvent({
        supabase,
        eventType: "partner_intro_requested",
        baseId,
        serviceCategory: placement.service_category || placement.partner.partner_category || "",
        metadata: {
          partner_id: placement.partner.id,
          placement_kind: placement.placement_kind,
          content_category: "partner_placement",
        },
      });

      setStatus({
        message:
          "Intro request submitted. PCS Pal only stores the minimum lead details needed for this handoff.",
        tone: "success",
      });
      setConsent(false);
      onSubmitted?.();
    } catch (error) {
      console.error("Unable to submit native partner lead.", error);
      setStatus({
        message:
          error?.message || "Unable to submit this request right now. Your planner data is unchanged.",
        tone: "error",
      });
    }
  };

  return (
    <details className="partner-lead-details">
      <summary>Request a vetted intro</summary>
      <form className="partner-lead-form" onSubmit={handleSubmit}>
        <label>
          Best email
          <input
            type="email"
            name="contact_email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Move month (optional)
          <input
            type="month"
            name="move_month"
            value={moveMonth}
            onChange={(event) => setMoveMonth(event.target.value)}
          />
        </label>
        <label className="account-checkbox account-checkbox--single">
          <input
            type="checkbox"
            name="lead_consent"
            required
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
          />
          <span>{`I want PCS Pal to share this request with ${placement.partner.display_name}.`}</span>
        </label>
        <p className="partner-lead-status" data-tone={status.tone}>
          {status.message}
        </p>
        <button type="submit">Submit intro request</button>
      </form>
    </details>
  );
}

function PartnerPlacementCard({ placement, baseId }) {
  const { user, profile, moveProfile } = useNativeAuth();
  const defaultEmail = user?.email || profile?.email || "";
  const defaultMoveMonth = formatMonthForInput(moveProfile?.move_month);

  const handleOutboundClick = async () => {
    if (!user || !canTrackAnalytics(profile)) {
      return;
    }

    const supabase = await getBrowserSupabaseClient();
    const targetUrl = placement.partner.referral_url || placement.partner.website_url || "";

    void insertResourceClick({
      supabase,
      baseId,
      category: placement.service_category || placement.partner.partner_category || "",
      partnerId: placement.partner.id,
      targetUrl,
    });

    void insertEvent({
      supabase,
      eventType: "partner_referral_clicked",
      baseId,
      serviceCategory: placement.service_category || placement.partner.partner_category || "",
      metadata: {
        page_slug: `base-${baseId}`,
        content_category: "partner_placement",
        resource_kind: "partner",
        link_label: `${placement.partner.display_name} ${placement.cta_label || "Visit partner"}`.slice(
          0,
          120
        ),
        target_domain: getDomainFromUrl(targetUrl),
        placement_kind: placement.placement_kind,
        partner_id: placement.partner.id,
      },
    });
  };

  return (
    <article className="base-card partner-placement-card">
      <span className="placement-badge">
        {placement.placement_label || getPlacementDisclosure(placement.placement_kind)}
      </span>
      <h3>{placement.partner.display_name}</h3>
      <p className="base-resource-copy">
        {`${placement.partner.disclosure_label || getPlacementDisclosure(placement.placement_kind)} for ${getBaseName(
          baseId
        )} families looking for ${getServiceCategoryLabel(
          placement.service_category || placement.partner.partner_category
        ).toLowerCase()}.`}
      </p>
      <p className="partner-card-disclosure">
        Partner cards are clearly labeled and separate from neutral installation resources.
      </p>
      <div className="base-link-stack">
        <a
          className="card-link"
          href={placement.partner.referral_url || placement.partner.website_url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            void handleOutboundClick();
          }}
        >
          {placement.cta_label || "Visit partner"}
        </a>
        <PartnerLeadForm
          placement={placement}
          baseId={baseId}
          defaultEmail={defaultEmail}
          defaultMoveMonth={defaultMoveMonth}
        />
      </div>
    </article>
  );
}

export function SponsoredPlacementsSection({ baseId }) {
  const { user, profile } = useNativeAuth();
  const [placements, setPlacements] = useState([]);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      if (!user || !baseId) {
        if (active) {
          setPlacements([]);
        }
        return;
      }

      try {
        const supabase = await getBrowserSupabaseClient();
        const nextPlacements = await loadPartnerPlacements({ supabase, baseId });
        if (!active) {
          return;
        }

        setPlacements(nextPlacements);

        if (canTrackAnalytics(profile)) {
          nextPlacements.forEach((placement) => {
            void insertEvent({
              supabase,
              eventType: "partner_placement_viewed",
              baseId,
              serviceCategory: placement.service_category || placement.partner.partner_category || "",
              metadata: {
                partner_id: placement.partner.id,
                placement_kind: placement.placement_kind,
                content_category: "partner_placement",
              },
            });
          });
        }
      } catch (error) {
        console.warn("Unable to load native partner placements.", error);
        if (active) {
          setPlacements([]);
        }
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, [baseId, profile, user]);

  const visiblePlacements = useMemo(() => placements.filter(Boolean), [placements]);

  if (!visiblePlacements.length) {
    return null;
  }

  return (
    <section className="base-detail base-enhancement-section base-sponsored-section" data-base-id={baseId}>
      <h2>Sponsored PCS Services</h2>
      <p className="base-enhancement-intro">{PARTNER_INTRO_COPY}</p>
      <div className="base-grid">
        {visiblePlacements.map((placement) => (
          <PartnerPlacementCard key={placement.id} placement={placement} baseId={baseId} />
        ))}
      </div>
    </section>
  );
}
