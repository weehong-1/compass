import { normalize } from "@/domain/angle";

const RAD = Math.PI / 180;

/**
 * 由 deviceorientationabsolute 的 alpha/beta/gamma 算出画面顶端所指的磁北方位角（顺时针）。
 * screenAngle 为 screen.orientation.angle：0 竖屏，90 逆时针横放，依此类推。
 * 把画面「上」方向的单位向量转到地球坐标（x 东、y 北），再取它在水平面上的方位。
 */
export function headingFromEuler(
  alpha: number,
  beta: number,
  gamma: number,
  screenAngle = 0,
): number {
  const [ca, sa] = [Math.cos(alpha * RAD), Math.sin(alpha * RAD)];
  const [cb, sb] = [Math.cos(beta * RAD), Math.sin(beta * RAD)];
  const [cg, sg] = [Math.cos(gamma * RAD), Math.sin(gamma * RAD)];
  // 画面「上」在设备坐标中的方向
  const vx = Math.sin(screenAngle * RAD);
  const vy = Math.cos(screenAngle * RAD);
  // R = Rz(alpha) · Rx(beta) · Ry(gamma)
  const y1 = cb * vy + sb * sg * vx;
  const east = ca * cg * vx - sa * y1;
  const north = sa * cg * vx + ca * y1;
  return normalize(Math.atan2(east, north) / RAD);
}

/** 手机屏幕与水平面的夹角：0 为平放，90 为直立。 */
export function tiltOf(beta: number, gamma: number): number {
  const c = Math.cos(beta * RAD) * Math.cos(gamma * RAD);
  return Math.acos(Math.max(-1, Math.min(1, c))) / RAD;
}

/** 倾斜超过此角度即提示「请平放手机」。 */
export const FLAT_LIMIT = 20;
