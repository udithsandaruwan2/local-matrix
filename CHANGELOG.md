# Changelog

All notable changes to Local Matrix are documented here. Format follows [Keep a Changelog](https://keepachangelog.com), versioning follows [SemVer](https://semver.org).

## [Unreleased]

### Added

- Project initialized with the Agent Project Framework.
- Phase 0–4 planning artifacts: brief, discovery, PRD, product catalog, architecture, ADRs, development plan, feature specs, and metrics.
- Framework trimmed to the OpenCode/AGENTS.md workflow; unused agent adapters removed.

### Changed

- Repository root now holds the framework and project truth instead of a nested `framework/` folder.

### Security

- Defined tenant isolation (Postgres RLS), signed embed tokens, API-key hashing, and webhook HMAC as release blockers.
