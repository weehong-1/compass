import { describe, expect, it } from "vitest";
import { headingFromEuler, tiltOf } from "./heading";

const close = (a: number, b: number) => {
  const d = Math.abs(((a - b + 540) % 360) - 180);
  expect(d).toBeLessThan(1e-6);
};

describe("headingFromEuler", () => {
  it("is 360 − alpha when flat in portrait", () => {
    close(headingFromEuler(0, 0, 0), 0);
    close(headingFromEuler(90, 0, 0), 270);
    close(headingFromEuler(270, 0, 0), 90);
    close(headingFromEuler(30, 0, 0), 330);
  });

  it("ignores tilt for the top edge in portrait", () => {
    close(headingFromEuler(30, 15, 0), 330);
    close(headingFromEuler(30, 0, 18), 330);
    close(headingFromEuler(30, 12, -10), 330);
  });

  it("adds the screen angle when rotated to landscape", () => {
    // 逆时针横放：画面顶端是设备右侧
    close(headingFromEuler(0, 0, 0, 90), 90);
    close(headingFromEuler(0, 0, 0, 270), 270);
    close(headingFromEuler(30, 0, 0, 90), 60);
    close(headingFromEuler(0, 0, 0, 180), 180);
  });
});

describe("tiltOf", () => {
  it("measures how far the phone is from flat", () => {
    expect(tiltOf(0, 0)).toBe(0);
    expect(tiltOf(90, 0)).toBeCloseTo(90);
    expect(tiltOf(0, -25)).toBeCloseTo(25);
    expect(tiltOf(180, 0)).toBeCloseTo(180);
  });
});
