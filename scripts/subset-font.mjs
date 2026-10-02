// 扫描 src/ 里（注释以外）出现的所有汉字与符号，向 Google Fonts 取 Noto Serif SC 的子集，存成本地 woff2。
// 界面文字有新增汉字时重新执行：npm run font
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "src/app/fonts/noto-serif-sc-subset.woff2");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(p) ? [p] : [];
  });
}

const chars = new Set("0123456789.°·—–-（）()：:、，。！？「」");
for (const file of walk(join(ROOT, "src"))) {
  const code = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\s\/\/ .*$/gm, "");
  for (const ch of code) {
    if (/[　-〿㐀-鿿＀-￯]/.test(ch)) chars.add(ch);
  }
}
const text = [...chars].sort().join("");

const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400..900&text=${encodeURIComponent(text)}`;
const css = await (await fetch(cssUrl, { headers: { "User-Agent": UA } })).text();
const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]);
if (urls.length !== 1) throw new Error(`expected one font file, got ${urls.length}:\n${css}`);

const font = Buffer.from(await (await fetch(urls[0])).arrayBuffer());
writeFileSync(OUT, font);
console.log(`${chars.size} glyphs → ${OUT} (${(font.length / 1024).toFixed(1)} KB)`);
