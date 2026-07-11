import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const feedRoot = path.resolve(projectRoot, process.argv[2] ?? "dist-app");
const port = Number.parseInt(process.argv[3] ?? "7418", 10);

const contentTypes = new Map([
  [".yml", "text/yaml; charset=utf-8"],
  [".yaml", "text/yaml; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".zip", "application/zip"],
  [".dmg", "application/x-apple-diskimage"],
  [".exe", "application/vnd.microsoft.portable-executable"],
  [".blockmap", "application/octet-stream"]
]);

if (!existsSync(feedRoot) || !statSync(feedRoot).isDirectory()) {
  throw new Error(`Update feed directory does not exist: ${feedRoot}`);
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);
  const relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "");
  const targetPath = path.resolve(feedRoot, relativePath || "index.html");

  if (!targetPath.startsWith(feedRoot + path.sep) && targetPath !== feedRoot) {
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
  console.log(`Serving update feed at http://127.0.0.1:${port}/`);
  console.log(`Directory: ${feedRoot}`);
});
