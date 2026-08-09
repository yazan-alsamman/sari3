# Pricing

## Purpose

Defines the pricing structure, snapshot behavior, and open commercial decisions for Saree'e deliveries.

## Status

Structural specification only. Commercial amounts are not decided.

Owning decision record: [`adrs/ADR-006-pricing-and-price-snapshot.md`](adrs/ADR-006-pricing-and-price-snapshot.md).

## Known product requirements

- Customer must see applicable delivery price before confirmation.
- Inputs include pickup/drop-off zones, delivery mode, package/weight class, special handling, and configured surcharges.
- Order stores exact price components used at confirmation so later pricing changes do not alter historical orders.
- Admin price-rule changes require audit trail.

## Structure (components)

| Component | Status |
|---|---|
| Base price | Structure required; amount **TBD — Business Decision Required** |
| Zone / zone-to-zone price | Structure required; amounts **TBD — Business Decision Required** |
| Standard mode pricing | **TBD — Business Decision Required** |
| VIP mode surcharge / pricing | **TBD — Business Decision Required** |
| Weight class surcharge | Classes and amounts **TBD — Business Decision Required** |
| Special handling surcharge | **TBD — Business Decision Required** |
| Discount | Whether supported and rules **TBD — Business Decision Required** |
| Platform share | Whether always applied and calculation **TBD — Business Decision Required** / ADR-013 |
| Driver earning | Calculation **TBD — Business Decision Required** / ADR-013 |
| Currency | Explicit currency required; value **TBD — Business Decision Required** |
| Rounding | Policy **TBD — ADR-006** |
| Price preview | Required before confirmation |
| Price confirmation | Required before activation |
| Price snapshot | Required on confirmed order; immutable historically |
| Effective date / version | Versioned pricing rules required; exact model **TBD — ADR-006** |

## Example conceptual formula

```text
total = baseZonePrice + modeSurcharge + weightSurcharge + specialHandlingSurcharge
```

This is a **conceptual** placeholder only.

The exact formula and amounts must be finalized in ADR-006 with business owners. Do not implement using invented numbers.

## Required behavior

- Price preview before confirmation.
- Price confirmation before order creation/activation.
- Explicit currency.
- Versioned pricing rules.
- Admin audit trail for price-rule changes.
- Historical immutability via snapshot (not silent overwrite).

## Related documents

- [`DOMAIN_MODEL.md`](DOMAIN_MODEL.md)
- [`ORDER_LIFECYCLE.md`](ORDER_LIFECYCLE.md)
- [`FINANCE.md`](FINANCE.md)
- [`adrs/ADR-006-pricing-and-price-snapshot.md`](adrs/ADR-006-pricing-and-price-snapshot.md)
- [`adrs/ADR-005-service-zone-model.md`](adrs/ADR-005-service-zone-model.md)
- [`adrs/ADR-013-financial-ledger.md`](adrs/ADR-013-financial-ledger.md)
