# ADR-015: Media / Object Storage

## Status

PROPOSED

## Context

Shop photos and optional delivery proof require secure upload, validation, metadata persistence, and orphan cleanup.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Security of uploads
- Cost
- Signed URL access
- Lifecycle cleanup

## Considered Options

### Option A

S3-compatible/MinIO

### Option B

Cloud-vendor object storage only

### Option C

DB BLOBs (discouraged)


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

## Open Questions

- MIME/size limits?
- Virus/malware scanning?
- Proof-of-delivery required or optional?
- Retention?
- Orphan cleanup SLA?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
