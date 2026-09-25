# Backend Launch Path — Market-Ready (Professional)

## Purpose

Defines the **only approved path** from the current demo prototype to a production Saree'e backend suitable for market launch.

Critical ADRs ACCEPTED. Phase 1 foundation authorized.

## Principle

```text
DOCUMENTATION FIRST → ADR ACCEPTANCE → IMPLEMENTATION → TEST → SHIP
```

Phase 0B gate passed. Phase 1 NestJS/Prisma foundation is authorized.

## Current state

| Layer | Status |
|---|---|
| Product demo (`client/`) | High-quality prototype (localStorage) |
| Backend source | **Phase 1 foundation verified locally** (`apps/backend`) |
| ADRs 001-009, 013, 015 | **ACCEPTED** (CTO 2026-09-22) |
| ADRs 010-012, 014, 016-020 | Still PROPOSED (wave-2 freeze) |
| Phase 0B | **COMPLETE** — critical ADRs ACCEPTED (CTO 2026-09-22) |
| Local runtime | API `:3001` ready (Postgres+Redis up); demo client `:3000` |

## User-confirmed commercial / ops values (freeze into ADRs)

These came from product owner confirmation (demo + this thread). They are **business decisions**, not AI guesses:

| Topic | Frozen value |
|---|---|
| Currency display | ?�?�?�?�???? ?�?�???�???�?? ?�?�?????�???? (?�.??.??) |
| Driver / platform share | **75% / 25%** of delivery charge |
| Driver bonuses | Flat per-trip bonus configurable by admin |
| Service areas (v1) | ?�?�?� ?�?�?�???� ???�?�?????� ?�???�?�?�???� ?�?????� ?????�?�?�?�?� ?�???�?? ???�?�?�?�?�?� ?�???�?? ?�?�?�???�?�?� ?�???�?? ???�?� ???�???�?� ???�?�???�?? ???�?� ???�?�?� |
| Package classes | **light** vs **heavy** (heavy: ?�?�?�???� ???�?�?�?� ?�?�???�?� ?????�?? ?�?�???�?� ?????�???�???� ???�?�?? ?�?� ?�?�?�) |
| Basket matching | Heavy → large basket only; small basket → light only |
| Max active orders | **2** |
| Second-order window | ≤ **5 minutes** to first delivery **or** after first delivery completes |
| Driver VIP filter | **Removed** (VIP remains order mode only) |
| Driver onboarding | Name + surname + birth date + ID photo + vehicle + basket size + capacity → **pending admin approval** |
| Bad rating alert | stars ≤ **2** |
| Offer window (demo → production intent) | **15 seconds** |

Amounts for zone bases / VIP surcharge / stop fees remain **admin-configurable**; production seed may use demo defaults until commercial pricing sheet is signed.

## Path to market (phases)

### Phase 0B — Architecture Decision Freeze (NOW)

1. Product owner reviews decision drafts in ADRs marked **PROPOSED — READY FOR ACCEPTANCE**.
2. Owner replies with acceptance per ADR (or batch: `ACCEPT ADR-001..009,013,015`).
3. Agent sets those ADRs to **ACCEPTED** and updates `ADR_INDEX.md` / `TASKS.md`.
4. Remaining ADRs (010–012, 014, 016–020) get the same treatment in a second freeze wave before their phases.

**Gate:** No Phase 1 code until **ADR-001, 002, 003** are ACCEPTED (minimum). Full order/dispatch/finance work additionally requires **004–009, 013, 015**.

### Phase 1 — Foundation

Depends on: ADR-001 (+ direction from 019/020).

- Monorepo `apps/backend` (NestJS + TypeScript strict)
- PostgreSQL + Prisma migrations
- Redis + BullMQ
- Config, secrets, health/readiness
- Structured logging, OpenAPI
- CI (lint, typecheck, unit tests)

### Phase 2 — Identity & Access

Depends on: ADR-002, ADR-003, ADR-015 (ID photo).

- Users / roles
- Customer & driver registration
- Argon2id passwords
- JWT access + rotating refresh
- Driver KYC pending → admin approve
- Admin RBAC

### Phase 3 — Zones & Pricing

Depends on: ADR-005, ADR-006.

- Named service areas (v1 list)
- Price preview + immutable price snapshot
- Admin pricing config

### Phase 4 — Orders

Depends on: ADR-004, ADR-015, ADR-017.

- Create order with package weight class
- Lifecycle transitions (server-authoritative)
- Idempotent submit

### Phase 5 — Dispatch & Capacity

Depends on: ADR-007, ADR-008, ADR-011.

- Availability + location freshness
- Basket / weight eligibility
- Offers (15s), accept/reject, first-accept wins

### Phase 6 — Multi-order & Tracking

Depends on: ADR-009, ADR-010, ADR-016.

- Second order near delivery / after complete (max 2)
- Customer status “driver on the way”
- Live tracking transport

### Phase 7 — Finance & Ratings

Depends on: ADR-013, ADR-012.

- Ledger 75/25 + bonuses
- Settlements reporting
- Ratings + bad-rating alerts

### Phase 8 — Notifications, Observability, Deploy

Depends on: ADR-014, ADR-018, ADR-019, ADR-020.

- Push provider abstraction
- Retention/privacy
- Metrics/tracing
- Production topology (API + workers)

### Phase 9 — Client cutover

- Replace demo localStorage bus with real APIs
- Capacitor / Flutter client against production contracts
- Soft launch → harden → public market launch

## Quality bar (non-negotiable)

- Domain rules never live in controllers
- Illegal order transitions rejected server-side
- No invented commercial formulas
- Every money movement is ledgered and auditable
- AuthZ on every resource (no IDOR)
- Automated tests for lifecycle, dispatch races, finance splits
- Runbooks for deploy/rollback

## What we will NOT do

- Port the demo localStorage “bus” as production architecture
- Ship without ACCEPTED ADRs for the feature being built
- Invent VIP commissions, fees, or ETA formulas without owner sign-off
- Start microservices on day one (modular monolith first — ADR-001)

## Immediate next action for product owner

Review and accept the decision drafts:

1. [`adrs/ADR-001-system-architecture.md`](adrs/ADR-001-system-architecture.md)
2. [`adrs/ADR-002-authentication-session.md`](adrs/ADR-002-authentication-session.md)
3. [`adrs/ADR-003-authorization-resource-scoping.md`](adrs/ADR-003-authorization-resource-scoping.md)
4. [`adrs/ADR-004-order-state-machine.md`](adrs/ADR-004-order-state-machine.md)
5. [`adrs/ADR-005-service-zone-model.md`](adrs/ADR-005-service-zone-model.md)
6. [`adrs/ADR-006-pricing-and-price-snapshot.md`](adrs/ADR-006-pricing-and-price-snapshot.md)
7. [`adrs/ADR-008-driver-capacity.md`](adrs/ADR-008-driver-capacity.md)
8. [`adrs/ADR-007-dispatch-selection.md`](adrs/ADR-007-dispatch-selection.md)
9. [`adrs/ADR-009-multi-order-route-compatibility.md`](adrs/ADR-009-multi-order-route-compatibility.md)
10. [`adrs/ADR-013-financial-ledger.md`](adrs/ADR-013-financial-ledger.md)
11. [`adrs/ADR-015-media-storage.md`](adrs/ADR-015-media-storage.md)

Reply example:

```text
ACCEPT ADR-001,002,003,004,005,006,007,008,009,013,015
```

Only then may Phase 1 implementation begin.

## Related

- [`TASKS.md`](TASKS.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`ADR_INDEX.md`](ADR_INDEX.md)
- [`DEMO_ADMIN_UI.md`](DEMO_ADMIN_UI.md) (prototype only — not production authority)
