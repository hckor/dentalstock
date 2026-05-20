# DentalStock API Skeleton

This folder is the backend entry point for automation work. It intentionally uses Node's built-in HTTP server for now, so the project can run without adding network-installed dependencies. The route/service boundaries are shaped so Express or Fastify can replace the thin HTTP layer later.

## Run

```bash
npm run server
```

Default URL: `http://127.0.0.1:8787`

## Routes

- `GET /health`
- `GET /api/orders`
- `POST /api/orders/:orderId/approve`
- `POST /api/tracking/refresh`
- `GET /api/vendor-credentials/:vendorId/status`
- `POST /api/vendor-credentials/:vendorId`

`POST /api/vendor-credentials/:vendorId` is disabled unless `DENTALSTOCK_INTERNAL_ADMIN_TOKEN` is set. The current skeleton must not store real vendor credentials.

## Security Defaults

- clinic context from `x-clinic-id`
- no-store cache header
- basic CORS allow-list
- basic in-memory rate limit
- vendor credential writes disabled by default
- tracking response masks full tracking number to last four digits
