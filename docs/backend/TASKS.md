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
- [ ] Approve blocking ADRs (Phase 0B)

## Phase 0B — Architecture decision freeze

- [ ] Finalize domain model (ADR-001 related docs)
- [ ] Finalize order lifecycle (ADR-004)
- [ ] Finalize pricing rules (ADR-006) — business amounts required
- [ ] Finalize capacity model (ADR-008) — business limits required
- [ ] Finalize dispatch algorithm (ADR-007)
- [ ] Finalize multi-order routing (ADR-009)
- [ ] Finalize authorization (ADR-003)
- [ ] Finalize tracking/realtime (ADR-010 / ADR-011 / ADR-016)
- [ ] Finalize retention (ADR-018)
- [ ] Approve required ADRs before Phase 1

## Phase 1

- [ ] Initialize repository and CI
- [ ] Configure NestJS/TypeScript
- [ ] Configure PostgreSQL/Prisma
- [ ] Configure Redis/BullMQ
- [ ] Add health/readiness
- [ ] Add structured logging
- [ ] Add API documentation

## Later phases

Use [`ROADMAP.md`](ROADMAP.md) and create detailed issue-level tasks only after the preceding phase is frozen and verified.

## Related documents

- [`ROADMAP.md`](ROADMAP.md)
- [`ADR_INDEX.md`](ADR_INDEX.md)
