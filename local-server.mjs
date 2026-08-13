import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve("src");
const requestedPort = Number(process.env.PORT || 4173);
const host = "127.0.0.1";

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8"
};

function fileForUrl(url) {
  const parsed = new URL(url, `http://${host}`);
  const pathname = decodeURIComponent(parsed.pathname);
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const candidate = resolve(join(root, safePath));
  if (!candidate.startsWith(root)) return null;
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    return join(candidate, "index.html");
  }
  return candidate;
}

const server = createServer((request, response) => {
  const file = fileForUrl(request.url || "/");
  if (!file || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": types[extname(file).toLowerCase()] || "application/octet-stream",
    "cache-control": "no-store"
  });
  createReadStream(file).pipe(response);
});

server.listen(requestedPort, host, () => {
  console.log(`Local server running at http://${host}:${requestedPort}/`);
});
