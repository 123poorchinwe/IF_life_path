import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { dialogueHealth, processDialogueRequest } from "@/server/dialogue-service";
import { parseProfileRequest } from "@/server/profile-parse-service";

const origins = [
  "https://123poorchinwe.github.io",
  "https://game-d7g6sf32s7b58cbcd-1464556999.tcloudbaseapp.com",
];

function cors(req: IncomingMessage) {
  const origin = req.headers.origin || "";
  const configured = (process.env.CORS_ALLOWED_ORIGIN || "").split(",").map((item) => item.trim()).filter(Boolean);
  const accepted = [...origins, ...configured].includes(origin) || /^https:\/\/[a-z0-9-]+\.tcloudbaseapp\.com$/i.test(origin);
  return {
    "Access-Control-Allow-Origin": accepted ? origin : origins[0],
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function send(res: ServerResponse, req: IncomingMessage, status: number, payload?: unknown) {
  const data = payload === undefined ? "" : JSON.stringify(payload);
  res.writeHead(status, { ...cors(req), "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(data) });
  res.end(data);
}

async function toRequest(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 6 * 1024 * 1024) throw new Error("request_too_large");
    chunks.push(buffer);
  }
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
    else if (value !== undefined) headers.set(key, value);
  });
  return new Request(`http://127.0.0.1${req.url || "/"}`, {
    method: req.method,
    headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  });
}

const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url || "/", "http://127.0.0.1").pathname.replace(/^\/if-life-api/, "");
    if (req.method === "OPTIONS") return send(res, req, 204);
    if (req.method === "GET" && path === "/api/dialogue") return send(res, req, 200, dialogueHealth());
    if (req.method === "POST" && path === "/api/dialogue") {
      const result = await processDialogueRequest(await toRequest(req));
      return send(res, req, result.status, result.payload);
    }
    if (req.method === "POST" && path === "/api/profile/parse") {
      const result = await parseProfileRequest(await toRequest(req));
      return send(res, req, result.status, result.payload);
    }
    if (req.method === "GET" && (path === "/health" || path === "/")) return send(res, req, 200, { ok: true, service: "if-life-api" });
    return send(res, req, 404, { error: "not_found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "server_error";
    return send(res, req, message === "request_too_large" ? 413 : 500, { error: message });
  }
});

server.listen(Number(process.env.PORT || 9000), "0.0.0.0", () => {
  console.log(`if-life-api listening on ${process.env.PORT || 9000}`);
});
