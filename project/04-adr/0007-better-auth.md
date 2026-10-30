# ADR-0007 — Better Auth with Prisma and NestJS

- **Status:** accepted (revised 2026-10-30 before G3 approval)
- **Date:** 2026-10-30
- **Deciders:** Udith Sandaruwan
- **Supersedes:** none

## Context

The product needs email/password, OAuth, email verification, password reset, sessions, organizations/workspaces, roles, and invitations. User data must live in our Postgres so it can join tenant tables and participate in RLS. The team is small and does not want to build auth from scratch or pay per-MAU pricing at the start. The API is NestJS + Fastify on Vercel; the web app is a Vite SPA on Netlify.

## Decision

Use Better Auth with the Prisma adapter and its organization plugin.

- Users, sessions, accounts, and verification tokens live in our Postgres via Prisma.
- Workspace = Better Auth organization; roles map to owner/admin/operator/viewer.
- Better Auth is mounted behind a dedicated NestJS controller that adapts its web-standard handler to Fastify.
- The SPA uses the Better Auth client; the API validates the session cookie on every request.
- Cookie is HTTP-only, secure in production, `sameSite=lax`, scoped to `.localmatrix.dev` so `app.` and `api.` are same-site. Local development uses `localhost` with different ports.
- CORS allows the Netlify origin with credentials; no wildcard origin.
- Email/password + Google/GitHub OAuth in v1; passkeys when the UI is ready.
- API keys are separate from user sessions and are hashed in `api_keys`.

**Fallback:** if the NestJS adapter spike (S-005) fails or becomes fragile, use NestJS JWT access/refresh tokens with argon2 and a `sessions` table, keeping the same session and role contract.

## Alternatives

| Option | Why not chosen |
|---|---|
| Clerk | Fastest UI, but per-MAU cost, user data off-site, and a migration burden at scale |
| Auth.js | Next.js-centric; awkward fit for a Vite SPA + NestJS API |
| Supabase Auth | Strong if already on Supabase; we are not, and it couples auth to a platform |
| Build custom auth | Security risk and weeks of work for a commodity capability |
| NestJS Passport + JWT only | Viable fallback, but more custom work for verification, reset, OAuth, and invitations |

## Consequences

**Positive**
- User data stays in our database and joins cleanly with `members`/`workspaces`.
- TypeScript-native, no vendor lock-in, no per-MAU fee at v1.
- Organization plugin covers invitations and roles.
- The SPA and API can share one session contract across two origins.

**Negative**
- We own security updates, session hardening, and email deliverability.
- Better Auth's documented paths are mostly Next.js; the NestJS adapter is a spike and may need a small wrapper.
- Cross-site cookie/CORS configuration is easy to get wrong; it needs an E2E test on staging.
- Fewer enterprise features (SAML/SCIM) than WorkOS/Clerk; enterprise SSO is deferred.

**Neutral**
- A future enterprise tier can add WorkOS/Auth0 for SAML while keeping the same user table.

## Revisit if

- Enterprise customers require SAML/SCIM before v2.
- The NestJS adapter needs more than a thin controller.
- Auth maintenance exceeds one day per month.
- A security review finds gaps that a managed provider closes more cheaply.

## References

- `project/02-prd.md` FR-01, FR-02
- `project/05-plan.md` T-009, spike S-005
