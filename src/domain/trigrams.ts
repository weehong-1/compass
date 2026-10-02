import { normalize } from "./angle";
import { MOUNTAINS, type Mountain } from "./mountains";

/** 爻：true 为阳爻，false 为阴爻。 */
export type Line = boolean;

/** 卦：后天八卦之一。 */
export interface Trigram {
  name: string;
  /** 初爻 → 中爻 → 上爻。 */
  lines: readonly [Line, Line, Line];
  /** 洛书数。 */
  luoshu: number;
  luoshuName: string;
}

/** 宫：一卦所管的 45°，含三山。 */
export interface Palace {
  /** 0 = 坎宫，顺时针递增，中线 = index × 45°。 */
  index: number;
  trigram: Trigram;
  center: number;
  mountains: readonly [Mountain, Mountain, Mountain];
}

/** 八方：北、东北……每个跨 45°。 */
export interface Direction {
  index: number;
  name: string;
  center: number;
}

const LUOSHU_NAMES = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

// 自坎宫起顺时针排列
const TRIGRAM_ROWS: [string, [Line, Line, Line], number][] = [
  ["坎", [false, true, false], 1],
  ["艮", [false, false, true], 8],
  ["震", [true, false, false], 3],
  ["巽", [false, true, true], 4],
  ["离", [true, false, true], 9],
  ["坤", [false, false, false], 2],
  ["兑", [true, true, false], 7],
  ["乾", [true, true, true], 6],
];

export const PALACES: readonly Palace[] = TRIGRAM_ROWS.map(
  ([name, lines, luoshu], index) => ({
    index,
    trigram: { name, lines, luoshu, luoshuName: LUOSHU_NAMES[luoshu] },
    center: index * 45,
    mountains: [
      MOUNTAINS[(index * 3 + 23) % 24],
      MOUNTAINS[index * 3],
      MOUNTAINS[index * 3 + 1],
    ],
  }),
);

export const DIRECTIONS: readonly Direction[] = [
  "北",
  "东北",
  "东",
  "东南",
  "南",
  "西南",
  "西",
  "西北",
].map((name, index) => ({ index, name, center: index * 45 }));

function sectorOf45(deg: number): number {
  return Math.floor(normalize(deg + 22.5) / 45) % 8;
}

/** 某度数所在的宫。 */
export function palaceAt(deg: number): Palace {
  return PALACES[sectorOf45(deg)];
}

/** 某度数所在的八方方位。 */
export function directionAt(deg: number): Direction {
  return DIRECTIONS[sectorOf45(deg)];
}

export function palaceOf(m: Mountain): Palace {
  return PALACES[m.palace];
}
