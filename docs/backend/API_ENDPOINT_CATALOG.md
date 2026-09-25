# API Endpoint Catalog

## Purpose

Planning catalog mapping intended business capabilities to REST operations.

## Status

Planning only. Exact DTOs and response schemas are finalized during each implementation phase after relevant ADRs are accepted.

Base path: `/api/v1`

All routes require documented authentication and authorization rules (ADR-002 / ADR-003 ACCEPTED; Phase 2 identity endpoints implemented below).

## Placeholder columns

For each endpoint:

- Method / Path
- Actor
- Permission
- Request / Response
- Errors
- Idempotency
- Related domain action

Where details depend on unresolved decisions: **TBD**.

---

## Auth

| Method | Path | Actor | Permission | Request | Response | Errors | Idempotency | Domain action | Status |
|---|---|---|---|---|---|---|---|---|---|
| POST | `/auth/register` | Public | — | phone, password, role, profile fields | `{ user, tokens }` | VALIDATION_ERROR, CONFLICT, FORBIDDEN | No | Register | Phase 2 |
| POST | `/auth/login` | Public | — | phone, password | `{ user, tokens }` | AUTH_UNAUTHORIZED | No | Login | Phase 2 |
| POST | `/auth/refresh` | Session | — | refreshToken | tokens | AUTH_UNAUTHORIZED | No | Rotate refresh | Phase 2 |
| POST | `/auth/logout` | Authenticated | — | optional refreshToken | `{ ok }` | AUTH_UNAUTHORIZED | No | Revoke session | Phase 2 |
| GET | `/auth/me` | Authenticated | — | — | user view | AUTH_UNAUTHORIZED | No | Current user | Phase 2 |
| POST | `/auth/verify` | Pending user | TBD | TBD | TBD | TBD | TBD | Verify identity (OTP) | Deferred ADR-014 |
| GET | `/auth/sessions` | Authenticated | TBD | — | session list | TBD | No | List devices | Later |
| DELETE | `/auth/sessions/:id` | Authenticated | own session | — | OK | TBD | TBD | Revoke device | Later |

---

## Media (ADR-015; local adapter until MinIO)

| Method | Path | Actor | Notes | Status |
|---|---|---|---|---|
| POST | `/media/presign` | Authenticated | Returns `uploadUrl` for PUT | Phase 2 |
| POST | `/media/presign-public` | Public | `driver_id` only (pre-registration KYC) | Phase 2 |
| PUT | `/media/:id/upload` | Public (slot id) | Raw bytes; local stand-in for S3 PUT | Phase 2 |
| POST | `/media/confirm` | Public (slot id) | Marks upload confirmed | Phase 2 |
| POST | `/media/upload-public` | Public | Multipart one-shot KYC (confirm immediate) | Phase 2 |

---

## Admin drivers

| Method | Path | Actor | Notes | Status |
|---|---|---|---|---|
| GET | `/admin/drivers/pending` | Admin | List KYC pending | Phase 2 |
| POST | `/admin/drivers/:driverProfileId/approve` | Admin | Approve driver | Phase 2 |
| POST | `/admin/drivers/:driverProfileId/reject` | Admin | Reject driver | Phase 2 |

---

## Customer profile

| Method | Path | Actor | Permission | Notes |
|---|---|---|---|---|
| GET | `/customers/me` | Customer | own profile | TBD DTO |
| PATCH | `/customers/me` | Customer | own profile | TBD fields |

---

## Orders (customer)

| Method | Path | Actor | Permission | Idempotency | Domain action |
|---|---|---|---|---|---|
| POST | `/orders/price-preview` | Customer | create-order capability TBD | TBD | Preview price |
| POST | `/orders` | Customer | create-order | Required (key) | Create/confirm order |
| GET | `/orders` | Customer | own orders | No | List orders |
| GET | `/orders/:orderId` | Customer | owner scope | No | Get order |
| POST | `/orders/:orderId/cancel` | Customer | owner + cancel policy TBD ADR-004 | TBD | Cancel |
| GET | `/orders/:orderId/status-history` | Customer | owner scope | No | History |

Request/response bodies: **TBD** until ADR-004 / ADR-006.

---

## Drivers

| Method | Path | Actor | Permission | Domain action |
|---|---|---|---|---|
| GET | `/drivers/me` | Driver | own profile | Get profile |
| PATCH | `/drivers/me` | Driver | own profile | Update profile |
| POST | `/drivers/me/availability` | Driver | own availability | Set availability |
| GET | `/drivers/me/offers` | Driver | own offers | List offers |
| GET | `/drivers/me/active-orders` | Driver | own assignments | Active workload |
| GET | `/drivers/me/earnings` | Driver | own finance read | Earnings summary |

---

## Dispatch

| Method | Path | Actor | Permission | Idempotency | Domain action |
|---|---|---|---|---|---|
| POST | `/dispatch/offers/:offerId/accept` | Driver | offer assignee | Required | Accept offer |
| POST | `/dispatch/offers/:offerId/reject` | Driver | offer assignee | Required | Reject offer |

Offer timeout/reassignment are system jobs — see [`JOBS.md`](JOBS.md) / ADR-007.

---

## Order execution (driver)

| Method | Path | Actor | Permission | Domain action |
|---|---|---|---|---|
| POST | `/orders/:orderId/pickup` | Driver | assigned driver | Confirm pickup |
| POST | `/orders/:orderId/deliver` | Driver | assigned driver | Confirm delivery |
| POST | `/orders/:orderId/in-transit` | Driver | assigned driver | Optional if state retained — TBD ADR-004 |

Checkpoint/proof payload: **TBD — ADR-004 / ADR-015**.

---

## Tracking

| Method | Path | Actor | Permission | Domain action |
|---|---|---|---|---|
| POST | `/drivers/me/location` | Driver | own location | Ingest sample |
| GET | `/orders/:orderId/tracking` | Customer/Admin | scoped | Read tracking view |

Realtime events are complementary; REST is authoritative.

---

## Ratings & complaints

| Method | Path | Actor | Permission | Domain action |
|---|---|---|---|---|
| POST | `/orders/:orderId/rating` | Customer | owner + eligibility | Submit rating |
| GET | `/ratings` | Customer/Admin | scoped | List ratings |
| POST | `/orders/:orderId/complaints` | Customer | owner | Create complaint |
| GET | `/complaints/:id` | Customer/Admin | scoped | Get complaint |

Eligibility/uniqueness: ADR-012 / ADR-004.

---

## Pricing & service zones (Phase 3 — ADR-005 / ADR-006)

| Method | Path | Actor | Notes | Status |
|---|---|---|---|---|
| GET | `/service-zones` | Public | Active named areas only | Phase 3 |
| GET | `/admin/service-zones` | Admin | All zones | Phase 3 |
| POST | `/admin/service-zones` | Admin | Create zone | Phase 3 |
| PATCH | `/admin/service-zones/:id` | Admin | Update / deactivate | Phase 3 |
| POST | `/pricing/preview` | Public | Same calculator as snapshot | Phase 3 |
| POST | `/pricing/snapshots` | Public | Immutable confirm snapshot | Phase 3 |
| GET | `/pricing/snapshots/:id` | Public | Fetch snapshot | Phase 3 |
| GET | `/admin/pricing-rules` | Admin | Version history | Phase 3 |
| GET | `/admin/pricing-rules/active` | Admin | Active rule | Phase 3 |
| POST | `/admin/pricing-rules` | Admin | Publish new version | Phase 3 |

Seed amounts = demo defaults until commercial sheet signed (LAUNCH_PATH). Unknown/inactive zones rejected.

---

## Media

| Method | Path | Actor | Permission | Domain action |
|---|---|---|---|---|
| POST | `/media/upload-url` | Customer/Driver/Admin | scoped upload | Get signed upload |
| POST | `/media/:mediaId/attach` | scoped actor | attach to domain object | Attach media |
| DELETE | `/media/:mediaId` | scoped actor | delete policy TBD | Detach/delete |

Limits: **TBD — ADR-015**.

---

## Finance

| Method | Path | Actor | Permission | Domain action |
|---|---|---|---|---|
| GET | `/drivers/me/ledger` | Driver | own ledger | List entries |
| GET | `/admin/drivers/:driverId/ledger` | Admin | finance.read | Admin ledger view |
| POST | `/admin/drivers/:driverId/adjustment` | Admin | finance.adjust | Post adjustment |
| GET | `/admin/finance/reports/daily` | Admin | finance.report | Daily report |
| GET | `/admin/finance/reports/weekly` | Admin | finance.report | Weekly report |
| GET | `/admin/finance/reports/monthly` | Admin | finance.report | Monthly report |

Amounts/formulas: **TBD — ADR-013**.

---

## Admin operations

| Method | Path | Actor | Permission | Domain action |
|---|---|---|---|---|
| GET | `/admin/orders` | Admin | orders.read | Search/filter orders |
| GET | `/admin/orders/:orderId` | Admin | orders.read | Order detail |
| POST | `/admin/orders/:orderId/override` | Admin | orders.override | Lifecycle override — TBD ADR-004 |
| GET | `/admin/drivers` | Admin | drivers.read | List drivers |
| POST | `/admin/drivers/:driverId/suspend` | Admin | drivers.suspend | Suspend |
| POST | `/admin/drivers/:driverId/reactivate` | Admin | drivers.reactivate | Reactivate |
| PATCH | `/admin/drivers/:driverId/capacity` | Admin | drivers.capacity | Capacity update — ADR-008 |
| GET | `/admin/live` | Admin | live.read | Live ops snapshot |
| GET | `/admin/ratings` | Admin | ratings.read | Ratings queue |
| GET | `/admin/alerts` | Admin | alerts.read | Admin alerts |
| POST | `/admin/alerts/:id/ack` | Admin | alerts.write | Acknowledge alert |

---

## Notifications

Outbound notifications are primarily system-generated via jobs.

| Method | Path | Actor | Permission | Domain action |
|---|---|---|---|---|
| GET | `/notifications/me` | Authenticated | own notifications | Inbox (if persisted) |
| POST | `/notifications/me/read` | Authenticated | own notifications | Mark read |

Provider details: **TBD — ADR-014**.

---

## Related documents

- [`API_GUIDELINES.md`](API_GUIDELINES.md)
- [`AUTH_SECURITY.md`](AUTH_SECURITY.md)
- [`ORDER_LIFECYCLE.md`](ORDER_LIFECYCLE.md)
- [`DISPATCH.md`](DISPATCH.md)
- [`ADMIN.md`](ADMIN.md)
