import { headers } from "next/headers";
import { getPriceList } from "@/lib/data";
import { DesktopView } from "@/components/PriceList/DesktopView";
import { MobileView } from "@/components/PriceList/MobileView";
import { PublicHeader } from "@/components/PublicHeader";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ preview?: string }> };

const MOBILE_UA = /Mobile|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i;

export default async function Page({ searchParams }: Props) {
  const { preview } = await searchParams;
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? "";
  const isMobile = MOBILE_UA.test(userAgent);

  const { lines, settings, viewer } = await getPriceList({
    previewClientId: preview,
  });

  if (lines.length === 0) {
    return (
      <main style={{ padding: 40, fontFamily: "var(--font-noto), sans-serif" }}>
        <h1 style={{ color: "#0047BB", fontSize: 32 }}>Komfy · Lista de Precios</h1>
        <p style={{ marginTop: 16, color: "#6B6359" }}>
          Todavía no hay productos cargados. Ingresá al{" "}
          <a href="/admin" style={{ color: "#0047BB", fontWeight: 700 }}>
            panel admin
          </a>{" "}
          para empezar.
        </p>
      </main>
    );
  }

  return (
    <>
      <PublicHeader viewer={viewer} />
      {isMobile ? (
        <MobileView lines={lines} settings={settings} />
      ) : (
        <DesktopView lines={lines} settings={settings} />
      )}
    </>
  );
}
