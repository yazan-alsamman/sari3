# Product Requirements — Saree'e

## Purpose

Authoritative product requirements shared by mobile and backend documentation.

## 1. Actors

### Customer

A verified merchant/mechanic account that creates delivery orders, supplies pickup/drop-off information, follows the order, and rates the completed delivery.

### Driver

A motorcycle delivery operator with an authenticated account, operational status, location, capacity profile, and financial ledger. Drivers can receive, accept/reject, execute, and complete multiple compatible orders.

### Admin / Operations

A privileged operational user who manages accounts, drivers, pricing, service zones, orders, live tracking, ratings, complaints, incentives, penalties, and financial reporting.

## 2. Order creation

Required:

- Pickup shop name.
- Pickup area.
- Pickup location and/or manually selected map point.
- Delivery shop name.
- Delivery area.
- Delivery location and/or manually selected map point.
- Optional shop/landmark photo.
- Delivery mode: Standard or VIP.
- Package/part category.
- Estimated/declared weight or size class.
- Special handling notes.

The customer must see the applicable delivery price before confirmation.

## 3. Addressing model

The platform must not depend exclusively on map search.

A delivery point consists of:

- Structured coordinates when available.
- Area/zone.
- Human-readable shop name.
- Landmark/instructions.
- Optional photo.

## 4. Dispatch

The backend selects eligible nearby drivers using:

- Current location freshness.
- Driver availability.
- Capacity.
- Current workload.
- Vehicle/motorcycle constraints.
- Service-zone eligibility.
- Route compatibility for multi-order opportunities.

The dispatch policy must be configurable and auditable.

Details and unresolved parameters: [`../backend/DISPATCH.md`](../backend/DISPATCH.md), ADR-007.

## 5. Multi-order delivery

A driver may carry multiple compatible orders when capacity and route constraints allow it.

Compatibility must consider:

- Weight/volume.
- Special handling.
- Pickup/drop-off sequence.
- Route deviation.
- VIP priority.
- Maximum active orders.

Numeric limits: **BUSINESS DECISION REQUIRED** — see ADR-008 / ADR-009.

## 6. Order lifecycle

The exact state machine is defined in [`../backend/ORDER_LIFECYCLE.md`](../backend/ORDER_LIFECYCLE.md).

Illegal transitions must be rejected server-side.

Unresolved transitions and the rating/completion ambiguity are owned by ADR-004.

## 7. Tracking

Customers see meaningful status and ETA information.

Admins can see live driver locations and active orders.

Tracking must use freshness/heartbeat rules and must not imply exact location when the location is stale.

Thresholds: **TBD — ADR-011**.

## 8. Ratings

After completion, the customer can submit:

- 1–5 star rating.
- Optional text feedback.

One rating is permitted per completed order unless an explicitly documented correction policy applies.

Repeated low ratings and severe complaints generate admin alerts according to configurable thresholds.

Note: lifecycle documentation currently contains an unresolved contradiction about whether rating occurs before or after `COMPLETED`. Resolution: **TBD — ADR-004 / ADR-012**. Product intent expressed here is rating after completion.

## 9. Financials

The system records:

- Delivery charge.
- Driver earning.
- Platform/company share where applicable.
- Incentives.
- Penalties/adjustments.
- Daily, weekly, and monthly summaries.

Financial records must be immutable or adjustment-based rather than silently overwritten.

Amounts and formulas: **TBD — Business Decision Required** / ADR-013.

## 10. Notifications

Important events include:

- New delivery offer.
- Offer expiration.
- Driver accepted.
- Driver approaching pickup.
- Pickup completed.
- Delivery completed.
- Rating request.
- Admin alert for severe/repeated complaints.
- New order alert containing the order number.

Push delivery is not the source of truth for order state.

## 11. Non-functional requirements

See [`NFR.md`](NFR.md).

High-level expectations:

- Secure authentication and authorization.
- Idempotent critical commands.
- Auditability.
- Observability.
- Horizontal scalability where practical.
- Reliable background jobs.
- Graceful handling of intermittent connectivity.
- API versioning.
- Automated tests at domain, application, integration, and E2E levels.
