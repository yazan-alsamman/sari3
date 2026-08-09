# Driver App

## Availability

Driver can be:

- Offline
- Available
- Temporarily unavailable
- Suspended

Only eligible states may receive dispatch offers.

## Offer

Offer displays:

- Order number.
- Service mode.
- Pickup/drop-off areas.
- Approximate distance/ETA.
- Package class.
- Earnings/charge as permitted by policy.
- Expiration timer.

Accept/reject operations are server-authoritative and idempotent.

## Active orders

The app displays a backend-defined sequence.

The driver cannot arbitrarily mark an order completed without satisfying required checkpoints.

## Location

Location sharing is active only when operational policy allows it and the driver has granted permission.

The app must communicate when location is being shared.
## Related documents

- [`NAVIGATION.md`](NAVIGATION.md)
- [`LOCATION.md`](LOCATION.md)
- [`../backend/DISPATCH.md`](../backend/DISPATCH.md)
- [`../backend/MULTI_ORDER_ROUTING.md`](../backend/MULTI_ORDER_ROUTING.md)
