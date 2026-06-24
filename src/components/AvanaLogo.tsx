interface AvanaLogoProps {
  className?: string;
  style?: React.CSSProperties;
  size?: "hero" | "header" | "small";
}

export function AvanaLogo({ className = "", style, size = "hero" }: AvanaLogoProps) {
  const sizeStyles: Record<string, React.CSSProperties> = {
    hero: { width: "min(86vw, 1100px)" },
    header: { width: "140px" },
    small: { width: "100px" },
  };

  return (
    <div
      role="img"
      aria-label="AVANA Showroom"
      className={`avana-logo-gold ${className}`}
      style={{
        WebkitMaskImage: `url(/avana-logo.png)`,
        maskImage: `url(/avana-logo.png)`,
        ...sizeStyles[size],
        ...style,
      }}
    />
  );
}
