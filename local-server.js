const http = require("http");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const port = 8000;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function resolvePath(urlPath) {
  let reqPath = decodeURIComponent((urlPath || "/").split("?")[0]);
  if (reqPath === "/") reqPath = "/Home.html";
  const safePath = path.normalize(path.join(root, reqPath));
  if (!safePath.startsWith(root)) return null;
  if (fs.existsSync(safePath) && fs.statSync(safePath).isDirectory()) {
    return path.join(safePath, "index.html");
  }
  return safePath;
}

const server = http.createServer((req, res) => {
  const filePath = resolvePath(req.url);
  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Local server: http://localhost:${port}`);
});
