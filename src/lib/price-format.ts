// Argentina number formatting helpers.
// Display:  1234567.89  →  "1.234.567,89"
// Live typing: any user input → progressively formatted string

export function formatAR(n: number) {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatInputAR(raw: string): string {
  let cleaned = raw.replace(/[^\d,]/g, "");
  const firstComma = cleaned.indexOf(",");
  if (firstComma !== -1) {
    cleaned =
      cleaned.slice(0, firstComma + 1) + cleaned.slice(firstComma + 1).replace(/,/g, "");
  }
  const [intPart = "", decPart] = cleaned.split(",");
  const intTrimmed = intPart.replace(/^0+(?=\d)/, "");
  const intFormatted = intTrimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (decPart !== undefined) {
    return `${intFormatted || "0"},${decPart.slice(0, 2)}`;
  }
  return intFormatted;
}

export function parseAR(formatted: string): number {
  if (!formatted) return NaN;
  const normalized = formatted.replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}
