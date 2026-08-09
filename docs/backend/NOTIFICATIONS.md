# Notifications

## Providers

Use provider abstractions so push/SMS/email services can change without affecting domain logic.

## Events

- Order created.
- Driver offer available.
- Driver accepted.
- Driver near pickup.
- Pickup completed.
- Delivery completed.
- Rating requested.
- Severe/repeated complaint alert.
- New order number alert for admin.

## Reliability

- Queue notification delivery.
- Retry transient failures.
- Record provider result.
- Prevent duplicate sends where required.
- Never make notification delivery the source of truth for order state.
## Related documents

- [`REALTIME.md`](REALTIME.md)
- [`JOBS.md`](JOBS.md)
- [`../mobile/NOTIFICATIONS.md`](../mobile/NOTIFICATIONS.md)
- [`adrs/ADR-014-notification-provider.md`](adrs/ADR-014-notification-provider.md)
