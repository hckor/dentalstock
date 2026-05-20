import { createDentalStockServer } from "./app.js";

const { server, config } = createDentalStockServer();

server.listen(config.port, config.host, () => {
  console.log(`DentalStock API skeleton listening on http://${config.host}:${config.port}`);
});
