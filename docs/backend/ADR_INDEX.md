# ADR Index

## Purpose

Index of Architecture Decision Records for Saree'e.

## Status rule

Architecture decisions must be frozen before related implementation and numbered sequentially.

| Status | Meaning |
|---|---|
| PROPOSED | Draft / incomplete |
| PROPOSED — READY FOR ACCEPTANCE | Decision text filled; awaiting Product Owner sign-off |
| ACCEPTED | Binding for implementation |
| SUPERSEDED / REJECTED | Do not implement |

**Critical path ADRs (001�009, 013, 015) are ACCEPTED** (CTO accepted backend work order, 2026-09-22).

## ADR dependency order

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

Note: ADR-008 (capacity) is intentionally ordered before ADR-007 (dispatch) because dispatch eligibility depends on capacity.

## Catalog

| ADR | Title | Status | File |
|---|---|---|---|
| ADR-001 | System Architecture & Module Boundaries | ACCEPTED | [`adrs/ADR-001-system-architecture.md`](adrs/ADR-001-system-architecture.md) |
| ADR-002 | Authentication & Session Strategy | ACCEPTED | [`adrs/ADR-002-authentication-session.md`](adrs/ADR-002-authentication-session.md) |
| ADR-003 | Authorization & Resource Scoping | ACCEPTED | [`adrs/ADR-003-authorization-resource-scoping.md`](adrs/ADR-003-authorization-resource-scoping.md) |
| ADR-004 | Order State Machine | ACCEPTED | [`adrs/ADR-004-order-state-machine.md`](adrs/ADR-004-order-state-machine.md) |
| ADR-005 | Service Zone Model | ACCEPTED | [`adrs/ADR-005-service-zone-model.md`](adrs/ADR-005-service-zone-model.md) |
| ADR-006 | Pricing Model & Price Snapshot | ACCEPTED | [`adrs/ADR-006-pricing-and-price-snapshot.md`](adrs/ADR-006-pricing-and-price-snapshot.md) |
| ADR-007 | Dispatch Candidate Selection | ACCEPTED | [`adrs/ADR-007-dispatch-selection.md`](adrs/ADR-007-dispatch-selection.md) |
| ADR-008 | Driver Capacity Model | ACCEPTED | [`adrs/ADR-008-driver-capacity.md`](adrs/ADR-008-driver-capacity.md) |
| ADR-009 | Multi-Order Route Compatibility | ACCEPTED | [`adrs/ADR-009-multi-order-route-compatibility.md`](adrs/ADR-009-multi-order-route-compatibility.md) |
| ADR-010 | Live Tracking Transport | PROPOSED | [`adrs/ADR-010-live-tracking-transport.md`](adrs/ADR-010-live-tracking-transport.md) |
| ADR-011 | Location Freshness & Retention | PROPOSED | [`adrs/ADR-011-location-freshness-retention.md`](adrs/ADR-011-location-freshness-retention.md) |
| ADR-012 | Rating & Complaint Policy | PROPOSED | [`adrs/ADR-012-rating-complaint-policy.md`](adrs/ADR-012-rating-complaint-policy.md) |
| ADR-013 | Financial Ledger Model | ACCEPTED | [`adrs/ADR-013-financial-ledger.md`](adrs/ADR-013-financial-ledger.md) |
| ADR-014 | Notification Provider Abstraction | PROPOSED | [`adrs/ADR-014-notification-provider.md`](adrs/ADR-014-notification-provider.md) |
| ADR-015 | Media / Object Storage | ACCEPTED | [`adrs/ADR-015-media-storage.md`](adrs/ADR-015-media-storage.md) |
| ADR-016 | Realtime Authorization | PROPOSED | [`adrs/ADR-016-realtime-authorization.md`](adrs/ADR-016-realtime-authorization.md) |
| ADR-017 | Idempotency Strategy | PROPOSED | [`adrs/ADR-017-idempotency.md`](adrs/ADR-017-idempotency.md) |
| ADR-018 | Data Retention & Privacy | PROPOSED | [`adrs/ADR-018-data-retention-privacy.md`](adrs/ADR-018-data-retention-privacy.md) |
| ADR-019 | Observability | PROPOSED | [`adrs/ADR-019-observability.md`](adrs/ADR-019-observability.md) |
| ADR-020 | Deployment Topology | PROPOSED | [`adrs/ADR-020-deployment-topology.md`](adrs/ADR-020-deployment-topology.md) |

## Required ADR sections

Each ADR contains:

- Context
- Decision (filled for READY FOR ACCEPTANCE rows)
- Alternatives
- Consequences
- Security / operational / data / API / mobile implications
- Dependencies
- Open questions
- Approval block

## Related documents

- [`LAUNCH_PATH.md`](LAUNCH_PATH.md)
- [`TASKS.md`](TASKS.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`../README.md`](../README.md)
