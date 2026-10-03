import { shortestDelta } from "./angle";
import { DIRECTIONS, directionAt, type Direction } from "./trigrams";

/** 向离目标方位中线不到此度数，即为正对。 */
export const ON_TARGET_DEG = 5;

/** 寻方时的指引：手机顶端（向）要怎么转，才会正对目标方位。 */
export interface SeekGuide {
  target: Direction;
  /** 还要转的度数，范围 (-180, 180]；正值为向右（顺时针）转。 */
  turn: number;
  /** 向已落在目标方位的 45° 之内。 */
  inside: boolean;
  onTarget: boolean;
}

export function seekGuide(facingDeg: number, targetIndex: number): SeekGuide {
  const target = DIRECTIONS[targetIndex];
  const turn = shortestDelta(facingDeg, target.center);
  return {
    target,
    turn,
    inside: directionAt(facingDeg).index === targetIndex,
    onTarget: Math.abs(turn) < ON_TARGET_DEG,
  };
}

/** 指引文字，例如「东南：向右转 62°」「已在东南内，再向左转 8°」「正对东南」。 */
export function seekText(g: SeekGuide): string {
  if (g.onTarget) return `正对${g.target.name}`;
  const turn = `向${g.turn > 0 ? "右" : "左"}转 ${Math.round(Math.abs(g.turn))}°`;
  return g.inside ? `已在${g.target.name}内，再${turn}` : `${g.target.name}：${turn}`;
}
