# Saree'e Mobile App — Flutter

## Purpose

Documentation for the Flutter mobile application covering customer and driver experiences.

## Scope

Flutter mobile application for customers and drivers.

The app must keep role-specific flows isolated while sharing authentication, networking, notifications, location, and common UI infrastructure.

## Status

Documentation only. Flutter application source code is **not implemented** in this repository yet.

Intended technology: Flutter / Dart.

## Recommended structure (intended)

```text
lib/
  app/
    router/
    theme/
    localization/
  core/
    network/
    storage/
    errors/
    permissions/
    notifications/
    location/
    widgets/
  features/
    auth/
    customer/
      orders/
      ratings/
      profile/
    driver/
      offers/
      active_orders/
      navigation/
      earnings/
      profile/
  shared/
```

## Architecture overview

Use feature-first Clean Architecture:

- **Presentation:** screens/widgets/controllers/state.
- **Application:** commands/use cases.
- **Domain:** entities/value objects/rules (UX validation only where helpful).
- **Data/infrastructure:** API clients, repositories, local persistence.

State management must be consistent across the application.

Avoid global objects acting as undocumented data buses.

Detailed layer rules: [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Rules

- API models never become domain models by accident.
- UI must not contain business rules.
- Location permissions are explicit and reversible.
- All critical user actions have loading/error/success states.
- Network failures are recoverable and understandable.
- Backend remains authoritative for order state, pricing, dispatch, permissions, and ratings.

## Documents in this folder

| File | Responsibility |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Mobile layered architecture |
| [`NAVIGATION.md`](NAVIGATION.md) | Role flows and navigation guards |
| [`ORDER_FLOW.md`](ORDER_FLOW.md) | Customer order UX sequence |
| [`DRIVER_APP.md`](DRIVER_APP.md) | Driver operational UX |
| [`NOTIFICATIONS.md`](NOTIFICATIONS.md) | Push/deep-link client behavior |
| [`LOCATION.md`](LOCATION.md) | Client location permissions and sampling |
| [`RATING.md`](RATING.md) | Rating UX |
| [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) | UX/visual principles |
| [`TESTING.md`](TESTING.md) | Mobile test strategy |
| [`RELEASE.md`](RELEASE.md) | Store/release readiness |

## Related backend docs

- [`../backend/ORDER_LIFECYCLE.md`](../backend/ORDER_LIFECYCLE.md)
- [`../backend/DISPATCH.md`](../backend/DISPATCH.md)
- [`../backend/REALTIME.md`](../backend/REALTIME.md)
- [`../backend/TRACKING.md`](../backend/TRACKING.md)
