# Backend Deployment

## Environments

- Development.
- Staging.
- Production.

Configuration must be environment-driven.

Secrets are never committed.

## Infrastructure

Suggested:

- Node.js service.
- PostgreSQL.
- Redis.
- Worker process.
- Object storage.
- Reverse proxy.
- Monitoring/logging.

## Deployment checks

- Database migration status.
- Health/readiness.
- Queue connectivity.
- Environment validation.
- API smoke tests.
- Rollback procedure.

## Docker

Provide separate service definitions for API and workers when scaling independently is useful.
## Related documents

- [`adrs/ADR-020-deployment-topology.md`](adrs/ADR-020-deployment-topology.md)
- [`OBSERVABILITY.md`](OBSERVABILITY.md)
