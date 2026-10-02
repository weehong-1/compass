import { defineConfig, devices } from "@playwright/test";

// 先 npm run build，再 npm run e2e。指南针模式用合成的方位事件测试，真机行为见 docs/真机测试清单.md
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/serve-out.mjs",
    env: { PORT: "3100" },
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    // 只装了 Chromium：iPhone 用它模拟尺寸与触控
    { name: "iphone", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "pixel", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
});
