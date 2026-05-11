import { getPriceList } from "@/lib/data";
import { DesktopView } from "@/components/PriceList/DesktopView";
import { MobileView } from "@/components/PriceList/MobileView";

export const revalidate = 60;

export default async function Page() {
  const { lines, settings } = await getPriceList();

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
      <DesktopView lines={lines} settings={settings} />
      <MobileView lines={lines} settings={settings} />
    </>
  );
}
