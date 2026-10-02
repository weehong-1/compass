// 在手机上测试：启动 next dev，再开 cloudflared 临时通道拿到 HTTPS 网址并印出 QR 码。
// 方位传感器只能在 HTTPS 下使用，而 WSL2 的 NAT 网络手机连不进来，所以走通道。
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import qrcode from "qrcode-terminal";

const PORT = process.env.PORT ?? "3000";
const children = [];

function run(cmd, args, opts = {}) {
  const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"], ...opts });
  children.push(child);
  child.on("exit", (code) => {
    console.log(`${cmd} exited (${code})`);
    shutdown();
  });
  return child;
}

function shutdown() {
  for (const c of children) if (c.exitCode === null) c.kill("SIGTERM");
  process.exit();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// 直接执行 next，不经过 npx，结束时信号才送得到
const next = run(fileURLToPath(new URL("../node_modules/.bin/next", import.meta.url)), ["dev", "--port", PORT]);
next.stdout.pipe(process.stdout);
next.stderr.pipe(process.stderr);

let tunnel;
try {
  tunnel = run("cloudflared", ["tunnel", "--no-autoupdate", "--url", `http://localhost:${PORT}`]);
} catch {
  console.error("找不到 cloudflared，请先安装：https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/");
  shutdown();
}
tunnel.on("error", () => {
  console.error("找不到 cloudflared，请先安装（见 README）。");
  shutdown();
});

let shown = false;
const onTunnelOutput = (chunk) => {
  const match = String(chunk).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (!match || shown) return;
  shown = true;
  console.log(`\n手机扫码或打开：${match[0]}\n`);
  qrcode.generate(match[0], { small: true });
};
tunnel.stdout.on("data", onTunnelOutput);
tunnel.stderr.on("data", onTunnelOutput);
