# Saree'e Backend (`apps/backend`)

Production NestJS backend for Saree'e (سريع حوش بلاس).

**Authority:** ACCEPTED ADR-001 (modular NestJS monolith + workers).  
**Phase:** 3 — Zones & pricing (named areas, preview, immutable snapshots).  
Identity (Phase 2) + foundation (Phase 1) included. OTP/MinIO still deferred.

Domain APIs beyond identity (orders, dispatch, finance) start in Phase 3+ per [`docs/backend/LAUNCH_PATH.md`](../../docs/backend/LAUNCH_PATH.md).

## Prerequisites

- Node.js 20+ (Node 24 works; use Jest 29 — Jest 30 resolver breaks on this stack)
- Postgres 16 + Redis 7 (Docker Compose preferred; native Windows installs also OK)

## Quick start

```powershell
cd apps/backend
Copy-Item .env.example .env
docker compose up -d   # or native Postgres + Redis on :5432 / :6379
# If registry.npmjs.org resets often on this network:
#   npm config set registry https://registry.npmmirror.com
#   $env:NODE_OPTIONS='--dns-result-order=ipv4first'
npm install --omit=optional --legacy-peer-deps --ignore-scripts
$env:CHECKPOINT_DISABLE='1'
npx prisma generate
npx prisma migrate deploy
npm run start:dev
```

- Live: `http://localhost:3001/api/v1/health/live` (works even if DB is down)
- Ready: `http://localhost:3001/api/v1/health/ready` (needs Postgres + Redis)
- Swagger: `http://localhost:3001/docs`

## Scripts

| Script | Purpose |
|---|---|
| `npm run start:dev` | API watch mode |
| `npm run build` | Compile |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit tests |
| `npm run prisma:migrate:dev` | Dev migrations |
| `npm run start:worker` | Worker stub (Phase 1) |

## Layout

```text
src/
  config/                 env validation
  infrastructure/         Prisma, Redis adapters
  modules/health/         liveness + readiness
  modules/auth/           register/login/refresh/logout + guards
  modules/media/          ADR-015 local adapter
  modules/admin/          driver KYC approve/reject
  modules/audit/          audit log writer
  main.ts                 API entry
  worker.ts               worker stub (ADR-001)
prisma/                   schema + migrations
```

## Related docs

- [`docs/backend/LAUNCH_PATH.md`](../../docs/backend/LAUNCH_PATH.md)
- [`docs/backend/ARCHITECTURE.md`](../../docs/backend/ARCHITECTURE.md)
- [`docs/backend/adrs/ADR-001-system-architecture.md`](../../docs/backend/adrs/ADR-001-system-architecture.md)
