type Props = {
  height?: number;
  /** Use navy text on a light pill background. When false, "Passport" renders white. */
  onLight?: boolean;
};

/** Stylised passport-stamp wordmark for the P2E aggregator brand.
 *  A gold circular "stamp" sits beside the wordmark "Passport2Earning",
 *  where the "2" is foil gold to read as a passport stamp / coin. */
const P2EStamp = ({ height }: { height: number }) => {
  return (
    <svg
      width={height}
      height={height}
      viewBox="0 0 40 40"
      role="img"
      aria-label="Passport stamp"
      style={{ flexShrink: 0 }}
    >
      <circle cx="20" cy="20" r="18" fill="#c8a14a" />
      <circle cx="20" cy="20" r="14" fill="none" stroke="#102a54" strokeWidth="1.2" />
      <text
        x="20"
        y="26"
        textAnchor="middle"
        fontFamily="serif"
        fontSize="20"
        fontWeight="800"
        fill="#102a54"
      >
        P2E
      </text>
    </svg>
  );
};

const P2EWordmark = ({ height = 32, onLight = false }: Props) => {
  const stampSize = Math.round(height * 0.95);
  return (
    <span className="inline-flex items-center gap-2" style={{ height }}>
      <P2EStamp height={stampSize} />
      <span
        className="font-nunito leading-none font-black tracking-tight"
        style={{ fontSize: height * 0.5 }}
      >
        <span style={{ color: onLight ? "#102a54" : "#ffffff" }}>Passport</span>
        <span style={{ color: "#c8a14a" }}>2</span>
        <span style={{ color: onLight ? "#102a54" : "#ffffff" }}>Earning</span>
      </span>
    </span>
  );
};

export default P2EWordmark;
