# ADR-012: Rating & Complaint Policy

## Status

ACCEPTED

## Context

Post-delivery trust signals require eligibility, uniqueness, and a correction policy before a rating can be stored. Alert thresholds, suspension, and complaint severity are separate decisions and are not chosen here.

## Decision

**Choose Option A:** one rating per order, no customer edit.

| Rule | Value |
|---|---|
| When | After the order is `COMPLETED` (ADR-004 Option B). `DELIVERED` is not eligible |
| Who | The owning customer |
| Score | Integer 1–5 |
| Note | Optional. At most 500 characters, the same cap as the customer cancel reason |
| Uniqueness | One row per order. A second submit is rejected. No customer update or delete |
| Complaint | The owning customer may write a complaint linked to their order. No severity scale |
| Admin review | An admin may mark a complaint `investigated` or `dismissed`. Dismiss requires a reason. The action is audited |
| Alerts and suspension | Not in this decision. No star threshold, no rolling window, no automatic suspension |

`rating.requested` is emitted on the existing order room when the order becomes `COMPLETED`. `admin.alert.created` stays unemitted until a threshold is accepted.

## Decision Drivers

- Customer trust
- Driver fairness
- Abuse resistance
- Operational alerting without inventing a cutoff

## Considered Options

### Option A — Strict one-rating-no-edit — **SELECTED**

Matches the product rule of one rating per completed order.

### Option B — One rating with admin-mediated correction

A later correction path. Not in v1.

### Option C — Time-boxed customer correction window

The window length is not documented.

## Consequences

- Ratings module stores an immutable customer rating and a reviewable complaint
- No `rating_alerts` table until a threshold exists
- Finance incentives and penalties stay on ADR-013 and are not posted from a rating

## Security Implications

- Owner or admin only. Another customer receives not-found
- The assigned driver id is copied onto the rating for later reads. The driver cannot submit or edit it

## Operational Implications

- Admins read ratings and review complaints. They do not auto-suspend

## Data Implications

- `ratings.orderId` is unique
- Complaints may repeat on one order. Status is `open`, `investigated`, or `dismissed`

## API Implications

- `POST /orders/:orderId/rating`
- `GET /ratings` and `GET /admin/ratings`
- `POST /orders/:orderId/complaints`
- `GET /complaints/:id`
- `PATCH /admin/complaints/:id`

## Mobile Implications

- The rating sheet opens after `COMPLETED`, not after `DELIVERED`
- The customer cannot change a sent rating

## Dependencies

- ADR-004

## Open Questions

- Low-rating alert threshold
- Suspension rules
- Complaint severity model

## Approval

- Decision owner: Product Owner
- Approved by: Product Owner — Option A
- Date: 2026-10-13
