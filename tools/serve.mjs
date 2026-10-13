// Preview the site locally with nothing but Node's built-in modules.
//   node tools/serve.mjs          -> http://localhost:8080
//   node tools/serve.mjs 3000     -> http://localhost:3000
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.argv[2]) || 8080;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

http
  .createServer((req, res) => {
    let rel;
    try {
      rel = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }

    let file = path.join(root, rel);
    if (file !== root && !file.startsWith(root + path.sep)) {
      res.writeHead(403).end();
      return;
    }

    // Folders serve their index.html, like GitHub Pages does.
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      if (!rel.endsWith("/")) {
        res.writeHead(301, { Location: rel + "/" }).end();
        return;
      }
      file = path.join(file, "index.html");
    }
    if (!fs.existsSync(file)) {
      file = path.join(root, "404.html");
      res.statusCode = 404;
    }

    res.setHeader("Content-Type", types[path.extname(file).toLowerCase()] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, "127.0.0.1", () => console.log(`Serving ${root} at http://localhost:${port}`));
