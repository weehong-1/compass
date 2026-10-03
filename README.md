# 风水罗盘

在手机上使用的中国风水罗盘。转动盘面，或打开指南针模式让手机带动盘面，就能从天心十道读出坐向。

- **盘面**（由内到外）：天池（磁针、海底线）、后天八卦（卦象、卦名、洛书数）、八方（正北红圈）、二十四山（按正五行着色，地支下注生肖，宫界红线）、360° 刻度
- **读数**：「坐子向午」「坐子向午兼癸丁」，靠近交界时提示大空亡或小空亡；同时显示向度与坐度（磁北）
- **详情**：坐山与向山的卦、五行、三元龙、阴阳、节气、生肖、时辰
- **操作**：拖动盘面、点任一格对准、滑杆、度数输入、方向键与滚轮。所有操作都以「向」为准（见 [ADR 0001](docs/adr/0001-向为操作基准.md)）
- **指南针模式**：iOS 与 Android 平放手机即可跟随实际方位，可锁定读数，有平放与校准提示，开启时屏幕常亮
- **寻方**：按九宫格里的八方按钮（例如「东南」），会开启指南针，盘面用蓝色箭头标出东南的实际位置，并提示手机要向左或向右转多少度；正对时显示「正对东南」
- **PWA**：可加到主屏幕，离线可用；分享链接 `?d=184.5` 可还原同一坐向

术语见 [CONTEXT.md](CONTEXT.md)。

## 开发

需要 Node.js 22 以上。

```sh
npm install
npm run dev          # http://localhost:3000
npm run dev:phone    # 开发服务器 + cloudflared 临时通道，终端会印出 HTTPS 网址与 QR 码
```

方位传感器只能在 HTTPS 下使用，而 WSL2（NAT 网络）里的服务器手机连不到，所以在手机上测试要用 `npm run dev:phone`。它需要 [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)，不用注册账号：

```sh
curl -fsSL -o ~/.local/bin/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x ~/.local/bin/cloudflared
```

真机上要检查的项目见 [真机测试清单](docs/真机测试清单.md)。

## 测试与检查

```sh
npm test             # Vitest：领域计算（二十四山、宫、兼向、空亡）与方位换算
npm run lint
npm run typecheck
npm run build        # 静态导出到 out/，并生成离线用的 out/sw.js
npm run e2e          # Playwright：在 iPhone、Pixel、电脑尺寸下测试（要先 build）
npm start            # 在 http://localhost:3000 预览 out/
```

第一次跑 Playwright 要先装浏览器：`npx playwright install --with-deps chromium`。没有 sudo 权限时，可以只装浏览器，再用 `apt-get download` 取得缺少的系统库，解压后用 `LD_LIBRARY_PATH` 指过去。

## 资源

- `npm run font`：界面加了新的汉字后执行，重新生成 `src/app/fonts/` 里的思源宋体子集
- `npm run icons`：重新生成应用图标

## 部署

部署到 Vercel：在 Vercel 网站上「Import Project」导入这个 GitHub repo，设置都用默认值。之后每次 push 到 `main` 就会自动部署。整个应用是静态文件，也能放到任何支持 HTTPS 的静态主机上（上传 `out/`）。

## 结构

```
src/domain/        二十四山、后天八卦、宫、八方，以及读数计算（与界面无关）
src/components/    界面；luopan/ 是罗盘本身（木座、盘面、磁针、天心十道分层绘制）
src/hooks/         指南针、屏幕常亮、安装提示
src/lib/           方位角换算、本机存储
scripts/           字体子集、图标、service worker、本机预览、手机测试通道
e2e/               Playwright 测试
docs/adr/          架构决定记录
```
