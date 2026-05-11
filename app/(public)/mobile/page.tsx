import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import MobileClient from "./MobileClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Komfy · Lista de Precios Mobile",
};

export default async function MobilePage() {
  const [lines, conditions, s] = await Promise.all([
    db.line.findMany({
      orderBy: { order: "asc" },
      include: {
        groups: {
          orderBy: { order: "asc" },
          include: { products: { orderBy: { order: "asc" } } },
        },
      },
    }),
    db.condition.findMany({ orderBy: { order: "asc" } }),
    getSettings(),
  ]);

  return <MobileClient lines={lines as never} conditions={conditions} settings={s} />;
}
