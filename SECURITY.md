# Security Policy — Saree'e (سريع)

## Supported versions

This repository is in **Phase 0 (documentation foundation)**. Application runtime versions are not yet released.

| Component | Support status |
|---|---|
| Documentation (`docs/`) | Actively maintained |
| ADR templates | Actively maintained |
| Application code | Not released yet |

When releases begin, this table will list supported version ranges.

## Reporting a vulnerability

**Do not open a public GitHub Issue for security vulnerabilities.**

Please report privately to the repository maintainers:

- Prefer GitHub **Private vulnerability reporting** on [yazan-alsamman/sari3](https://github.com/yazan-alsamman/sari3/security) when enabled
- Or contact the repository owner via their GitHub profile contact options

Include, when possible:

- Description of the issue
- Affected component (docs, future API, mobile, admin, infra)
- Steps to reproduce
- Potential impact
- Suggested remediation (optional)

## Response expectations

Maintainers will aim to:

1. Acknowledge receipt
2. Assess severity and scope
3. Coordinate a fix or documentation correction
4. Disclose responsibly after mitigation when appropriate

Exact SLAs will be published with production releases.

## Security principles for this project

Even before implementation, contributors must respect:

- No secrets in source control (tokens, passwords, keystores, `.env` values)
- Authentication ≠ authorization ≠ resource scope
- Server-side authorization is mandatory; UI checks are not security controls
- Financial records must be append-only / adjustment-based (no silent overwrites)
- Push / WebSocket events are not the source of truth for order or finance state
- Location data is sensitive; retention and access must follow accepted privacy ADRs
- Media uploads require validation and scoped access patterns

See:

- [`docs/backend/AUTH_SECURITY.md`](docs/backend/AUTH_SECURITY.md)
- [`docs/backend/SECURITY_THREAT_MODEL.md`](docs/backend/SECURITY_THREAT_MODEL.md)
- [`docs/shared/NFR.md`](docs/shared/NFR.md)

## Threat themes (high level)

- Account takeover
- IDOR / privilege escalation
- Double assignment / race conditions
- Price or ledger manipulation
- Location spoofing
- Malicious media upload
- Notification / API abuse

Mitigations must map to accepted ADRs and the threat model — not ad-hoc inventiveness.

## Safe contribution practices

- Never commit production credentials or private keys
- Redact sensitive data from screenshots and logs in issues/PRs
- Prefer least-privilege examples in documentation
- Flag security-relevant ADRs as blocking before related implementation
