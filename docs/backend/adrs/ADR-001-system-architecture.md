# ADR-001: System Architecture & Module Boundaries

## Status

ACCEPTED

## Context

Saree'e needs a clear backend and overall system architecture so Flutter/Capacitor clients, admin APIs, workers, and infrastructure providers do not entangle domain rules with frameworks.

## Decision

**Choose Option B:** Modular NestJS monolith (single deployable API) **plus separate worker processes** sharing the same domain/application packages.

### Stack (production intent)

- Node.js + TypeScript (strict)
- NestJS modular monolith for HTTP/WebSocket presentation
- PostgreSQL + Prisma (infrastructure only)
- Redis + BullMQ for jobs/queues (workers)
- OpenAPI/Swagger for contracts
- Docker for local/prod parity

### Boundaries

| Layer | May depend on | Must not depend on |
|---|---|---|
| Domain | Nothing framework-specific | NestJS, Prisma, Redis, HTTP |
| Application | Domain + ports | Controllers, Prisma client directly |
| Infrastructure | Application ports | — |
| Presentation | Application use cases | Domain rules inline |

### Module ownership (initial)

`auth`, `users`, `customers`, `drivers`, `orders`, `dispatch`, `pricing`, `tracking`, `ratings`, `notifications`, `finance`, `service-zones`, `media`, `admin`

### Eventing

Transactional **outbox** for cross-module side effects (notifications, ledger hooks). In-process events allowed inside a module only.

### Repository layout

Monorepo:

```text
apps/backend/     ? NestJS API + worker entrypoints
docs/             ? authority for decisions
client/           ? demo / interim UI (not production authority)
```

Microservices are **out of scope for v1 market launch**.

## Decision Drivers

- Clean Architecture / DDD intent
- Independent scale of API vs workers
- Testability of domain rules
- Avoid NestJS/Prisma leakage into domain
- Faster market delivery than multi-service day one

## Considered Options

### Option A — Modular NestJS monolith only

Simpler ops; weaker isolation of background work.

### Option B — Modular monolith + separate worker processes ? **SELECTED**

### Option C — Multiple deployable services from day one

Higher ops cost; premature for v1.

## Consequences

- One Postgres schema owned carefully by modules
- Workers and API share domain packages
- Clear path to extract a service later if needed

## Security Implications

- Secrets only via env/secret manager
- No domain secrets in client
- Admin APIs behind same authZ framework (ADR-003)

## Operational Implications

- Deploy API and worker(s) as separate processes/containers
- Shared migration ownership in CI

## Data Implications

- Single primary database for v1
- Redis for ephemeral state (sessions/refresh metadata, queues, presence cache)

## API Implications

- Versioned REST under `/api/v1`
- Realtime transport decided in ADR-010

## Mobile Implications

- Clients consume OpenAPI contracts only
- Demo `client/` localStorage is not production backend

## Dependencies

- None (root ADR)

## Open Questions

- Exact Flutter vs Capacitor long-term client (product; does not block backend Phase 1)
- Wave-2 ADRs 019/020 finalize CI/CD topology details

## Approval

- Decision owner: Product Owner
- Approved by: Yazan (CTO) — accepted backend work order
- Date: 2026-09-22
