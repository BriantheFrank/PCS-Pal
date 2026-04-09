import Link from "next/link";

import { MetaSummary } from "@/components/site/meta-summary";

export function GuidedPageIntro({ purpose, bestFor, startBy, nextStepLabel, nextStepHref }) {
  return (
    <MetaSummary
      purpose={purpose}
      bestFor={bestFor}
      startBy={startBy}
      nextStepLabel={nextStepLabel}
      nextStepHref={nextStepHref}
    />
  );
}

export function PageStepNav({ previousLabel, previousHref, nextLabel, nextHref }) {
  return (
    <section className="info-panel page-step-nav" aria-label="Previous and next steps">
      <Link className="nav-card step-card" href={previousHref}>
        <p className="eyebrow">Previous step</p>
        <h3>{previousLabel}</h3>
        <span className="card-link">← Go to previous step</span>
      </Link>
      <Link className="nav-card step-card" href={nextHref}>
        <p className="eyebrow">Next step</p>
        <h3>{nextLabel}</h3>
        <span className="card-link">Go to next step →</span>
      </Link>
    </section>
  );
}
