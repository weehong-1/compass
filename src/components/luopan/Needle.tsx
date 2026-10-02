import { memo } from "react";
import { CINNABAR } from "./palette";

/** 磁针：指北端朱红，另一端墨黑。 */
export const Needle = memo(function Needle() {
  return (
    <svg viewBox="-500 -500 1000 1000" className="block h-full w-full" aria-hidden="true">
      <defs>
        <filter id="needle-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx={3} dy={4} stdDeviation={3} floodColor="#000" floodOpacity={0.35} />
        </filter>
      </defs>
      <g filter="url(#needle-shadow)">
        <path d="M0 -72L8.5 0H-8.5Z" fill={CINNABAR} />
        <path d="M0 72L8.5 0H-8.5Z" fill="#1b1a18" />
        <circle r={9.5} fill="#c9a24a" stroke="#5a4318" strokeWidth={2} />
      </g>
    </svg>
  );
});
