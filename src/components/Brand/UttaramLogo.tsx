const UttaramLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 340 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="ऊttaram"
  >
    <line
      x1="0"
      y1="48"
      x2="330"
      y2="48"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <text
      fontFamily="'Noto Sans Devanagari','Nirmala UI','Devanagari Sangam MN',sans-serif"
      fontSize="44"
      fontWeight="500"
      x="0"
      y="72"
      fill="currentColor"
    >
      ऊ
    </text>
    <text
      fontFamily="'Montserrat',sans-serif"
      fontSize="44"
      fontWeight="500"
      x="52"
      y="72"
      fill="currentColor"
    >
      ttaram
    </text>
  </svg>
);

export default UttaramLogo;
