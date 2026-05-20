export function createTrackingService() {
  return {
    async refresh({ carrier, trackingNumber }) {
      if (!carrier || !trackingNumber) {
        const error = new Error("carrier_and_tracking_number_required");
        error.statusCode = 400;
        throw error;
      }

      return {
        provider: "demo",
        carrier,
        trackingNumberLast4: String(trackingNumber).slice(-4),
        events: [
          {
            status: "배송조회 준비",
            location: carrier,
            timestamp: new Date().toISOString(),
            completed: true,
          },
        ],
      };
    },
  };
}
