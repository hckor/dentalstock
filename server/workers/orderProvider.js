export function createUnsupportedOrderProvider() {
  return Object.freeze({
    async submitOrder() {
      throw new Error("order_provider_not_configured");
    },
  });
}
