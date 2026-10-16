# ADR-016: Realtime Authorization

## Status

ACCEPTED

## Context

Realtime channels can leak sensitive operational data if membership is not authorized equivalently to REST scopes.

## Decision

**Choose Option A:** token-gated rooms mapped to REST scopes.

The client never sends a room name. After the access JWT is accepted (ADR-010), the server joins that socket only to rooms the same token could read over REST.

### Rooms

| Room | Who is joined |
|---|---|
| `order:{orderId}` | The customer who owns the order, and the assigned driver once assigned |
| `driver:{userId}` | That driver's own sockets |
| `admin:ops` | Admin sockets |

### Phase 6 events

Emitted only into the rooms above. REST remains the source of truth; a client reconciles with the existing GET after reconnect.

| Event | Rooms | Payload |
|---|---|---|
| `order.status.changed` | `order:{orderId}`, `admin:ops` | `orderId`, `status` |
| `driver.location.updated` | `order:{orderId}` for each order currently assigned to that driver (from `DRIVER_ACCEPTED` through `IN_TRANSIT`), and `admin:ops` | `orderId` on the order room; `driverUserId`, coordinates, accuracy, `capturedAt`, freshness |
| `dispatch.offer.created` | `driver:{userId}` gets the same body as `GET /drivers/me/offers`. `admin:ops` gets `offerId`, `orderId`, `driverUserId` only | |
| `dispatch.offer.expired` | That driver's room and `admin:ops` | `offerId`, `orderId`, `status` of `expired`, `rejected`, or `cancelled` |

`rating.requested` and `admin.alert.created` stay proposed until ADR-012 is accepted.

### Handshake

- Access JWT only, checked at connect. A failed check disconnects.
- The socket does not accept a refresh token and does not rotate tokens in-band.
- When the client stores a new access token it opens a new socket. Reconnect reads REST again.

## Decision Drivers

- Least privilege
- Prevent cross-customer/driver leakage
- Admin channel protection
- Reconnect safety

## Considered Options

### Option A — Token-gated rooms mapped to REST scopes — **SELECTED**

Socket.IO rooms match the scopes ADR-003 already enforces on order, tracking, and offer reads. The client cannot ask to join another id.

### Option B — Per-event authorization checks

Same checks without a stable membership list. Harder to see who can hear a later emit on an open socket.

### Option C — Server-side push only (no client-subscribe rooms)

Equivalent safety if the server picks sockets itself. Option A uses rooms so membership stays explicit, while still forbidding client-initiated joins.

## Consequences

- Orders, dispatch, and location ingest emit after the database write commits
- A missed event is recovered by the existing REST read
- No new tables

## Security Implications

- Room join is server-side only
- Offer shop details go only to the offered driver's room
- Admin receives identifiers and location, not another party's credentials
- Location coordinates are emitted only after a driver is assigned, matching ADR-011

## Operational Implications

- One API process holds the sockets (ADR-010). Fan-out across processes stays ADR-020

## Data Implications

- No new stored fields. Events are not a second log

## API Implications

- No new REST routes
- Event names above are frozen for Phase 6

## Mobile Implications

- Customer tracking updates status and the latest driver point from these events, then confirms from REST
- The driver offer card appears and closes from the offer events
- Background GPS stays out of v1 (ADR-011)

## Dependencies

- ADR-003
- ADR-010
- ADR-004 for status values
- ADR-007 for offer lifetime
- ADR-011 for who may see a point

## Open Questions

- Numeric ETA source for the 5-minute second-offer gate remains the open question in ADR-009. This decision does not choose a maps provider.

## Approval

- Decision owner: Product Owner
- Approved by: Product Owner — Option A, Phase 6 events
- Date: 2026-10-13
