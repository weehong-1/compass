import { expect, test, type Page } from "@playwright/test";

const reading = (page: Page) => page.getByRole("region", { name: "读数" });

async function expectReading(page: Page, text: string, facing?: string) {
  await expect(reading(page).locator("p[aria-live]")).toHaveText(text);
  if (facing) await expect(reading(page)).toContainText(`向 ${facing}`);
}

/** 罗盘上某个画面角度（自上方顺时针）、某个半径（viewBox 单位）的点。 */
async function pointOnLuopan(page: Page, screenAngle: number, radius: number) {
  const box = (await page.getByRole("img", { name: /^罗盘/ }).boundingBox())!;
  const scale = box.width / 1000;
  const a = (screenAngle * Math.PI) / 180;
  return {
    x: box.x + box.width / 2 + radius * scale * Math.sin(a),
    y: box.y + box.height / 2 - radius * scale * Math.cos(a),
  };
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("luopan:ios-hint-dismissed", "1"));
});

test("opens at 坐子向午 with the facing on top", async ({ page }) => {
  await page.goto("/");
  await expectReading(page, "坐子向午", "180.0°");
  await expect(reading(page)).toContainText("坐 0.0°");
  await expect(reading(page)).toContainText("正向");
});

test("restores a shared link and cleans the URL", async ({ page }) => {
  await page.goto("/?d=202");
  await expectReading(page, "坐癸向丁兼丑未", "202.0°");
  await expect(page.getByRole("status")).toHaveText("⚠ 大空亡（癸丑之交）");
  await expect(page).toHaveURL("/");
});

test("flags 小空亡 near a boundary inside one palace", async ({ page }) => {
  await page.goto("/?d=187");
  await expect(page.getByRole("status")).toHaveText("⚠ 小空亡（子癸之交）");
});

test("tapping a mountain brings it to the facing line", async ({ page }) => {
  await page.goto("/");
  // 向 180° 时子山在正下方
  const p = await pointOnLuopan(page, 180, 324);
  await page.mouse.click(p.x, p.y);
  await expectReading(page, "坐午向子", "0.0°");
});

test("tapping a palace aligns its 中线", async ({ page }) => {
  await page.goto("/");
  // 向 180° 时，画面右方（90°）是盘面 270°，即兑宫
  const p = await pointOnLuopan(page, 100, 150);
  await page.mouse.click(p.x, p.y);
  await expectReading(page, "坐卯向酉", "270.0°");
});

test("dragging rotates the dial with the finger", async ({ page }) => {
  await page.goto("/");
  const steps = 12;
  const start = await pointOnLuopan(page, 0, 400);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    const p = await pointOnLuopan(page, (90 * i) / steps, 400);
    await page.mouse.move(p.x, p.y);
  }
  await page.mouse.up();
  // 盘面顺时针转 90°，向度减 90°
  await expectReading(page, "坐酉向卯", "90.0°");
});

test("八方 buttons, slider and degree input set the facing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "东", exact: true }).click();
  await expectReading(page, "坐酉向卯", "90.0°");
  await expect(page.getByRole("button", { name: "东", exact: true })).toHaveAttribute("aria-pressed", "true");

  await page.getByLabel("拖动调整向度").fill("270");
  await expectReading(page, "坐卯向酉", "270.0°");

  const input = page.getByLabel("输入向度");
  await input.fill("184.5");
  await input.press("Enter");
  await expectReading(page, "坐子向午兼癸丁", "184.5°");

  await page.getByRole("button", { name: "向度加 1 度" }).click();
  await expectReading(page, "坐子向午兼癸丁", "185.5°");

  await input.fill("400");
  await input.press("Enter");
  await expect(page.getByText("请输入 0 到 360 之间的度数")).toBeVisible();
});

test("keyboard: arrows nudge, shift for 0.1°, up/down jump mountains", async ({ page }) => {
  await page.goto("/");
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
  await expectReading(page, "坐子向午兼癸丁", "184.0°");
  await page.keyboard.press("Shift+ArrowLeft");
  await expectReading(page, "坐子向午兼癸丁", "183.9°");
  await page.keyboard.press("ArrowUp");
  await expectReading(page, "坐癸向丁", "195.0°");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expectReading(page, "坐壬向丙", "165.0°");
});

test("remembers the last manual facing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "西南" }).click();
  await expectReading(page, "坐艮向坤", "225.0°");
  await page.waitForTimeout(600);
  await page.reload();
  await expectReading(page, "坐艮向坤", "225.0°");
});

test("details show the 坐山 and 向山", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "详情" }).click();
  const sitting = page.getByRole("article", { name: "坐山：子" });
  await expect(sitting).toContainText("坎宫 · 洛书一");
  await expect(sitting).toContainText("天元龙");
  await expect(sitting).toContainText("冬至");
  await expect(sitting).toContainText("鼠");
  await expect(sitting).toContainText("子时 23:00–01:00");
  const facing = page.getByRole("article", { name: "向山：午" });
  await expect(facing).toContainText("离宫 · 洛书九");
  await expect(facing).toContainText("火");

  await expect(page.getByRole("button", { name: "向度加 1 度" })).toHaveCount(0);
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("article", { name: "坐山：壬" })).toContainText("—");
});

test("share copies a link with the facing", async ({ page, context, browserName }, testInfo) => {
  test.skip(browserName !== "chromium");
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: testInfo.project.use.baseURL });
  await page.goto("/?d=184.5");
  await page.getByRole("button", { name: "分享这个坐向" }).click();
  await expect(page.getByText("链接已复制")).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toBe("http://localhost:3100/?d=184.5");
});

test.describe("compass mode", () => {
  test.skip(({ isMobile }) => !isMobile, "电脑没有方位传感器");

  const orient = (page: Page, alpha: number, beta = 0, gamma = 0) =>
    page.evaluate(
      ([a, b, g]) =>
        window.dispatchEvent(
          new DeviceOrientationEvent("deviceorientationabsolute", { alpha: a, beta: b, gamma: g, absolute: true }),
        ),
      [alpha, beta, gamma],
    );

  test("follows the heading, locks, and exits on manual input", async ({ page, context }) => {
    await context.grantPermissions(["accelerometer", "gyroscope", "magnetometer"]);
    await page.goto("/");
    await page.getByRole("button", { name: "指南针" }).click();
    await expect(page.getByText("正在取得方位")).toBeVisible();

    // alpha 90 → 手机顶端指向 270°
    await orient(page, 90);
    await expectReading(page, "坐卯向酉", "270.0°");
    await expect(page.getByText("✓ 已平放")).toBeVisible();
    await expect(page.getByRole("button", { name: "跟随中" })).toBeVisible();

    await page.getByRole("button", { name: "🔒 锁定读数" }).click();
    await orient(page, 0);
    await expectReading(page, "坐卯向酉", "270.0°");
    await expect(page.getByRole("button", { name: "已锁定" })).toBeVisible();

    await page.getByRole("button", { name: "🔓 解锁，继续跟随" }).click();
    for (let i = 0; i < 40; i++) {
      await orient(page, 0);
      await page.waitForTimeout(16);
    }
    await expectReading(page, "坐午向子");

    await orient(page, 0, 35, 0);
    await expect(page.getByText("请平放手机（倾斜 35°）")).toBeVisible();

    const p = await pointOnLuopan(page, 0, 400);
    const q = await pointOnLuopan(page, 30, 400);
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.move(q.x, q.y, { steps: 5 });
    await page.mouse.up();
    await expect(page.getByText("已退出指南针模式")).toBeVisible();
    await expect(page.getByRole("button", { name: "西北" })).toBeVisible();
  });

  test("reports when no heading arrives", async ({ page, context }) => {
    await context.grantPermissions(["accelerometer", "gyroscope", "magnetometer"]);
    await page.goto("/");
    await page.getByRole("button", { name: "指南针" }).click();
    await expect(page.getByText("收不到方位数据。")).toBeVisible({ timeout: 6000 });
    await page.getByRole("button", { name: "退出指南针" }).click();
    await expect(page.getByRole("button", { name: "西北" })).toBeVisible();
  });
});

test("desktop marks the compass as unavailable", async ({ page, isMobile }) => {
  test.skip(isMobile);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "指南针" })).toBeDisabled();
  await expect(page.getByText("这台设备没有方位传感器，请用手机打开。")).toBeVisible();
});

test("works offline after the first visit", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve));
    }
  });
  await context.setOffline(true);
  await page.goto("/?d=90");
  await expectReading(page, "坐酉向卯", "90.0°");
  await context.setOffline(false);
});
