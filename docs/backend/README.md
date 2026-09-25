# Saree'e Backend — Node.js

## Purpose

Documentation for the intended production backend serving authentication, orders, dispatch, pricing, tracking, ratings, notifications, finance, and admin operations.

## Scope

Intended production-grade backend for:

- Authentication.
- Customers.
- Drivers.
- Orders.
- Dispatch.
- Pricing.
- Tracking.
- Ratings.
- Notifications.
- Financial ledgers.
- Admin operations.
- Reporting.

## Status

Documentation only. Backend application source code is **not implemented** in this repository yet.

## Suggested stack (intent)

- Node.js + TypeScript
- NestJS
- PostgreSQL
- Prisma
- Redis
- BullMQ
- WebSocket/Socket.IO or another documented realtime transport (**TBD — ADR-010**)
- Swagger/OpenAPI
- Docker
- Object storage such as MinIO/S3-compatible provider (**TBD — ADR-015**)

These are documented intentions until source code and ADRs confirm them.

## Architecture overview

Clean Architecture + DDD with modular ownership.

Suggested module layout (intent):

```text
apps/backend/src/
  modules/
    auth/
    users/
    customers/
    drivers/
    orders/
    dispatch/
    pricing/
    tracking/
    ratings/
    notifications/
    finance/
    service-zones/
    media/
    admin/
  shared/
```

Each module separates:

- Domain
- Application/use cases
- Infrastructure
- Presentation/API

Details: [`ARCHITECTURE.md`](ARCHITECTURE.md).

## API

Base path:

`/api/v1`

## Backend authority

The backend is the source of truth for:

- Authorization.
- Pricing.
- Order state.
- Dispatch.
- Tracking freshness.
- Ratings.
- Financial records.

## Documents in this folder

| File | Responsibility |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Layer boundaries and module ownership |
| [`DOMAIN_MODEL.md`](DOMAIN_MODEL.md) | Domain concepts and classifications |
| [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) | Conceptual persistence model |
| [`ORDER_LIFECYCLE.md`](ORDER_LIFECYCLE.md) | Order states and transition matrix |
| [`DISPATCH.md`](DISPATCH.md) | Driver offer/assignment specification |
| [`MULTI_ORDER_ROUTING.md`](MULTI_ORDER_ROUTING.md) | Multi-order compatibility |
| [`PRICING.md`](PRICING.md) | Pricing structure |
| [`TRACKING.md`](TRACKING.md) | Live tracking ingestion/freshness |
| [`RATINGS.md`](RATINGS.md) | Ratings and complaints |
| [`FINANCE.md`](FINANCE.md) | Ledger and settlements |
| [`NOTIFICATIONS.md`](NOTIFICATIONS.md) | Notification orchestration |
| [`AUTH_SECURITY.md`](AUTH_SECURITY.md) | Authentication and authorization |
| [`API_GUIDELINES.md`](API_GUIDELINES.md) | REST conventions |
| [`API_ENDPOINT_CATALOG.md`](API_ENDPOINT_CATALOG.md) | Endpoint planning catalog |
| [`ADMIN.md`](ADMIN.md) | Admin operations and client scope |
| [`DEMO_ADMIN_UI.md`](DEMO_ADMIN_UI.md) | Prototype Admin Web UI at `/admin` (demo credentials & 80/20 / ≤2) |
| [`MEDIA.md`](MEDIA.md) | Media/object storage |
| [`REALTIME.md`](REALTIME.md) | Realtime transport strategy |
| [`JOBS.md`](JOBS.md) | Background jobs |
| [`OBSERVABILITY.md`](OBSERVABILITY.md) | Logs, metrics, alerts |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Deployment and environments |
| [`ROADMAP.md`](ROADMAP.md) | Phased delivery plan |
| [`TASKS.md`](TASKS.md) | Implementation task tracker |
| [`TESTING.md`](TESTING.md) | Backend test strategy |
| [`SECURITY_THREAT_MODEL.md`](SECURITY_THREAT_MODEL.md) | Threats and mitigations |
| [`ADR_INDEX.md`](ADR_INDEX.md) | ADR index and dependency order |
| [`adrs/`](adrs/) | Individual ADR templates |

## Related shared docs

- [`../shared/PRODUCT_REQUIREMENTS.md`](../shared/PRODUCT_REQUIREMENTS.md)
- [`../shared/NFR.md`](../shared/NFR.md)
- [`../shared/DOMAIN_GLOSSARY.md`](../shared/DOMAIN_GLOSSARY.md)
