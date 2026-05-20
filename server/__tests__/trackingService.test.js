import { describe, expect, it, vi } from "vitest";
import {
  createDemoTrackingProvider,
  createExternalTrackingProvider,
  createHttpTrackingClient,
  createTrackingService,
} from "../services/trackingService.js";

describe("tracking service provider boundary", () => {
  it("uses the demo provider by default without exposing full tracking numbers", async () => {
    const service = createTrackingService({
      provider: createDemoTrackingProvider({ now: () => new Date("2026-05-20T00:00:00.000Z") }),
    });

    const result = await service.refresh({
      carrier: "CJ대한통운",
      trackingNumber: "1234567890",
      currentStatuses: [],
    });

    expect(result).toEqual({
      provider: "demo",
      carrier: "CJ대한통운",
      trackingNumberLast4: "7890",
      events: [
        {
          status: "배송출발",
          location: "CJ대한통운",
          label: "배송사가 상품을 인수했습니다",
          timestamp: "2026-05-20T00:00:00.000Z",
          completed: true,
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain("1234567890");
  });

  it("can select the external provider placeholder with an injected client", async () => {
    const refreshTracking = vi.fn(async () => ({
      events: [{ status: "배송중", location: "허브", label: "이동 중", completed: true }],
    }));
    const service = createTrackingService({ provider: "external", externalClient: { refreshTracking } });

    const result = await service.refresh({
      carrier: "롯데택배",
      trackingNumber: "998877665544",
      currentStatuses: ["배송출발"],
    });

    expect(refreshTracking).toHaveBeenCalledWith({
      carrier: "롯데택배",
      trackingNumber: "998877665544",
      currentStatuses: ["배송출발"],
    });
    expect(result).toMatchObject({
      provider: "external",
      carrier: "롯데택배",
      trackingNumberLast4: "5544",
      events: [{ status: "배송중", location: "허브", label: "이동 중", completed: true }],
    });
    expect(JSON.stringify(result)).not.toContain("998877665544");
  });

  it("reports an unconfigured external provider without leaking credentials", async () => {
    const service = createTrackingService({ provider: "external" });

    await expect(
      service.refresh({
        carrier: "CJ대한통운",
        trackingNumber: "1234567890",
        currentStatuses: [],
      }),
    ).rejects.toMatchObject({
      message: "tracking_provider_not_configured",
      statusCode: 503,
    });
  });

  it("does not pass through provider response fields that could expose tokens or invoices", async () => {
    const service = createTrackingService({
      provider: {
        name: "secret-token-1234567890",
        async refresh() {
          return {
            provider: "secret-token-1234567890",
            trackingNumber: "1234567890",
            token: "external-token",
            events: [
              {
                status: "배송중",
                location: "허브",
                label: "외부사 이벤트",
                completed: true,
                token: "external-token",
                trackingNumber: "1234567890",
              },
            ],
          };
        },
      },
    });

    const result = await service.refresh({
      carrier: "CJ대한통운",
      trackingNumber: "1234567890",
      currentStatuses: [],
    });
    const serialized = JSON.stringify(result);

    expect(result.provider).toBe("custom");
    expect(result.trackingNumberLast4).toBe("7890");
    expect(serialized).not.toContain("1234567890");
    expect(serialized).not.toContain("secret-token");
    expect(serialized).not.toContain("external-token");
  });

  it("keeps the external provider factory as a provider interface implementation", async () => {
    const provider = createExternalTrackingProvider({
      client: {
        async refreshTracking() {
          return { events: [{ status: "배달완료", completed: true }] };
        },
      },
    });
    const service = createTrackingService({ provider });

    const result = await service.refresh({
      carrier: "우체국택배",
      trackingNumber: "111122223333",
      currentStatuses: ["배송출발"],
    });

    expect(result.provider).toBe("external");
    expect(result.events).toEqual([{ status: "배달완료", completed: true }]);
  });

  it("can call an HTTPS tracking client without exposing provider tokens in the service response", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      async json() {
        return {
          token: "provider-token",
          trackingNumber: "111122223333",
          events: [
            { status: "배송출발", location: "허브", label: "출발", completed: true, token: "provider-token" },
          ],
        };
      },
    }));
    const externalClient = createHttpTrackingClient({
      endpoint: "https://tracking.example.test/refresh",
      apiKey: "secret-api-key",
      fetchImpl,
    });
    const service = createTrackingService({ provider: "external", externalClient });

    const result = await service.refresh({
      carrier: "우체국택배",
      trackingNumber: "111122223333",
      currentStatuses: ["배송중"],
    });

    expect(fetchImpl).toHaveBeenCalledWith("https://tracking.example.test/refresh", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ authorization: "Bearer secret-api-key" }),
    }));
    expect(result).toMatchObject({
      provider: "external",
      trackingNumberLast4: "3333",
      events: [{ status: "배송출발", location: "허브", label: "출발", completed: true }],
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("111122223333");
    expect(serialized).not.toContain("secret-api-key");
    expect(serialized).not.toContain("provider-token");
  });

  it("requires HTTPS endpoints for external tracking clients", async () => {
    const externalClient = createHttpTrackingClient({
      endpoint: "http://tracking.example.test/refresh",
      apiKey: "secret-api-key",
      fetchImpl: vi.fn(),
    });

    await expect(
      externalClient.refreshTracking({
        carrier: "CJ대한통운",
        trackingNumber: "1234567890",
        currentStatuses: [],
      }),
    ).rejects.toMatchObject({
      message: "tracking_endpoint_invalid",
      statusCode: 500,
    });
  });
});
