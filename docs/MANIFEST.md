# Saree'e Documentation Manifest

## Purpose

Accurate inventory of documentation files in this repository.

## Count

- Root `README.md`: 1
- Files under `docs/`: 62
- **Total Markdown files: 63**

## Hierarchy

```text
README.md
docs/
├── README.md
├── MANIFEST.md
├── shared/
├── mobile/
└── backend/
    └── adrs/
```

## Complete file list

| Path |
|---|
| `README.md` |
| `docs/backend/ADMIN.md` |
| `docs/backend/ADR_INDEX.md` |
| `docs/backend/adrs/ADR-001-system-architecture.md` |
| `docs/backend/adrs/ADR-002-authentication-session.md` |
| `docs/backend/adrs/ADR-003-authorization-resource-scoping.md` |
| `docs/backend/adrs/ADR-004-order-state-machine.md` |
| `docs/backend/adrs/ADR-005-service-zone-model.md` |
| `docs/backend/adrs/ADR-006-pricing-and-price-snapshot.md` |
| `docs/backend/adrs/ADR-007-dispatch-selection.md` |
| `docs/backend/adrs/ADR-008-driver-capacity.md` |
| `docs/backend/adrs/ADR-009-multi-order-route-compatibility.md` |
| `docs/backend/adrs/ADR-010-live-tracking-transport.md` |
| `docs/backend/adrs/ADR-011-location-freshness-retention.md` |
| `docs/backend/adrs/ADR-012-rating-complaint-policy.md` |
| `docs/backend/adrs/ADR-013-financial-ledger.md` |
| `docs/backend/adrs/ADR-014-notification-provider.md` |
| `docs/backend/adrs/ADR-015-media-storage.md` |
| `docs/backend/adrs/ADR-016-realtime-authorization.md` |
| `docs/backend/adrs/ADR-017-idempotency.md` |
| `docs/backend/adrs/ADR-018-data-retention-privacy.md` |
| `docs/backend/adrs/ADR-019-observability.md` |
| `docs/backend/adrs/ADR-020-deployment-topology.md` |
| `docs/backend/API_ENDPOINT_CATALOG.md` |
| `docs/backend/API_GUIDELINES.md` |
| `docs/backend/ARCHITECTURE.md` |
| `docs/backend/AUTH_SECURITY.md` |
| `docs/backend/DATABASE_SCHEMA.md` |
| `docs/backend/DEPLOYMENT.md` |
| `docs/backend/DISPATCH.md` |
| `docs/backend/DOMAIN_MODEL.md` |
| `docs/backend/FINANCE.md` |
| `docs/backend/JOBS.md` |
| `docs/backend/MEDIA.md` |
| `docs/backend/MULTI_ORDER_ROUTING.md` |
| `docs/backend/NOTIFICATIONS.md` |
| `docs/backend/OBSERVABILITY.md` |
| `docs/backend/ORDER_LIFECYCLE.md` |
| `docs/backend/PRICING.md` |
| `docs/backend/RATINGS.md` |
| `docs/backend/README.md` |
| `docs/backend/REALTIME.md` |
| `docs/backend/ROADMAP.md` |
| `docs/backend/SECURITY_THREAT_MODEL.md` |
| `docs/backend/TASKS.md` |
| `docs/backend/TESTING.md` |
| `docs/backend/TRACKING.md` |
| `docs/MANIFEST.md` |
| `docs/mobile/ARCHITECTURE.md` |
| `docs/mobile/DESIGN_SYSTEM.md` |
| `docs/mobile/DRIVER_APP.md` |
| `docs/mobile/LOCATION.md` |
| `docs/mobile/NAVIGATION.md` |
| `docs/mobile/NOTIFICATIONS.md` |
| `docs/mobile/ORDER_FLOW.md` |
| `docs/mobile/RATING.md` |
| `docs/mobile/README.md` |
| `docs/mobile/RELEASE.md` |
| `docs/mobile/TESTING.md` |
| `docs/README.md` |
| `docs/shared/DOMAIN_GLOSSARY.md` |
| `docs/shared/NFR.md` |
| `docs/shared/PRODUCT_REQUIREMENTS.md` |

## Structure notes

- `docs/shared/` — product/domain/NFR documentation shared by clients.
- `docs/mobile/` — Flutter mobile architecture and UX/operational documentation.
- `docs/backend/` — backend architecture, domain, API, security, operations, testing, roadmap.
- `docs/backend/adrs/` — Architecture Decision Records (all PROPOSED until approved).

## Recommended starting order

1. `docs/shared/PRODUCT_REQUIREMENTS.md`
2. `docs/shared/NFR.md`
3. `docs/backend/ARCHITECTURE.md`
4. `docs/backend/DOMAIN_MODEL.md`
5. `docs/backend/ORDER_LIFECYCLE.md`
6. `docs/backend/ADR_INDEX.md`
7. `docs/backend/TASKS.md`
8. `docs/mobile/ARCHITECTURE.md`

## Migration note

Documentation previously lived at repository-root `shared/`, `mobile/`, and `backend/`.
Those directories were removed after content was normalized under `docs/` to establish a single source of truth.

