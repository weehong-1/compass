import { memo } from "react";
import { MOUNTAINS, neighborMountain } from "@/domain/mountains";
import { DIRECTIONS, PALACES } from "@/domain/trigrams";
import { R, polar, sectorPath } from "./geometry";
import { CINNABAR, ELEMENT_FILL, INK } from "./palette";

/** 盘面：由内到外为天池、后天八卦层、八方层、二十四山层、刻度层。内容固定，转动由外层的 CSS transform 负责。 */
export const Dial = memo(function Dial() {
  return (
    <svg viewBox="-500 -500 1000 1000" className="block h-full w-full font-serif" aria-hidden="true">
      <defs>
        <radialGradient id="dial-face">
          <stop offset="0%" stopColor="#f6e7bf" />
          <stop offset="70%" stopColor="#ecd296" />
          <stop offset="100%" stopColor="#dcb871" />
        </radialGradient>
        <linearGradient id="dial-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c19a52" />
          <stop offset="50%" stopColor="#7a5524" />
          <stop offset="100%" stopColor="#b38a43" />
        </linearGradient>
        <radialGradient id="pool-floor">
          <stop offset="0%" stopColor="#fbf7ee" />
          <stop offset="85%" stopColor="#efe6d1" />
          <stop offset="100%" stopColor="#d8c9a6" />
        </radialGradient>
      </defs>

      <circle r={R.dialRim} fill="url(#dial-rim)" />
      <circle r={R.scaleOuter} fill="url(#dial-face)" />

      <ScaleRing />
      <MountainRing />
      <DirectionRing />
      <TrigramRing />
      <Pool />

      <g fill="none" stroke={INK} strokeWidth={2.5}>
        {[R.poolRim, R.trigramOuter, R.directionOuter, R.mountainOuter, R.scaleOuter].map((r) => (
          <circle key={r} r={r} />
        ))}
      </g>
    </svg>
  );
});

function radialLine(r0: number, r1: number, deg: number): string {
  const [x0, y0] = polar(r0, deg);
  const [x1, y1] = polar(r1, deg);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}L${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/** 360° 刻度：每 1° 短线、5° 中线、10° 长线并标数字。 */
function ScaleRing() {
  const ticks = { short: "", mid: "", long: "" };
  for (let d = 0; d < 360; d++) {
    if (d % 10 === 0) ticks.long += radialLine(R.scaleOuter - 26, R.scaleOuter, d);
    else if (d % 5 === 0) ticks.mid += radialLine(R.scaleOuter - 17, R.scaleOuter, d);
    else ticks.short += radialLine(R.scaleOuter - 9, R.scaleOuter, d);
  }
  return (
    <g>
      <path d={sectorPath(R.mountainOuter, R.scaleOuter, 0, 359.99)} fill="#f3e6c2" />
      <g stroke={INK} fill="none">
        <path d={ticks.short} strokeWidth={1.4} />
        <path d={ticks.mid} strokeWidth={2} />
        <path d={ticks.long} strokeWidth={2.6} />
      </g>
      <g fontSize={24} fontWeight={600} textAnchor="middle" dominantBaseline="central">
        {Array.from({ length: 36 }, (_, i) => i * 10).map((d) => (
          <text
            key={d}
            transform={`rotate(${d})`}
            y={-(R.mountainOuter + 22)}
            fill={d % 90 === 0 ? CINNABAR : INK}
          >
            {d}
          </text>
        ))}
      </g>
    </g>
  );
}

/** 二十四山：按五行填色，地支下注生肖，宫界用红线。 */
function MountainRing() {
  let dividers = "";
  let palaceLines = "";
  for (const m of MOUNTAINS) {
    // 每山顺时针一侧的界线；与下一山不同宫时就是宫界
    const line = radialLine(R.directionOuter, R.mountainOuter, m.center + 7.5);
    if (neighborMountain(m, 1).palace !== m.palace) palaceLines += line;
    else dividers += line;
  }
  return (
    <g>
      {MOUNTAINS.map((m) => (
        <path
          key={m.name}
          d={sectorPath(R.directionOuter, R.mountainOuter, m.center - 7.5, m.center + 7.5)}
          fill={ELEMENT_FILL[m.element].fill}
        />
      ))}
      <path d={dividers} stroke={INK} strokeWidth={1.6} />
      <path d={palaceLines} stroke={CINNABAR} strokeWidth={6} />
      <g textAnchor="middle" dominantBaseline="central">
        {MOUNTAINS.map((m) => {
          const ink = ELEMENT_FILL[m.element].ink;
          return (
            <g key={m.name} transform={`rotate(${m.center})`} fill={ink}>
              <text y={-338} fontSize={54} fontWeight={700}>
                {m.name}
              </text>
              {m.zodiac && (
                <text y={-291} fontSize={27} fontWeight={600} opacity={0.82}>
                  {m.zodiac}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </g>
  );
}

/** 八方：正北以红圈标出。 */
function DirectionRing() {
  const mid = (R.trigramOuter + R.directionOuter) / 2;
  return (
    <g>
      <path d={sectorPath(R.trigramOuter, R.directionOuter, 0, 359.99)} fill="#e6cc8c" />
      <path
        d={DIRECTIONS.map((d) => radialLine(R.trigramOuter, R.directionOuter, d.center + 22.5)).join("")}
        stroke={INK}
        strokeWidth={1.6}
      />
      <g textAnchor="middle" dominantBaseline="central" fill={INK} fontSize={31} fontWeight={700}>
        {DIRECTIONS.map((d) => (
          <g key={d.name} transform={`rotate(${d.center})`}>
            {d.index === 0 && (
              <circle cy={-mid} r={22} fill="none" stroke={CINNABAR} strokeWidth={4} />
            )}
            <text y={-mid} letterSpacing={d.name.length > 1 ? 2 : 0}>
              {d.name}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
}

/** 后天八卦：由内到外为洛书数、卦名、卦象；初爻在内。 */
function TrigramRing() {
  const lineRadii = [176, 188, 200]; // 初爻、中爻、上爻
  const half = 34;
  const gap = 7;
  return (
    <g>
      <path
        d={PALACES.map((p) => radialLine(R.poolRim, R.trigramOuter, p.center + 22.5)).join("")}
        stroke={INK}
        strokeWidth={1.6}
      />
      {PALACES.map((p) => (
        <g key={p.trigram.name} transform={`rotate(${p.center})`}>
          <text
            y={-121}
            fontSize={25}
            fontWeight={700}
            fill={CINNABAR}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {p.trigram.luoshuName}
          </text>
          <text
            y={-151}
            fontSize={35}
            fontWeight={700}
            fill={INK}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {p.trigram.name}
          </text>
          <g stroke={INK} strokeWidth={7.5} strokeLinecap="butt">
            {p.trigram.lines.map((yang, i) => {
              const y = -lineRadii[i];
              return yang ? (
                <line key={i} x1={-half} x2={half} y1={y} y2={y} />
              ) : (
                <g key={i}>
                  <line x1={-half} x2={-gap} y1={y} y2={y} />
                  <line x1={gap} x2={half} y1={y} y2={y} />
                </g>
              );
            })}
          </g>
        </g>
      ))}
    </g>
  );
}

/** 天池：池底与海底线。磁针另在上一层。 */
function Pool() {
  return (
    <g>
      <circle r={R.poolRim} fill="#6f4d20" />
      <circle r={R.pool} fill="url(#pool-floor)" />
      <line y1={-86} y2={86} stroke={CINNABAR} strokeWidth={3} />
      <circle cy={-80} r={5.5} fill={CINNABAR} />
      <circle cy={80} r={5.5} fill={CINNABAR} />
    </g>
  );
}
