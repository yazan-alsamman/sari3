# ADR-001: System Architecture & Module Boundaries

## Status

PROPOSED

## Context

Saree'e needs a clear backend and overall system architecture so Flutter clients, admin APIs, workers, and infrastructure providers do not entangle domain rules with frameworks.

## Decision

TBD — Business/Architecture Decision Required

## Decision Drivers

- Clean Architecture / DDD intent
- Independent deployability of API vs workers
- Testability of domain rules
- Avoid NestJS/Prisma leakage into domain

## Considered Options

### Option A

Modular NestJS monolith with clean boundaries

### Option B

Modular monolith + separate worker processes

### Option C

Multiple deployable services from day one


## Consequences

TBD

## Security Implications

TBD

## Operational Implications

TBD

## Data Implications

TBD

## API Implications

TBD

## Mobile Implications

TBD

## Dependencies

- None (root ADR)

## Open Questions

- Exact module list and ownership?
- Shared kernel contents?
- Eventing approach (in-process vs outbox)?
- Monorepo layout for mobile/backend?

## Approval

- Decision owner: TBD
- Approved by: TBD
- Date: TBD
