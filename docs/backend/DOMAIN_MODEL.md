# Domain Model

## Purpose

Classifies core domain concepts for Saree'e and records ownership, relationships, and open decisions.

## Status

Conceptual domain model. Final attributes and invariants depend on ADRs.

Physical persistence is deferred to [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) after ADR freeze.

## Classification legend

| Type | Meaning |
|---|---|
| Aggregate | Consistency boundary / primary write model |
| Entity | Identityful object inside or beside an aggregate |
| Value Object | Immutable descriptive value |
| Domain Event | Something that happened in the domain |
| Configuration | Admin/versioned policy data |
| Read Model | Query-optimized projection |
| Infrastructure | Technical concern, not core domain |

## Aggregates / entities

### User

- **Type:** Aggregate / Entity
- **Purpose:** Authentication identity
- **Responsibility:** Credentials, account status, identity linkage
- **Ownership:** Auth / Users module
- **Important attributes:** id, contact identifiers TBD, credential hash, status — **TBD — Domain Decision Required**
- **Invariants:** TBD — ADR-002
- **Relationships:** may link to CustomerProfile, DriverProfile, and/or Admin identity — **TBD — Domain Decision Required** (see admin identity ambiguity)
- **Related ADRs:** ADR-002, ADR-003

### CustomerProfile

- **Type:** Aggregate / Entity
- **Purpose:** Merchant/mechanic business profile
- **Responsibility:** Customer-facing profile and order ownership linkage
- **Ownership:** Customers module
- **Important attributes:** userId, shop/business fields TBD
- **Related ADRs:** ADR-003

### DriverProfile

- **Type:** Aggregate / Entity
- **Purpose:** Driver operational profile
- **Responsibility:** Operational status, zone assignment linkage, capacity linkage
- **Ownership:** Drivers module
- **Important attributes:** userId, suspension status, vehicle metadata TBD
- **Related ADRs:** ADR-003, ADR-007, ADR-008

### Admin identity

- **Type:** Entity (model TBD)
- **Purpose:** Privileged operational actor
- **Open question:** Separate `admin_users` table vs role on `User` — **TBD — Domain Decision Required / ADR-002 / ADR-003**
- **Related ADRs:** ADR-002, ADR-003

### Order

- **Type:** Aggregate root
- **Purpose:** Delivery request and lifecycle authority
- **Responsibility:** Status, assignment reference, price snapshot, stops, package classification
- **Ownership:** Orders module
- **Important attributes:**
  - Order number (unique)
  - Customer reference
  - Pickup point / drop-off point
  - Delivery mode (Standard / VIP)
  - Package classification
  - Weight/volume data — values TBD ADR-008
  - Price snapshot
  - Driver assignment
  - Current status
  - Timestamps
- **Invariants:** Only legal transitions; server-side authorization — TBD ADR-004 / ADR-003
- **Related ADRs:** ADR-004, ADR-006, ADR-007, ADR-008, ADR-009

### OrderStop / PickupPoint / DropoffPoint

- **Type:** Entity or Value Object (exact modeling TBD)
- **Purpose:** Addressing for pickup and delivery
- **Responsibility:** Coordinates (optional), area/zone, shop name, landmark/instructions, optional media
- **Known product rule:** Platform must not depend exclusively on map search
- **Related ADRs:** ADR-005, ADR-015

### ServiceZone

- **Type:** Configuration / Entity
- **Purpose:** Geographic/operational area with pricing and rules
- **Attributes:** geometry/definition TBD — ADR-005
- **Related ADRs:** ADR-005, ADR-006

### PricingRule / PriceSnapshot

- **Type:** Configuration / Value Object
- **Purpose:** Versioned pricing inputs vs immutable confirmed price components on an order
- **Related ADRs:** ADR-006

### DriverCapacityProfile

- **Type:** Entity / Configuration
- **Purpose:** Allowed weight/volume/order limits for a driver or vehicle class
- **Must document categories (values not invented):**
  - Weight — **BUSINESS DECISION REQUIRED**
  - Volume — **BUSINESS DECISION REQUIRED**
  - Package count — **BUSINESS DECISION REQUIRED**
  - Package categories — **BUSINESS DECISION REQUIRED**
  - Oversized items — **BUSINESS DECISION REQUIRED**
  - Special handling — **BUSINESS DECISION REQUIRED**
  - Motorcycle/basket capacity — **BUSINESS DECISION REQUIRED**
  - Driver-specific capacity overrides — **BUSINESS DECISION REQUIRED**
  - Capacity enforcement behavior — **TBD — ADR-008**
  - Who may modify capacity (admin) — **TBD — ADR-003 / ADR-008**
- **Related ADRs:** ADR-008, ADR-009

### DriverAvailability

- **Type:** Entity / State
- **Purpose:** Whether driver may receive offers
- **Proposed mobile states:** Offline, Available, Temporarily unavailable, Suspended
- **Final model:** TBD — ADR-007
- **Related ADRs:** ADR-007

### DispatchOffer

- **Type:** Entity / Aggregate candidate
- **Purpose:** Temporary offer of an order to a driver
- **Related ADRs:** ADR-007, ADR-017

### DriverAssignment

- **Type:** Entity / Value within Order
- **Purpose:** Accepted driver binding for an order
- **Uniqueness:** One active driver assignment per order (conceptual integrity rule)
- **Related ADRs:** ADR-004, ADR-007

### DriverLocation / TrackingPoint / LocationPoint

- **Type:** Entity / event stream sample
- **Attributes:** latitude, longitude, accuracy, capturedAt, receivedAt/source/freshness classification
- **Related ADRs:** ADR-010, ADR-011, ADR-018

### Rating

- **Type:** Entity
- **Purpose:** 1–5 score associated with a completed (or otherwise eligible) order
- **Uniqueness:** One rating per order under default policy
- **Related ADRs:** ADR-012, ADR-004

### Complaint

- **Type:** Entity
- **Purpose:** Customer feedback requiring operational attention
- **Severity model:** TBD — ADR-012
- **Related ADRs:** ADR-012

### AdminAlert

- **Type:** Entity / Read Model
- **Purpose:** Operational notification requiring attention
- **Related ADRs:** ADR-012

### Notification / NotificationDelivery

- **Type:** Infrastructure + delivery records
- **Purpose:** Orchestrate outbound messages; never source of truth for order state
- **Related ADRs:** ADR-014

### FinancialAccount / LedgerEntry

- **Type:** Aggregate / Entity
- **Purpose:** Append-only financial history for drivers (and platform share records as applicable)
- **Invariants:** No silent overwrite; corrections via adjustments
- **Related ADRs:** ADR-013

### Incentive / Penalty / Adjustment

- **Type:** Configuration and/or ledger entry kinds
- **Amounts/rules:** TBD — Business Decision Required / ADR-013
- **Related ADRs:** ADR-013, ADR-012

### MediaObject

- **Type:** Entity
- **Purpose:** Shop photos / optional delivery proof metadata
- **Related ADRs:** ADR-015

### AuditLog

- **Type:** Infrastructure / append-only record
- **Purpose:** Privileged and high-risk action traceability
- **Related ADRs:** ADR-003, ADR-018

## Value objects (candidates)

- DeliveryMode (Standard | VIP)
- Money / PriceComponents — currency TBD ADR-006
- GeoCoordinate
- FreshnessClass (Fresh | Aging | Stale | Unknown) — thresholds TBD ADR-011
- PackageClass / WeightClass — taxonomy TBD ADR-008

## Domain events (candidates)

Exact event catalog TBD after ADR-004 / ADR-007 / ADR-013:

- OrderCreated
- OrderStatusChanged
- DispatchOfferCreated
- DispatchOfferAccepted
- DispatchOfferExpired
- DriverLocationUpdated
- RatingSubmitted
- LedgerEntryPosted
- AdminAlertCreated

## Configuration concepts

- Service zones
- Pricing rules / versions
- Dispatch ranking versions
- Capacity profiles
- Rating/complaint thresholds
- Retention policies

## Read models (candidates)

- Admin live map / active orders view
- Driver earnings summaries
- Daily/weekly/monthly finance summaries

## Open domain questions

1. Admin identity model (separate aggregate vs role on User).
2. Whether OrderStop is entity or value object collection.
3. Whether DriverAssignment is separate aggregate or order-owned entity.
4. Package taxonomy and capacity units — business required.
5. Rating eligibility relative to COMPLETED — ADR-004 / ADR-012.

## Related documents

- [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md)
- [`ORDER_LIFECYCLE.md`](ORDER_LIFECYCLE.md)
- [`../shared/DOMAIN_GLOSSARY.md`](../shared/DOMAIN_GLOSSARY.md)
- [`ADR_INDEX.md`](ADR_INDEX.md)
