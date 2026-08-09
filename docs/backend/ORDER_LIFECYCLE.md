# Order Lifecycle

## Purpose

Defines proposed order states, known rules, and the transition matrix required for implementation.

## Status

Proposed state machine scaffold. Many transitions remain unresolved.

Owning decision record: [`adrs/ADR-004-order-state-machine.md`](adrs/ADR-004-order-state-machine.md).

## Known rules (preserved)

- Only documented transitions are allowed.
- Illegal transitions must be rejected server-side.
- Every transition records actor, timestamp, source, and optional reason.
- Completion requires the required delivery proof/checkpoint (**proof definition TBD — ADR-004**).
- Admin override transitions require explicit permission and audit logging.
- Rating eligibility policy must be frozen in ADR-004 / ADR-012 (see contradiction below).

## Proposed happy-path states

```text
DRAFT
  -> PRICE_CONFIRMED
  -> SEARCHING_DRIVER
  -> DRIVER_OFFERED
  -> DRIVER_ACCEPTED
  -> DRIVER_TO_PICKUP
  -> PICKED_UP
  -> IN_TRANSIT
  -> DELIVERED
  -> RATING_PENDING
  -> COMPLETED
```

## Proposed exceptional states

- `CANCELLED`
- `EXPIRED`
- `FAILED`
- `REJECTED` / `UNFULFILLED` (naming and meaning TBD — ADR-004; must not be confused with dispatch offer rejection)

## State definitions

| State | Meaning | Status |
|---|---|---|
| DRAFT | Order being composed / not yet activated | Proposed |
| PRICE_CONFIRMED | Customer confirmed applicable price snapshot | Proposed |
| SEARCHING_DRIVER | System seeking eligible drivers | Proposed |
| DRIVER_OFFERED | One or more dispatch offers outstanding | Proposed |
| DRIVER_ACCEPTED | Driver assigned via accepted offer | Proposed |
| DRIVER_TO_PICKUP | Driver en route to pickup | Proposed |
| PICKED_UP | Package collected from pickup | Proposed |
| IN_TRANSIT | Package moving toward drop-off | Proposed |
| DELIVERED | Delivery checkpoint satisfied | Proposed |
| RATING_PENDING | Waiting for customer rating (if this model is chosen) | Proposed / contested |
| COMPLETED | Terminal successful completion | Proposed |
| CANCELLED | Order cancelled before successful completion | Proposed |
| EXPIRED | Order expired per policy | Proposed |
| FAILED | Order failed operationally | Proposed |
| REJECTED / UNFULFILLED | Could not be fulfilled / rejected at order level | Proposed / naming TBD |

Exact semantics and whether all listed states are retained: **TBD — ADR-004**.

## Open contradiction — rating vs completion

Current documentation contains an unresolved ambiguity:

**Option A — rating before completed**

```text
DELIVERED -> RATING_PENDING -> COMPLETED
```

**Option B — completed then rating**

```text
DELIVERED -> COMPLETED -> (rating eligible)
```

Product requirements and mobile docs currently describe rating after completion, while the proposed state list includes `RATING_PENDING` before `COMPLETED`.

**Do not choose either option in this document.**

Resolution: **TBD — ADR-004** (coordinate with [`RATINGS.md`](RATINGS.md) and [`adrs/ADR-012-rating-complaint-policy.md`](adrs/ADR-012-rating-complaint-policy.md)).

## Transition matrix

Where a cell is unresolved, the value is marked `TBD — ADR-004`.

| Current State | Action | Actor | Next State | Preconditions | Authorization | Side Effects |
|---|---|---|---|---|---|---|
| DRAFT | confirm_price | Customer | PRICE_CONFIRMED | TBD — ADR-004 / ADR-006 | TBD — ADR-003 | Create/attach price snapshot — TBD |
| PRICE_CONFIRMED | submit_order | Customer | SEARCHING_DRIVER | TBD — ADR-004 | TBD — ADR-003 | Idempotent create — TBD ADR-017 |
| SEARCHING_DRIVER | create_offer | System | DRIVER_OFFERED | Eligible drivers exist — TBD ADR-007 | System | Create dispatch offers |
| DRIVER_OFFERED | accept_offer | Driver | DRIVER_ACCEPTED | Offer valid/unexpired — TBD ADR-007 | TBD — ADR-003 | Assign driver; cancel competing offers — TBD |
| DRIVER_OFFERED | reject_offer | Driver | TBD — ADR-004 | TBD | TBD — ADR-003 | Reassignment policy — TBD ADR-007 |
| DRIVER_OFFERED | offer_expired | System | TBD — ADR-004 | Timeout — TBD ADR-007 | System | Retry/reassign — TBD |
| DRIVER_ACCEPTED | start_to_pickup | Driver/System | DRIVER_TO_PICKUP | TBD — ADR-004 | TBD — ADR-003 | Notify customer — TBD |
| DRIVER_TO_PICKUP | confirm_pickup | Driver | PICKED_UP | Checkpoint/proof TBD — ADR-004 | TBD — ADR-003 | Notify; update route — TBD |
| PICKED_UP | mark_in_transit | Driver/System | IN_TRANSIT | Whether distinct from PICKED_UP TBD — ADR-004 | TBD — ADR-003 | TBD |
| IN_TRANSIT | confirm_delivery | Driver | DELIVERED | Checkpoint/proof TBD — ADR-004 | TBD — ADR-003 | Notify; finance posting eligibility TBD ADR-013 |
| DELIVERED | open_rating | System | RATING_PENDING **or** COMPLETED | **Contradiction — ADR-004** | System | TBD |
| RATING_PENDING | submit_rating | Customer | COMPLETED | If Option A chosen — ADR-004 / ADR-012 | TBD — ADR-003 | Persist rating |
| RATING_PENDING | skip/timeout | System/Customer | COMPLETED | If Option A chosen — policy TBD ADR-004 | TBD | TBD |
| COMPLETED | submit_rating | Customer | COMPLETED | If Option B chosen — ADR-004 / ADR-012 | TBD — ADR-003 | Persist rating |
| * (allowed set TBD) | cancel | Customer/Admin/Driver? | CANCELLED | Cancellation windows TBD — ADR-004 | TBD — ADR-003 | Notify; finance implications TBD |
| * (allowed set TBD) | expire | System | EXPIRED | Expiration rules TBD — ADR-004 | System | TBD |
| * (allowed set TBD) | fail | System/Admin | FAILED | Failure taxonomy TBD — ADR-004 | TBD — ADR-003 | TBD |
| * (allowed set TBD) | admin_override | Admin | TBD — ADR-004 | Explicit permission | TBD — ADR-003 | Mandatory audit |

## Decision checklist for ADR-004

- [ ] Final state list (include/exclude `DRAFT`, `IN_TRANSIT`, `RATING_PENDING`, `REJECTED/UNFULFILLED`)
- [ ] Resolve rating vs completion contradiction
- [ ] Actor and authorization per transition
- [ ] Cancellation windows by state and actor
- [ ] Expiration rules
- [ ] Driver rejection vs order-level unfulfilled semantics
- [ ] Reassignment after reject/expire
- [ ] Pickup/delivery proof requirements
- [ ] Admin override catalog
- [ ] Failure taxonomy
- [ ] Side effects (notifications, finance, tracking) per transition

## Related documents

- [`DISPATCH.md`](DISPATCH.md)
- [`RATINGS.md`](RATINGS.md)
- [`API_ENDPOINT_CATALOG.md`](API_ENDPOINT_CATALOG.md)
- [`../mobile/ORDER_FLOW.md`](../mobile/ORDER_FLOW.md)
- [`adrs/ADR-004-order-state-machine.md`](adrs/ADR-004-order-state-machine.md)
