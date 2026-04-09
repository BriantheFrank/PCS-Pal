import Link from "next/link";

export function MetaSummary({ purpose, bestFor, startBy, nextStepLabel, nextStepHref }) {
  return (
    <section className="info-panel meta-summary" aria-label="How to use this page">
      <dl>
        <div>
          <dt>What this page helps with</dt>
          <dd>{purpose}</dd>
        </div>
        <div>
          <dt>Best for</dt>
          <dd>{bestFor}</dd>
        </div>
        <div>
          <dt>Start by</dt>
          <dd>{startBy}</dd>
        </div>
        <div>
          <dt>Next likely step</dt>
          <dd>
            <Link className="text-link" href={nextStepHref}>
              {nextStepLabel}
            </Link>
          </dd>
        </div>
      </dl>
    </section>
  );
}
