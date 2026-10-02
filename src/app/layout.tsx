import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// 只含本应用用到的汉字的思源宋体子集，由 scripts/subset-font.mjs 生成
const luopanSerif = localFont({
  src: "./fonts/noto-serif-sc-subset.woff2",
  weight: "400 900",
  variable: "--font-luopan",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "风水罗盘",
  description: "在手机上使用的风水罗盘：二十四山、后天八卦、坐向读数与兼向空亡提示，可跟随手机指南针。",
  applicationName: "罗盘",
  appleWebApp: { capable: true, title: "罗盘", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4eee2" },
    { media: "(prefers-color-scheme: dark)", color: "#14110d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${luopanSerif.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
