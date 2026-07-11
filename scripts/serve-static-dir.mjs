import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

const root = path.resolve(process.argv[2] ?? ".");
const port = Number.parseInt(process.argv[3] ?? "7421", 10);

const contentTypes = new Map([
  [".json", "application/json; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".html", "text/html; charset=utf-8"]
]);

if (!existsSync(root) || !statSync(root).isDirectory()) {
  throw new Error(`Static directory does not exist: ${root}`);
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "") || "index.html";
  const targetPath = path.resolve(root, relativePath);

  if (!targetPath.startsWith(root + path.sep) && targetPath !== root) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (!existsSync(targetPath) || !statSync(targetPath).isFile()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentTypes.get(path.extname(targetPath).toLowerCase()) ?? "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(targetPath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}/`);
});
