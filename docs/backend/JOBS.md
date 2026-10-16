# Background Jobs

Use BullMQ or equivalent for asynchronous work.

## Jobs

- Notification delivery/retry.
- Dispatch offer expiration. **Running.** Payload: none. Every 5 seconds, marks `dispatch_offers` past `expiresAt` as expired and returns the order to `SEARCHING_DRIVER` when no offered row remains, then creates up to 5 fresh offers (ADR-007 / ADR-011). Idempotent: a closed offer is not offered again to a driver who rejected it. Failure: log and retry the next tick.
- Tracking cleanup. **Running.** Hourly delete of `driver_location_samples` with `receivedAt` older than 24 hours (ADR-011). Idempotent delete. Failure: log and leave the rows.
- Tracking cleanup.
- Rating alert evaluation.
- Daily/weekly/monthly financial aggregation.
- Orphan media cleanup. **Running.** Payload: none (sweep). Selects `media_objects` with `confirmedAt` null and `createdAt` older than 24 hours (ADR-015), up to 200 rows. Skips a row linked from `driver_profiles.id_photo_media_id`. Deletes the object (S3 when live, and the local file) then the row. Retry / backoff: the next hourly tick. Idempotent: a missing object deletes cleanly; a second sweep finds no row. Failure: log and leave the row (no separate dead-letter table until a BullMQ queue exists for this job).
- Idempotency record expiry (ADR-017). **Running.** Payload: none. Deletes `idempotency_records` with `expiresAt` in the past. Retry / backoff: the next hourly tick. Idempotent delete. Failure: log and leave the rows.
- Stale driver detection.

Each job must define:

- Payload contract.
- Retry policy.
- Backoff.
- Idempotency strategy.
- Failure/dead-letter behavior.
## Related documents

- [`DISPATCH.md`](DISPATCH.md)
- [`NOTIFICATIONS.md`](NOTIFICATIONS.md)
- [`FINANCE.md`](FINANCE.md)
- [`adrs/ADR-017-idempotency.md`](adrs/ADR-017-idempotency.md)
