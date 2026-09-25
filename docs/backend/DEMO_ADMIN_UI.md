# Demo Admin Web UI (Client Prototype)

## Purpose

Documents the **demo-only** Admin Web UI shipped in this repository’s Next.js `client/` app so operations screens can be exercised before production ADRs are ACCEPTED.

This does **not** replace backend Admin APIs or freeze production architecture.

## Product decision (prototype scope)

**Decision:** Build a dedicated Admin Web UI inside `client/` at route `/admin`.

**Not shown** on the mobile welcome role picker (customer / driver only). Access:

- Browser (Next dev): `http://localhost:3000/admin`
- Browser / Capacitor: URL hash `#admin` or `?admin=1`
- Capacitor app (no address bar): **long-press** the brand title «سريع حوش بلاس» ~2.5s on the welcome screen → admin login (still requires username/password)

Capacitor customer/driver shells do not show a visible admin button.

**Status relative to [`ADMIN.md`](ADMIN.md):** Satisfies the previously open “Admin Web UI” product decision **for this prototype only**. Production hosting, separate repo, and auth hardening remain subject to ACCEPTED ADR-002 / ADR-003 / ADR-020.

## Demo authentication (not production)

| Field | Demo value |
|---|---|
| Username | `admin` |
| Password | `HoshBlass@Admin` |

Plaintext demo credentials for UI exercise only. Production admin auth: **TBD — ADR-002**.

## Frozen demo commercial / policy values (UI only)

User-confirmed for the prototype (still **not** ACCEPTED ADR decisions):

| Topic | Demo value | Related ADR |
|---|---|---|
| Driver share of delivery charge | **75%** | ADR-013 |
| Platform / company share | **25%** | ADR-013 |
| Per-driver flat bonuses | Admin pricing tab (ل.س.ج added to driver earning) | ADR-013 |
| Bad-rating alert threshold | **stars ≤ 2** | ADR-012 |
| New driver work gate | Account stays **pending** until admin approves | ADR-003 |
| Currency display | **الليرة السورية الجديدة (ل.س.ج)** across customer / driver / admin demo UI | ADR-006 amounts still demo |
| Service areas (pickup / delivery / shops) | حوش بلاس، صناعة، برامكة، مزة، جرمانا، كراج تيناوي، كراج النخيل، كراج خان زاده، صناعية تل، دوما | ADR-005 |
| Package weight classes | **light** vs **heavy** (heavy includes بواط، طبون، محرك، غطاء محرك، إطارات، أكبر من ذلك) | ADR-008 |
| Basket matching | Heavy packages → **large basket** drivers only; small basket → light only | ADR-008 |
| Driver VIP-only filter | **Removed** (VIP remains an order mode, not a driver filter) | ADR-007 |
| Second offer window | While finishing first trip: when **≤ 5 minutes** to first delivery (demo: `nearDelivery`), **or** after first trip completes; max **2** orders (active + queued) | ADR-008 / ADR-009 |
| Driver signup KYC (demo) | First name, surname, birth date, ID photo + vehicle + **basket size** + **capacity** → pending admin | ADR-002 / ADR-015 |

## Dashboard capabilities (demo)

Aligned with [`ADMIN.md`](ADMIN.md) / product requirements / API catalog **as UI surfaces**:

- Live driver map (positions published from the driver demo session).
- Driver search (name / phone) with order stats for day / week / month and 75/25 splits.
- Finance summaries: daily / weekly / monthly / yearly.
- **Pricing tab:** edit zone bases, fixed routes (from→to), VIP/stop fees, default driver share %, per-driver share overrides and flat bonuses (localStorage demo config).
- Ratings queue with alerts when stars ≤ 2.
- Join requests: approve / reject pending drivers; rejected or pending cannot go online.
- End-of-day order inventory.
- Order search by order number, driver name/phone, shop name.
- **Customers tab:** admin-only per-customer order records (accounts + orders). Customers do **not** see their own order history in the customer app.

## Customer ↔ driver linkage (demo)

Driver offers come **only** from customer orders published on the same-device demo dispatch bus. Fake/simulated offers are disabled. Driver must be approved + available; customer places an order in the same browser origin.

Offers are filtered by **basket size vs package weight class**. Drivers do not filter by VIP-only preference.

A driver may accept a **second** offer when approaching first delivery (≤5 min demo signal) or after completing the first. The second customer sees that the driver is on the way.

After a driver **rejects**, **times out (15s)**, or **completes** an order, that `orderId` is skipped for that driver session and the job is force-closed (`delivered`) on complete — the same order will not reappear until a **new** customer order is published.

## Data plane

Local `localStorage` + in-tab events (same device), shared with customer and driver demo stores. Not a real backend.

## Related documents

- [`ADMIN.md`](ADMIN.md)
- [`FINANCE.md`](FINANCE.md)
- [`RATINGS.md`](RATINGS.md)
- [`AUTH_SECURITY.md`](AUTH_SECURITY.md)
- [`API_ENDPOINT_CATALOG.md`](API_ENDPOINT_CATALOG.md)
- [`../shared/PRODUCT_REQUIREMENTS.md`](../shared/PRODUCT_REQUIREMENTS.md)
