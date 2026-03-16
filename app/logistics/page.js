import { LOGISTICS_STORAGE_KEY } from "@/logistics-data";
import { LogisticsHeading, NativeLogisticsPage } from "@/components/logistics/native-logistics-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Move Logistics";
const description =
  "Coordinate travel dates, moving contacts, itinerary stops, and custom events in one protected logistics workspace.";

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
        <p className="eyebrow">Move Organizer</p>
        <LogisticsHeading />
        <p className="subtitle">
          Coordinate travel dates, moving contacts, itinerary stops, and custom events in one
          protected logistics workspace.
        </p>
      </SiteHeader>

      <NativeLogisticsPage />

      <SiteFooter>
        <p className="footer-tip">
          Tip: Logistics changes still save through the existing <code>{LOGISTICS_STORAGE_KEY}</code>{" "}
          browser storage key.
        </p>
        <p className="footer-disclaimer">
          This logistics planner is for coordination purposes only and does not replace official
          guidance from your transportation, housing, or command channels.
        </p>
      </SiteFooter>
    </>
  );
}
