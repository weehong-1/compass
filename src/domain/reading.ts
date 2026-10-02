import { normalize, roundTenth } from "./angle";
import {
  mountainAt,
  neighborMountain,
  oppositeMountain,
  type Mountain,
} from "./mountains";

/** 偏离中线不超过此度数为正向，超过为兼向。 */
export const PURE_LIMIT = 3;
/** 偏离中线超过此度数（即离两山交界不到 1.5°）为空亡。 */
export const VOID_LIMIT = 6;

/** 大空亡落在宫界上，小空亡落在同宫两山之交。 */
export type VoidKind = "great" | "small";

export const VOID_NAMES: Record<VoidKind, string> = {
  great: "大空亡",
  small: "小空亡",
};

export interface VoidLine {
  kind: VoidKind;
  /** [坐山, 坐山偏向的邻山]，例如「子癸之交」。 */
  between: readonly [Mountain, Mountain];
}

/** 读数：某一刻从天心十道读出的全部结果。 */
export interface Reading {
  /** 向的度数，精确到 0.1°，[0, 360)。 */
  facingDeg: number;
  sittingDeg: number;
  facing: Mountain;
  sitting: Mountain;
  /** 向偏离向山中线的度数，正值为顺时针，[-7.5, 7.5)。 */
  offset: number;
  /** 兼向时为 { 坐山偏向的邻山, 向山偏向的邻山 }；正向时为 null。 */
  jian: { sitting: Mountain; facing: Mountain } | null;
  void: VoidLine | null;
}

export function readingAt(facingDegInput: number): Reading {
  const facingDeg = roundTenth(facingDegInput);
  const sittingDeg = roundTenth(facingDeg + 180);
  const facing = mountainAt(facingDeg);
  const sitting = oppositeMountain(facing);

  // 以 0.1° 为单位用整数比较，避免浮点误差
  const offsetTenths = Math.round(normalize(facingDeg - facing.center + 7.5) * 10) - 75;
  const offset = offsetTenths / 10;
  const step = offsetTenths >= 0 ? 1 : -1;

  const jian =
    Math.abs(offsetTenths) > PURE_LIMIT * 10
      ? {
          sitting: neighborMountain(sitting, step),
          facing: neighborMountain(facing, step),
        }
      : null;

  let voidLine: VoidLine | null = null;
  if (Math.abs(offsetTenths) > VOID_LIMIT * 10) {
    const other = neighborMountain(sitting, step);
    voidLine = {
      kind: other.palace === sitting.palace ? "small" : "great",
      between: [sitting, other],
    };
  }

  return { facingDeg, sittingDeg, facing, sitting, offset, jian, void: voidLine };
}

/** 坐向文字，例如「坐子向午」「坐子向午兼癸丁」。 */
export function zuoXiangText(r: Reading): string {
  const base = `坐${r.sitting.name}向${r.facing.name}`;
  return r.jian ? `${base}兼${r.jian.sitting.name}${r.jian.facing.name}` : base;
}

/** 空亡提示文字，例如「小空亡（子癸之交）」；没有空亡时为 null。 */
export function voidText(r: Reading): string | null {
  if (!r.void) return null;
  const [a, b] = r.void.between;
  return `${VOID_NAMES[r.void.kind]}（${a.name}${b.name}之交）`;
}
