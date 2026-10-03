import type { Element } from "@/domain/mountains";

/** 二十四山层按五行填色：木青绿、火浅朱、土赭黄、金银白、水墨黑。 */
export const ELEMENT_FILL: Record<Element, { fill: string; ink: string }> = {
  wood: { fill: "#9dbf8e", ink: "#13240f" },
  fire: { fill: "#efa58c", ink: "#3a0f06" },
  earth: { fill: "#d9a85b", ink: "#2d1d06" },
  metal: { fill: "#f4f1e8", ink: "#24211c" },
  water: { fill: "#23262b", ink: "#f2e6c9" },
};

export const CINNABAR = "#c62d1f";
export const INK = "#1e1a14";
/** 寻方的标记色：盘面上没有蓝色，一眼就能和盘面本身的内容分开。 */
export const SEEK_BLUE = "#1765d8";
