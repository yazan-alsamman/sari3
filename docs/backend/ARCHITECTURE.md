# Backend Architecture

## Purpose

Defines architectural boundaries, dependency rules, and module ownership for the Saree'e backend.

## Status

Intended architecture. Source code is not implemented yet.

Related decision record: [`adrs/ADR-001-system-architecture.md`](adrs/ADR-001-system-architecture.md).

## Architectural boundaries

### Domain

Pure business rules and invariants.

Must not depend on NestJS, Prisma, Redis, HTTP, or other infrastructure frameworks.

### Application

Use cases, command/query orchestration, transaction boundaries, ports.

### Infrastructure

Prisma repositories, Redis, queues, push providers, storage, maps/routing providers, realtime transport.

### Presentation

Controllers, DTOs, guards, serializers, WebSocket gateways.

## Core principles

- Dependency inversion.
- Explicit ports/adapters.
- No domain dependency on NestJS/Prisma.
- No controller business logic.
- Transactions around state transitions that must be atomic.
- Idempotency for retryable commands (**TBD — ADR-017**).
- Audit events for privileged or high-risk operations.

## Suggested module ownership

| Module | Owns |
|---|---|
| Orders | Order lifecycle |
| Dispatch | Offers / assignment |
| Tracking | Location samples / freshness |
| Pricing | Zone/mode calculation |
| Ratings | Rating eligibility and moderation signals |
| Finance | Immutable ledger records |
| Notifications | Delivery orchestration, not business eligibility |
| Service Zones | Geographic/operational zone configuration |
| Media | Object metadata and upload lifecycle |
| Admin | Privileged operational APIs (presentation/application orchestration) |

Exact module boundaries and shared-kernel rules: **TBD — ADR-001**.

## Related documents

- [`README.md`](README.md)
- [`DOMAIN_MODEL.md`](DOMAIN_MODEL.md)
- [`API_GUIDELINES.md`](API_GUIDELINES.md)
- [`adrs/ADR-001-system-architecture.md`](adrs/ADR-001-system-architecture.md)
