const UttaramIcon = ({ size = 80 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="50" cy="50" r="48" fill="#24A0ED" />
    <circle cx="50" cy="50" r="48" stroke="#24A0ED" strokeWidth="2" />
    <text
      x="50"
      y="64"
      textAnchor="middle"
      fontFamily="'Noto Sans Devanagari','Nirmala UI','Devanagari Sangam MN',sans-serif"
      fontSize="42"
      fontWeight="500"
      fill="white"
    >
      ऊ
    </text>
  </svg>
);

export default UttaramIcon;
