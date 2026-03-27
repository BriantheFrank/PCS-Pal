import Link from "next/link";

export function GuidedPageIntro({ purpose, bestFor, startBy, nextStepLabel, nextStepHref }) {
  return (
    <section className="info-panel legal-page-section" aria-label="How to use this page">
      <p>
        <strong>What this page helps with:</strong> {purpose}
      </p>
      <p>
        <strong>Best for:</strong> {bestFor}
      </p>
      <p>
        <strong>Start by:</strong> {startBy}
      </p>
      <p>
        <strong>Next likely step:</strong>{" "}
        <Link className="text-link" href={nextStepHref}>
          {nextStepLabel}
        </Link>
      </p>
    </section>
  );
}

export function PageStepNav({ previousLabel, previousHref, nextLabel, nextHref }) {
  return (
    <section className="info-panel page-step-nav" aria-label="Previous and next steps">
      <Link className="nav-card" href={previousHref}>
        <p className="eyebrow">Previous step</p>
        <h3>{previousLabel}</h3>
        <span className="card-link">Go to previous step</span>
      </Link>
      <Link className="nav-card" href={nextHref}>
        <p className="eyebrow">Next step</p>
        <h3>{nextLabel}</h3>
        <span className="card-link">Go to next step</span>
      </Link>
    </section>
  );
}
