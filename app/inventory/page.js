import { INVENTORY_STORAGE_KEY } from "@/inventory-data";
import { InventoryHeading, NativeInventoryPage } from "@/components/inventory/native-inventory-page";
import { JsonLd } from "@/components/seo/json-ld";
import { LandingTopBar, SiteFooter, SiteHeader } from "@/components/site/chrome";
import { buildPageMetadata } from "@/lib/metadata";
import { buildWebPageSchema } from "@/lib/structured-data";

const title = "Move Inventory";
const description =
  "Build a protected room-by-room inventory with box labels, high-value tracking, local persistence, and the existing PCS Pal inventory sync semantics.";

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
          Build a room-by-room inventory with boxes, item labels, and notes. Your data stays on this
          device and syncs to your account when cloud sync is available.
        </p>
      </SiteHeader>

      <NativeInventoryPage />

      <SiteFooter>
        <p className="footer-tip">
          Tip: Inventory changes still save through the existing <code>{INVENTORY_STORAGE_KEY}</code>{" "}
          browser storage key.
        </p>
        <p className="footer-disclaimer">
          This tool is for planning purposes only and does not replace official guidance from your
          transportation, housing, or command channels.
        </p>
      </SiteFooter>
    </>
  );
}
