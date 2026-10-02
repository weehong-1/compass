/** 把任意角度换算到 [0, 360)。 */
export function normalize(deg: number): number {
  const r = deg % 360;
  // `+ 0` 把 -0 变成 0
  return (r < 0 ? r + 360 : r) + 0;
}

/** 从 from 转到 to 的最短角度差，范围 (-180, 180]；正值为顺时针。 */
export function shortestDelta(from: number, to: number): number {
  const d = normalize(to - from);
  return d > 180 ? d - 360 : d;
}

/** 四舍五入到 0.1° 并换算到 [0, 360)，即读数显示的精度。 */
export function roundTenth(deg: number): number {
  return normalize(Math.round(normalize(deg) * 10) / 10);
}

export function formatDegree(deg: number): string {
  return `${roundTenth(deg).toFixed(1)}°`;
}
