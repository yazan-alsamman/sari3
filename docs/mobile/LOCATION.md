# Mobile Location

## Purpose

Defines client-side location capture, permissions, and interaction with backend freshness rules.

## Customer

Customer location is used to improve pickup/drop-off accuracy when explicitly selected.

## Driver

Driver location is used for:

- Dispatch proximity.
- Live tracking.
- ETA estimation.
- Route compatibility.

## Rules

- Request only necessary permissions.
- Explain why background location is required if enabled.
- Send location samples according to configurable distance/time thresholds.
- Mark stale location after the backend freshness threshold.
- Never assume GPS is perfect.
- Handle denied/restricted permissions gracefully.
- Communicate when location is being shared.

## Open thresholds (do not invent)

| Parameter | Status |
|---|---|
| Sample time interval | **TBD — ADR-011** |
| Sample distance threshold | **TBD — ADR-011** |
| Accuracy acceptance threshold | **TBD — ADR-011** |
| Background vs foreground policy | **TBD — Mobile + ADR-011** |
| Stale display threshold | **TBD — ADR-011** |

## Authority

Backend freshness classification and retention policy are authoritative.

See [`../backend/TRACKING.md`](../backend/TRACKING.md) and [`../backend/REALTIME.md`](../backend/REALTIME.md).

Push/WebSocket updates are not the source of truth.

## Related documents

- [`DRIVER_APP.md`](DRIVER_APP.md)
- [`../backend/TRACKING.md`](../backend/TRACKING.md)
- [`../backend/adrs/ADR-011-location-freshness-retention.md`](../backend/adrs/ADR-011-location-freshness-retention.md)
