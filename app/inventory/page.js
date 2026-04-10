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
        <p className="eyebrow">Inventory</p>
        <InventoryHeading />
        <p className="subtitle">Keep rooms, boxes, and labels organized so packing and claims are easier to manage.</p>
      </SiteHeader>

      <NativeInventoryPage />



      <SiteFooter>
        <p className="footer-tip">
          Tip: Your inventory updates save automatically so you can keep planning across sessions.
        </p>
      </SiteFooter>
    </>
  );
}
