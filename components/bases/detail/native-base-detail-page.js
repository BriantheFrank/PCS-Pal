"use client";

import Link from "next/link";

import { SponsoredPlacementsSection } from "@/components/bases/detail/sponsored-placements";

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
  return (
    <main className="container">
      <DetailSection section={pageData.arrivalSection} />
      <SponsoredPlacementsSection baseId={pageData.baseId} />
      <DetailSection section={pageData.helpfulStopsSection} />
      {pageData.staticSections.map((section) => (
        <DetailSection section={section} key={section.title} />
      ))}
      <section className="base-detail">
        <h2>Keep this base guide tied to the rest of your PCS plan</h2>
        <div className="base-grid">
          <Link className="base-card" href="/military-pcs-checklist">
            <h3>Military PCS checklist</h3>
            <p>Use the checklist guide to keep reporting, finance, and family tasks visible while you prepare for arrival.</p>
            <span className="card-link">Open checklist guide</span>
          </Link>
          <Link className="base-card" href="/pcs-move-logistics-planning">
            <h3>PCS logistics planning</h3>
            <p>Keep lodging, travel stops, and delivery details aligned with the destination base plan.</p>
            <span className="card-link">Open logistics planning</span>
          </Link>
        </div>
      </section>
      <Link className="back-link" href={pageData.backLink.href}>
        {pageData.backLink.label}
      </Link>
    </main>
  );
}
