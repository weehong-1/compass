// 生成应用图标：方形木座、圆形盘面、二十四山色环与天心十道。改图标时执行：npm run icons
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ELEMENT_FILL } from "../src/components/luopan/palette.ts";

const ROOT = new URL("..", import.meta.url).pathname;

// 自子山起顺时针各山的正五行（同 src/domain/mountains.ts）；配色直接取盘面用的那一份
const ELEMENTS = "water water earth earth wood wood wood wood earth wood fire fire fire fire earth earth metal metal metal metal earth metal water water".split(" ");

function polar(r, deg) {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)];
}

function sector(r0, r1, a0, a1) {
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M${x0} ${y0}A${r1} ${r1} 0 0 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 0 0 ${x3} ${y3}Z`;
}

/** full：木纹铺满（maskable 与 apple icon 用），否则为圆角方块。scale：盘面相对大小。 */
function iconSvg({ full, scale }) {
  const mountains = ELEMENTS.map(
    (e, i) => `<path d="${sector(118, 182, i * 15 - 7.5, i * 15 + 7.5)}" fill="${ELEMENT_FILL[e].fill}"/>`,
  ).join("");
  const palaceLines = Array.from({ length: 8 }, (_, k) => {
    const [x0, y0] = polar(118, 22.5 + k * 45);
    const [x1, y1] = polar(182, 22.5 + k * 45);
    return `M${x0} ${y0}L${x1} ${y1}`;
  }).join("");
  const bg = full
    ? `<rect x="-256" y="-256" width="512" height="512" fill="url(#wood)"/>`
    : `<rect x="-240" y="-240" width="480" height="480" rx="96" fill="url(#wood)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-256 -256 512 512" width="512" height="512">
  <defs>
    <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#9a6634"/><stop offset="0.5" stop-color="#7c4b23"/><stop offset="1" stop-color="#6a3f1c"/>
    </linearGradient>
    <radialGradient id="face"><stop offset="0" stop-color="#f6e7bf"/><stop offset="1" stop-color="#dcb871"/></radialGradient>
  </defs>
  ${bg}
  <g transform="scale(${scale})">
    <circle r="214" fill="#3a2410"/>
    <circle r="206" fill="#a07a3a"/>
    <circle r="198" fill="url(#face)"/>
    ${mountains}
    <path d="${palaceLines}" stroke="#c62d1f" stroke-width="6"/>
    <g fill="none" stroke="#1e1a14" stroke-width="4">
      <circle r="118"/><circle r="182"/><circle r="60"/>
    </g>
    <circle r="56" fill="#fbf7ee"/>
    <path d="M0 -50L9 0H-9Z" fill="#c62d1f"/><path d="M0 50L9 0H-9Z" fill="#1b1a18"/>
    <circle r="8" fill="#c9a24a"/>
    <path d="M0 -214V214M-214 0H214" stroke="#d21f14" stroke-width="5"/>
  </g>
</svg>`;
}

mkdirSync(join(ROOT, "public/icons"), { recursive: true });

const rounded = iconSvg({ full: false, scale: 1 });
const fullBleed = iconSvg({ full: true, scale: 0.86 });
const maskable = iconSvg({ full: true, scale: 0.7 }); // maskable 安全区为中间 80%

writeFileSync(join(ROOT, "src/app/icon.svg"), rounded);
const png = (svg, size, out) => sharp(Buffer.from(svg)).resize(size, size).png().toFile(join(ROOT, out));
await png(rounded, 192, "public/icons/icon-192.png");
await png(rounded, 512, "public/icons/icon-512.png");
await png(maskable, 512, "public/icons/maskable-512.png");
await png(fullBleed, 180, "src/app/apple-icon.png");
console.log("icons written");
