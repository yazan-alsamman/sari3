# ADR-013: Financial Ledger Model

## Status

ACCEPTED

## Context

Driver earnings, platform share, incentives, penalties, and settlements are high-risk. Ledger must be append-only and reproducible for reporting.

## Decision

**Choose Option B:** Single-account append-only movements with typed entry kinds (immutable). Evolve toward double-entry later if accounting requires it.

### Owner-confirmed split (v1)

On each completed delivery charge `T`:

| Party | Share |
|---|---|
| Driver base earning | **75%** of `T` |
| Platform / company | **25%** of `T` |
| Driver bonus | Optional **flat** amount per trip (admin per-driver config), added to driver earning |

```text
driverEarning = round(T * 0.75) + bonus
platformShare = T - round(T * 0.75)   // ensures sum matches T before bonus
```

Bonus is a platform expense / incentive entry (separate ledger kind), not taken from customer `T` unless product later says otherwise.

### Posting trigger

- Ledger entries created when order reaches **`COMPLETED`** (ADR-004)
- Never mutate; corrections via compensating entries (admin-only, audited)

### Entry kinds (v1)

- `delivery_driver_earning`
- `delivery_platform_share`
- `driver_bonus`
- `penalty` (admin)
- `adjustment` (admin, reason required)
- `settlement_payout` (when settlements run)

### Currency

?????? ??????? ??????? (?.?.?); integer minor units (no floats).

### Settlement cadence

Admin-defined reports: day / week / month / year (as in ops UI intent). Automated payout rail **TBD post-v1**.

## Decision Drivers

- Financial integrity
- Auditability
- Reproducible reports
- Authorization of adjustments
- Owner-confirmed 75/25 + bonuses

## Considered Options

### Option A — Double-entry style ledger

Stronger accounting; heavier for v1.

### Option B — Append-only movements with entry kinds ? **SELECTED**

### Option C — External accounting as system of record

Deferred.

## Consequences

- Finance module is source of truth for driver balances
- Demo 80/20 is superseded for production by this ADR once ACCEPTED

## Security Implications

- Only admin posts penalties/adjustments
- Drivers read own ledger only

## Operational Implications

- Day-end inventory + finance dashboards read ledger

## Data Implications

- Append-only `ledger_entries`; unique constraint on (orderId, kind) where applicable

## API Implications

- Driver earnings APIs; admin finance summaries

## Mobile Implications

- Driver day-end shows ledger-backed totals

## Dependencies

- ADR-006
- ADR-004
- ADR-012 (penalties from ratings — wave-2)

## Open Questions

- Settlement payout method (cash handoff vs transfer)
- Whether bonus reduces platform share (explicitly: **no** in v1 — bonus is additive incentive)

## Approval

- Decision owner: Product Owner
- Approved by: Yazan (CTO) — accepted backend work order
- Date: 2026-09-22
