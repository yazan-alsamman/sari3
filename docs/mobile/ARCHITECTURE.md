# Mobile Architecture

## Purpose

Defines Flutter application layering, dependency direction, and backend-authority rules.

## Status

Intended architecture. Application source is not implemented yet.

State-management library choice: **TBD — Mobile Architecture Decision Required** (record in implementation plan after ADR-001 alignment).

## Layers

### Presentation

Responsible for rendering state and user interaction.

### Application

Coordinates use cases such as:

- CreateOrder
- AcceptOffer
- RejectOffer
- SubmitRating
- UpdateDriverAvailability

### Domain

Contains pure business rules and entities where mobile-side validation improves UX.

Backend remains authoritative.

### Data

Contains:

- REST clients.
- DTOs.
- Serializers.
- Repositories.
- Local cache.
- Secure storage.
- Notification adapters.

## Dependency direction

```text
Presentation -> Application -> Domain
                         \-> Data interfaces

Data implements Application/Domain interfaces
```

## Backend authority

The app never assumes that client-side validation guarantees server acceptance.

Server responses are authoritative for:

- Order state.
- Pricing.
- Dispatch.
- Permissions.
- Ratings.

## Offline behavior

The app may cache read-only data and queue explicitly safe retryable actions.

It must never fabricate an order state or financial result while offline.

Safe offline retry classification: **TBD — depends on ADR-017 (Idempotency)** and per-command contracts.

## Related documents

- [`README.md`](README.md)
- [`NAVIGATION.md`](NAVIGATION.md)
- [`../backend/ARCHITECTURE.md`](../backend/ARCHITECTURE.md)
- [`../backend/adrs/ADR-001-system-architecture.md`](../backend/adrs/ADR-001-system-architecture.md)
