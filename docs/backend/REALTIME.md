# Realtime Strategy

## Purpose

Defines realtime update channels as an acceleration layer over authoritative REST/domain state.

## Status

Transport is **Socket.IO** (ADR-010 ACCEPTED, 2026-10-13). Path `/socket.io` on the API process. Connection requires the JWT access token in `auth.token` or `Authorization: Bearer`.

Membership is **ADR-016 Option A** (ACCEPTED, 2026-10-13). The server joins sockets to `order:{orderId}`, `driver:{userId}`, and `admin:ops`. The client does not send a room name.

The client connects with the stored access token. On connect and reconnect it reads `GET /orders`. While the session stays open, that read still repeats every 5 seconds so a missed event is recovered. Phase 6 events are consumed: `order.status.changed`, `driver.location.updated`, `dispatch.offer.created`, and `dispatch.offer.expired`. `rating.requested` and `admin.alert.created` stay proposed until ADR-012.

Related ADRs:

- [`adrs/ADR-010-live-tracking-transport.md`](adrs/ADR-010-live-tracking-transport.md)
- [`adrs/ADR-016-realtime-authorization.md`](adrs/ADR-016-realtime-authorization.md)

## Candidates

- WebSocket / Socket.IO for operational updates.
- Alternative realtime transport if chosen in ADR-010.

REST remains authoritative for commands and initial reads.

## Channels (ADR-016)

- `order:{orderId}` — owning customer, and the assigned driver after assignment
- `driver:{userId}` — that driver only
- `admin:ops` — admins

## Events

Frozen for Phase 6, plus `rating.requested` when the order becomes `COMPLETED` (ADR-012):

- `order.status.changed`
- `driver.location.updated`
- `dispatch.offer.created`
- `dispatch.offer.expired` (`status`: `expired`, `rejected`, or `cancelled`)
- `rating.requested`

Still proposed until a threshold is accepted:

- `admin.alert.created`

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
