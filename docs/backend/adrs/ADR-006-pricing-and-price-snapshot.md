# ADR-006: Pricing Model & Price Snapshot

## Status

ACCEPTED

## Context

Customers must preview and confirm price before activation. Historical orders must retain immutable price components. Commercial amounts must come from business owners.

## Decision

**Choose Option A:** Zone-to-zone matrix (and/or per-zone base) **+ surcharges**, with **immutable price snapshot** at confirmation.

### Pricing components (v1)

| Component | Rule |
|---|---|
| Base | Zone base and/or fixed route override `from?to` (admin-configurable) |
| Cross-zone | Multiplier when pickup zone ? delivery zone (admin-configurable) |
| VIP surcharge | Percentage of base (admin-configurable) |
| Intermediate stops | Flat per stop (admin-configurable) |
| Weight class | Optional surcharge for **heavy** (admin-configurable; may be 0 at launch) |
| Currency | **?????? ??????? ??????? (?.?.?)** |

### Snapshot

On `PRICE_CONFIRMED` / submit: persist immutable JSON of all components + total + rule version id. Later admin price edits **do not** mutate historical orders.

### Split timing

Customer-facing total is delivery charge. Driver/platform split is **finance** (ADR-013), not shown as binding customer price breakdown unless product asks later.

### Seed note

Demo defaults may seed admin config; **changing seed amounts is an admin/commercial action**, not an engineering invention after acceptance.

## Decision Drivers

- Price transparency
- Historical immutability
- Audit of rule changes
- Finance posting inputs

## Considered Options

### Option A — Zone-to-zone matrix + surcharges ? **SELECTED**

### Option B — Distance-based formula + surcharges

Deferred; poor fit for informal industrial addressing.

### Option C — Hybrid matrix with distance adjustments

Optional later behind same snapshot model.

## Consequences

- Preview endpoint must use same calculator as confirm
- Pricing module owns calculator + config

## Security Implications

- Only admin edits rules
- Clients cannot submit arbitrary totals (server recalculates / verifies snapshot)

## Operational Implications

- Admin UI for zone bases, routes, VIP%, stops, heavy surcharge

## Data Implications

- `pricing_rules` + `price_snapshots`

## API Implications

- `POST /pricing/preview`, snapshot id attached to order

## Mobile Implications

- Show total + disclaimer before confirm

## Dependencies

- ADR-005

## Open Questions

- Exact numeric seed table for production launch day (owner provides sheet)
- Discount/coupon support deferred post-v1

## Approval

- Decision owner: Product Owner
- Approved by: Yazan (CTO) — accepted backend work order
- Date: 2026-09-22
