# Feature specs

One spec per feature: `FEAT-###-<slug>.md`. Use `.agents/templates/feature-spec.md`.

Rules:

- The spec is the contract for behavior.
- Every acceptance item maps to a test or a documented manual check.
- Keep it under 300 lines; split the feature if longer.
- Update the spec when behavior changes, in the same PR.
- Link the catalog entry and task IDs.

## Index

| Spec | Feature | Status | Tasks |
|---|---|---|---|
| [FEAT-001](FEAT-001-ingest-api.md) | HTTP ingest API | specified | T-005, T-006 |
| [FEAT-010](FEAT-010-live-map.md) | Live map + realtime stream | specified | T-007, T-008 |
| [FEAT-040](FEAT-040-embeddable-map.md) | Embeddable live map | specified | T-042–T-046 |

Specs for M2+ features are written when the milestone is planned, not in advance.
