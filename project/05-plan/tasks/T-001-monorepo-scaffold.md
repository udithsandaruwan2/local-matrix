# T-001 — Monorepo scaffold, tooling, and CI

- **Milestone:** M1
- **Feature:** none (foundation)
- **Size:** M
- **Risk:** low
- **Depends on:** none
- **Status:** done

## Delivery notes (2026-10-30)

- Split into two PRs per the branch workflow: `feat/monorepo-scaffold` → `dev-backend` (root, packages, api, worker, CI) and `feat/web-embed-scaffold` → `dev-frontend` (web, embed); dev-backend synced to dev-frontend before the second PR.
- Prisma 7 is config-driven: datasource URL lives in `prisma.config.ts`, the schema carries only the provider (P1012).
- ESLint drops `consistent-type-imports`: Nest constructor param types are consumed by `emitDecoratorMetadata`.
- `@types/node` pinned to 24.x to match the Node 22 runtime; GitHub branch protection coerced 0-review to 1, so long-lived branches keep a required-PR rule without an approval count.
- Peer warnings from `@swc/cli` (chokidar/webpack minors) are recorded for T-004.


## Goal

A pnpm workspace with the planned React/Vite and NestJS apps, Prisma package, shared TypeScript/ESLint/Vitest/Playwright config, and a CI pipeline that runs lint, typecheck, tests, and build on empty scaffolds.

## Context

- `project/04-adr/0001-monorepo-react-nestjs.md` — app boundaries
- `project/03-architecture.md` — component responsibilities
- `project/05-plan.md` — M1 S1

## Acceptance

- [ ] `pnpm install` succeeds from a clean checkout with a committed lockfile.
- [ ] `apps/web` is React 19 + Vite + React Router + Tailwind v4 with a minimal route and build.
- [ ] `apps/api` is NestJS 11 with the Fastify adapter and a minimal `GET /health`.
- [ ] `apps/worker` is a NestJS standalone entry point with a no-op BullMQ worker.
- [ ] `apps/embed` is a Vite React app with a placeholder map route.
- [ ] `packages/db` initializes Prisma 7 with `prisma.config.ts` and a placeholder schema; `core`, `shared`, `map`, `ui`, `config` export typed placeholders.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
- [ ] CI runs the four commands on push/PR and caches pnpm/Turborepo.
- [ ] `.env.example` documents every required variable; no real secret is committed.
- [ ] Node 22 and pnpm 10 are pinned (`.nvmrc`, `packageManager`).
- [ ] `netlify.toml` and `vercel.json` placeholders exist; no deployment is wired yet.
- [ ] Long-lived branches `dev-frontend`, `dev-backend`, `prod-frontend`, `prod-backend` exist alongside `main`; all five are protected against direct pushes.
- [ ] No Next.js, Hono, or Drizzle dependency is present.

## Out of scope

- Any product behavior, database schema, auth, or map code.
- Real Netlify/Vercel/Neon deployments; CI deploy jobs.

## Verification

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @local-matrix/api start
curl -s localhost:3001/health
```

Manual: open the PR and confirm CI is green.

## Notes

Keep the scaffold boring. Do not add dependencies that are not used by M1. If a package has no code yet, export an empty typed module rather than deleting it. Use the Vercel NestJS zero-config path only after T-004 proves it locally.
