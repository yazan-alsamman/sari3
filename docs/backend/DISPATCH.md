# Dispatch & Smart Assignment

## Purpose

Specifies the categories of rules required to select eligible drivers, rank candidates, create offers, and handle accept/reject/expire/reassign flows.

## Status

Specification scaffold. Concrete algorithm parameters are **not decided**.

Owning decision record: [`adrs/ADR-007-dispatch-selection.md`](adrs/ADR-007-dispatch-selection.md).

Depends on:

- [`adrs/ADR-008-driver-capacity.md`](adrs/ADR-008-driver-capacity.md)
- [`adrs/ADR-005-service-zone-model.md`](adrs/ADR-005-service-zone-model.md)
- [`adrs/ADR-011-location-freshness-retention.md`](adrs/ADR-011-location-freshness-retention.md)
- [`adrs/ADR-009-multi-order-route-compatibility.md`](adrs/ADR-009-multi-order-route-compatibility.md)

## Known product requirement

The backend selects eligible nearby drivers using location freshness, availability, capacity, workload, vehicle constraints, service-zone eligibility, and multi-order route compatibility.

The dispatch policy must be configurable and auditable.

## Candidate eligibility (categories)

A driver is considered only when all applicable checks pass. Exact predicates: **TBD — ADR-007**.

| Check | Notes |
|---|---|
| Availability | Driver operationally available |
| Not suspended | Account/enforcement status permits offers |
| Location freshness | Location classified as sufficiently fresh (**TBD — ADR-011**) |
| Capacity | Remaining capacity sufficient (**TBD — ADR-008**) |
| Service zone | Zone rules permit the order (**TBD — ADR-005**) |
| Current workload | Active order count / load within limits (**TBD — ADR-007 / ADR-009**) |
| Route compatibility | If already carrying orders (**TBD — ADR-009**) |

## Ranking (categories)

Initial ranking may consider the following factors. Weights and order: **TBD — ADR-007**.

1. Distance/ETA to pickup — **TBD — ADR-007**
2. Route compatibility with active orders — **TBD — ADR-009**
3. Capacity remaining — **TBD — ADR-008**
4. Current workload — **TBD — ADR-007**
5. VIP priority — **TBD — ADR-007**
6. Driver fairness/rotation — **TBD — ADR-007**

The ranking algorithm must be versioned/configurable rather than embedded as magic constants.

## Offer lifecycle

Proposed offer states:

- Created
- Sent
- Accepted
- Rejected
- Expired
- Cancelled

Exact offer state machine and side effects: **TBD — ADR-007** (coordinate with [`ORDER_LIFECYCLE.md`](ORDER_LIFECYCLE.md) / ADR-004).

## Decision categories still required

| Category | Status |
|---|---|
| Eligibility predicates | TBD — ADR-007 |
| Availability definition | TBD — ADR-007 |
| Location freshness threshold | TBD — ADR-011 |
| Capacity interaction | TBD — ADR-008 |
| Zone eligibility | TBD — ADR-005 |
| Distance / ETA calculation | TBD — ADR-007 |
| Current workload limits | TBD — ADR-007 |
| VIP prioritization | TBD — ADR-007 |
| Fairness / rotation | TBD — ADR-007 |
| Offer timeout | TBD — ADR-007 |
| Rejection behavior | TBD — ADR-007 |
| Expiration behavior | TBD — ADR-007 |
| Reassignment / retry | TBD — ADR-007 |
| Concurrent acceptance protection | TBD — ADR-007 |
| Idempotency for accept/reject | TBD — ADR-017 |

## Concurrency

Concurrency must prevent two drivers from accepting the same exclusive offer/assignment.

Exact locking/transaction strategy: **TBD — ADR-007**.

## Related documents

- [`ORDER_LIFECYCLE.md`](ORDER_LIFECYCLE.md)
- [`MULTI_ORDER_ROUTING.md`](MULTI_ORDER_ROUTING.md)
- [`TRACKING.md`](TRACKING.md)
- [`adrs/ADR-007-dispatch-selection.md`](adrs/ADR-007-dispatch-selection.md)
