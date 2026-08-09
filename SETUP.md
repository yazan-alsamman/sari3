# Setup — Saree'e (سريع)

This guide explains how to work with the repository in its **current Phase 0** state (documentation foundation) and what to expect when implementation begins.

## Prerequisites (documentation work)

- Git
- A Markdown-capable editor (VS Code / Cursor recommended)
- Ability to browse the `docs/` tree

No Flutter SDK, Node.js runtime, PostgreSQL, or Redis is required to contribute documentation or ADRs.

## Clone

```bash
git clone https://github.com/yazan-alsamman/sari3.git
cd sari3
```

## Repository orientation

| Path | Purpose |
|---|---|
| `docs/` | Authoritative product and engineering documentation |
| `docs/backend/adrs/` | Architecture Decision Records |
| `.cursor/rules/` | Cursor agent documentation-first gate |
| `.github/` | Issue and pull request templates |

Start here:

1. [`README.md`](README.md)
2. [`docs/README.md`](docs/README.md)
3. [`docs/MANIFEST.md`](docs/MANIFEST.md) (index only — verify against filesystem)
4. [`docs/shared/PRODUCT_REQUIREMENTS.md`](docs/shared/PRODUCT_REQUIREMENTS.md)
5. [`docs/backend/ADR_INDEX.md`](docs/backend/ADR_INDEX.md)

## Documentation workflow

1. Discover the actual `docs/` filesystem (do not trust memory or MANIFEST alone).
2. Identify the authoritative document for your change.
3. Prefer updating an existing file over creating a duplicate.
4. Architectural decisions belong in ADRs under `docs/backend/adrs/`.
5. Mark unresolved items as `TBD` / `BUSINESS DECISION REQUIRED` / `PROPOSED` — never invent commercial values.

## Intended implementation stack (future)

When Phase 1+ begins (after required ADRs are **ACCEPTED**), contributors should expect approximately:

### Mobile

- Flutter SDK (stable channel as decided by the team)
- Dart toolchain
- IDE with Flutter plugins

### Backend

- Node.js LTS + TypeScript
- NestJS
- PostgreSQL
- Prisma
- Redis + BullMQ
- Object storage (S3-compatible / MinIO — ADR-015)
- Realtime transport (ADR-010)

Exact versions and topology will be frozen in accepted ADRs and deployment documentation.

## Local development (not available yet)

Application packages (`pubspec.yaml`, NestJS `package.json`, Docker Compose, `.env` samples) are intentionally **not** part of Phase 0.

When they are introduced:

- Copy environment examples (never commit secrets)
- Run database migrations through the documented process
- Start API and workers as documented in `docs/backend/DEPLOYMENT.md`
- Follow mobile setup in `docs/mobile/README.md` and `docs/mobile/RELEASE.md`

## Verification before implementation work

Ask:

- Which ADRs does this task depend on?
- Are they all **ACCEPTED**?
- Are any required business values still TBD?
- Does the impact surface touch API, database, auth, finance, dispatch, or security?

If blocked, stop and escalate the decision — do not guess.

## Troubleshooting

| Issue | Action |
|---|---|
| Cannot find a document listed in MANIFEST | Trust the filesystem; report MANIFEST drift |
| Unclear order/rating/pricing rule | Check ADR status; do not invent |
| Need to run the app locally | Implementation not bootstrapped yet — see roadmap |

## Related documents

- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`docs/backend/ROADMAP.md`](docs/backend/ROADMAP.md)
- [`docs/backend/TASKS.md`](docs/backend/TASKS.md)
- [`docs/backend/DEPLOYMENT.md`](docs/backend/DEPLOYMENT.md)
