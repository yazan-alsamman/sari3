# Client UI Prototype — سريع حوش بلاس

Mobile-first **Client (Customer / Shop Owner)** interface prototype for Saree'e.

## Scope

- Welcome / branding
- Client authentication & shop profile setup
- Multi-stop order creation + photo upload
- Demo zone-based price preview
- Simulated live tracking + driver card
- Post-delivery 5-star rating modal

## Important constraints

| Topic | Status |
|---|---|
| Production backend / NestJS | Not connected |
| Flutter mobile app (documented stack) | Separate future path — this is a **web UI prototype** |
| Pricing amounts | **DEMO only** — see `src/lib/demo-pricing.ts`; real amounts are BUSINESS DECISION REQUIRED (ADR-006) |
| ADRs | All currently **PROPOSED** — this prototype does not establish architecture |

## Run locally

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flow

Welcome → Auth/Profile → Order (multi-stop) → Tracking → Rating
