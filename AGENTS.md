# AGENTS.md — Local Matrix

Operating manual for AI agents. Read this file fully, once per session. Do not preload the rest of the repo.

**Prime directive:** ship the smallest correct change that satisfies an explicit, testable requirement. Correctness first, tokens second, speed third. Never invent requirements.

---

## 1. Session start (30 seconds)

1. Read `project/STATE.md` — current phase, gates, next action.
2. Read only the task artifact (spec, task, or issue), not the whole project.
3. If the request is vague, large, or multi-outcome, run the `prompt-optimizer` skill **before** writing code.
4. If the phase is below **G4 Build authorized**, do not write product code. Propose the next document instead.

## 2. Phase model and gates

`0 Intake → 1 Discovery → 2 Product → 3 Architecture → 4 Plan → 5 Build → 6 Release → 7 Operate`

| Gate | Meaning | Required artifacts |
|---|---|---|
| G0 | Brief approved | `project/00-brief.md` |
| G1 | Problem validated | `project/01-discovery.md` |
| G2 | Product baseline | `project/02-prd.md`, `project/02-product-catalog.md` |
| G3 | Architecture approved | `project/03-architecture.md`, ADRs |
| G4 | Plan approved / build authorized | `project/05-plan.md`, task files |
| G5 | Merge-ready | acceptance met, checks green, review done |
| G6 | Release-ready | changelog, version, rollback plan |

**Agents may propose a gate; only the human approves one.** Record approval in `project/STATE.md`.

Phase 7 (Operate) has no gate: feedback loops back to G2 (scope) or G4 (plan).

## 3. Context economy (non-negotiable)

- **Search before read.** Use `rg`/glob, then read the smallest useful range. Never read a whole directory "for context".
- **Never re-read** a file already read this session unless it changed.
- **Load on demand** using the map in §9. One document at a time.
- **No file dumps in chat.** Cite `path:line`; show only the changed lines.
- **No narration** beyond the one-line orientation in §1. Reply with: what changed, why, verification, next step.
- **Size the task first.** S = no plan. M = short written plan. L = plan + slices. XL = split before starting.
- **Stop and ask** when two sources of truth conflict. Max 3 questions, each with a recommended default.
- **Compact early.** At ~60% context, copy `.agents/templates/handoff.md` to `project/handoffs/` and start a fresh session.
- **Context tiers.** T0: this file + skill descriptions. T1: one skill. T2: one doc or project artifact. T3: templates. Budgets: `docs/10-token-economy.md`.

## 4. Work order for non-trivial work

Every M/L task must have: **Goal · Context · Constraints · Acceptance · Out of scope · Verification**. Missing pieces → run `prompt-optimizer`. Keep it under 300 words.

## 5. Build loop

`spec → failing check → smallest implementation → targeted verify → full verify → self-review diff → commit`

Definition of done: acceptance met · tests pass · lint/typecheck pass · docs updated · no secrets · diff reviewable in one sitting.

Stop after **2 failed attempts** and re-read the error. Stop after **3** and ask a human.

## 6. Git management

- Long-lived branches: `main` (phase-complete), `dev-frontend`, `dev-backend`, `prod-frontend`, `prod-backend`. Feature branches: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`, `chore/<slug>`, `refactor/<slug>`, `hotfix/<slug>`.
- Feature flow: branch from the matching `dev-*`, make several atomic commits, push, `gh pr create --base dev-*`, wait for checks/review, then `gh pr merge --merge --delete-branch`. Backend first for full-stack work.
- Merge to `main` only when a phase or product is complete. Merge `main` to `prod-*` and deploy only when the human explicitly says “merge to production and deploy.” Never commit directly to `main`, `dev-*`, or `prod-*`.
- Conventional Commits: `type(scope): imperative summary` (≤72 chars, body explains *why*). One logical change per commit; several commits per feature.
- **Never** force-push, rebase, or tag a shared branch without explicit human approval. Never self-merge without review.
- **Never** `git add .`. Stage explicit paths. Check `git status` before every commit. Never commit secrets, `.env*`, credentials, build output, or unrelated files; generated adapters are committed.
- Parallel agents: one `git worktree` per task, branched from the correct `dev-*` branch.
- Commit only when checks pass. Push the feature branch and open the PR when the feature is complete. Production merge/deploy is human-gated.

## 7. Code standards

- Read and follow existing patterns before inventing new ones.
- Small, deep modules with explicit interfaces; no hidden globals or action-at-a-distance.
- Validate at system boundaries. Typed errors. No silent catches.
- No dead code, commented-out blocks, or `TODO` without an issue link.
- Tests assert behavior, not implementation; each test has one reason to fail.
- Every dependency must be justified. Prefer the standard library and existing packages.
- Least privilege, parameterized queries, no secrets in code or logs.
- UI: keyboard access, semantic HTML, and the project's performance budget.

## 8. Documentation

- `project/` is the single source of truth for project state and decisions; process depth lives in `docs/`. Do not create parallel project docs elsewhere.
- ADR for irreversible decisions. Spec for behavior. Catalog for scope. Plan for sequence.
- Docs change in the same PR as the code they describe.
- Update `project/STATE.md` whenever a phase, gate, or next action changes.

## 9. Context map (open only what the task needs)

| Need | Read |
|---|---|
| Where are we? | `project/STATE.md` |
| Why this product? | `project/00-brief.md`, `project/01-discovery.md` |
| What are we building? | `project/02-prd.md`, `project/02-product-catalog.md` |
| How is it structured? | `project/03-architecture.md`, `project/04-adr/` |
| What is next? | `project/05-plan.md` |
| Exact behavior | `project/06-specs/` |
| Project-only rules | `project/rules/` (read relevant file only) |
| Process depth | `docs/` (one playbook at a time) |
| Reusable procedures | `.agents/skills/<name>/SKILL.md` |
| Doc/plan templates | `.agents/templates/` |
| Previous session | `project/handoffs/` |

## 10. Skills

Skills use progressive disclosure: only `name` and `description` are always visible. Load the body when the trigger matches.

| Skill | Trigger |
|---|---|
| `project-kickoff` | new project, new phase, "start", "kickoff" |
| `prompt-optimizer` | vague/large request, "optimize", "plan this", token concerns |
| `spec-writer` | new feature, ambiguous behavior, acceptance criteria |
| `architecture-decisions` | stack choice, ADR, NFR, data model, threat model |
| `plan-and-slice` | milestone, task breakdown, estimate, sequencing |
| `implementation-loop` | writing or changing product code |
| `git-steward` | branch, commit, PR, worktree, conflict, release tag |
| `code-review` | review a diff or PR, pre-merge check |
| `test-strategy` | test plan, flaky tests, coverage question |
| `release-manager` | version, changelog, deploy, rollback |
| `context-auditor` | rules/docs feel bloated, stale, or contradictory |
| `skill-forge` | add a project-specific skill or rule |

## 11. Project invariants (edit per project, ≤10 bullets)

- Stack: TypeScript 5 · React 19 + Vite + Tailwind v4 on Netlify · NestJS 11 + Fastify adapter on Vercel · PostgreSQL 17 + PostGIS + TimescaleDB + Prisma 7 (Docker local, Neon later) · Redis 7 · MapLibre GL JS 6. No Next.js, Hono, or Drizzle.
- Package manager: `pnpm` 10 with Turborepo. Node 22 LTS.
- Commands: `pnpm install`, `pnpm dev`, `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm db:up`, `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed` (planned until M1 scaffold exists).
- Never touch: `project/STATE.md` gate approvals without a human; applied migrations without an ADR; `.env*`, production data, or secrets.
- Data classification: **sensitive** — location traces, sensor telemetry, account data, API keys.
- Every tenant-owned query must run through `PrismaService.withWorkspace` with `app.workspace_id` set and pass RLS. No service-role query in a request path.
- Embed tokens are read-only, short-lived, origin-bound, and never grant workspace API scopes.
- Public API changes ship with an OpenAPI update and a version/deprecation note.
- Deploy target: Netlify (web/embed static), Vercel (API function + worker daemon), Neon later (Postgres), Upstash later (Redis); Docker Compose is local only.

## 12. When stuck

1. Re-read the failing output, not the whole file.
2. Search the repo for the same pattern (`rg "<symbol>"`).
3. Check `project/04-adr/` and `project/rules/` for a prior decision.
4. Write the smallest reproduction.
5. Ask one precise question with your best hypothesis and default.
