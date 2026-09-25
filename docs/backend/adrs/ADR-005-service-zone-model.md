# ADR-005: Service Zone Model

## Status

ACCEPTED

## Context

Pricing, dispatch eligibility, and operational coverage depend on how service zones are defined, assigned to drivers, and matched to pickup/drop-off points.

## Decision

**Choose Option C (hybrid), v1 emphasis on named areas:**

### v1 service areas (authoritative list)

1. ??? ????  
2. ?????  
3. ??????  
4. ???  
5. ??????  
6. ???? ??????  
7. ???? ??????  
8. ???? ??? ????  
9. ?????? ??  
10. ????  

### Model

- Each area is an admin-managed **named zone** with optional centroid coordinates for maps/ETA heuristics.
- Orders store **area name + shop name + optional lat/lng + optional photo** (addressing model from PRD).
- Polygon geofences are **optional Phase 2+**; not required to launch if named areas cover ops.
- Out-of-list areas: reject create **or** allow `OTHER` only if admin enables — **v1 default: reject unknown area** to keep pricing/dispatch closed.
- Drivers may be eligible for **all active zones** in v1 (city-wide Damascus industrial ops) unless admin restricts later.

## Decision Drivers

- Zone-to-zone pricing
- Dispatch eligibility
- Operational coverage control
- Admin configurability
- Match confirmed product area list

## Considered Options

### Option A — Polygon geofences only

### Option B — Named areas with manual assignment only

### Option C — Hybrid geofence + admin area labels ? **SELECTED** (named-first for v1)

## Consequences

- Pricing keys off named from?to (ADR-006)
- Mobile dropdowns use the frozen list

## Security Implications

- Admin-only zone CRUD
- Clients cannot invent priced zones

## Operational Implications

- Ops can rename/disable zones with migration notes
- Adding a zone is an admin + pricing config action

## Data Implications

- `service_zones` table; orders FK or denormalized zone codes + snapshot names

## API Implications

- Public list of active zones for order forms
- Admin zone management endpoints

## Mobile Implications

- Pickup/delivery area selectors bound to active zones

## Dependencies

- ADR-001
- ADR-004

## Open Questions

- Exact seed coordinates per zone (ops GIS pass)
- Multi-city expansion model (post-v1)

## Approval

- Decision owner: Product Owner
- Approved by: Yazan (CTO) — accepted backend work order
- Date: 2026-09-22
