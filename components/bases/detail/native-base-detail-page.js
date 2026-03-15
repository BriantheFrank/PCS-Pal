"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useNativeAuth } from "@/components/auth/native-auth-provider";
import { SponsoredPlacementsSection } from "@/components/bases/detail/sponsored-placements";

const LOADING_MESSAGE = "Loading your destination base guide.";
const REDIRECT_MESSAGE = "Redirecting to sign in so you can open this base guide.";
const ERROR_MESSAGE = "This base guide is unavailable right now. Please try again in a moment.";

function BaseCard({ card }) {
  return (
    <article className="base-card">
      <h3>{card.title}</h3>
      {(card.paragraphs || []).map((paragraph) => (
        <p key={`${card.title}-${paragraph}`}>{paragraph}</p>
      ))}
      {card.listItems?.length ? (
        <ul className="base-units">
          {card.listItems.map((item) => (
            <li key={`${card.title}-${item}`}>{item}</li>
          ))}
        </ul>
      ) : null}
      {(card.links || []).map((link) => (
        <a
          className="card-link"
          href={link.href}
          key={`${card.title}-${link.label}`}
          target={link.openInNewTab ? "_blank" : undefined}
          rel={link.openInNewTab ? "noopener noreferrer" : undefined}
        >
          {link.label}
        </a>
      ))}
    </article>
  );
}

function DetailSection({ section }) {
  if (!section) {
    return null;
  }

  return (
    <section className="base-detail">
      <h2>{section.title}</h2>
      {section.intro ? <p className="base-enhancement-intro">{section.intro}</p> : null}
      <div className="base-grid">
        {section.cards.map((card) => (
          <BaseCard card={card} key={`${section.title}-${card.title}`} />
        ))}
      </div>
    </section>
  );
}

export function NativeBaseDetailPage({ pageData }) {
  const router = useRouter();
  const { status, user, errorMessage } = useNativeAuth();

  useEffect(() => {
    if (status === "ready" && !user) {
      router.replace(`/sign-in?next=${pageData.routePath}`);
    }
  }, [pageData.routePath, router, status, user]);

  if (status === "loading") {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">{pageData.installationName}</p>
          <h2>Loading your base guide</h2>
          <p className="signup-page-status" aria-live="polite">
            {LOADING_MESSAGE}
          </p>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">{pageData.installationName}</p>
          <h2>Base guide access is unavailable</h2>
          <p className="signup-page-status" data-tone="error" aria-live="polite">
            {errorMessage || ERROR_MESSAGE}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container">
        <div className="info-panel signup-page-card">
          <p className="eyebrow">{pageData.installationName}</p>
          <h2>Redirecting to sign in</h2>
          <p className="signup-page-status" aria-live="polite">
            {REDIRECT_MESSAGE}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <DetailSection section={pageData.arrivalSection} />
      <SponsoredPlacementsSection baseId={pageData.baseId} />
      <DetailSection section={pageData.helpfulStopsSection} />
      {pageData.staticSections.map((section) => (
        <DetailSection section={section} key={section.title} />
      ))}
      <a className="back-link" href={pageData.backLink.href}>
        {pageData.backLink.label}
      </a>
    </main>
  );
}
