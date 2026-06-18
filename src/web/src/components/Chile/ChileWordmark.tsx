type Props = {
  height?: number;
  /** Use dark-blue text (for light backgrounds). When false, "Chile" renders white. */
  onLight?: boolean;
};

/** Inline Chile flag (2:3 ratio).
 *  Top-left quadrant: blue with white 5-pointed star; top-right: white;
 *  bottom half: full red. Always renders, unlike the 🇨🇱 emoji which
 *  Windows can't display. */
const ChileFlagSVG = ({ height }: { height: number }) => {
  const w = Math.round(height * 1.5);
  return (
    <svg
      width={w}
      height={height}
      viewBox="0 0 60 40"
      role="img"
      aria-label="Bandera de Chile"
      style={{
        flexShrink: 0,
        borderRadius: 2,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
      }}
    >
      {/* white background (top-right area) */}
      <rect width="60" height="20" fill="#ffffff" />
      {/* blue square in top-left */}
      <rect width="20" height="20" fill="#0033a0" />
      {/* red bottom half */}
      <rect y="20" width="60" height="20" fill="#da291c" />
      {/* white 5-pointed star, centered in the blue square */}
      <polygon
        fill="#ffffff"
        points="10,4 11.76,9.41 17.45,9.41 12.85,12.77 14.61,18.18 10,14.83 5.39,18.18 7.15,12.77 2.55,9.41 8.24,9.41"
      />
    </svg>
  );
};

const ChileWordmark = ({ height = 32, onLight = false }: Props) => {
  return (
    <span className="inline-flex items-center gap-2" style={{ height }}>
      <ChileFlagSVG height={Math.round(height * 0.72)} />
      <span
        className="font-nunito leading-none font-black tracking-tight"
        style={{ fontSize: height * 0.58 }}
      >
        <span style={{ color: onLight ? "#0033a0" : "#ffffff" }}>Chile</span>{" "}
        <span style={{ color: "#da291c" }}>Joven</span>
      </span>
    </span>
  );
};

export default ChileWordmark;
