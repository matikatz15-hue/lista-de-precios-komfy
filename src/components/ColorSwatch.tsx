// Las muestras toman el color DE LA WEB (pedido de Mati, 24-11-2026): la web
// pinta cada color con una textura PNG por nombre (malbec.png, manteca.png…)
// en esta carpeta fija del tema de Tienda Nube. Acá se usa la misma textura;
// si la web no tiene una para ese color, queda el hex guardado en la lista.
// Antes era solo el hex, y un color nuevo (Malbec) entraba en gris.
export const SWATCH_WEB =
  "https://d2az8otjr0j19j.cloudfront.net/templates/006/415/043/twig/static/images/swatches/";

// Mismo slug que usa la web (komfy-pdp-top.tpl → colorNameToSlug).
export function slugColor(nombre: string): string {
  return (nombre || "")
    .toLowerCase()
    .replace(/[áàäâã]/g, "a").replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i").replace(/[óòöôõ]/g, "o")
    .replace(/[úùüû]/g, "u").replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function capa(hex: string, nombre?: string): React.CSSProperties {
  const slug = nombre ? slugColor(nombre) : "";
  return {
    backgroundColor: hex,
    backgroundImage: slug ? `url('${SWATCH_WEB}${slug}.png')` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

type Props = {
  hex: string;
  hexSecondary?: string | null;
  // color_name de la lista: "Malbec" o "Negro mate - Roble Bardolino"
  name?: string | null;
  size?: number;
  className?: string;
};

export function ColorSwatch({ hex, hexSecondary, name, size = 11, className }: Props) {
  const [n1, n2] = (name ?? "").split(" - ").map((s) => s.trim());

  if (!hexSecondary) {
    return <span className={className} style={{ width: size, height: size, ...capa(hex, n1) }} aria-hidden />;
  }

  // Dos colores: mitad y mitad en diagonal, cada mitad con su textura.
  const mitad: React.CSSProperties = { position: "absolute", inset: 0, borderRadius: "inherit" };
  return (
    <span className={className} style={{ width: size, height: size, position: "relative", overflow: "hidden" }} aria-hidden>
      <span style={{ ...mitad, ...capa(hex, n1), clipPath: "polygon(0 0, 100% 0, 0 100%)" }} />
      <span style={{ ...mitad, ...capa(hexSecondary, n2), clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }} />
      <span style={{ ...mitad, boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.18)" }} />
    </span>
  );
}
