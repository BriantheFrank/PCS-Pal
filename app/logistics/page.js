import { LogisticsHeading, NativeLogisticsPage } from "@/components/logistics/native-logistics-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Move Logistics";
const description =
  "Use this page to map out your travel, lodging, arrival timing, and the first tasks you need to handle at your new duty station.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/logistics",
  noindex: true,
});

export default function LogisticsPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/logistics",
        })}
      />

      <SiteHeader topBar={<LandingTopBar active="organizer" />}>
        <p className="eyebrow">Logistics</p>
        <LogisticsHeading />
        <p className="subtitle">Track appointments, travel windows, and arrival milestones in one timeline.</p>
      </SiteHeader>

      <NativeLogisticsPage />



      <SiteFooter>
        <p className="footer-tip">
          Tip: Your logistics updates save automatically so you can come back to them later.
        </p>
        <p className="footer-disclaimer">
          This logistics planner is for coordination purposes only and does not replace official
          guidance from your transportation, housing, or command channels.
        </p>
      </SiteFooter>
    </>
  );
}
