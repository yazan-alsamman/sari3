# Saree'e (سريع)

**Motorcycle-based automotive-parts delivery platform**

Saree'e connects automotive-parts merchants and mechanics with motorcycle delivery drivers and an operations team — with first-class support for dispatch, multi-order routing, driver capacity, live tracking, pricing, ratings, notifications, and financial ledgers.

---

## Current status

| Area | Status |
|---|---|
| Product & architecture documentation | Present under [`docs/`](docs/README.md) |
| Critical ADRs (001–009, 013, 015) | **ACCEPTED** (CTO 2026-09-22) |
| Demo client (`client/`) | Working prototype |
| NestJS backend (`apps/backend`) | **Phase 1 foundation complete** (health verified) |
| Flutter mobile application | Not implemented yet (Capacitor demo exists) |

Launch path: [`docs/backend/LAUNCH_PATH.md`](docs/backend/LAUNCH_PATH.md)

Stack (ACCEPTED ADR-001):

- **Backend:** Node.js, TypeScript, NestJS (+ workers)
- **Data:** PostgreSQL, Prisma
- **Async:** Redis, BullMQ (workers expand in later phases)
- **Realtime / storage:** ADR-010 / ADR-015

---

## Documentation (source of truth)

Authoritative engineering documentation lives under [`docs/`](docs/README.md).

| Path | Purpose |
|---|---|
| [`docs/README.md`](docs/README.md) | Documentation home, authority rules, reading order |
| [`docs/MANIFEST.md`](docs/MANIFEST.md) | File inventory (index — filesystem remains authoritative) |
| [`docs/shared/`](docs/shared/) | Product requirements, glossary, NFRs |
| [`docs/mobile/`](docs/mobile/) | Flutter architecture and UX documentation |
| [`docs/backend/`](docs/backend/) | Backend domain, API, security, ops |
| [`docs/backend/adrs/`](docs/backend/adrs/) | Architecture Decision Records |

### Recommended reading order

1. [`docs/shared/PRODUCT_REQUIREMENTS.md`](docs/shared/PRODUCT_REQUIREMENTS.md)
2. [`docs/shared/NFR.md`](docs/shared/NFR.md)
3. [`docs/backend/ARCHITECTURE.md`](docs/backend/ARCHITECTURE.md)
4. [`docs/backend/DOMAIN_MODEL.md`](docs/backend/DOMAIN_MODEL.md)
5. [`docs/backend/ORDER_LIFECYCLE.md`](docs/backend/ORDER_LIFECYCLE.md)
6. [`docs/backend/ADR_INDEX.md`](docs/backend/ADR_INDEX.md)
7. [`docs/backend/TASKS.md`](docs/backend/TASKS.md)
8. [`docs/mobile/ARCHITECTURE.md`](docs/mobile/ARCHITECTURE.md)

---

## Core engineering principles

- Documentation first → architecture second → implementation third
- Only **ACCEPTED** ADRs are binding architectural decisions
- Explicit `TBD` / `BUSINESS DECISION REQUIRED` is preferred over invented values
- Clean Architecture and SOLID
- Domain / application / infrastructure / presentation separation
- REST API under `/api/v1`
- Authentication, authorization, and resource scope are separate concerns
- Backend is authoritative for order state, pricing, dispatch, ratings, and finance

---

## Phase strategy

| Phase | Goal |
|---|---|
| **0** | Documentation foundation (current) |
| **0B** | Architecture decision freeze (approve blocking ADRs) |
| **1+** | Incremental implementation per [`docs/backend/ROADMAP.md`](docs/backend/ROADMAP.md) |

Do not implement later phases by guessing unresolved architecture.

---

## Repository layout

```text
.
├── README.md
├── SETUP.md
├── CONTRIBUTING.md
├── SECURITY.md
├── CODE_OF_CONDUCT.md
├── CHANGELOG.md
├── LICENSE
├── .gitignore
├── .github/
│   ├── pull_request_template.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── .cursor/rules/          # Cursor agent engineering gates
└── docs/                   # Authoritative documentation
    ├── shared/
    ├── mobile/
    └── backend/
        └── adrs/
```

---

## Getting started

See [`SETUP.md`](SETUP.md) for environment expectations and documentation onboarding.

Contributors: see [`CONTRIBUTING.md`](CONTRIBUTING.md).

Security reports: see [`SECURITY.md`](SECURITY.md).

---

## License

See [`LICENSE`](LICENSE).

---

## Maintainers

Repository: [yazan-alsamman/sari3](https://github.com/yazan-alsamman/sari3)
