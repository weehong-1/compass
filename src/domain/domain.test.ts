import { describe, expect, it } from "vitest";
import { normalize, roundTenth, shortestDelta } from "./angle";
import {
  MOUNTAINS,
  mountainAt,
  mountainRange,
  type Element,
} from "./mountains";
import { DIRECTIONS, PALACES, directionAt, palaceAt } from "./trigrams";
import { readingAt, sittingFacingParts, sittingFacingText, voidText } from "./reading";
import { seekGuide, seekText } from "./seek";

const names = (ms: readonly { name: string }[]) => ms.map((m) => m.name).join("");

describe("angle", () => {
  it("normalizes into [0, 360)", () => {
    expect(normalize(360)).toBe(0);
    expect(normalize(-15)).toBe(345);
    expect(Object.is(normalize(-0), 0)).toBe(true);
    expect(normalize(725)).toBe(5);
  });

  it("finds the shortest delta", () => {
    expect(shortestDelta(350, 10)).toBe(20);
    expect(shortestDelta(10, 350)).toBe(-20);
    expect(shortestDelta(0, 180)).toBe(180);
  });

  it("rounds to a tenth and wraps 359.96 to 0", () => {
    expect(roundTenth(184.46)).toBe(184.5);
    expect(roundTenth(359.96)).toBe(0);
  });
});

describe("二十四山", () => {
  it("runs clockwise from 子 at 0°", () => {
    expect(names(MOUNTAINS)).toBe("子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥壬");
    expect(MOUNTAINS.map((m) => m.center)).toEqual(MOUNTAINS.map((_, i) => i * 15));
  });

  it("assigns boundary degrees to the next mountain clockwise", () => {
    expect(mountainAt(352.5).name).toBe("子");
    expect(mountainAt(352.4).name).toBe("壬");
    expect(mountainAt(7.4).name).toBe("子");
    expect(mountainAt(7.5).name).toBe("癸");
    expect(mountainAt(360).name).toBe("子");
    expect(mountainRange(mountainAt(0))).toEqual({ start: 352.5, end: 7.5 });
  });

  it("uses 正五行", () => {
    const by = (e: Element) => names(MOUNTAINS.filter((m) => m.element === e));
    expect(by("water")).toBe("子癸亥壬");
    expect(by("wood")).toBe("寅甲卯乙巽");
    expect(by("fire")).toBe("巳丙午丁");
    expect(by("metal")).toBe("申庚酉辛乾");
    expect(by("earth")).toBe("丑艮辰未坤戌");
  });

  it("assigns 三元龙", () => {
    const by = (d: string) => names(MOUNTAINS.filter((m) => m.dragon === d));
    expect(by("heaven")).toBe("子艮卯巽午坤酉乾");
    expect(by("man")).toBe("癸寅乙巳丁申辛亥");
    expect(by("earth")).toBe("丑甲辰丙未庚戌壬");
  });

  it("assigns 玄空阴阳", () => {
    expect(names(MOUNTAINS.filter((m) => m.yinYang === "yang"))).toBe("艮寅甲巽巳丙坤申庚乾亥壬");
  });

  it("gives 生肖 and 时辰 only to 地支山", () => {
    const branches = MOUNTAINS.filter((m) => m.kind === "branch");
    expect(names(branches)).toBe("子丑寅卯辰巳午未申酉戌亥");
    expect(branches.map((m) => m.zodiac).join("")).toBe("鼠牛虎兔龙蛇马羊猴鸡狗猪");
    expect(MOUNTAINS[0].doubleHour).toEqual({ name: "子时", start: "23:00", end: "01:00" });
    expect(mountainAt(180).doubleHour).toEqual({ name: "午时", start: "11:00", end: "13:00" });
    for (const m of MOUNTAINS.filter((m) => m.kind !== "branch")) {
      expect(m.zodiac).toBeUndefined();
      expect(m.doubleHour).toBeUndefined();
    }
  });

  it("pairs each mountain with a 节气", () => {
    expect(MOUNTAINS.map((m) => m.solarTerm).join("")).toBe(
      "冬至小寒大寒立春雨水惊蛰春分清明谷雨立夏小满芒种夏至小暑大暑立秋处暑白露秋分寒露霜降立冬小雪大雪",
    );
  });
});

describe("后天八卦、宫、八方", () => {
  it("lays out 后天八卦 with 洛书数", () => {
    expect(PALACES.map((p) => p.trigram.name).join("")).toBe("坎艮震巽离坤兑乾");
    expect(PALACES.map((p) => p.trigram.luoshu)).toEqual([1, 8, 3, 4, 9, 2, 7, 6]);
    expect(PALACES[0].trigram.luoshuName).toBe("一");
  });

  it("draws lines from 初爻 to 上爻", () => {
    const glyph = (i: number) =>
      PALACES[i].trigram.lines.map((yang) => (yang ? "—" : "--")).join(" ");
    expect(glyph(0)).toBe("-- — --"); // 坎
    expect(glyph(2)).toBe("— -- --"); // 震：初爻为阳
    expect(glyph(1)).toBe("-- -- —"); // 艮：上爻为阳
    expect(glyph(3)).toBe("-- — —"); // 巽：初爻为阴
    expect(glyph(6)).toBe("— — --"); // 兑：上爻为阴
  });

  it("puts three mountains in each palace", () => {
    expect(PALACES.map((p) => names(p.mountains)).join(" ")).toBe(
      "壬子癸 丑艮寅 甲卯乙 辰巽巳 丙午丁 未坤申 庚酉辛 戌乾亥",
    );
    for (const p of PALACES) for (const m of p.mountains) expect(m.palace).toBe(p.index);
  });

  it("finds palace and direction by degree", () => {
    expect(palaceAt(22.4).trigram.name).toBe("坎");
    expect(palaceAt(22.5).trigram.name).toBe("艮");
    expect(directionAt(337.5).name).toBe("北");
    expect(directionAt(337.4).name).toBe("西北");
    expect(DIRECTIONS.map((d) => d.name).join(" ")).toBe("北 东北 东 东南 南 西南 西 西北");
  });
});

describe("读数", () => {
  const read = (deg: number) => {
    const r = readingAt(deg);
    return { text: sittingFacingText(r), void: voidText(r) };
  };

  it("reads 正向 within 3° of the 中线", () => {
    expect(read(180)).toEqual({ text: "坐子向午", void: null });
    expect(read(183)).toEqual({ text: "坐子向午", void: null });
    expect(read(177)).toEqual({ text: "坐子向午", void: null });
  });

  it("reads 兼向 beyond 3°", () => {
    expect(read(183.1).text).toBe("坐子向午兼癸丁");
    expect(read(184.5).text).toBe("坐子向午兼癸丁");
    expect(read(176.9).text).toBe("坐子向午兼壬丙");
    expect(read(186).void).toBeNull();
  });

  it("flags 小空亡 within 1.5° of a mountain boundary inside one palace", () => {
    expect(read(187)).toEqual({ text: "坐子向午兼癸丁", void: "小空亡（子癸之交）" });
    expect(read(186.1).void).toBe("小空亡（子癸之交）");
    // 交界线本身归下一山
    expect(read(187.5)).toEqual({ text: "坐癸向丁兼子午", void: "小空亡（癸子之交）" });
  });

  it("flags 大空亡 on a 宫界", () => {
    expect(read(202)).toEqual({ text: "坐癸向丁兼丑未", void: "大空亡（癸丑之交）" });
    expect(read(157)).toEqual({ text: "坐亥向巳兼壬丙", void: "大空亡（亥壬之交）" });
  });

  it("wraps around 0° and keeps 坐 opposite 向", () => {
    const r = readingAt(359.96);
    expect(r.facingDeg).toBe(0);
    expect(r.sittingDeg).toBe(180);
    expect(sittingFacingText(r)).toBe("坐午向子");
    expect(sittingFacingText(readingAt(4.5))).toBe("坐午向子兼丁癸");
    expect(readingAt(4.5).offset).toBe(4.5);
    expect(readingAt(355.5).offset).toBe(-4.5);
  });

  it("splits the 坐向 text so the 兼 part can be styled", () => {
    expect(sittingFacingParts(readingAt(180))).toEqual({ base: "坐子向午", jian: null });
    expect(sittingFacingParts(readingAt(184.5))).toEqual({ base: "坐子向午", jian: "兼癸丁" });
  });

  it("classifies on the displayed tenth, not the raw float", () => {
    expect(read(183.04).text).toBe("坐子向午");
    expect(read(183.05).text).toBe("坐子向午兼癸丁");
  });

  it("covers every tenth of a degree consistently", () => {
    for (let t = 0; t < 3600; t++) {
      const r = readingAt(t / 10);
      expect(r.sitting.index).toBe((r.facing.index + 12) % 24);
      expect(Math.abs(r.offset)).toBeLessThanOrEqual(7.5);
      expect(r.jian === null).toBe(Math.abs(r.offset) <= 3);
      expect(r.void === null).toBe(Math.abs(r.offset) <= 6);
      if (r.void) {
        const [a, b] = r.void.between;
        expect(r.void.kind === "great").toBe(a.palace !== b.palace);
      }
    }
  });
});

describe("寻方", () => {
  const text = (facing: number, target: number) => seekText(seekGuide(facing, target));

  it("turns the shorter way to the 中线 of the target", () => {
    // 东南 = 3，中线 135°
    expect(text(73, 3)).toBe("东南：向右转 62°");
    expect(text(250, 3)).toBe("东南：向左转 115°");
    expect(text(315, 3)).toBe("东南：向右转 180°");
    // 北 = 0，跨过 0°
    expect(text(300, 0)).toBe("北：向右转 60°");
    expect(text(40, 0)).toBe("北：向左转 40°");
  });

  it("says when the facing is already inside the target", () => {
    expect(text(120, 3)).toBe("已在东南内，再向右转 15°");
    expect(text(157.4, 3)).toBe("已在东南内，再向左转 22°");
    // 157.5° 已经是南
    expect(text(157.5, 3)).toBe("东南：向左转 23°");
  });

  it("is on target within 5° of the 中线", () => {
    expect(text(130.1, 3)).toBe("正对东南");
    expect(text(357, 0)).toBe("正对北");
    expect(seekGuide(130, 3).onTarget).toBe(false);
    expect(text(130, 3)).toBe("已在东南内，再向右转 5°");
  });
});
