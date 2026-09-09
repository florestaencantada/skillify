import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const port = Number.parseInt(process.env.PORT || "8080", 10);
const distDir = resolve("dist");
const indexFile = join(distDir, "index.html");

const contentTypes = new Map([
  [".avif", "image/avif"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

function sendFile(res, filePath) {
  const extension = extname(filePath);
  const isAsset = filePath.includes(`${join(distDir, "assets")}/`);

  res.writeHead(200, {
    "Content-Type": contentTypes.get(extension) || "application/octet-stream",
    "Cache-Control":
      extension === ".html" || filePath.endsWith("env.js")
        ? "no-store"
        : isAsset
          ? "public, max-age=31536000, immutable"
          : "public, max-age=3600",
  });

  createReadStream(filePath).pipe(res);
}

function sendStatus(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function resolveStaticPath(pathname) {
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return { error: 400 };
  }

  const normalizedPath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(distDir, normalizedPath);
  const resolvedPath = resolve(filePath);

  if (resolvedPath !== distDir && !resolvedPath.startsWith(`${distDir}${sep}`)) {
    return { error: 403 };
  }

  if (existsSync(resolvedPath) && statSync(resolvedPath).isFile()) {
    return { filePath: resolvedPath };
  }

  return {};
}

const server = createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendStatus(res, 405, "method not allowed\n");
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/health") {
    sendStatus(res, 200, "ok\n");
    return;
  }

  const staticPath = resolveStaticPath(url.pathname);

  if (staticPath.error) {
    sendStatus(res, staticPath.error, "invalid path\n");
    return;
  }

  if (staticPath.filePath) {
    sendFile(res, staticPath.filePath);
    return;
  }

  if (extname(url.pathname)) {
    sendStatus(res, 404, "not found\n");
    return;
  }

  sendFile(res, indexFile);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Static frontend listening on port ${port}`);
});

function shutdown(signal) {
  console.log(`Received ${signal}, closing HTTP server`);
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forcing shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
