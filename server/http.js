import { createServer } from "node:http";
import { Buffer } from "node:buffer";

const MAX_JSON_BYTES = 128 * 1024;

export function sendJson(res, statusCode, payload, headers = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    ...headers,
  });
  res.end(body);
}

export function notFound(res) {
  sendJson(res, 404, { error: "not_found" });
}

export function methodNotAllowed(res, allow) {
  sendJson(res, 405, { error: "method_not_allowed" }, { allow });
}

export async function readJson(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_JSON_BYTES) {
      const error = new Error("request_entity_too_large");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("invalid_json");
    error.statusCode = 400;
    throw error;
  }
}

export function createHttpServer(handler) {
  return createServer(async (req, res) => {
    await handler(req, res);
  });
}
