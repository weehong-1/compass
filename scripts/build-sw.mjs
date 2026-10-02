// next build 之后执行：列出 out/ 里的所有文件，写成离线用的 service worker（out/sw.js）。
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = new URL("../out", import.meta.url).pathname;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const hash = createHash("sha256");
const urls = [];
for (const file of walk(OUT).sort()) {
  const path = "/" + relative(OUT, file).split(sep).join("/");
  // RSC 数据（.txt）只在页面之间切换时用，这里只有一页
  if (path === "/sw.js" || path.endsWith(".txt") || path.endsWith(".map")) continue;
  hash.update(path).update(readFileSync(file));
  urls.push(path === "/index.html" ? "/" : path);
}
const version = hash.digest("hex").slice(0, 12);

const sw = `// 由 scripts/build-sw.mjs 生成，勿手改
const CACHE = "luopan-${version}";
const PRECACHE = ${JSON.stringify(urls)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("luopan-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 页面：有网络时取最新版，离线时用缓存（分享链接带 ?d= 也对得上）
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request, { ignoreSearch: true }).then((hit) => hit || caches.match("/")),
      ),
    );
    return;
  }

  // 静态资源：文件名带 hash，缓存优先
  event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
});
`;

writeFileSync(join(OUT, "sw.js"), sw);
console.log(`sw.js: ${urls.length} files precached, cache luopan-${version}`);
