# Backend Testing Strategy

## Unit

Pure domain rules and application use cases.

## Integration

- PostgreSQL repositories.
- Transactions.
- Redis/queues.
- Storage.
- Authorization scopes.

## Strict integration

Explicit negative tests for:

- IDOR.
- Wrong customer.
- Wrong driver.
- Suspended driver.
- Cross-scope resource access.
- Soft-deleted resources.
- Invalid state transitions.
- Concurrent dispatch acceptance.
- Capacity violations.
- Duplicate rating.
- Ledger mutation attempts.

## E2E

Critical flows:

1. Customer registration/login.
2. Create and price order.
3. Dispatch.
4. Driver accepts.
5. Pickup.
6. Delivery.
7. Rating.
8. Admin alert.
9. Financial settlement/reporting.

## Quality gates

- TypeScript.
- Lint.
- Formatting.
- Unit.
- Integration.
- E2E.
- Database migration validation.
- Build.
- Docker/live verification.
## Related documents

- [`TASKS.md`](TASKS.md)
- [`SECURITY_THREAT_MODEL.md`](SECURITY_THREAT_MODEL.md)
