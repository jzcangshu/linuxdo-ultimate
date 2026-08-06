import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  const safe = (pathname === "/" ? "/discourse-list.html" : pathname).replace(/^\/+/, "");
  if (safe.split("/").includes("..")) {
    response.writeHead(400);
    response.end("invalid path");
    return;
  }
  const listRoute = safe === "latest" || safe === "bookmarks" || safe.startsWith("c/") || safe.startsWith("tag/") || safe.startsWith("search");
  const fixturePath = safe.startsWith("t/") ? "discourse-topic.html" : listRoute ? "discourse-list.html" : safe.replace(/^fixtures[/\\]/, "");
  const file = path.join(root, safe === "linuxdo-ultimate.user.js" ? "dist/linuxdo-ultimate.user.js" : `fixtures/${fixturePath}`);
  try {
    const stat = statSync(file);
    response.writeHead(200, { "Content-Type": file.endsWith(".js") ? "text/javascript" : "text/html", "Content-Length": stat.size });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404);
    response.end("not found");
  }
});
server.listen(4173, "127.0.0.1", () => console.log("fixture server listening on http://127.0.0.1:4173"));
