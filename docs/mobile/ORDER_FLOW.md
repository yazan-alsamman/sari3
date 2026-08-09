# Mobile Order Flow

## Purpose

Customer-facing order creation and tracking UX sequence.

## Sequence

1. Customer selects pickup and drop-off information.
2. App validates required fields.
3. App requests a price preview.
4. Customer confirms the displayed price.
5. App submits the order with an idempotency key.
6. Backend returns authoritative order state/number.
7. App subscribes/polls for status updates according to the realtime strategy.
8. Customer sees driver identity and ETA when available.
9. Completion unlocks rating according to backend policy.
10. Rating submission is retry-safe and linked to the eligible order.

## Backend authority

- Order state machine: [`../backend/ORDER_LIFECYCLE.md`](../backend/ORDER_LIFECYCLE.md) / ADR-004
- Pricing: [`../backend/PRICING.md`](../backend/PRICING.md) / ADR-006
- Rating eligibility timing (completion vs rating-pending contradiction): **TBD — ADR-004 / ADR-012**

Mobile must not invent lifecycle transitions.

## Screen states

Every screen must handle:

- Loading.
- Empty.
- Offline.
- Permission denied.
- Validation errors.
- Authorization errors.
- Server conflict.
- Retry.

## Related documents

- [`NAVIGATION.md`](NAVIGATION.md)
- [`RATING.md`](RATING.md)
- [`../backend/API_ENDPOINT_CATALOG.md`](../backend/API_ENDPOINT_CATALOG.md)
