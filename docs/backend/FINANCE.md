# Driver Earnings & Financial Ledger

## Purpose

Defines financial architecture principles and the decisions required before implementation.

## Status

Principles preserved; commercial formulas undecided.

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
| Driver earning | Calculation **TBD — Business Decision Required** / ADR-013. **Demo UI only:** 80% of delivery charge — see [`DEMO_ADMIN_UI.md`](DEMO_ADMIN_UI.md) (not ACCEPTED) |
| Platform share | Whether always applied and formula **TBD — Business Decision Required** / ADR-013. **Demo UI only:** 20% of delivery charge — see [`DEMO_ADMIN_UI.md`](DEMO_ADMIN_UI.md) (not ACCEPTED) |
| Incentives | Rules and amounts **TBD — Business Decision Required** |
| Penalties | Rules and amounts **TBD — Business Decision Required** |
| Manual adjustments | Authorization matrix **TBD — ADR-003 / ADR-013** |
| Settlement | Cadence and process **TBD — ADR-013** |
| Daily report | Required; derivation rules **TBD — ADR-013** |
| Weekly report | Required; derivation rules **TBD — ADR-013** |
| Monthly report | Required; derivation rules **TBD — ADR-013** |
| Currency | **TBD — Business Decision Required** (align with ADR-006) |
| Rounding | **TBD — ADR-013 / ADR-006** |
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
