import { Readable } from "node:stream";
import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { createDentalStockHandler } from "../app.js";

function createTestHandler() {
  return createDentalStockHandler({
    env: {
      DENTALSTOCK_ALLOWED_ORIGINS: "http://127.0.0.1:5174",
      DENTALSTOCK_RATE_LIMIT_MAX: "1000",
    },
  }).handler;
}

function createMockRequest({ method = "GET", path = "/", headers = {}, body = null } = {}) {
  const req = Readable.from(body ? [Buffer.from(JSON.stringify(body))] : []);
  req.method = method;
  req.url = path;
  req.headers = headers;
  req.socket = { remoteAddress: "test" };
  return req;
}

function createMockResponse() {
  const headers = new Map();
  return {
    statusCode: 0,
    rawBody: "",
    setHeader(key, value) {
      headers.set(key.toLowerCase(), value);
    },
    writeHead(statusCode, nextHeaders = {}) {
      this.statusCode = statusCode;
      Object.entries(nextHeaders).forEach(([key, value]) => headers.set(key.toLowerCase(), value));
    },
    end(body = "") {
      this.rawBody = body;
    },
    json() {
      return JSON.parse(this.rawBody);
    },
    header(key) {
      return headers.get(key.toLowerCase());
    },
  };
}

async function request(options) {
  const handler = createTestHandler();
  const req = createMockRequest(options);
  const res = createMockResponse();
  await handler(req, res);
  return res;
}

describe("DentalStock API skeleton", () => {
  it("responds to health checks", async () => {
    const response = await request({ path: "/health" });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.service).toBe("dentalstock-api");
    expect(response.header("x-content-type-options")).toBe("nosniff");
  });

  it("returns scoped order list stub", async () => {
    const response = await request({
      path: "/api/orders",
      headers: { "x-clinic-id": "clinic-test" },
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.clinicId).toBe("clinic-test");
    expect(body.data).toEqual([]);
  });

  it("refreshes demo tracking without exposing full credential surfaces", async () => {
    const response = await request({
      path: "/api/tracking/refresh",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: { carrier: "CJ대한통운", trackingNumber: "1234567890" },
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.provider).toBe("demo");
    expect(body.trackingNumberLast4).toBe("7890");
    expect(body.events[0].status).toBe("배송조회 준비");
  });

  it("keeps vendor credential writes disabled without an internal token", async () => {
    const response = await request({
      path: "/api/vendor-credentials/1",
      method: "POST",
      headers: { "content-type": "application/json" },
      body: { username: "demo", password: "secret" },
    });
    const body = response.json();

    expect(response.statusCode).toBe(503);
    expect(body.error).toBe("vendor_credentials_backend_disabled");
  });
});
