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

## Media (ADR-015)

Prefixes: `kyc/`, `orders/`, `proofs/`. S3/MinIO when it is reachable; local disk otherwise. Images jpeg/png/webp, max 5 MB. Signed GET lasts 5 minutes. Unconfirmed uploads older than 24 hours are deleted by an hourly sweep. KYC download is admin-only and writes `media.kyc.view`. Shop and proof photos: owner or admin until orders exist.

| Method | Path | Actor | Notes | Status |
|---|---|---|---|---|
| POST | `/media/presign` | Authenticated, purpose scoped by role | Returns `uploadUrl` for PUT | Phase 2 |
| POST | `/media/presign-public` | Public | `driver_id` only (pre-registration KYC) | Phase 2 |
| PUT | `/media/:id/upload` | Slot id | Raw bytes; local stand-in for S3 PUT | Phase 2 |
| POST | `/media/confirm` | Owner, admin, or pre-registration KYC slot | Marks upload confirmed | Phase 2 |
| POST | `/media/upload-public` | Public | Multipart one-shot KYC (confirm immediate) | Phase 2 |
| GET | `/media/:id/url` | Admin for KYC; owner or admin otherwise | `{ url, expiresIn }` 5 minutes. KYC view audited | ADR-015 |
| GET | `/media/:id/content` | Signed `exp` + `sig` | Local-adapter bytes. No permanent public URL | ADR-015 |

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

Price preview stays `POST /pricing/preview` (not idempotent). Submit recalculates the snapshot on the server. Header `Idempotency-Key` is required on submit (8–128 characters, 24h replay, ADR-017). Customer cancel is allowed through `DRIVER_TO_PICKUP` with no fee until a commercial sheet is signed (ADR-004).

| Method | Path | Actor | Permission | Idempotency | Domain action |
|---|---|---|---|---|---|
| POST | `/orders` | Customer | own create | Required | Create snapshot, land on `SEARCHING_DRIVER` |
| GET | `/orders` | Customer | own orders | No | List orders |
| GET | `/orders/:orderId` | Customer, assigned driver, or admin | scope | No | Get order |
| POST | `/orders/:orderId/cancel` | Customer | owner, early states | No | Cancel |
| GET | `/orders/:orderId/status-history` | Customer, assigned driver, or admin | scope | No | History |

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

Implemented in Phase 5: `POST /drivers/me/availability`, `POST /drivers/me/location`, `GET /drivers/me/offers`, accept, reject, and `GET /orders/:orderId/tracking`. Earnings and the ledger are implemented in Phase 8. `GET/PATCH /drivers/me` and active-orders are not implemented.

---

## Order execution (driver)

| Method | Path | Actor | Permission | Domain action |
|---|---|---|---|---|
| POST | `/orders/:orderId/start-to-pickup` | Driver | assigned + approved | `DRIVER_ACCEPTED` → `DRIVER_TO_PICKUP` |
| POST | `/orders/:orderId/pickup` | Driver | assigned + approved | `DRIVER_TO_PICKUP` → `PICKED_UP` |
| POST | `/orders/:orderId/in-transit` | Driver | assigned + approved | `PICKED_UP` → `IN_TRANSIT` |
| POST | `/orders/:orderId/deliver` | Driver | assigned + approved | `IN_TRANSIT` → `DELIVERED`. Optional `proofMediaId` |
| POST | `/orders/:orderId/complete` | Driver | assigned + approved | `DELIVERED` → `COMPLETED` |

Assignment itself is dispatch (Phase 5). These commands reject an order with no assigned driver. Illegal transitions return `409` `ORDER_INVALID_STATE`.

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

Eligibility/uniqueness: ADR-012 Option A. Rating only after `COMPLETED`, one per order, no customer edit. Note max 500 characters. `PATCH /admin/complaints/:id` marks `investigated` or `dismissed` (dismiss requires a reason) and is audited. No alert threshold and no automatic suspension.

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

Implemented routes are in **Media (ADR-015)** above. There is no public delete of KYC while the driver account is active (ADR-018 is still PROPOSED).

---

## Finance

| Method | Path | Actor | Permission | Domain action |
|---|---|---|---|---|
| GET | `/drivers/me/ledger` | Driver | own ledger | List entries |
| GET | `/drivers/me/earnings` | Driver | own finance read | Balance and today's earning |
| GET | `/admin/drivers/:driverProfileId/ledger` | Admin | finance.read | Admin ledger view |
| PATCH | `/admin/drivers/:driverProfileId/trip-bonus` | Admin | finance.adjust | Set the flat per-trip bonus |
| POST | `/admin/drivers/:driverProfileId/adjustment` | Admin | finance.adjust | Post `penalty` or `adjustment`. Requires `Idempotency-Key` |
| GET | `/admin/finance/reports/daily` | Admin | finance.report | Daily report |
| GET | `/admin/finance/reports/weekly` | Admin | finance.report | Weekly report |
| GET | `/admin/finance/reports/monthly` | Admin | finance.report | Monthly report |
| GET | `/admin/finance/reports/yearly` | Admin | finance.report | Yearly report |

Amounts follow ADR-013: driver base `round(T * 0.75)`, platform the remainder, optional flat bonus. Posted at `COMPLETED`. `settlement_payout` exists on the ledger enum and is not posted until the payout method is chosen. Offer payloads include `earnings.driverEarning` for the same split.

---

## Admin operations

| Method | Path | Actor | Permission | Domain action |
|---|---|---|---|---|
| GET | `/admin/orders` | Admin | orders.read | Recent orders. Optional `status` and exact `orderNumber` |
| GET | `/admin/orders/:orderId` | Admin | orders.read | Order detail |
| POST | `/admin/orders/:orderId/override` | Admin | orders.override | Lifecycle override is allowed by ADR-004 with audit. The target-state catalog is still unspecified, so the command is not implemented. |
| GET | `/admin/drivers` | Admin | drivers.read | List drivers |
| POST | `/admin/drivers/:driverProfileId/suspend` | Admin | drivers.suspend | Approved → suspended. Reason required. Open offers are withdrawn. |
| POST | `/admin/drivers/:driverProfileId/reactivate` | Admin | drivers.reactivate | Suspended → approved. Reason required. Does not set the driver online. |
| PATCH | `/admin/drivers/:driverProfileId/capacity` | Admin | drivers.capacity | `basketSize` and/or `capacityNote`. Does not change the max of 2 active orders. |
| GET | `/admin/live` | Admin | live.read | Approved drivers with freshness, active orders, open offers |
| GET | `/admin/ratings` | Admin | ratings.read | Ratings queue |
| GET | `/admin/alerts` | Admin | alerts.read | Not implemented. ADR-012 has no alert threshold. |
| POST | `/admin/alerts/:id/ack` | Admin | alerts.write | Not implemented. ADR-012 has no alert threshold. |

---

## Notifications

Outbound notifications are primarily system-generated via jobs.

| Method | Path | Actor | Permission | Domain action |
|---|---|---|---|---|
| GET | `/notifications/me` | Authenticated | own notifications | Inbox (if persisted) |
| POST | `/notifications/me/read` | Authenticated | own notifications | Mark read |

Provider details: **TBD — ADR-014**.

---

## Realtime

ADR-010 ACCEPTED. Socket.IO on the API process at path `/socket.io`. Not under `/api/v1`.

| Step | Actor | Auth | Result |
|---|---|---|---|
| Connect | Authenticated | JWT access token in `auth.token` or `Authorization: Bearer` | Connection stays open. `socket.data.principal` is `{ userId, role }` |
| Connect | Anonymous or invalid token | — | Disconnect |

No domain events and no rooms. Those wait for ADR-016. REST stays authoritative. Reconnect reads existing REST.

---

## Related documents

- [`API_GUIDELINES.md`](API_GUIDELINES.md)
- [`AUTH_SECURITY.md`](AUTH_SECURITY.md)
- [`ORDER_LIFECYCLE.md`](ORDER_LIFECYCLE.md)
- [`DISPATCH.md`](DISPATCH.md)
- [`REALTIME.md`](REALTIME.md)
- [`ADMIN.md`](ADMIN.md)
