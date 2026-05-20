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
- `POST /api/orders/:orderId/reject`
- `POST /api/orders/:orderId/tracking`
- `POST /api/orders/:orderId/receive`
- `POST /api/tracking/refresh`
- `GET /api/vendor-credentials/:vendorId/status`
- `POST /api/vendor-credentials/:vendorId`

`POST /api/vendor-credentials/:vendorId` is disabled unless `DENTALSTOCK_INTERNAL_ADMIN_TOKEN` is set. Internal access is checked through the auth service boundary with `x-internal-admin-token`; this is separate from user bearer auth. Encrypted storage also requires `DENTALSTOCK_CREDENTIAL_ENCRYPTION_KEY` with a 32-byte utf8/base64 or 64-char hex key. Responses expose only connection/storage status, never usernames or passwords.

Order action routes enforce server-side role checks and payload validation. `owner` and `manager` can approve, reject, register tracking, and confirm receipt. Other roles receive `403 order_action_forbidden`. Approval creates an append-only audit log and enqueues an `orderJob` in the server-side repository boundary.

## Security Defaults

- client-provided clinic/user/role headers are ignored by default
- production mode reads user context only from `Authorization: Bearer ...` through the auth provider interface
- the default production provider is intentionally unconfigured and falls back to anonymous context until Firebase/Auth0 wiring is added
- `DENTALSTOCK_TRUST_CLIENT_CONTEXT=true` maps to `test-header` mode and enables header-based context for local tests only
- no-store cache header
- basic CORS allow-list
- basic in-memory rate limit
- vendor credential writes disabled by default
- vendor credentials require AES-256-GCM encrypted server storage before returning `mode: encrypted`
- tracking provider is selected with `DENTALSTOCK_TRACKING_PROVIDER`; `demo` is the default and `external` fails closed until a provider client is wired
- external tracking requires `DENTALSTOCK_TRACKING_ENDPOINT` over HTTPS and `DENTALSTOCK_TRACKING_API_KEY`
- tracking response masks full tracking number to last four digits
- order tracking registration responses mask full tracking numbers to last four digits
- order approval responses expose `auditId` and `orderJobId`, not credential or provider secrets
