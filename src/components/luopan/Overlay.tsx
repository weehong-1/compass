import { memo } from "react";
import { R } from "./geometry";

const THREAD = "#d21f14";

/** 天心十道与天池玻璃反光：固定在木座上，不随盘面转动。 */
export const Overlay = memo(function Overlay() {
  return (
    <svg
      viewBox="-500 -500 1000 1000"
      className="pointer-events-none absolute inset-0 h-full w-full font-serif"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="glass" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      <circle r={R.pool} fill="url(#glass)" />

      {/* 白色衬线让红线压在墨黑的水山上也看得清 */}
      <g strokeLinecap="round">
        <path d="M0 -462V462M-488 0H488" stroke="rgba(255,250,235,0.55)" strokeWidth={6.5} />
        <path d="M0 -462V462M-488 0H488" stroke={THREAD} strokeWidth={2.8} />
      </g>

      <ThreadTab y={-479} label="向" />
      <ThreadTab y={479} label="坐" />
    </svg>
  );
});

function ThreadTab({ y, label }: { y: number; label: string }) {
  return (
    <g>
      <rect x={-26} y={y - 17} width={52} height={34} rx={8} fill={THREAD} />
      <text
        y={y}
        fill="#fff8ec"
        fontSize={25}
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {label}
      </text>
    </g>
  );
}
