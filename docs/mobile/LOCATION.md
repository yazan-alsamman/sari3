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

## Thresholds (ADR-011 ACCEPTED)

| Parameter | Value |
|---|---|
| Sample time interval | 5 seconds while online and the driver app is open |
| Sample distance threshold | 20 meters |
| Fresh | age ≤ 15 seconds and accuracy ≤ 30 meters |
| Aging | age ≤ 45 seconds and accuracy ≤ 80 meters |
| Stale | older than 45 seconds or accuracy worse than 80 meters |
| Background GPS | Not in v1 |

## Authority

Backend freshness classification and retention policy are authoritative.

See [`../backend/TRACKING.md`](../backend/TRACKING.md) and [`../backend/REALTIME.md`](../backend/REALTIME.md).

Push/WebSocket updates are not the source of truth.

## Related documents

- [`DRIVER_APP.md`](DRIVER_APP.md)
- [`../backend/TRACKING.md`](../backend/TRACKING.md)
- [`../backend/adrs/ADR-011-location-freshness-retention.md`](../backend/adrs/ADR-011-location-freshness-retention.md)
