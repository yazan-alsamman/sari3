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
- [ ] Wave-2 drafts: ADR-010, 011, 012, 014, 016–020
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

**IN PROGRESS** (slice: password auth + sessions + driver KYC approve; OTP deferred to ADR-014).

Depends on: ADR-002, ADR-003, ADR-015 (ACCEPTED). Local media adapter until MinIO.

- [x] Prisma: users, profiles, refresh sessions, media objects, audit log
- [x] Register customer / driver / bootstrap admin
- [x] Login + Argon2id verify
- [x] JWT access (15m) + opaque rotating refresh (hashed)
- [x] Logout / me
- [x] RolesGuard + DriverApprovedGuard
- [x] Media presign + local PUT upload + confirm (+ public KYC one-shot)
- [x] Admin list pending / approve / reject drivers
- [ ] Phone OTP verification (blocked on ADR-014 PROPOSED)
- [ ] MinIO/S3 adapter swap (ADR-015 production path; local adapter preserves flow)
- [ ] Wire demo client login/register to these APIs (optional Phase 2 follow-up)

## Later phases

Use [`ROADMAP.md`](ROADMAP.md) and [`LAUNCH_PATH.md`](LAUNCH_PATH.md).

## Related documents

- [`LAUNCH_PATH.md`](LAUNCH_PATH.md)
- [`PHASE1_PREFLIGHT.md`](PHASE1_PREFLIGHT.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`ADR_INDEX.md`](ADR_INDEX.md)
