# Contributing to Saree'e (سريع)

Thank you for contributing. Saree'e is documentation-first: architecture decisions must be explicit before implementation.

## Engineering gate

```text
Documentation → Architecture (ACCEPTED ADRs) → Implementation
```

- Do **not** invent business values (prices, commissions, capacity limits, thresholds).
- Do **not** implement against **PROPOSED** ADRs as if they were final.
- Prefer an explicit `TBD` over a silent assumption.
- `docs/` is the engineering source of truth. The filesystem is authoritative for documentation discovery; `docs/MANIFEST.md` is an index only.

## Before you start

1. Read [`README.md`](README.md) and [`docs/README.md`](docs/README.md).
2. Read [`docs/shared/PRODUCT_REQUIREMENTS.md`](docs/shared/PRODUCT_REQUIREMENTS.md).
3. Review [`docs/backend/ADR_INDEX.md`](docs/backend/ADR_INDEX.md) and any ADRs your change depends on.
4. Check [`docs/backend/TASKS.md`](docs/backend/TASKS.md) and [`docs/backend/ROADMAP.md`](docs/backend/ROADMAP.md).
5. Confirm your change is not blocked by a PROPOSED/TBD decision your work depends on.

## Ways to contribute

| Type | Guidance |
|---|---|
| Documentation fixes | Prefer the existing authoritative file; avoid duplicates |
| Architecture decisions | Use / update ADRs under `docs/backend/adrs/` |
| Product clarifications | Update shared product docs; do not invent commercial values |
| Implementation | Only after required ADRs for that scope are **ACCEPTED** |
| Bug reports / features | Use GitHub Issue templates |

## Pull request process

1. Create a focused branch from the default branch.
2. Keep changes scoped to one concern when practical.
3. Update relevant documentation when contracts change.
4. Fill out the pull request template completely.
5. Link related issues and ADRs.
6. Do not commit secrets, credentials, or local environment files.
7. Wait for review. Address feedback before merge.

### PR checklist (minimum)

- [ ] Relevant documentation reviewed
- [ ] Required ADR dependency chain checked (all ACCEPTED or not required)
- [ ] No invented business/architecture decisions
- [ ] Docs updated if an approved contract changed
- [ ] Tests planned/added when implementation exists
- [ ] Security/authorization impact considered

## Coding standards (when implementation begins)

- Backend: Clean Architecture; domain must not depend on NestJS/Prisma
- Mobile: feature-first Clean Architecture; backend remains authoritative for domain state
- API: `/api/v1`, validated DTOs, consistent error envelopes, OpenAPI
- AuthN ≠ AuthZ ≠ resource scope
- Idempotency for critical commands as defined by accepted ADRs

## Commit messages

Use clear, present-tense summaries focused on **why**:

```text
docs: clarify order lifecycle rating ambiguity for ADR-004
chore: add repository security policy
feat: add order price preview endpoint
```

Avoid vague messages such as `update` or `fix stuff`.

## Review expectations

Reviewers verify:

- Documentation alignment
- ADR compliance
- Absence of silent architectural drift
- Security and ownership scope
- Test adequacy (once code exists)

## Conduct

Participation is governed by [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Security

Do not open public issues for vulnerabilities. Follow [`SECURITY.md`](SECURITY.md).

## Questions

Open a GitHub Discussion or Issue (feature/question) with references to the relevant `docs/` paths.
