# Driver Earnings & Financial Ledger

## Purpose

Defines financial architecture principles and the decisions required before implementation.

## Status

ADR-013 is ACCEPTED. The production split is 75% driver / 25% platform of the snapshotted delivery charge, posted when the order reaches `COMPLETED`. A per-driver flat bonus is optional and is a separate entry. The local demo share in the admin UI is not the ledger.

Owning decision record: [`adrs/ADR-013-financial-ledger.md`](adrs/ADR-013-financial-ledger.md).

## Known principles

- Financial history is append-only.
- Corrections create adjustment entries; they do not rewrite historical amounts.
- Daily, weekly, and monthly summaries must be reproducible from ledger entries.
- Only authorized admin roles can create manual adjustments.
- Each adjustment requires actor, reason, amount, related driver/account, timestamp, and audit record.

## Concepts to decide

| Concept | Status |
|---|---|
| Delivery charge | Comes from price snapshot — amounts TBD ADR-006 |
| Driver earning | `round(T * 0.75)` plus an optional flat bonus (ADR-013) |
| Platform share | `T - round(T * 0.75)`. Bonus is not taken from this share |
| Incentives | Admin sets `tripBonusAmount` on the driver profile. Zero posts no bonus entry |
| Penalties | Admin posts a positive amount. It is stored as a negative driver movement. No automatic penalty from ratings |
| Manual adjustments | Authorization matrix **TBD — ADR-003 / ADR-013** |
| Settlement | Reports are day, week (Monday), month, and year in Asia/Damascus. Automated payout rail stays open |
| Daily report | Sum of ledger entries whose `createdAt` falls in the Damascus calendar day |
| Weekly report | Monday 00:00 through the next Monday, Damascus |
| Monthly report | Calendar month, Damascus |
| Currency | Integer Syrian pounds from the price snapshot |
| Rounding | `Math.round(T * 0.75)` for the driver base. 0.75 is exact in binary, so integer charges do not drift |
| Reconciliation | Process **TBD — ADR-013** |
| Audit | Mandatory for privileged financial actions |

## Ledger entry kinds (proposed)

- Delivery earning
- Platform share
- Incentive
- Penalty
- Manual adjustment
- Settlement

Final catalog and posting triggers (e.g., on DELIVERED vs COMPLETED): **TBD — ADR-013** (coordinate with ADR-004).

## Immutability

Historical financial records must not be silently changed.

Enforcement mechanism (DB constraints, no update API, append-only store): **TBD — ADR-013**.

## Related documents

- [`PRICING.md`](PRICING.md)
- [`RATINGS.md`](RATINGS.md)
- [`AUTH_SECURITY.md`](AUTH_SECURITY.md)
- [`adrs/ADR-013-financial-ledger.md`](adrs/ADR-013-financial-ledger.md)
