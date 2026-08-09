# Changelog

All notable changes to Saree'e (سريع) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to follow [Semantic Versioning](https://semver.org/) once versioned releases begin.

## [Unreleased]

### Added

- Authoritative documentation tree under `docs/` (shared, mobile, backend).
- Architecture Decision Record templates ADR-001 through ADR-020 (`PROPOSED`).
- Repository community files: contributing guide, security policy, code of conduct, setup guide, changelog, license.
- GitHub issue and pull request templates.
- Cursor documentation-first engineering rule (`.cursor/rules/`).

### Changed

- Normalized documentation hierarchy under `docs/` as the single source of truth.
- Clarified that MANIFEST is an index; filesystem discovery is authoritative.

### Notes

- Application source code (Flutter / NestJS) is not implemented in this release window.
- Commercial values (pricing, capacity limits, commissions) remain business decisions and must not be invented during implementation.
- Implementation is gated on **ACCEPTED** ADRs for the affected dependency chain.

## [0.1.0] - 2026-08-09

### Added

- Initial public repository bootstrap for Saree'e documentation foundation (Phase 0).

[Unreleased]: https://github.com/yazan-alsamman/sari3/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yazan-alsamman/sari3/releases/tag/v0.1.0
