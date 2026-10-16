# ADR-011: Location Freshness & Retention

## Status

ACCEPTED

## Context

Dispatch and customer trust depend on freshness classification. Privacy requires retention limits. Thresholds must be explicit and measurable.

The product owner asked for the thresholds used by urban on-demand driver apps in this market (Yalla Go / BeOrder style): a motorcycle courier is offered a nearby pickup only when the latest GPS fix is recent and tight.

## Decision

**Choose Option B:** Time + accuracy hybrid tiers.

A sample is classified from its age (`receivedAt - capturedAt`) and its reported accuracy.

| Class | Rule | Dispatch |
|---|---|---|
| Fresh | age ≤ **15 seconds** and accuracy ≤ **30 meters** | Eligible |
| Aging | age ≤ **45 seconds** and accuracy ≤ **80 meters**, and not Fresh | Visible, not eligible |
| Stale | older than 45 seconds, accuracy worse than 80 meters, or capturedAt more than 5 seconds in the future | Not eligible |
| Unknown | No stored sample | Not eligible |

### Sampling

While the driver is online and the driver app is open:

- Send a sample every **5 seconds** or **20 meters**, whichever comes first.
- Each sample includes latitude, longitude, accuracy meters, and capturedAt.
- The server stores a sample only when it is at least 5 seconds or 20 meters from the previous stored sample.
- No background GPS in v1. Going offline stops new samples.

### Retention

Delete location samples **24 hours** after `receivedAt`. Pickup and drop-off points stored on the order are not part of this sweep.

### Visibility

- Dispatch and admin read the latest sample and its class.
- The customer reads the latest point only after a driver is assigned to that order. No track history on that read.
- Before assignment the customer gets order status without coordinates.

## Decision Drivers

- Dispatch safety
- Privacy minimization
- Stale-location honesty in UX
- Storage cost
- Same operating pattern as a city motorcycle courier app

## Considered Options

### Option A — Time-based freshness tiers

A new point with a hundreds-of-meters error would still look fresh.

### Option B — Time + accuracy hybrid tiers ? **SELECTED**

### Option C — Presence heartbeat separate from GPS samples

Presence is already the online/offline switch. It does not prove the driver is near the pickup.

## Consequences

- Offer selection uses Fresh only (ADR-007)
- Aging and Stale stay on the latest sample so the UI can say the fix is not precise
- A second offer still follows ADR-009. Without an ETA provider, a driver who already has an order before `DELIVERED` is not offered another one

## Security Implications

- Only the approved driver writes their own samples
- Customer tracking is limited to an order they own, and only after assignment
- Samples older than 24 hours are deleted

## Operational Implications

- Drivers who stand still still refresh every 5 seconds so a fix does not age out while they are online
- Offer expiry remains 15 seconds (ADR-007). The dispatch sweep runs every 5 seconds so that timeout is honored

## Data Implications

- `driver_location_samples` and `driver_availability`
- `dispatch_offers` for Phase 5

## API Implications

- `POST /drivers/me/availability`
- `POST /drivers/me/location`
- `GET /drivers/me/offers`
- `POST /dispatch/offers/:offerId/accept` and `reject` with `Idempotency-Key`
- `GET /orders/:orderId/tracking`

## Mobile Implications

- The driver app sends fixes only while online and open
- The customer map uses the latest assigned-driver point, not a trail

## Dependencies

- ADR-010
- ADR-007
- ADR-008
- ADR-009

## Open Questions

- Background GPS after v1
- Numeric ETA provider for the ADR-009 five-minute second-offer gate

## Approval

- Decision owner: Product Owner
- Approved by: Product Owner — set the Yalla Go / BeOrder style thresholds
- Date: 2026-10-13
