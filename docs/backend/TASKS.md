# Implementation Tasks

## Purpose

Source of truth for implementation sequencing and verification checklists.

## Rule

Do not implement a later phase by guessing missing architecture.

Stop and update the relevant ADR/document first.

## Phase 0 — Documentation foundation

- [x] Normalize documentation under `docs/`
- [x] Split merged documents
- [x] Create ADR-001..020 templates (PROPOSED)
- [x] Write market launch path [`LAUNCH_PATH.md`](LAUNCH_PATH.md)
- [x] Fill critical ADR decision drafts (001–009, 013, 015)
- [x] Product Owner / CTO accepts critical ADRs (Phase 0B gate) — 2026-09-22

## Phase 0B — Architecture decision freeze

- [x] **ACCEPT** ADR-001 System Architecture
- [x] **ACCEPT** ADR-002 Authentication
- [x] **ACCEPT** ADR-003 Authorization
- [x] **ACCEPT** ADR-004 Order lifecycle (rating after COMPLETED)
- [x] **ACCEPT** ADR-005 Service zones (named area list)
- [x] **ACCEPT** ADR-006 Pricing + snapshot
- [x] **ACCEPT** ADR-008 Capacity / basket matching
- [x] **ACCEPT** ADR-007 Dispatch (parallel offers, 15s)
- [x] **ACCEPT** ADR-009 Multi-order (max 2, ?5 min gate)
- [x] **ACCEPT** ADR-013 Finance 75/25 + bonuses
- [x] **ACCEPT** ADR-015 Media / KYC storage
- [x] **ACCEPT** ADR-017 Idempotency (Option A � client key, 24h replay)
- [ ] Wave-2 drafts: ADR-010, 011, 012, 014, 016, 018�020
- [x] Sync `ORDER_LIFECYCLE.md` after ADR-004 ACCEPTED (Option B noted)

## Phase 1 — Foundation

**COMPLETE** (local verify 2026-09-22; CI workflow added). Critical ADRs ACCEPTED (CTO 2026-09-22).

- [x] Initialize `apps/backend` layout
- [x] Configure NestJS + TypeScript strict
- [x] Configure PostgreSQL/Prisma (bootstrap `schema_meta` migration)
- [x] Configure Redis adapter + `docker-compose.yml`
- [x] Health liveness + readiness
- [x] Env validation + boot logging
- [x] OpenAPI at `/docs`
- [x] CI workflow (GitHub Actions — typecheck + unit tests)
- [x] Verify migrate + `/health/ready` locally (Postgres 16 + Redis; Docker Desktop install blocked on this machine)
- [x] CORS for demo client origins + client Phase 1 health banner (not domain cutover)

## Phase 2 — Identity & Access

**COMPLETE** (identity slice 2026-09-25; media signed GET and orphan cleanup 2026-10-12). OTP still deferred.

Depends on: ADR-002, ADR-003, ADR-015 (ACCEPTED). S3/MinIO when reachable; local disk otherwise.

- [x] Prisma: users, profiles, refresh sessions, media objects, audit log
- [x] Register customer / driver / bootstrap admin
- [x] Login + Argon2id verify
- [x] JWT access (15m) + opaque rotating refresh (hashed)
- [x] Logout / me
- [x] RolesGuard + DriverApprovedGuard
- [x] Media presign + local PUT upload + confirm (+ public KYC one-shot)
- [x] Signed GET (5 min), admin-only KYC view with audit, prefixes `kyc/` `orders/` `proofs/`
- [x] Orphan unconfirmed media cleanup after 24h (hourly sweep)
- [x] Admin list pending / approve / reject drivers
- [ ] Phone OTP verification (blocked on ADR-014 PROPOSED — left out on purpose)
- [x] MinIO/S3 adapter (ADR-015). Local disk remains the fallback when MinIO is not running
- [x] Wire demo client login/register (customer, driver, admin) to these APIs

## Phase 3 — Zones & Pricing

**COMPLETE** (core slice 2026-09-25). Demo-client wiring optional.

Depends on: ADR-005, ADR-006 ACCEPTED; seed amounts = demo defaults per LAUNCH_PATH.

- [x] Prisma: service_zones, pricing_rule_versions, price_snapshots
- [x] Seed 10 v1 named areas (no OTHER; unknown rejected)
- [x] Seed pricing rule v1 from demo defaults
- [x] GET /service-zones (public active)
- [x] Admin zone CRUD
- [x] POST /pricing/preview + snapshots
- [x] Admin publish pricing rule versions
- [x] Wire demo client price preview + admin price publish to the API

## Phase 4 � Orders

**COMPLETE** (2026-10-12). Depends on ADR-004, ADR-015, ADR-017 (ACCEPTED). Dispatch offers are Phase 5.

- [x] Prisma: orders, order_transitions, idempotency_records
- [x] Submit order with server-priced snapshot, weight class, pickup and drop-off
- [x] Idempotent submit (`Idempotency-Key`, 24h replay, conflict on different body)
- [x] Customer cancel through `DRIVER_TO_PICKUP` with no fee
- [x] Append-only transition history
- [x] Assigned-driver execution commands (`start-to-pickup` through `complete`)
- [x] Admin list and detail
- [x] Offer create / accept / reject � Phase 5 (ADR-011 ACCEPTED 2026-10-13)

## Phase 5 � Dispatch

**STARTED** (2026-10-13). ADR-007, ADR-008, ADR-009, ADR-011 are ACCEPTED.

- [x] Driver availability and location samples
- [x] Freshness classes: fresh 15s/30m, aging 45s/80m, otherwise stale
- [x] Parallel offers, 15s timeout, first accept wins, max 5
- [x] Heavy orders require a large basket. Second offer only when the driver has no trip still before DELIVERED
- [x] Driver app reads `GET /drivers/me/offers` and sends availability, location, accept, and reject. A server offer shows the ADR-013 75/25 split. Local demo offers still use the demo share
- [x] Socket offer events: `dispatch.offer.created` and `dispatch.offer.expired` (ADR-016 ACCEPTED)

## Phase 6 � Execution & Tracking

**STARTED** (2026-10-13). ADR-009, ADR-010, and ADR-016 are ACCEPTED.

- [x] Rooms `order:{orderId}`, `driver:{userId}`, `admin:ops`. The client cannot join by name
- [x] `order.status.changed` and `driver.location.updated` after assignment
- [x] Driver checkpoint buttons call the existing execution commands
- [ ] The 5-minute second-offer gate stays closed until ADR-009's ETA source is chosen. A second offer is still blocked while a trip is before `DELIVERED`

## Phase 7 � Ratings & Complaints

**STARTED** (2026-10-13). ADR-012 Option A is ACCEPTED.

- [x] One rating after `COMPLETED`, no customer edit
- [x] Complaint text linked to the order, admin review without a severity scale
- [ ] Low-rating alerts and automatic suspension wait for a threshold

## Realtime transport

**ADR-010 ACCEPTED** (Socket.IO, 2026-10-13). Authenticated connect on `/socket.io` is implemented. ADR-016 rooms and Phase 6 events are implemented. `admin.alert.created` stays unemitted.

## Phase 8 — Finance

**STARTED** (2026-10-13). ADR-013 is ACCEPTED.

- [x] Append-only ledger posted at `COMPLETED`: 75% driver, 25% platform, optional flat bonus
- [x] Driver ledger and earnings, admin ledger, trip bonus, penalty and adjustment
- [x] Damascus day, week, month, and year reports
- [ ] Settlement payout stays closed until cash handoff or transfer is chosen

## Phase 9 — Admin Operations

**STARTED** (2026-10-13). ADR-003 is ACCEPTED.

- [x] Driver list, suspend, reactivate, and basket/capacity-note update, each audited
- [x] Live snapshot of approved drivers, active orders, and open offers
- [x] Order list filters by status and exact order number
- [ ] Lifecycle override waits for an allowed target-state list
- [ ] Admin alerts wait for an ADR-012 threshold

## Client cutover (LAUNCH_PATH Phase 9)

**STARTED** (2026-10-16). Uses only ACCEPTED API contracts. Does not wait on ADR-014 / 018 / 019 / 020.

- [x] Customer order submit/cancel, driver offers/availability/location/checkpoints, ratings/complaints, finance reports, and admin live/drivers already call the API when a session exists
- [x] Driver day-end reads `GET /drivers/me/earnings` and ledger when the driver is on the API
- [x] Admin live map prefers `GET /admin/live` points when present
- [x] Customer reconcile polls `GET /orders/:id/tracking` after assignment (REST authority)
- [x] Admin can set the flat trip bonus on the server driver list
- [ ] Full removal of the localStorage demo bus for offline/demo-only flows
- [ ] Capacitor soft-launch against production contracts

## Phase 10 — Production Hardening

**BLOCKED.** Depends on ADR-014, ADR-018, ADR-019, and ADR-020, which are still PROPOSED. Do not invent a notification provider, retention deletes, observability stack, or deploy topology.

## Later phases

Use [`ROADMAP.md`](ROADMAP.md) and [`LAUNCH_PATH.md`](LAUNCH_PATH.md).

## Related documents

- [`LAUNCH_PATH.md`](LAUNCH_PATH.md)
- [`PHASE1_PREFLIGHT.md`](PHASE1_PREFLIGHT.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`ADR_INDEX.md`](ADR_INDEX.md)
