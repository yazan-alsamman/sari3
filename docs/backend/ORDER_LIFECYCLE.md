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

**Resolution:** [`adrs/ADR-004-order-state-machine.md`](adrs/ADR-004-order-state-machine.md) is **ACCEPTED** with **Option B** (DELIVERED → COMPLETED, then rating eligible).

`RATING_PENDING` is not a required order state for v1.

**Option A — rating before completed** (rejected in ADR-004 draft)

```text
DELIVERED -> RATING_PENDING -> COMPLETED
```

**Option B — completed then rating** (selected in ADR-004 draft)

```text
DELIVERED -> COMPLETED -> (rating eligible)
```

Product requirements and mobile docs describe rating after completion.

## Transition matrix

Where a cell is unresolved, the value is marked `TBD — ADR-004`.

| Current State | Action | Actor | Next State | Preconditions | Authorization | Side Effects |
|---|---|---|---|---|---|---|
| DRAFT | confirm_price | Customer | PRICE_CONFIRMED | Active zones and pricing rule | Customer owner | Immutable price snapshot — ADR-006 |
| PRICE_CONFIRMED | submit_order | Customer | SEARCHING_DRIVER | Snapshot attached | Customer owner | Idempotent create — ADR-017 `Idempotency-Key`. v1 submit performs confirm_price and submit_order in one command. |
| SEARCHING_DRIVER | create_offer | System | DRIVER_OFFERED | Eligible drivers — ADR-007. Fresh only (ADR-011: ≤15s and ≤30m) | System | Create up to 5 dispatch offers |
| DRIVER_OFFERED | accept_offer | Driver | DRIVER_ACCEPTED | Offer valid, 15s, first accept wins — ADR-007 | Offer assignee — ADR-003 | Assign driver; cancel competing offers. Requires `Idempotency-Key` — ADR-017 |
| DRIVER_OFFERED | reject_offer | Driver | SEARCHING_DRIVER or DRIVER_OFFERED | ADR-004 / ADR-007 | Offer assignee | If another offer is still open, stay `DRIVER_OFFERED`; otherwise return to `SEARCHING_DRIVER`. Not `UNFULFILLED`. Implemented |
| DRIVER_OFFERED | offer_expired | System | SEARCHING_DRIVER or DRIVER_OFFERED | 15 seconds — ADR-007 | System | Same as reject: keep searching while offers remain |
| DRIVER_ACCEPTED | start_to_pickup | Driver | DRIVER_TO_PICKUP | Assigned approved driver | Assigned driver — ADR-003 | Record transition |
| DRIVER_TO_PICKUP | confirm_pickup | Driver | PICKED_UP | Assigned driver | Assigned driver | Record transition |
| PICKED_UP | mark_in_transit | Driver | IN_TRANSIT | State retained — ADR-004 | Assigned driver | Record transition |
| IN_TRANSIT | confirm_delivery | Driver | DELIVERED | Optional proof photo — ADR-015 | Assigned driver | Record transition |
| DELIVERED | complete | Driver | COMPLETED | Delivery checkpoint recorded | Assigned driver | Rating becomes eligible — ADR-004 Option B. Rating command waits on ADR-012. |
| RATING_PENDING | submit_rating | Customer | COMPLETED | If Option A chosen — ADR-004 / ADR-012 | TBD — ADR-003 | Persist rating |
| RATING_PENDING | skip/timeout | System/Customer | COMPLETED | If Option A chosen — policy TBD ADR-004 | TBD | TBD |
| COMPLETED | submit_rating | Customer | COMPLETED | One rating, no edit (ADR-012 Option A) | Order owner | Persist rating |
| COMPLETED | rating.requested | System | COMPLETED | Emitted on the order room | Order members | Ask the customer to rate |
| DRAFT … DRIVER_TO_PICKUP | cancel | Customer | CANCELLED | No fee until commercial sheet — ADR-004 | Owner | Record reason |
| * (allowed set TBD) | expire | System | EXPIRED | Expiration rules TBD — ADR-004 | System | TBD |
| * (allowed set TBD) | fail | System/Admin | FAILED | Failure taxonomy TBD — ADR-004 | TBD — ADR-003 | TBD |
| * (allowed set TBD) | admin_override | Admin | TBD — ADR-004 | Explicit permission | TBD — ADR-003 | Mandatory audit |

## Decision checklist for ADR-004

- [ ] Final state list (include/exclude `DRAFT`, `IN_TRANSIT`, `RATING_PENDING`, `REJECTED/UNFULFILLED`)
- [x] Resolve rating vs completion contradiction — ADR-004 Option B and ADR-012 Option A (2026-10-13)
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
