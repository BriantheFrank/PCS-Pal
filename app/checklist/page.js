import { CHECKLIST_STORAGE_KEY } from "@/checklist-data";
import { ChecklistHeading, NativeChecklistPage } from "@/components/checklist/native-checklist-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { getLegacyChecklistMainHtml } from "@/lib/checklist/legacy-checklist-content";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "PCS Move Checklist";
const description =
  "Track spouse, family, and service-member PCS tasks in one protected checklist that keeps local progress and signed-in sync aligned.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/checklist",
  noindex: true,
});

export default function ChecklistPage() {
  const legacyChecklistHtml = getLegacyChecklistMainHtml();

  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/checklist",
        })}
      />

      <SiteHeader topBar={<LandingTopBar active="checklist" />}>
        <p className="eyebrow">U.S. Military PCS Toolkit</p>
        <ChecklistHeading />
        <p className="subtitle">
          A practical, offline-friendly checklist to guide each phase of your Permanent Change of
          Station move. A PCS is a military move to a new duty station.
        </p>
        <p className="subtitle">
          This checklist is organized to support military families first. The spouse and family
          checklist appears first, followed by tasks that must be completed by the service member.
        </p>
      </SiteHeader>

      <NativeChecklistPage legacyChecklistHtml={legacyChecklistHtml} />

      <SiteFooter>
        <p className="footer-tip">
          Tip: Your checklist progress still saves automatically using the existing{" "}
          <code>{CHECKLIST_STORAGE_KEY}</code> browser storage key.
        </p>
        <p className="footer-disclaimer">
          This checklist is for planning purposes only and does not replace official guidance from
          your unit, transportation office, or finance office.
        </p>
      </SiteFooter>
    </>
  );
}
