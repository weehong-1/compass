import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 纯前端应用：静态导出到 out/，不需要服务器
  output: "export",
  // 开发时用 cloudflared 临时通道在手机上测试
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;
