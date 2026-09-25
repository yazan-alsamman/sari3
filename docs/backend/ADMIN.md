# Admin Operations

## Purpose

Defines backend administrative/operational capabilities and distinguishes them from any future admin web UI.

## Dashboard capabilities (backend-supported)

- Live driver map.
- Active orders.
- Driver status.
- Dispatch queue.
- Order search/filter.
- Rating/complaint alerts.
- Financial summaries.

## Driver management

- Create/verify/suspend/reactivate.
- Capacity profile (**limits TBD — ADR-008 / business**).
- Availability.
- Service zones.
- Earnings.
- Performance.

## Operational controls

- Configure service zones (**TBD — ADR-005**).
- Configure prices (**TBD — ADR-006**).
- Configure thresholds (**ratings/dispatch TBD**).
- Review/audit manual interventions.

Admin actions must be permissioned and audited (**TBD — ADR-003**).

## Admin Client Scope

### Backend Admin APIs

In scope for backend documentation and eventual implementation.

See [`API_ENDPOINT_CATALOG.md`](API_ENDPOINT_CATALOG.md) admin sections.

### Admin Web UI

**Prototype product decision (this repository):**

A demo Admin Web UI lives in `client/` at `/admin` (username/password gate; not linked from the customer/driver welcome screen). See [`DEMO_ADMIN_UI.md`](DEMO_ADMIN_UI.md).

**Production** hosting (same repo vs separate vs temporary ops tool), real admin identity, and permission matrix remain subject to ACCEPTED ADR-002 / ADR-003 / ADR-020. The demo UI does not freeze those ADRs.

## Related documents

- [`DEMO_ADMIN_UI.md`](DEMO_ADMIN_UI.md)
- [`AUTH_SECURITY.md`](AUTH_SECURITY.md)
- [`API_ENDPOINT_CATALOG.md`](API_ENDPOINT_CATALOG.md)
- [`TRACKING.md`](TRACKING.md)
- [`FINANCE.md`](FINANCE.md)
- [`RATINGS.md`](RATINGS.md)
