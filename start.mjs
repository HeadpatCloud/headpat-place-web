import { randomBytes } from "node:crypto";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const clientDir = join(__dirname, "dist", "client");

const { default: app } = await import("./dist/server/server.js");

const port = process.env.PORT || 3000;
const trustProxy = process.env.TRUST_PROXY === "1";
const backendOrigin = (process.env.BACKEND_ORIGIN || "").replace(/\/$/, "");
const allowedHosts = new Set(
  (process.env.ALLOWED_HOSTS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json",
};

const apiUrl = process.env.VITE_API_URL || "";

const BASE_SCRIPT_SRC = "script-src 'self'";

// SSR HTML carries inline scripts (theme, next-themes, hydration), so its CSP
// gets a per-request nonce instead of 'unsafe-inline'. Same-origin bundles and
// dynamic imports still load via 'self'. Static/non-HTML responses have no inline
// scripts, so they use the base script-src.
function securityHeaders(scriptSrc) {
  return {
    "Content-Security-Policy": [
      "default-src 'self'",
      "img-src 'self' https: data: blob:",
      "font-src 'self' https: data:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      scriptSrc,
      "frame-src 'none'",
      "worker-src 'self'",
      `connect-src 'self' https: wss: ${apiUrl}`.trim(),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
  };
}

const cssCache = new Map();

// The stylesheet is the only thing blocking first paint, so ship it inside the
// document and save the round trip a separate request would cost.
function inlineStylesheets(html) {
  return html.replace(
    /<link rel="stylesheet" href="(\/assets\/[^"]+\.css)"[^>]*\/?>/g,
    (tag, href) => {
      let css = cssCache.get(href);
      if (css === undefined) {
        const file = join(clientDir, href);
        css = file.startsWith(clientDir) && existsSync(file) ? readFileSync(file, "utf8") : null;
        cssCache.set(href, css);
      }
      return css === null ? tag : `<style data-href="${href}" data-precedence="default">${css}</style>`;
    },
  );
}

function pickEncoding(req) {
  const accept = String(req.headers["accept-encoding"] || "");
  if (/\bbr\b/.test(accept)) return "br";
  if (/\bgzip\b/.test(accept)) return "gzip";
  return null;
}

function compressBuffer(buf, encoding) {
  if (encoding === "br") {
    return brotliCompressSync(buf, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 4 },
    });
  }
  return gzipSync(buf, { level: 6 });
}

function isPathAllowed(pathname) {
  if (pathname.includes("/.")) return false;
  if (pathname.endsWith(".map")) return false;
  return true;
}

function tryServeStatic(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") return false;

  const url = new URL(req.url || "/", `http://localhost:${port}`);
  if (!isPathAllowed(url.pathname)) return false;

  const filePath = join(clientDir, url.pathname);
  if (!filePath.startsWith(clientDir)) return false;

  if (!existsSync(filePath)) return false;
  const stat = statSync(filePath);
  if (!stat.isFile()) return false;

  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  const headers = {
    "Content-Type": contentType,
    "Content-Length": stat.size,
    ...securityHeaders(BASE_SCRIPT_SRC),
  };

  if (url.pathname.startsWith("/assets/")) {
    headers["Cache-Control"] = "public, max-age=31536000, immutable";
  } else if (/\.(webp|png|svg|ico)$/.test(ext)) {
    headers["Cache-Control"] = "public, max-age=604800, stale-while-revalidate=86400";
  }

  let sendPath = filePath;
  const encoding = pickEncoding(req);
  if (encoding) {
    const suffix = encoding === "br" ? ".br" : ".gz";
    if (existsSync(filePath + suffix)) {
      sendPath = filePath + suffix;
      headers["Content-Encoding"] = encoding;
      headers["Content-Length"] = statSync(sendPath).size;
    }
  }
  headers.Vary = "Accept-Encoding";

  res.writeHead(200, headers);
  if (req.method === "HEAD") {
    res.end();
  } else {
    createReadStream(sendPath).pipe(res);
  }
  return true;
}

function resolveProtocol(req) {
  if (!trustProxy) return "http";
  const v = req.headers["x-forwarded-proto"];
  const value = Array.isArray(v) ? v[0] : v;
  return value === "https" ? "https" : "http";
}

function validateHost(rawHost) {
  if (!rawHost) return null;
  const host = String(rawHost).toLowerCase();
  if (allowedHosts.size === 0) return host;
  return allowedHosts.has(host) ? host : null;
}

async function proxyApi(req, res) {
  const target = backendOrigin + (req.url || "/");
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (v != null && k.toLowerCase() !== "host") {
      headers[k] = Array.isArray(v) ? v.join(",") : v;
    }
  }
  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
  }
  let resp;
  try {
    resp = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
      duplex: "half",
    });
  } catch {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end("Bad Gateway: backend unreachable");
    return;
  }
  const outHeaders = {};
  for (const [k, v] of resp.headers) {
    if (k.toLowerCase() !== "set-cookie") outHeaders[k] = v;
  }
  const setCookies =
    typeof resp.headers.getSetCookie === "function"
      ? resp.headers.getSetCookie()
      : [];
  if (setCookies.length > 0) outHeaders["set-cookie"] = setCookies;
  res.writeHead(resp.status, outHeaders);
  if (resp.body) {
    const reader = resp.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}

const server = createServer(async (req, res) => {
  if (backendOrigin && (req.url || "/").startsWith("/api")) {
    await proxyApi(req, res);
    return;
  }
  if (tryServeStatic(req, res)) return;

  const host = validateHost(req.headers.host);
  if (!host) {
    res.writeHead(400, securityHeaders(BASE_SCRIPT_SRC));
    res.end("Bad Request: host not allowed");
    return;
  }
  const protocol = resolveProtocol(req);
  const url = new URL(req.url || "/", `${protocol}://${host}`);

  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
  }

  const response = await app.fetch(
    new Request(url, {
      method: req.method,
      headers: Object.fromEntries(
        Object.entries(req.headers).filter(([, v]) => v != null),
      ),
      body,
      duplex: "half",
    }),
  );

  const contentType = response.headers.get("content-type") || "";

  // SSR HTML: stamp a per-request nonce onto every inline script and serve a
  // nonce-based CSP (no 'unsafe-inline'). Buffered so the whole document shares
  // one nonce; pages are small enough that giving up streaming here is fine.
  if (contentType.includes("text/html")) {
    const nonce = randomBytes(16).toString("base64");
    const html = await response.text();
    const nonced = inlineStylesheets(html).replace(
      /<script(?![^>]*\snonce=)/gi,
      `<script nonce="${nonce}"`,
    );
    const responseHeaders = {
      ...Object.fromEntries(response.headers.entries()),
      ...securityHeaders(`script-src 'self' 'nonce-${nonce}'`),
    };
    delete responseHeaders["content-length"];
    responseHeaders.vary = "Accept-Encoding, Cookie";
    const encoding = pickEncoding(req);
    if (encoding && req.method !== "HEAD") {
      const packed = compressBuffer(Buffer.from(nonced), encoding);
      responseHeaders["content-encoding"] = encoding;
      res.writeHead(response.status, responseHeaders);
      res.end(packed);
      return;
    }
    res.writeHead(response.status, responseHeaders);
    res.end(nonced);
    return;
  }

  const responseHeaders = {
    ...Object.fromEntries(response.headers.entries()),
    ...securityHeaders(BASE_SCRIPT_SRC),
  };

  res.writeHead(response.status, responseHeaders);

  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } else {
    const text = await response.text();
    res.end(text);
  }
});

server.listen(port, () => {
  console.log(`Frontend server listening on http://localhost:${port}`);
});
