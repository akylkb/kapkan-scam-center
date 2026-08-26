/**
 * Съёмочный сервер статической сборки: раздаёт out/ и ничего больше.
 *
 * Зачем свой, а не `next start`: сборка идёт в режиме `output: 'export'`,
 * и `next start` с ним не работает. Зачем не `npx serve`: на площадке
 * может не быть интернета, а качать пакет в этот момент уже поздно.
 * Никаких зависимостей — только то, что есть в Node.
 */
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL("../", import.meta.url)), "out");
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function resolve(urlPath) {
  // normalize отсекает ../ — за пределы out/ выйти нельзя
  const rel = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const target = join(ROOT, rel);
  if (!target.startsWith(ROOT)) return null;

  for (const candidate of [target, join(target, "index.html"), `${target}.html`]) {
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {
      // следующий вариант
    }
  }
  return null;
}

createServer(async (req, res) => {
  const path = new URL(req.url ?? "/", "http://localhost").pathname;
  const file = (await resolve(path)) ?? (await resolve("/404.html"));

  if (!file) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("404");
    return;
  }

  res.writeHead(path === "/404.html" || !file.endsWith("404.html") ? 200 : 404, {
    "content-type": TYPES[extname(file)] ?? "application/octet-stream",
    // Экраны висят всю смену: пусть браузер не дёргает файлы заново
    "cache-control": "public, max-age=3600",
  });
  createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`Экраны на http://localhost:${PORT}  (Ctrl+C — стоп)`);
});
