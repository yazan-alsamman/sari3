# Realtime Strategy

## Purpose

Defines realtime update channels as an acceleration layer over authoritative REST/domain state.

## Status

Transport choice undecided.

Related ADRs:

- [`adrs/ADR-010-live-tracking-transport.md`](adrs/ADR-010-live-tracking-transport.md)
- [`adrs/ADR-016-realtime-authorization.md`](adrs/ADR-016-realtime-authorization.md)

## Candidates

- WebSocket / Socket.IO for operational updates.
- Alternative realtime transport if chosen in ADR-010.

REST remains authoritative for commands and initial reads.

## Channels (proposed)

- Customer order room
- Driver private channel
- Admin operational channel

Membership rules: **TBD — ADR-016**.

## Events (proposed)

- `order.status.changed`
- `driver.location.updated`
- `dispatch.offer.created`
- `dispatch.offer.expired`
- `rating.requested`
- `admin.alert.created`

Final event catalog: **TBD — ADR-010** (coordinate with ADR-004 / ADR-007 / ADR-012).

## Rules

- Authenticate socket connections.
- Authorize channel membership.
- Never broadcast data beyond scope.
- Reconnect must trigger state reconciliation from REST.
- Realtime delivery is not the source of truth for order state, pricing, or finance.

## Related documents

- [`TRACKING.md`](TRACKING.md)
- [`NOTIFICATIONS.md`](NOTIFICATIONS.md)
- [`../mobile/NOTIFICATIONS.md`](../mobile/NOTIFICATIONS.md)
- [`AUTH_SECURITY.md`](AUTH_SECURITY.md)
