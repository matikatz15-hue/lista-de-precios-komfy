export function SwatchDot({
  colorHex,
  colorHex2,
  size = 11,
}: {
  colorHex: string;
  colorHex2?: string | null;
  size?: number;
}) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: 999,
    flexShrink: 0,
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,.18), 0 1px 2px rgba(0,0,0,.08)",
    background: colorHex2
      ? `linear-gradient(135deg, ${colorHex} 0 50%, ${colorHex2} 50% 100%)`
      : colorHex,
  };
  return <span style={style} />;
}
