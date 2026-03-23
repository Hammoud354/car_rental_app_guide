type SvgProps = { style?: React.CSSProperties; className?: string };

const STROKE = "black";
const SW = 2.2;
const SW_THIN = 1.5;
const SW_THICK = 3;
const WIN_FILL = "#d8d8d8";

export function CarLeftSVG({ style, className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto", ...style }}
      className={className}
    >
      <rect width="300" height="100" fill="white" />

      <path
        d="M 22,72 C 20,72 16,70 14,67 L 14,62 L 52,56 L 55,50 L 78,40 L 90,24 L 98,20 L 202,20 L 210,24 L 222,40 L 245,50 L 248,56 L 286,62 L 286,67 C 284,70 280,72 278,72 L 244,72 Q 237,60 225,60 Q 213,60 206,72 L 94,72 Q 87,60 75,60 Q 63,60 56,72 Z"
        fill="white" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round"
      />

      <path
        d="M 90,24 L 78,56 L 148,56 L 150,20 Z"
        fill={WIN_FILL} stroke={STROKE} strokeWidth={SW_THIN}
      />
      <path
        d="M 210,24 L 152,20 L 152,56 L 222,56 Z"
        fill={WIN_FILL} stroke={STROKE} strokeWidth={SW_THIN}
      />

      <line x1="149" y1="20" x2="151" y2="56" stroke={STROKE} strokeWidth={SW_THICK} />

      <line x1="78" y1="56" x2="76" y2="72" stroke={STROKE} strokeWidth={SW_THIN} />
      <line x1="222" y1="56" x2="224" y2="72" stroke={STROKE} strokeWidth={SW_THIN} />

      <circle cx="75" cy="83" r="17" fill="white" stroke={STROKE} strokeWidth={SW} />
      <circle cx="75" cy="83" r="6"  fill="white" stroke={STROKE} strokeWidth={SW_THIN} />
      <circle cx="225" cy="83" r="17" fill="white" stroke={STROKE} strokeWidth={SW} />
      <circle cx="225" cy="83" r="6"  fill="white" stroke={STROKE} strokeWidth={SW_THIN} />

      <line x1="8" y1="97" x2="292" y2="97" stroke="#bbb" strokeWidth={0.6} strokeDasharray="4,4" />
    </svg>
  );
}

export function CarRightSVG({ style, className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto", ...style }}
      className={className}
    >
      <rect width="300" height="100" fill="white" />

      <g transform="scale(-1,1) translate(-300,0)">
        <path
          d="M 22,72 C 20,72 16,70 14,67 L 14,62 L 52,56 L 55,50 L 78,40 L 90,24 L 98,20 L 202,20 L 210,24 L 222,40 L 245,50 L 248,56 L 286,62 L 286,67 C 284,70 280,72 278,72 L 244,72 Q 237,60 225,60 Q 213,60 206,72 L 94,72 Q 87,60 75,60 Q 63,60 56,72 Z"
          fill="white" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round"
        />
        <path d="M 90,24 L 78,56 L 148,56 L 150,20 Z" fill={WIN_FILL} stroke={STROKE} strokeWidth={SW_THIN} />
        <path d="M 210,24 L 152,20 L 152,56 L 222,56 Z" fill={WIN_FILL} stroke={STROKE} strokeWidth={SW_THIN} />
        <line x1="149" y1="20" x2="151" y2="56" stroke={STROKE} strokeWidth={SW_THICK} />
        <line x1="78"  y1="56" x2="76"  y2="72" stroke={STROKE} strokeWidth={SW_THIN} />
        <line x1="222" y1="56" x2="224" y2="72" stroke={STROKE} strokeWidth={SW_THIN} />
        <circle cx="75"  cy="83" r="17" fill="white" stroke={STROKE} strokeWidth={SW} />
        <circle cx="75"  cy="83" r="6"  fill="white" stroke={STROKE} strokeWidth={SW_THIN} />
        <circle cx="225" cy="83" r="17" fill="white" stroke={STROKE} strokeWidth={SW} />
        <circle cx="225" cy="83" r="6"  fill="white" stroke={STROKE} strokeWidth={SW_THIN} />
      </g>

      <line x1="8" y1="97" x2="292" y2="97" stroke="#bbb" strokeWidth={0.6} strokeDasharray="4,4" />
    </svg>
  );
}

export function CarFrontSVG({ style, className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 200 150"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto", ...style }}
      className={className}
    >
      <rect width="200" height="150" fill="white" />

      <path
        d="M 16,108 C 14,108 12,106 12,104 L 12,96 L 22,88 L 178,88 L 188,96 L 188,104 C 188,106 186,108 184,108 Z"
        fill="white" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round"
      />

      <path
        d="M 22,88 L 30,60 L 40,42 L 160,42 L 170,60 L 178,88 Z"
        fill="white" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round"
      />

      <path
        d="M 44,86 L 52,60 L 58,44 L 142,44 L 148,60 L 156,86 Z"
        fill={WIN_FILL} stroke={STROKE} strokeWidth={SW_THIN}
      />

      <rect x="14"  y="70" width="32" height="20" rx="4" fill="white" stroke={STROKE} strokeWidth={SW_THIN} />
      <rect x="154" y="70" width="32" height="20" rx="4" fill="white" stroke={STROKE} strokeWidth={SW_THIN} />

      <rect x="58" y="94" width="84" height="12" rx="3" fill="white" stroke={STROKE} strokeWidth={SW_THIN} />

      <ellipse cx="12"  cy="130" rx="16" ry="14" fill="white" stroke={STROKE} strokeWidth={SW} />
      <ellipse cx="188" cy="130" rx="16" ry="14" fill="white" stroke={STROKE} strokeWidth={SW} />

      <path
        d="M 40,42 L 36,28 L 100,18 L 164,28 L 160,42"
        fill="white" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round"
      />
    </svg>
  );
}

export function CarRearSVG({ style, className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 200 150"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", width: "100%", height: "auto", ...style }}
      className={className}
    >
      <rect width="200" height="150" fill="white" />

      <path
        d="M 16,108 C 14,108 12,106 12,104 L 12,96 L 22,88 L 178,88 L 188,96 L 188,104 C 188,106 186,108 184,108 Z"
        fill="white" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round"
      />

      <path
        d="M 22,88 L 30,60 L 40,42 L 160,42 L 170,60 L 178,88 Z"
        fill="white" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round"
      />

      <path
        d="M 52,86 L 60,62 L 66,44 L 134,44 L 140,62 L 148,86 Z"
        fill={WIN_FILL} stroke={STROKE} strokeWidth={SW_THIN}
      />

      <rect x="12"  y="62" width="36" height="28" rx="4" fill="white" stroke={STROKE} strokeWidth={SW_THIN} />
      <rect x="152" y="62" width="36" height="28" rx="4" fill="white" stroke={STROKE} strokeWidth={SW_THIN} />

      <rect x="70" y="96" width="60" height="10" rx="2" fill="white" stroke={STROKE} strokeWidth={SW_THIN} />

      <ellipse cx="12"  cy="130" rx="16" ry="14" fill="white" stroke={STROKE} strokeWidth={SW} />
      <ellipse cx="188" cy="130" rx="16" ry="14" fill="white" stroke={STROKE} strokeWidth={SW} />

      <path
        d="M 40,42 L 36,28 L 100,18 L 164,28 L 160,42"
        fill="white" stroke={STROKE} strokeWidth={SW} strokeLinejoin="round"
      />
    </svg>
  );
}
