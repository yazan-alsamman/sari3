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

Status:

**TBD — Product Decision Required**

The backend exposes administrative APIs. Whether the team builds a dedicated admin web client in this repository, a separate repository, or uses a temporary ops tool is a product decision and is **not decided** here.

Do not invent a full admin web architecture until that product decision is made.

## Related documents

- [`AUTH_SECURITY.md`](AUTH_SECURITY.md)
- [`API_ENDPOINT_CATALOG.md`](API_ENDPOINT_CATALOG.md)
- [`TRACKING.md`](TRACKING.md)
- [`FINANCE.md`](FINANCE.md)
- [`RATINGS.md`](RATINGS.md)
