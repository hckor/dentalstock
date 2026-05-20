const MAX_STATUS_COUNT = 10;
const MAX_EVENT_TEXT_LENGTH = 120;

function createHttpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validateInput({ carrier, trackingNumber, currentStatuses }) {
  if (
    typeof carrier !== "string" ||
    typeof trackingNumber !== "string" ||
    carrier.trim().length < 1 ||
    carrier.length > 40 ||
    trackingNumber.trim().length < 4 ||
    trackingNumber.length > 80
  ) {
    throw createHttpError("carrier_and_tracking_number_required", 400);
  }

  if (!Array.isArray(currentStatuses) || currentStatuses.length > MAX_STATUS_COUNT) {
    throw createHttpError("invalid_tracking_statuses", 400);
  }

  return {
    carrier,
    trackingNumber,
    currentStatuses: currentStatuses.filter(status => typeof status === "string" && status.length <= 40),
  };
}

function sanitizeEventText(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_EVENT_TEXT_LENGTH) return undefined;
  return trimmed;
}

function sanitizeEvents(events) {
  if (!Array.isArray(events)) return [];

  return events
    .slice(0, MAX_STATUS_COUNT)
    .map(event => {
      if (!event || typeof event !== "object") return null;

      const status = sanitizeEventText(event.status);
      if (!status) return null;

      const sanitized = {
        status,
        completed: event.completed === true,
      };
      const location = sanitizeEventText(event.location);
      const label = sanitizeEventText(event.label);
      const timestamp = sanitizeEventText(event.timestamp);

      if (location) sanitized.location = location;
      if (label) sanitized.label = label;
      if (timestamp) sanitized.timestamp = timestamp;

      return sanitized;
    })
    .filter(Boolean);
}

export function createDemoTrackingProvider({ now = () => new Date() } = {}) {
  return {
    name: "demo",
    async refresh({ carrier, currentStatuses }) {
      const timestamp = now().toISOString();
      let nextEvent = null;

      if (!currentStatuses.includes("배송출발")) {
        nextEvent = {
          status: "배송출발",
          location: carrier,
          label: "배송사가 상품을 인수했습니다",
          timestamp,
          completed: true,
        };
      } else if (!currentStatuses.includes("배달완료")) {
        nextEvent = {
          status: "배달완료",
          location: "치과 접수대",
          label: "치과에 도착했습니다",
          timestamp,
          completed: true,
        };
      }

      return {
        events: nextEvent ? [nextEvent] : [],
      };
    },
  };
}

export function createExternalTrackingProvider({ client } = {}) {
  return {
    name: "external",
    async refresh(input) {
      if (!client || typeof client.refreshTracking !== "function") {
        throw createHttpError("tracking_provider_not_configured", 503);
      }

      const result = await client.refreshTracking(input);
      return {
        events: result?.events,
      };
    },
  };
}

export function createHttpTrackingClient({
  endpoint,
  apiKey,
  fetchImpl = globalThis.fetch,
  timeoutMs = 5000,
} = {}) {
  return {
    async refreshTracking(input) {
      if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
        throw createHttpError("tracking_endpoint_invalid", 500);
      }
      if (typeof apiKey !== "string" || apiKey.trim().length < 8) {
        throw createHttpError("tracking_api_key_required", 500);
      }
      if (typeof fetchImpl !== "function") {
        throw createHttpError("tracking_fetch_unavailable", 500);
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            carrier: input.carrier,
            trackingNumber: input.trackingNumber,
            currentStatuses: input.currentStatuses,
          }),
          signal: controller.signal,
        });

        if (!response?.ok) {
          throw createHttpError("tracking_provider_failed", 502);
        }

        return await response.json();
      } catch (error) {
        if (error.statusCode) throw error;
        throw createHttpError("tracking_provider_unreachable", 502);
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}

function resolveProvider(provider, { externalClient } = {}) {
  if (!provider || provider === "demo") return createDemoTrackingProvider();
  if (provider === "external") return createExternalTrackingProvider({ client: externalClient });
  if (provider && typeof provider.refresh === "function") {
    return {
      name: provider.name === "demo" || provider.name === "external" ? provider.name : "custom",
      refresh: provider.refresh.bind(provider),
    };
  }

  throw createHttpError("tracking_provider_invalid", 500);
}

export function createTrackingService({ provider, externalClient } = {}) {
  const selectedProvider = resolveProvider(provider, { externalClient });

  return {
    async refresh({ carrier, trackingNumber, currentStatuses = [] }) {
      const input = validateInput({ carrier, trackingNumber, currentStatuses });
      const providerResult = await selectedProvider.refresh(input);

      return {
        provider: selectedProvider.name,
        carrier: input.carrier,
        trackingNumberLast4: input.trackingNumber.slice(-4),
        events: sanitizeEvents(providerResult?.events),
      };
    },
  };
}
