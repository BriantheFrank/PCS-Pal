import { InventoryHeading, NativeInventoryPage } from "@/components/inventory/native-inventory-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Move Inventory";
const description =
  "Use this page to keep track of what is being packed, how boxes are labeled, and which items may need better documentation for claims.";

export const metadata = buildPageMetadata({
  title,
  description,
  pathname: "/inventory",
  noindex: true,
});

export default function InventoryPage() {
  return (
    <>
      <JsonLd
        data={buildWebPageSchema({
          title,
          description,
          pathname: "/inventory",
        })}
      />

      <SiteHeader topBar={<LandingTopBar active="organizer" />}>
        <p className="eyebrow">Move Organizer</p>
        <InventoryHeading />
        <p className="subtitle">
          Use this page to keep track of what is being packed, how boxes are labeled, and which items
          may need better documentation for claims.
        </p>
        <p>Best for: Families trying to stay organized during pack-out, delivery, and unpacking.</p>
        <p>Start by: Adding one room, then list the items you would struggle most to replace first.</p>
      </SiteHeader>

      <NativeInventoryPage />

      <SiteFooter>
        <p className="footer-tip">
          Tip: Your inventory updates save automatically so you can keep planning across sessions.
        </p>
        <p className="footer-disclaimer">
          This tool is for planning purposes only and does not replace official guidance from your
          transportation, housing, or command channels.
        </p>
      </SiteFooter>
    </>
  );
}
