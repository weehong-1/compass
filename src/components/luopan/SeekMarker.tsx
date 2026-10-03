import { memo } from "react";
import { R, sectorPath } from "./geometry";
import { SEEK_BLUE } from "./palette";

const HALO = "rgba(255,250,235,0.85)";

/** 寻方的目标：框出该方位在八方层的一格，并从天池到盘外画一条指向它中线的箭头。随盘面转动。 */
export const SeekMarker = memo(function SeekMarker({ center }: { center: number }) {
  const shaft = `M0 ${-R.poolRim}V${-R.dialRim}`;
  return (
    <svg
      viewBox="-500 -500 1000 1000"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <g transform={`rotate(${center})`}>
        <path
          d={sectorPath(R.trigramOuter, R.directionOuter, -22.5, 22.5)}
          fill="none"
          stroke={SEEK_BLUE}
          strokeWidth={7}
        />
        <path d={shaft} stroke={HALO} strokeWidth={12} strokeLinecap="round" />
        <path d={shaft} stroke={SEEK_BLUE} strokeWidth={6} strokeLinecap="round" />
        <path d="M0 -498L-22 -462H22Z" fill={SEEK_BLUE} stroke={HALO} strokeWidth={4} strokeLinejoin="round" />
      </g>
    </svg>
  );
});
