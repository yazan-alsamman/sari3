# Navigation & Role Flows

## Purpose

Defines shared and role-specific navigation destinations and guard rules for the Flutter app.

## Shared

- Splash/bootstrap
- Login
- Verification/recovery
- Profile
- Settings

## Customer

- Home
- Create Order
- Pickup details
- Drop-off details
- Delivery mode
- Price confirmation
- Active order
- Order history
- Order details
- Rating
- Profile

## Driver

- Availability
- Delivery offers
- Offer details
- Active deliveries
- Route/order sequence
- Pickup confirmation
- Delivery confirmation
- Earnings
- History
- Profile

## Guards

Navigation guards must be driven by authenticated role/session state, not by UI visibility alone.

Exact route map, deep-link scheme, and guard matrix: **TBD — Mobile implementation decision after ADR-002 / ADR-003**.

## Related documents

- [`ARCHITECTURE.md`](ARCHITECTURE.md)
- [`ORDER_FLOW.md`](ORDER_FLOW.md)
- [`DRIVER_APP.md`](DRIVER_APP.md)
- [`../backend/AUTH_SECURITY.md`](../backend/AUTH_SECURITY.md)
