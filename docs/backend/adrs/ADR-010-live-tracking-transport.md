# ADR-010: Live Tracking Transport

## Status

ACCEPTED

## Context

Clients need timely operational updates, but transport must not become source of truth. Transport technology and event catalog must be chosen explicitly.

## Decision

**Choose Option A:** Socket.IO on the API process.

### Rules

| Topic | Decision |
|---|---|
| Transport | Socket.IO, path `/socket.io`, same HTTP server as the API |
| Process | API process only. The worker does not serve sockets |
| Adapter | In-process adapter. A Redis Socket.IO adapter is not selected |
| Connection auth | Existing JWT access token (ADR-002). Handshake `auth.token`, or `Authorization: Bearer` |
| Failed auth | Disconnect. No anonymous socket |
| Authority | REST/domain state stays authoritative. The socket is an acceleration channel |
| Reconnect | Client reconciles by calling existing REST. No new poll interval |
| Domain rooms and events | Not part of this acceptance. Membership is ADR-016. Emission waits until that ADR and the event's owning ADR are ACCEPTED |

Commands (order submit, cancel, offer accept, location ingest) stay on REST.

## Decision Drivers

- Mobile battery/network realities
- Admin live ops
- Authority of REST/domain state
- Operational complexity
- ADR-001 already specifies NestJS HTTP/WebSocket presentation and a single modular monolith

## Considered Options

### Option A — Socket.IO ? **SELECTED**

Rooms, reconnect, and the NestJS Socket.IO adapter match the proposed channel list without a second protocol.

### Option B — Raw WebSockets

Same capability with the room and reconnect behavior rebuilt in application code.

### Option C — SSE for some channels + REST polling fallback

One-way server push. ADR-007 already requires a REST fallback for offers; SSE does not provide the bidirectional socket ADR-001 names as the presentation style.

## Consequences

- `@nestjs/websockets`, `@nestjs/platform-socket.io`, and `socket.io` are API-process dependencies
- CORS origins match `CORS_ORIGINS`
- Domain events in `REALTIME.md` stay proposed until their owning ADRs are accepted

## Security Implications

- Access JWT only. Refresh tokens are not accepted on the socket
- JWT payload stays `sub` and `role` (ADR-002)
- Channel membership and broadcast scope are ADR-016, not implemented here

## Operational Implications

- One API process holds the socket connections
- Horizontal socket fan-out is a later deployment decision (ADR-020), not this ADR

## Data Implications

- No new tables. Connection state is in memory on the API process

## API Implications

- Socket.IO endpoint at `/socket.io`
- No new REST routes
- No domain event names are frozen by this decision

## Mobile Implications

- After reconnect, the app reads order and profile state from existing REST
- Offer countdown and live map events are not emitted until ADR-016 and the event catalog are accepted

## Dependencies

- ADR-001
- ADR-002
- ADR-004

## Open Questions

- Final event catalog (proposed names remain in `REALTIME.md`)
- Room membership (ADR-016)
- Redis adapter / multi-instance fan-out (ADR-020)

## Approval

- Decision owner: Product Owner
- Approved by: Product Owner — Option A Socket.IO
- Date: 2026-10-13
