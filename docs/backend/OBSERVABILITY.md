# Observability

## Logs

Structured JSON logs with:

- timestamp
- level
- requestId/correlationId
- actorId where safe
- module
- action
- duration
- outcome

## Metrics

- API latency/error rate.
- Orders created/completed/cancelled.
- Dispatch acceptance/rejection/expiry.
- Driver location freshness.
- Notification success/failure.
- Queue lag.
- Rating distribution.
- Financial totals.

## Alerts

Examples:

- Dispatch backlog spike.
- Notification provider outage.
- Database health failure.
- High stale-driver ratio.
- Unusual low-rating spike.
## Related documents

- [`../shared/NFR.md`](../shared/NFR.md)
- [`adrs/ADR-019-observability.md`](adrs/ADR-019-observability.md)
