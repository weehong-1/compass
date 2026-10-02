import { normalize } from "./angle";

/** 五行（本项目一律指山的正五行）。 */
export type Element = "water" | "wood" | "fire" | "metal" | "earth";

export const ELEMENT_NAMES: Record<Element, string> = {
  water: "水",
  wood: "木",
  fire: "火",
  metal: "金",
  earth: "土",
};

/** 山的类别：天干、地支、四维卦。 */
export type MountainKind = "stem" | "branch" | "trigram";

/** 三元龙：地元龙、天元龙、人元龙。 */
export type Dragon = "earth" | "heaven" | "man";

export const DRAGON_NAMES: Record<Dragon, string> = {
  earth: "地元龙",
  heaven: "天元龙",
  man: "人元龙",
};

/** 玄空所定每山的阴阳。 */
export type YinYang = "yin" | "yang";

export const YIN_YANG_NAMES: Record<YinYang, string> = {
  yin: "阴",
  yang: "阳",
};

/** 时辰：只有地支山才有。 */
export interface Shichen {
  name: string;
  start: string;
  end: string;
}

/** 山：二十四山之一，跨 15°。 */
export interface Mountain {
  /** 0 = 子，顺时针递增，中线 = index × 15°。 */
  index: number;
  name: string;
  kind: MountainKind;
  /** 中线度数。 */
  center: number;
  /** 所属宫的序号，0 = 坎宫，顺时针递增。 */
  palace: number;
  dragon: Dragon;
  element: Element;
  yinYang: YinYang;
  solarTerm: string;
  /** 生肖，只有地支山才有。 */
  zodiac?: string;
  shichen?: Shichen;
}

type Row = [
  name: string,
  kind: MountainKind,
  element: Element,
  yinYang: YinYang,
  solarTerm: string,
  zodiac?: string,
  shichenStart?: string,
];

// 自子山起顺时针排列
const ROWS: Row[] = [
  ["子", "branch", "water", "yin", "冬至", "鼠", "23:00"],
  ["癸", "stem", "water", "yin", "小寒"],
  ["丑", "branch", "earth", "yin", "大寒", "牛", "01:00"],
  ["艮", "trigram", "earth", "yang", "立春"],
  ["寅", "branch", "wood", "yang", "雨水", "虎", "03:00"],
  ["甲", "stem", "wood", "yang", "惊蛰"],
  ["卯", "branch", "wood", "yin", "春分", "兔", "05:00"],
  ["乙", "stem", "wood", "yin", "清明"],
  ["辰", "branch", "earth", "yin", "谷雨", "龙", "07:00"],
  ["巽", "trigram", "wood", "yang", "立夏"],
  ["巳", "branch", "fire", "yang", "小满", "蛇", "09:00"],
  ["丙", "stem", "fire", "yang", "芒种"],
  ["午", "branch", "fire", "yin", "夏至", "马", "11:00"],
  ["丁", "stem", "fire", "yin", "小暑"],
  ["未", "branch", "earth", "yin", "大暑", "羊", "13:00"],
  ["坤", "trigram", "earth", "yang", "立秋"],
  ["申", "branch", "metal", "yang", "处暑", "猴", "15:00"],
  ["庚", "stem", "metal", "yang", "白露"],
  ["酉", "branch", "metal", "yin", "秋分", "鸡", "17:00"],
  ["辛", "stem", "metal", "yin", "寒露"],
  ["戌", "branch", "earth", "yin", "霜降", "狗", "19:00"],
  ["乾", "trigram", "metal", "yang", "立冬"],
  ["亥", "branch", "water", "yang", "小雪", "猪", "21:00"],
  ["壬", "stem", "water", "yang", "大雪"],
];

// 每宫三山按顺时针依次为地元、天元、人元；壬（index 23）是坎宫第一山
const DRAGONS: Dragon[] = ["earth", "heaven", "man"];

function hourAfter(start: string): string {
  const h = (Number(start.slice(0, 2)) + 2) % 24;
  return `${String(h).padStart(2, "0")}:00`;
}

export const MOUNTAINS: readonly Mountain[] = ROWS.map(
  ([name, kind, element, yinYang, solarTerm, zodiac, shichenStart], index) => {
    const posInPalaceOrder = (index + 1) % 24;
    return {
      index,
      name,
      kind,
      center: index * 15,
      palace: Math.floor(posInPalaceOrder / 3),
      dragon: DRAGONS[posInPalaceOrder % 3],
      element,
      yinYang,
      solarTerm,
      ...(zodiac && shichenStart
        ? {
            zodiac,
            shichen: {
              name: `${name}时`,
              start: shichenStart,
              end: hourAfter(shichenStart),
            },
          }
        : {}),
    };
  },
);

/** 某度数所在的山；交界线上的度数归顺时针方向的下一山。 */
export function mountainAt(deg: number): Mountain {
  return MOUNTAINS[Math.floor(normalize(deg + 7.5) / 15) % 24];
}

/** 顺时针（step > 0）或逆时针（step < 0）方向第 |step| 个山。 */
export function neighborMountain(m: Mountain, step: number): Mountain {
  return MOUNTAINS[(((m.index + step) % 24) + 24) % 24];
}

/** 对面的山（相差 180°）。 */
export function oppositeMountain(m: Mountain): Mountain {
  return neighborMountain(m, 12);
}

/** 山的度数范围，[start, end)。 */
export function mountainRange(m: Mountain): { start: number; end: number } {
  return { start: normalize(m.center - 7.5), end: normalize(m.center + 7.5) };
}
