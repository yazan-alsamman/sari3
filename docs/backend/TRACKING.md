# Live Tracking

## Purpose

Defines location ingestion, freshness classification, visibility, and retention concerns for operational tracking.

## Status

Structural specification. Thresholds and retention periods are undecided.

Related ADRs:

- [`adrs/ADR-010-live-tracking-transport.md`](adrs/ADR-010-live-tracking-transport.md)
- [`adrs/ADR-011-location-freshness-retention.md`](adrs/ADR-011-location-freshness-retention.md)
- [`adrs/ADR-016-realtime-authorization.md`](adrs/ADR-016-realtime-authorization.md)
- [`adrs/ADR-018-data-retention-privacy.md`](adrs/ADR-018-data-retention-privacy.md)

## Separation of concerns

| Concern | Owning doc / ADR |
|---|---|
| Location capture (mobile) | [`../mobile/LOCATION.md`](../mobile/LOCATION.md) |
| Location ingestion (backend) | this file |
| Location freshness | this file + ADR-011 |
| Realtime transport | [`REALTIME.md`](REALTIME.md) + ADR-010 |
| REST reconciliation | [`REALTIME.md`](REALTIME.md) |
| Admin visibility | this file + [`ADMIN.md`](ADMIN.md) |
| Customer visibility | this file + product requirements |
| Privacy / retention | ADR-011 / ADR-018 |

## Location ingestion

Drivers send location samples while operationally active.

Each sample contains at least:

- driverId
- latitude
- longitude
- accuracy
- capturedAt
- receivedAt

Additional fields (speed, heading, source): **TBD — ADR-011**.

Sampling frequency / distance threshold / accuracy threshold: **TBD — ADR-011** (do not invent values).

## Freshness

Backend classifies location as:

- Fresh
- Aging
- Stale
- Unknown

Thresholds for each class: **TBD — ADR-011**.

Clients must display freshness-aware wording rather than claiming a precise live location when stale.

## Visibility

### Admin

Admin can view:

- Current driver location.
- Last update time.
- Active orders.
- Current operational status.

Exact authorization: **TBD — ADR-003 / ADR-016**.

### Customer

Customers see meaningful status and ETA information.

Whether customers see continuous map coordinates vs coarse status: **TBD — Product / ADR-011**.

## Failure modes

| Scenario | Required behavior |
|---|---|
| GPS failure | Graceful degradation — details **TBD — ADR-011** |
| Offline driver | Mark freshness accordingly — **TBD — ADR-011** |
| Reconnection | Reconcile authoritative state via REST — see REALTIME |
| Forged / spoofed location | Mitigations **TBD — ADR-011 / security threat model** |

## Authority rule

Push notifications and WebSocket events are **not** the source of truth.

REST/domain state remains authoritative; realtime is an acceleration channel.

## Retention

Tracking history must have a documented retention period and deletion/anonymization policy.

Retention period: **TBD — ADR-011 / ADR-018**.

## Related documents

- [`REALTIME.md`](REALTIME.md)
- [`DISPATCH.md`](DISPATCH.md)
- [`../mobile/LOCATION.md`](../mobile/LOCATION.md)
- [`SECURITY_THREAT_MODEL.md`](SECURITY_THREAT_MODEL.md)
