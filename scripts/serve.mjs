/**
 * Съёмочный сервер статической сборки: раздаёт out/ и держит живой мост.
 *
 * Зачем свой, а не `next start`: сборка идёт в режиме `output: 'export'`,
 * и `next start` с ним не работает. Зачем не `npx serve`: на площадке
 * может не быть интернета, а качать пакет в этот момент уже поздно.
 * Никаких зависимостей — только то, что есть в Node.
 *
 * Мост /live связывает экраны на разных машинах локалки: чатер на одной,
 * телефон жертвы на другой. Приём — SSE, отправка — POST; всё в памяти,
 * ничего наружу. Протокол описан в lib/live/protocol.ts.
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

// --- живой мост -------------------------------------------------------------

const LIVE_PATH = "/live";

/** Сколько реплик держим для догона после F5: одного дубля хватает с запасом */
const JOURNAL_LIMIT = 800;

/** Больше 64 КБ реплика в кадре быть не может — это защита от мусора в порту */
const BODY_LIMIT = 64 * 1024;

/** Без heartbeat браузер и прокси молча роняют простаивающий поток */
const PING_MS = 15_000;

/**
 * Журнал общий на все комнаты, номер сквозной: клиент подписан сразу на две
 * комнаты (своё место и общая «scene»), и с одним счётчиком ему достаточно
 * одного `after`, чтобы догнать пропущенное.
 */
const journal = [];
let seq = 0;

/** Открытые потоки: { res, rooms:Set<string> } */
const clients = new Set();

function sendEvent(res, envelope) {
  res.write(`id: ${envelope.seq}\ndata: ${JSON.stringify(envelope)}\n\n`);
}

function openStream(req, res, url) {
  const rooms = new Set((url.searchParams.get("rooms") ?? "").split(",").filter(Boolean));

  res.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-store",
    connection: "keep-alive",
    // Экраны на площадке открываются с localhost и с http://<ip> — это разные
    // origin для браузера, а сервер один и тот же
    "access-control-allow-origin": "*",
  });

  // EventSource при переподключении присылает Last-Event-ID сам, но при первом
  // открытии его нет — тогда берём ?after= из адреса
  const header = Number(req.headers["last-event-id"]);
  const after = Number.isFinite(header) ? header : Number(url.searchParams.get("after")) || 0;

  for (const envelope of journal) {
    if (envelope.seq > after && rooms.has(envelope.room)) sendEvent(res, envelope);
  }

  const client = { res, rooms };
  clients.add(client);

  const ping = setInterval(() => res.write(": ping\n\n"), PING_MS);
  req.on("close", () => {
    clearInterval(ping);
    clients.delete(client);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        reject(new Error("too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

async function publish(req, res) {
  let envelope;
  try {
    envelope = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400).end();
    return;
  }

  if (!envelope || typeof envelope.id !== "string" || typeof envelope.room !== "string") {
    res.writeHead(400).end();
    return;
  }

  // Ctrl+Alt+R: сброс дубля. Журнал чистим здесь же, иначе экран, обновлённый
  // после сброса, доиграет отменённую переписку и дубли не склеятся.
  if (envelope.msg?.t === "scene" && envelope.msg.kind === "reset") {
    journal.length = 0;
  }

  envelope.seq = ++seq;
  journal.push(envelope);
  if (journal.length > JOURNAL_LIMIT) journal.splice(0, journal.length - JOURNAL_LIMIT);

  for (const client of clients) {
    // Отправителю тоже: его собственное эхо — подтверждение доставки
    if (client.rooms.has(envelope.room)) sendEvent(client.res, envelope);
  }

  res.writeHead(204, { "access-control-allow-origin": "*" }).end();
}

// --- статика ----------------------------------------------------------------

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
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = url.pathname;

  if (path === LIVE_PATH) {
    if (req.method === "GET") return openStream(req, res, url);
    if (req.method === "POST") return publish(req, res);
    if (req.method === "OPTIONS") {
      return res
        .writeHead(204, {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "content-type",
        })
        .end();
    }
    return res.writeHead(405).end();
  }

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
  console.log(`Живой мост на ${LIVE_PATH} · вторая машина открывает http://<ip>:${PORT}/`);
});
