# Backend Roadmap

## Purpose

High-level phased delivery plan. Detailed checklists live in [`TASKS.md`](TASKS.md).

## Phase 0 — Documentation Foundation

- Normalize `docs/` hierarchy
- Split merged documents
- Create ADR infrastructure

## Phase 0B — Architecture Decision Freeze

Freeze via accepted ADRs (see [`LAUNCH_PATH.md`](LAUNCH_PATH.md)):

- domain boundaries
- state machines
- pricing policy
- dispatch policy
- capacity model
- multi-order routing
- tracking strategy
- authorization model
- data retention
- notification provider abstraction

**Progress:** Critical ADRs 001–009, 013, 015 are drafted as **PROPOSED — READY FOR ACCEPTANCE**. Owner sign-off required before Phase 1.
## Phase 1 — Foundation

- Repository setup.
- CI.
- NestJS modules.
- PostgreSQL/Prisma.
- Redis/BullMQ.
- Configuration.
- Logging.
- Health checks.

Depends on: ADR-001 (minimum), preferably ADR-019/020 direction.

## Phase 2 — Identity & Access

- Users.
- Customer/driver profiles.
- Authentication.
- Sessions.
- RBAC/policies.

Depends on: ADR-002, ADR-003.

## Phase 3 — Service Zones & Pricing

- Zones.
- Pricing rules.
- Price preview.
- Price snapshots.

Depends on: ADR-005, ADR-006.

## Phase 4 — Orders

- Order creation.
- Lifecycle.
- Media.
- Idempotency.

Depends on: ADR-004, ADR-015, ADR-017.

## Phase 5 — Dispatch

- Driver availability.
- Location freshness.
- Offers.
- Acceptance/rejection.
- Capacity.

Depends on: ADR-007, ADR-008, ADR-011.

## Phase 6 — Execution & Tracking

- Pickup/delivery checkpoints.
- Realtime.
- ETA.
- Multi-order route compatibility.

Depends on: ADR-009, ADR-010, ADR-016.

## Phase 7 — Ratings & Complaints

- Rating.
- Feedback.
- Alerts.
- Moderation.

Depends on: ADR-012.

## Phase 8 — Finance

- Driver ledger.
- Incentives.
- Penalties.
- Reporting.

Depends on: ADR-013.

## Phase 9 — Admin Operations

- Live dashboard APIs.
- Search/filter.
- Operational controls.
- Audit.

Depends on: ADR-003 and prior domain ADRs.

## Phase 10 — Production Hardening

- Load testing.
- Security review.
- Disaster recovery.
- Observability.
- Release readiness.

Depends on: ADR-018, ADR-019, ADR-020.
