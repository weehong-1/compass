import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "风水罗盘",
    short_name: "罗盘",
    description: "在手机上使用的风水罗盘：二十四山、后天八卦、坐向读数与兼向空亡提示。",
    lang: "zh-CN",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // 平放时手机容易误判成横屏，安装后固定竖屏（iOS 不支持此项）
    orientation: "portrait",
    background_color: "#f4eee2",
    theme_color: "#7c4b23",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
