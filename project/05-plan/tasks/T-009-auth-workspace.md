# T-009 — Auth, workspace, and route protection

- **Milestone:** M1
- **Feature:** FEAT-050, FEAT-051
- **Size:** L
- **Risk:** high
- **Depends on:** T-003
- **Status:** todo

## Goal

A visitor can sign up, verify email, sign in, create or join a workspace, switch workspaces, and reach only the console routes their role allows; every request runs with the correct tenant context across the Netlify SPA and Vercel API.

## Context

- `project/04-adr/0007-better-auth.md` — auth choice and NestJS adapter
- `project/04-adr/0005-tenant-isolation-rls.md` — tenant context
- `project/05-plan.md` — spike S-005

## Acceptance

- [ ] Email + password signup and login work through Better Auth with its Prisma adapter; passwords are hashed by the provider, never by app code.
- [ ] Better Auth is mounted through a NestJS controller on Fastify; the SPA uses the Better Auth client against `api.localmatrix.dev`.
- [ ] Sessions use `httpOnly`, `secure` (in production), `sameSite=lax` cookies scoped to `.localmatrix.dev`; logout invalidates the session server-side.
- [ ] Local development works across `localhost:5173` and `localhost:3001` with CORS credentials.
- [ ] Email verification is required before ingest or invite actions; a local Mailpit mailbox receives the link.
- [ ] Password reset works end-to-end in dev and returns the same response for known and unknown emails.
- [ ] Signup creates a workspace and an `owner` membership in one transaction; the user lands in onboarding, not an empty console.
- [ ] Roles `owner`, `admin`, `operator`, `viewer` are enforced server-side; `viewer` cannot mutate devices, keys, or members.
- [ ] A workspace switcher lists only memberships; switching refreshes the session context and map data without a full reload.
- [ ] Unauthenticated console routes redirect to `/login?next=...`; authenticated `/login` redirects to `/map`.
- [ ] The SPA never trusts a `workspace_id` from the client; the API derives it from the session and runs `PrismaService.withWorkspace`.
- [ ] CSRF protection is on for cookie-authenticated mutations; API-key routes are exempt.
- [ ] Session expiry and revoked membership return `401`/`403` with a recoverable message.
- [ ] Integration tests prove a member of workspace A gets `404`/`403` for workspace B resources, including by guessing IDs.
- [ ] Spike S-005 result recorded: Better Auth + Prisma 7 + NestJS/Fastify + RLS either works or the JWT fallback is chosen.

## Out of scope

- OAuth providers beyond Google/GitHub, SAML/SCIM, invitations beyond a single-use email link, billing seats.
- Audit log UI (M2); emit audit rows only if T-003 already provides the table.

## Verification

```bash
pnpm --filter @local-matrix/web dev
pnpm --filter @local-matrix/api test
pnpm typecheck
pnpm --filter @local-matrix/web exec playwright test e2e/auth.spec.ts
```

Manual: sign up in a clean browser, verify email in Mailpit, create a device, sign out, sign in, switch workspace, confirm data isolation.

## Notes

Use the Better Auth client in the SPA and a thin NestJS adapter on the API; do not call the API with a service key from the browser. Keep role checks in one policy module shared by guards and UI, and treat the UI check as cosmetic only. Test the cross-site cookie path on staging, not only localhost.
