# Multi-Order & Smart Routing

## Purpose

Defines product requirements and architecture decisions required to allow drivers to carry multiple compatible orders.

## Status

Requirement known; operational limits and algorithm undecided.

Owning decision record: [`adrs/ADR-009-multi-order-route-compatibility.md`](adrs/ADR-009-multi-order-route-compatibility.md).

Depends on [`adrs/ADR-008-driver-capacity.md`](adrs/ADR-008-driver-capacity.md) and [`adrs/ADR-007-dispatch-selection.md`](adrs/ADR-007-dispatch-selection.md).

## Known product requirement

A driver may carry multiple compatible orders when capacity and route constraints allow it.

Compatibility must consider:

- Weight/volume.
- Special handling.
- Pickup/drop-off sequence.
- Route deviation.
- VIP priority.
- Maximum active orders.

Routing providers must not own business decisions. They provide distance/ETA/route data. Saree'e decides operational acceptability.

## Architecture decisions required

| Decision | Status |
|---|---|
| Maximum active orders | **BUSINESS DECISION REQUIRED** / ADR-009 |
| Weight capacity interaction | **BUSINESS DECISION REQUIRED** / ADR-008 |
| Volume capacity interaction | **BUSINESS DECISION REQUIRED** / ADR-008 |
| Package count / categories | **BUSINESS DECISION REQUIRED** / ADR-008 |
| Maximum route deviation | **TBD — ADR-009** |
| Maximum additional ETA / ETA degradation | **TBD — ADR-009** |
| VIP behavior when inserting into a route | **TBD — ADR-009** |
| Pickup ordering rules | **TBD — ADR-009** |
| Drop-off ordering rules | **TBD — ADR-009** |
| Route insertion algorithm | Deterministic insertion heuristic proposed as initial approach; exact algorithm **TBD — ADR-009** |
| Provider selection (maps/routing) | **TBD — ADR-009** |
| Provider unavailable / degraded mode | **TBD — ADR-009** |
| Driver acceptance of additional orders | **TBD — ADR-009** |
| Route recalculation triggers | **TBD — ADR-009** |
| Removing an order from an existing route | **TBD — ADR-009** |
| Behavior when route becomes incompatible mid-execution | **TBD — ADR-009** |

## Route compatibility (principle)

A new order is compatible only if inserting its pickup/drop-off stops into the current route keeps all constraints valid.

A more advanced optimizer may be introduced later behind the same application port.

## Capacity interaction

Capacity enforcement for multi-order scenarios is owned by ADR-008 + ADR-009.

Do **not** invent:

- Maximum kilograms
- Maximum liters
- Maximum packages
- Motorcycle basket dimensions

Mark all numeric limits: **BUSINESS DECISION REQUIRED**.

## Related documents

- [`DISPATCH.md`](DISPATCH.md)
- [`DOMAIN_MODEL.md`](DOMAIN_MODEL.md)
- [`../mobile/DRIVER_APP.md`](../mobile/DRIVER_APP.md)
- [`adrs/ADR-009-multi-order-route-compatibility.md`](adrs/ADR-009-multi-order-route-compatibility.md)
- [`adrs/ADR-008-driver-capacity.md`](adrs/ADR-008-driver-capacity.md)
