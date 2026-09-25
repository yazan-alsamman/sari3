# Saree'e Documentation

## What is Saree'e?

Saree'e (سريع) is a motorcycle-based automotive-parts delivery platform.

Actors:

- **Customer** — merchant/mechanic who creates, tracks, and rates deliveries.
- **Driver** — motorcycle courier who receives offers, executes deliveries, and shares operational location.
- **Admin / Operations** — privileged operators who manage zones, pricing, drivers, orders, ratings, finance, and live tracking.

Product surfaces:

- Flutter mobile app (customer + driver).
- Backend REST/realtime APIs (Node.js / NestJS — intended).
- Admin operational APIs (admin web UI client scope is a product decision; see [`backend/ADMIN.md`](backend/ADMIN.md)).

## Documentation structure

```text
docs/
├── README.md                 ← this file
├── MANIFEST.md               ← complete file inventory
├── shared/                   ← product, glossary, NFR
├── mobile/                   ← Flutter architecture & UX
└── backend/                  ← backend architecture, domain, API, ops
    └── adrs/                 ← Architecture Decision Records
```

## Authority rules

1. **`docs/` is the single source of truth** for product and engineering documentation.
2. ADRs in `docs/backend/adrs/` are the mechanism for freezing architectural decisions.
3. Until an ADR is **Accepted**, related implementation must not begin.
4. Backend state is authoritative for order status, pricing, dispatch, ratings eligibility, and financial records.
5. Mobile documentation must not invent backend business rules.
6. Unresolved decisions must remain explicit `TBD` references to the owning ADR.

## Shared documentation

| File | Responsibility |
|---|---|
| [`shared/PRODUCT_REQUIREMENTS.md`](shared/PRODUCT_REQUIREMENTS.md) | Product scope and requirements |
| [`shared/DOMAIN_GLOSSARY.md`](shared/DOMAIN_GLOSSARY.md) | Shared terminology |
| [`shared/NFR.md`](shared/NFR.md) | Non-functional requirements |

## Mobile documentation

Start at [`mobile/README.md`](mobile/README.md).

Covers Flutter architecture, navigation, customer/driver flows, notifications, location, ratings UX, design system, testing, and release.

## Backend documentation

Start at [`backend/README.md`](backend/README.md).

Covers domain model, lifecycle, dispatch, pricing, tracking, finance, auth, API, admin operations, jobs, observability, deployment, roadmap, tasks, testing, and threat model.

## ADR directory

See [`backend/ADR_INDEX.md`](backend/ADR_INDEX.md) and [`backend/adrs/`](backend/adrs/).

Critical-path ADRs (001–009, 013, 015) have decision drafts marked **PROPOSED — READY FOR ACCEPTANCE**. None are ACCEPTED until the Product Owner signs off.

Market launch sequence: [`backend/LAUNCH_PATH.md`](backend/LAUNCH_PATH.md).

### Recommended ADR dependency order

```text
ADR-001 System Architecture
  → ADR-002 Authentication
  → ADR-003 Authorization
  → ADR-004 Order State Machine
  → ADR-005 Service Zones
  → ADR-006 Pricing
  → ADR-008 Driver Capacity
  → ADR-007 Dispatch
  → ADR-009 Multi-Order Routing
  → ADR-010 Live Tracking Transport
  → ADR-011 Location Freshness & Retention
  → ADR-012 Ratings & Complaints
  → ADR-013 Financial Ledger
  → ADR-014 Notification Provider
  → ADR-015 Media Storage
  → ADR-016 Realtime Authorization
  → ADR-017 Idempotency
  → ADR-018 Data Retention & Privacy
  → ADR-019 Observability
  → ADR-020 Deployment Topology
```

## Recommended reading order

1. [`shared/PRODUCT_REQUIREMENTS.md`](shared/PRODUCT_REQUIREMENTS.md)
2. [`shared/NFR.md`](shared/NFR.md)
3. [`backend/ARCHITECTURE.md`](backend/ARCHITECTURE.md)
4. [`backend/DOMAIN_MODEL.md`](backend/DOMAIN_MODEL.md)
5. [`backend/ORDER_LIFECYCLE.md`](backend/ORDER_LIFECYCLE.md)
6. [`backend/ADR_INDEX.md`](backend/ADR_INDEX.md)
7. [`backend/TASKS.md`](backend/TASKS.md)
8. [`mobile/ARCHITECTURE.md`](mobile/ARCHITECTURE.md)

## Development phase strategy

| Phase | Goal |
|---|---|
| Phase 0 | Documentation repair & ADR infrastructure (current) |
| Phase 0B | Architecture decision freeze (approve blocking ADRs) |
| Phase 1+ | Incremental implementation per [`backend/ROADMAP.md`](backend/ROADMAP.md) |

Do not implement a later phase by guessing missing architecture. Update the relevant ADR/document first.
