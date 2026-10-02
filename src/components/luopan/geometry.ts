import { normalize } from "@/domain/angle";

/** SVG viewBox 为 -500..500，罗盘中心在原点。以下半径都以 viewBox 单位计。 */
export const VIEW = 1000;

export const R = {
  pool: 92, // 天池
  poolRim: 100,
  trigramOuter: 212, // 后天八卦层外缘
  directionOuter: 268, // 八方层外缘
  mountainOuter: 380, // 二十四山层外缘
  scaleOuter: 452, // 刻度层外缘
  dialRim: 462,
} as const;

/** 圆周上某角度（自上方顺时针）的点。 */
export function polar(r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [r * Math.sin(rad), -r * Math.cos(rad)];
}

/** 环形扇区路径，角度自上方顺时针。 */
export function sectorPath(r0: number, r1: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  const f = (n: number) => n.toFixed(2);
  return [
    `M${f(x0)} ${f(y0)}`,
    `A${r1} ${r1} 0 ${large} 1 ${f(x1)} ${f(y1)}`,
    `L${f(x2)} ${f(y2)}`,
    `A${r0} ${r0} 0 ${large} 0 ${f(x3)} ${f(y3)}`,
    "Z",
  ].join(" ");
}

export type Ring = "trigram" | "direction" | "mountain";

/**
 * 点在盘面上的哪一层、哪一格中线。
 * screenAngle 为点在画面上的角度（自上方顺时针），facing 为当前向度。
 * 返回该格中线的度数；点在刻度层、天池或盘外时返回 null。
 */
export function hitTest(
  radius: number,
  screenAngle: number,
  facing: number,
): { ring: Ring; center: number } | null {
  const dialAngle = normalize(screenAngle + facing);
  const snap = (span: number) => (Math.floor(normalize(dialAngle + span / 2) / span) * span) % 360;
  if (radius >= R.poolRim && radius < R.trigramOuter) return { ring: "trigram", center: snap(45) };
  if (radius >= R.trigramOuter && radius < R.directionOuter) return { ring: "direction", center: snap(45) };
  if (radius >= R.directionOuter && radius < R.mountainOuter) return { ring: "mountain", center: snap(15) };
  return null;
}
