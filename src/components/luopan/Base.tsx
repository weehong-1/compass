import { memo } from "react";

/** 方形木座：不随盘面转动。 */
export const Base = memo(function Base() {
  return (
    <svg viewBox="-500 -500 1000 1000" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9a6634" />
          <stop offset="35%" stopColor="#7c4b23" />
          <stop offset="65%" stopColor="#92602f" />
          <stop offset="100%" stopColor="#6a3f1c" />
        </linearGradient>
        <filter id="wood-grain" x="-500" y="-500" width="1000" height="1000" filterUnits="userSpaceOnUse">
          <feTurbulence type="fractalNoise" baseFrequency="0.0022 0.055" numOctaves={4} seed={11} />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.17  0 0 0 0 0.09  0 0 0 0 0.03  1.6 0 0 0 -0.62"
          />
        </filter>
        <clipPath id="base-clip">
          <rect x={-500} y={-500} width={1000} height={1000} rx={40} />
        </clipPath>
        <radialGradient id="rivet">
          <stop offset="0%" stopColor="#f1d68f" />
          <stop offset="100%" stopColor="#8a6424" />
        </radialGradient>
      </defs>

      <g clipPath="url(#base-clip)">
        <rect x={-500} y={-500} width={1000} height={1000} fill="url(#wood)" />
        <rect x={-500} y={-500} width={1000} height={1000} filter="url(#wood-grain)" />
      </g>
      <rect x={-492} y={-492} width={984} height={984} rx={34} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={4} />
      <rect x={-484} y={-484} width={968} height={968} rx={28} fill="none" stroke="rgba(255,228,180,0.22)" strokeWidth={3} />

      {/* 盘面嵌入木座的凹槽 */}
      <circle r={476} fill="rgba(30,16,6,0.55)" />
      <circle r={468} fill="#3a2410" />

      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sy]) => (
        <circle key={`${sx}${sy}`} cx={sx * 446} cy={sy * 446} r={11} fill="url(#rivet)" stroke="#4a3010" strokeWidth={2} />
      ))}
    </svg>
  );
});
