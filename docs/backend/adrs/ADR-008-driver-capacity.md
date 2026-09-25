# ADR-008: Driver Capacity Model

## Status

ACCEPTED

## Context

Automotive parts may be large/heavy. Capacity must constrain dispatch and multi-order routing. Numeric limits are business decisions and must not be invented by engineering.

## Decision

**Choose Option A + hard class bans:** Global capacity profile with per-driver basket attributes.

### Package weight class (order)

| Class | Meaning | Examples (heavy) |
|---|---|---|
| `light` | Fits small or large basket | general light parts |
| `heavy` | Requires **large** basket | ????? ????? ????? ???? ????? ??????? ???? ?? ??? |

### Driver basket (registration — required)

| Field | Rule |
|---|---|
| `basketSize` | `small` \| `large` (required) |
| `capacityNote` | Free-text capacity declaration (required) |
| Vehicle fields | motorcycle model + plate (required) |

### Matching rule (hard)

```text
IF order.weightClass == heavy AND driver.basketSize != large THEN ineligible
ELSE eligible (subject to other dispatch rules)
```

### Multi-order capacity

- Max active orders: **2** (ADR-009)
- Second heavy order still requires large basket
- No invented kg/volume numbers in v1 beyond class ban + capacityNote for ops review

### Who edits

- Driver sets basket/capacity at registration; admin may update after approval (audited)

## Decision Drivers

- Safety
- Motorcycle constraints
- Multi-order compatibility
- Admin configurability
- Owner-confirmed basket/weight rules

## Considered Options

### Option A — Global default + driver overrides ? **SELECTED** (class-based)

### Option B — Per-vehicle-class profiles only

### Option C — Order-class hard bans without numeric capacity ? partially included via light/heavy

## Consequences

- Dispatch must call capacity gate before offer
- UI filter is not sufficient alone

## Security Implications

- Drivers cannot self-upgrade basket without admin if policy locks after approve (recommend admin lock post-approve)

## Operational Implications

- Pending join shows basket size + capacity for admin review

## Data Implications

- Driver vehicle profile fields; order weight class required

## API Implications

- Validation errors when heavy order would be offered to small basket (should never happen if gate correct)

## Mobile Implications

- Customer must choose light/heavy
- Driver registration requires basket size + capacity

## Dependencies

- ADR-001
- ADR-006

## Open Questions

- Exact kg limits for future numeric capacity (not required for v1 class model)
- Whether medium class is ever needed (owner said light/heavy only)

## Approval

- Decision owner: Product Owner
- Approved by: Yazan (CTO) — accepted backend work order
- Date: 2026-09-22
