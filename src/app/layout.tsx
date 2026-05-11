import type { Metadata } from "next";
import { Noto_Sans, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Komfy · Lista de Precios",
  description: "Catálogo mayorista de muebles Komfy. Precios netos, sin IVA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${notoSans.variable} ${barlowCondensed.variable}`}>{children}</body>
    </html>
  );
}
