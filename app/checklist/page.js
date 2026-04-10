import { ChecklistHeading, NativeChecklistPage } from "@/components/checklist/native-checklist-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { getChecklistPageData } from "@/lib/checklist/page-data";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "PCS Checklist";
const description =
  "Use this practical PCS checklist to track what your family needs before, during, and after a military move.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/checklist",
  noindex: true,
});

export default function ChecklistPage() {
  const pageData = getChecklistPageData();

  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/checklist",
        })}
      />

      <SiteHeader topBar={<LandingTopBar active="pcs-checklist-guide" />}>
        <p className="eyebrow">Checklist</p>
        <ChecklistHeading />
        <p className="subtitle">Track required tasks by phase so you always know what to do next.</p>
      </SiteHeader>

      <NativeChecklistPage pageData={pageData} />

      <SiteFooter>
        <p className="footer-tip">
          Tip: Your checklist progress saves automatically to this device and your account when sync is available.
        </p>
        <p className="footer-disclaimer">
          This checklist is for planning purposes only and does not replace official guidance from
          your unit, transportation office, or finance office.
        </p>
      </SiteFooter>
    </>
  );
}
