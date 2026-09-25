# ADR-015: Media / Object Storage

## Status

ACCEPTED

## Context

Shop photos, driver ID photos, and optional delivery proof require secure upload, validation, metadata persistence, and orphan cleanup.

## Decision

**Choose Option A:** S3-compatible object storage (MinIO in staging; AWS S3 / equivalent in production).

### Object types (v1)

| Type | Required? | Notes |
|---|---|---|
| Driver national ID image | **Required** at driver registration | Private; admin review only |
| Shop / landmark photo | Optional on order stops | Private; assigned parties + admin |
| Delivery proof photo | Optional in v1 | May become required later |

### Upload flow

1. Client requests **presigned upload URL** (authZ scoped)
2. Client uploads directly to object storage
3. Client confirms upload ? server validates metadata (MIME, size) and stores object key
4. Download via **short-lived signed GET** URLs only (no public buckets for KYC)

### Limits (v1 defaults — owner may tighten)

- Images only: `image/jpeg`, `image/png`, `image/webp`
- Max size **5 MB** per object
- Malware scanning: enable when provider available; until then MIME/size + authZ gate

### Retention

- KYC images retained while driver account active; delete/anonymize per ADR-018
- Orphan uploads (no confirm within 24h) cleaned by job

## Decision Drivers

- Security of uploads
- Cost
- Signed URL access
- Lifecycle cleanup
- Driver KYC requirement

## Considered Options

### Option A — S3-compatible / MinIO ? **SELECTED**

### Option B — Cloud-vendor only

### Option C — DB BLOBs

Rejected.

## Consequences

- Media module owns metadata; domain stores references only
- Never return permanent public URLs for ID photos

## Security Implications

- Private buckets
- Presign scoped to user + purpose
- Admin access audited when viewing KYC

## Operational Implications

- Separate buckets/prefixes: `kyc/`, `orders/`, `proofs/`

## Data Implications

- `media_objects` table (id, owner, purpose, key, mime, bytes, createdAt)

## API Implications

- `POST /media/presign`, `POST /media/confirm`

## Mobile Implications

- Camera/gallery ? presign ? upload ? attach id to register/order payloads

## Dependencies

- ADR-001
- ADR-002 / ADR-003 for who may upload/view

## Open Questions

- Exact production cloud vendor
- Mandatory delivery proof date (post-v1)

## Approval

- Decision owner: Product Owner
- Approved by: Yazan (CTO) — accepted backend work order
- Date: 2026-09-22
