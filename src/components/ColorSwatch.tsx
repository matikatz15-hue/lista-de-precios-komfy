type Props = {
  hex: string;
  hexSecondary?: string | null;
  size?: number;
  className?: string;
};

export function ColorSwatch({ hex, hexSecondary, size = 11, className }: Props) {
  const style: React.CSSProperties = hexSecondary
    ? {
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${hex} 0 50%, ${hexSecondary} 50% 100%)`,
      }
    : { width: size, height: size, background: hex };

  return <span className={className} style={style} aria-hidden />;
}
