export async function loadDentalMaterialCatalog() {
  const preparedCatalog = await import("./dentalMaterialCatalogPrepared.js");
  const { materials } = await preparedCatalog.loadDentalMaterialCatalogPreparedData();
  return materials;
}
