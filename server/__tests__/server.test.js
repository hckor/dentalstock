import { Readable } from "node:stream";
import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { createDentalStockHandler } from "../app.js";
import { createStaticBearerAuthProvider } from "../authService.js";

function createTestHandler(envOverrides = {}) {
  return createDentalStockHandler({
    env: {
      DENTALSTOCK_ALLOWED_ORIGINS: "http://127.0.0.1:5174",
      DENTALSTOCK_RATE_LIMIT_MAX: "1000",
      ...envOverrides,
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

async function request(options, envOverrides) {
  const handler = createTestHandler(envOverrides);
  const req = createMockRequest(options);
  const res = createMockResponse();
  await handler(req, res);
  return res;
}

async function requestWithServer(options, envOverrides) {
  const server = createDentalStockHandler({
    env: {
      DENTALSTOCK_ALLOWED_ORIGINS: "http://127.0.0.1:5174",
      DENTALSTOCK_RATE_LIMIT_MAX: "1000",
      ...envOverrides,
    },
  });
  const req = createMockRequest(options);
  const res = createMockResponse();
  await server.handler(req, res);
  return { response: res, services: server.services };
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
    expect(body.clinicId).toBe("demo-clinic");
    expect(body.data).toEqual([]);
  });

  it("rejects browser requests from unapproved origins", async () => {
    const response = await request({
      path: "/api/orders",
      headers: { origin: "https://malicious.example" },
    });
    const body = response.json();

    expect(response.statusCode).toBe(403);
    expect(body.error).toBe("origin_not_allowed");
  });

  it("can trust client context only when explicitly enabled", async () => {
    const handler = createTestHandler({ DENTALSTOCK_TRUST_CLIENT_CONTEXT: "true" });
    const req = createMockRequest({
      path: "/api/orders",
      headers: { "x-clinic-id": "clinic-test" },
    });
    const res = createMockResponse();
    await handler(req, res);
    const body = res.json();

    expect(res.statusCode).toBe(200);
    expect(body.clinicId).toBe("clinic-test");
  });

  it("rejects order actions when client role headers are not trusted by default", async () => {
    const response = await request({
      path: "/api/orders/o1/approve",
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-clinic-id": "clinic-test",
        "x-user-id": "u2",
        "x-user-role": "manager",
      },
      body: { reviewNote: "승인합니다" },
    });
    const body = response.json();

    expect(response.statusCode).toBe(403);
    expect(body.error).toBe("order_action_forbidden");
  });

  it("allows production order actions through a configured bearer auth provider", async () => {
    const authProvider = createStaticBearerAuthProvider({
      tokens: {
        "valid-token": { clinicId: "clinic-prod", userId: "u9", role: "manager" },
      },
    });
    const server = createDentalStockHandler({
      env: {
        DENTALSTOCK_ALLOWED_ORIGINS: "http://127.0.0.1:5174",
        DENTALSTOCK_RATE_LIMIT_MAX: "1000",
      },
      authProvider,
    });
    const req = createMockRequest({
      path: "/api/orders/o1/approve",
      method: "POST",
      headers: {
        authorization: "Bearer valid-token",
        "content-type": "application/json",
      },
      body: { reviewNote: "승인합니다", vendorId: "denall" },
    });
    const res = createMockResponse();
    await server.handler(req, res);
    const body = res.json();

    expect(res.statusCode).toBe(202);
    expect(body).toMatchObject({
      clinicId: "clinic-prod",
      requestedBy: "u9",
      requestedRole: "manager",
      action: "approve",
    });
  });

  it("allows managers to approve orders when client context trust is explicitly enabled", async () => {
    const { response, services } = await requestWithServer(
      {
        path: "/api/orders/o1/approve",
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-clinic-id": "clinic-test",
          "x-user-id": "u2",
          "x-user-role": "manager",
        },
        body: { reviewNote: "승인합니다", vendorId: "denall", maxOrderAmount: 50000 },
      },
      { DENTALSTOCK_TRUST_CLIENT_CONTEXT: "true" },
    );
    const body = response.json();

    expect(response.statusCode).toBe(202);
    expect(body).toMatchObject({
      queued: true,
      action: "approve",
      auditAction: "order.approved",
      orderId: "o1",
      clinicId: "clinic-test",
      requestedBy: "u2",
      requestedRole: "manager",
      reviewNote: "승인합니다",
      stateTransition: { orderId: "o1", status: "ordered" },
    });
    expect(body.auditId).toBeDefined();
    expect(body.orderJobId).toBeDefined();

    const logs = await services.auditLogService.listByClinic({ clinicId: "clinic-test" });
    expect(logs[0]).toMatchObject({
      action: "order.approved",
      entity: "order",
      entityId: "o1",
      metadata: { review_note: "승인합니다" },
    });

    const jobs = await services.orderJobStore.listQueued({ clinicId: "clinic-test" });
    expect(jobs[0]).toMatchObject({
      jobId: body.orderJobId,
      clinicId: "clinic-test",
      orderId: "o1",
      vendorId: "denall",
      approvedBy: "u2",
      maxOrderAmount: 50000,
      status: "queued",
    });
  });

  it("rejects hygienists from server-side order actions even when context is trusted", async () => {
    const response = await request(
      {
        path: "/api/orders/o1/reject",
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-clinic-id": "clinic-test",
          "x-user-id": "u3",
          "x-user-role": "hygienist",
        },
        body: { reviewNote: "반려합니다" },
      },
      { DENTALSTOCK_TRUST_CLIENT_CONTEXT: "true" },
    );
    const body = response.json();

    expect(response.statusCode).toBe(403);
    expect(body.error).toBe("order_action_forbidden");
  });

  it("queues tracking registration without echoing full tracking numbers", async () => {
    const response = await request(
      {
        path: "/api/orders/o1/tracking",
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-clinic-id": "clinic-test",
          "x-user-id": "u1",
          "x-user-role": "owner",
        },
        body: { carrier: "CJ대한통운", trackingNumber: "1234567890" },
      },
      { DENTALSTOCK_TRUST_CLIENT_CONTEXT: "true" },
    );
    const body = response.json();

    expect(response.statusCode).toBe(202);
    expect(body.auditAction).toBe("order.tracking_registered");
    expect(body.carrier).toBe("CJ대한통운");
    expect(body.trackingNumberLast4).toBe("7890");
    expect(JSON.stringify(body)).not.toContain("1234567890");
  });

  it("validates receipt quantities on server-side order actions", async () => {
    const response = await request(
      {
        path: "/api/orders/o1/receive",
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-clinic-id": "clinic-test",
          "x-user-id": "u2",
          "x-user-role": "manager",
        },
        body: { actualQty: 3 },
      },
      { DENTALSTOCK_TRUST_CLIENT_CONTEXT: "true" },
    );
    const body = response.json();

    expect(response.statusCode).toBe(202);
    expect(body).toMatchObject({
      action: "receive",
      auditAction: "order.received",
      actualQty: 3,
    });
  });

  it("rejects invalid receipt quantities before queueing", async () => {
    const response = await request(
      {
        path: "/api/orders/o1/receive",
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-clinic-id": "clinic-test",
          "x-user-id": "u2",
          "x-user-role": "manager",
        },
        body: { actualQty: 0 },
      },
      { DENTALSTOCK_TRUST_CLIENT_CONTEXT: "true" },
    );
    const body = response.json();

    expect(response.statusCode).toBe(400);
    expect(body.error).toBe("actual_qty_invalid");
  });

  it("refreshes demo tracking without exposing full credential surfaces", async () => {
    const response = await request({
      path: "/api/tracking/refresh",
      method: "POST",
      headers: { "content-type": "application/json", "x-clinic-id": "clinic-test", "x-user-id": "u2", "x-user-role": "manager" },
      body: { carrier: "CJ대한통운", trackingNumber: "1234567890" },
    }, { DENTALSTOCK_TRUST_CLIENT_CONTEXT: "true" });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.provider).toBe("demo");
    expect(body.trackingNumberLast4).toBe("7890");
    expect(body.events[0].status).toBe("배송출발");
  });

  it("advances demo tracking to delivery based on current statuses", async () => {
    const response = await request({
      path: "/api/tracking/refresh",
      method: "POST",
      headers: { "content-type": "application/json", "x-clinic-id": "clinic-test", "x-user-id": "u2", "x-user-role": "manager" },
      body: {
        carrier: "CJ대한통운",
        trackingNumber: "1234567890",
        currentStatuses: ["배송중", "배송출발"],
      },
    }, { DENTALSTOCK_TRUST_CLIENT_CONTEXT: "true" });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.events[0]).toMatchObject({
      status: "배달완료",
      location: "치과 접수대",
      completed: true,
    });
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

  it("reports vendor credential status without exposing secret fields", async () => {
    const response = await request({
      path: "/api/vendor-credentials/1/status",
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toMatchObject({
      vendorId: "1",
      connected: false,
      stored: false,
      mode: "disabled",
    });
    expect(body.username).toBeUndefined();
    expect(body.password).toBeUndefined();
  });

  it("returns mock credential storage state when token exists but encrypted store is absent", async () => {
    const handler = createDentalStockHandler({
      env: {
        DENTALSTOCK_ALLOWED_ORIGINS: "http://127.0.0.1:5174",
        DENTALSTOCK_RATE_LIMIT_MAX: "1000",
        DENTALSTOCK_INTERNAL_ADMIN_TOKEN: "test-token",
      },
    }).handler;
    const req = createMockRequest({
      path: "/api/vendor-credentials/1",
      method: "POST",
      headers: { "content-type": "application/json", "x-internal-admin-token": "test-token" },
      body: { username: "demo", password: "secret" },
    });
    const res = createMockResponse();
    await handler(req, res);
    const body = res.json();

    expect(res.statusCode).toBe(202);
    expect(body).toMatchObject({
      vendorId: "1",
      connected: false,
      stored: false,
      mode: "mock",
    });
    expect(body.username).toBeUndefined();
    expect(body.password).toBeUndefined();
  });

  it("stores vendor credentials with encrypted server storage when token and key are configured", async () => {
    const env = {
      DENTALSTOCK_INTERNAL_ADMIN_TOKEN: "test-token",
      DENTALSTOCK_CREDENTIAL_ENCRYPTION_KEY: "12345678901234567890123456789012",
    };
    const { response: saveResponse } = await requestWithServer(
      {
        path: "/api/vendor-credentials/1",
        method: "POST",
        headers: { "content-type": "application/json", "x-internal-admin-token": "test-token" },
        body: { username: "demo", password: "secret" },
      },
      env,
    );
    const saveBody = saveResponse.json();

    expect(saveResponse.statusCode).toBe(202);
    expect(saveBody).toMatchObject({
      vendorId: "1",
      connected: true,
      stored: true,
      mode: "encrypted",
    });
    expect(JSON.stringify(saveBody)).not.toContain("secret");
  });

  it("returns a safe error when external tracking provider is selected without a client", async () => {
    const response = await request(
      {
        path: "/api/tracking/refresh",
        method: "POST",
        headers: { "content-type": "application/json", "x-clinic-id": "clinic-test", "x-user-id": "u2", "x-user-role": "manager" },
        body: { carrier: "CJ대한통운", trackingNumber: "1234567890" },
      },
      { DENTALSTOCK_TRACKING_PROVIDER: "external", DENTALSTOCK_TRUST_CLIENT_CONTEXT: "true" },
    );
    const body = response.json();

    expect(response.statusCode).toBe(503);
    expect(body.error).toBe("tracking_provider_not_configured");
    expect(JSON.stringify(body)).not.toContain("1234567890");
  });
});
