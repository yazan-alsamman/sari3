# Media & Shop Photos

## Use cases

- Pickup shop photo.
- Drop-off shop photo.
- Optional delivery proof.

## Storage

Use an object-storage abstraction such as S3-compatible storage or MinIO.

## Security

- Do not expose raw bucket credentials.
- Generate scoped signed URLs where required.
- Validate MIME type and size.
- Generate safe object keys.
- Remove orphaned objects through a cleanup process.
- Store metadata in PostgreSQL.

## Lifecycle

Upload
-> validate
-> persist metadata
-> attach to domain object
-> cleanup on failed/orphaned workflows.
## Related documents

- [`adrs/ADR-015-media-storage.md`](adrs/ADR-015-media-storage.md)
- [`ORDER_LIFECYCLE.md`](ORDER_LIFECYCLE.md)
