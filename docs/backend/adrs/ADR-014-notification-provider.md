# ADR-014: Notification Provider Abstraction

## Status

PROPOSED

## Context

Operational events need reliable multi-channel delivery without making notifications authoritative for domain state.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Provider portability
- Retry/dead-letter
- Dedup
- Privacy in notification text

## Considered Options

### Option A

FCM/APNs only

### Option B

Push + SMS fallback

### Option C

Push + SMS + email


## Consequences

TBD

## Security Implications

TBD

## Operational Implications

TBD

## Data Implications

TBD

## API Implications

TBD

## Mobile Implications

TBD

## Dependencies

- ADR-001
- ADR-004

## Open Questions

- Channels per event?
- Provider selection?
- Dedup keys?
- Template ownership?
- Admin alert channel?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
