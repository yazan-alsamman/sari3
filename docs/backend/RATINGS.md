# Ratings & Complaints

## Purpose

Defines rating eligibility principles, complaint handling categories, and open policy decisions.

## Status

Baseline rules preserved; thresholds and correction policy undecided.

Owning decision record: [`adrs/ADR-012-rating-complaint-policy.md`](adrs/ADR-012-rating-complaint-policy.md).

Coordinate rating timing with [`ORDER_LIFECYCLE.md`](ORDER_LIFECYCLE.md) / ADR-004.

## Rating

| Rule | Status |
|---|---|
| Eligibility | Completed/eligible order + owning customer — exact state gate **TBD — ADR-004 / ADR-012** |
| Score | Integer 1–5 |
| Text | Optional, length-limited (**max length TBD**) |
| Uniqueness | One rating per order under default policy |
| Correction policy | Referenced by product docs; details **TBD — ADR-012** |
| Duplicate prevention | Required (DB uniqueness + authz) |

## Moderation signals (configurable examples)

Exact thresholds: **TBD — Business Decision Required / ADR-012**.

- Rating <= N (example historically mentioned <= 2; not frozen).
- Multiple low ratings in a rolling period.
- Complaint keywords/severity.
- Repeated delay-related complaints.

## Complaints

| Topic | Status |
|---|---|
| Severity model | **TBD — ADR-012** |
| Repeated complaints | Escalation rules **TBD — ADR-012** |
| Linkage to order/customer/driver | Required |
| Admin alerts | Required for severe/repeated cases |

## Admin actions

- Review.
- Mark investigated.
- Add internal note.
- Apply incentive.
- Apply penalty.
- Temporarily suspend driver.
- Dismiss with reason.

Every enforcement action is audited.

Financial effects of incentives/penalties: [`FINANCE.md`](FINANCE.md) / ADR-013.

## Related documents

- [`ORDER_LIFECYCLE.md`](ORDER_LIFECYCLE.md)
- [`FINANCE.md`](FINANCE.md)
- [`../mobile/RATING.md`](../mobile/RATING.md)
- [`adrs/ADR-012-rating-complaint-policy.md`](adrs/ADR-012-rating-complaint-policy.md)
