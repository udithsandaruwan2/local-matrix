# 07 — Git workflow

**Question this phase answers:** how do we keep history readable, integrate frontend and backend safely, and make production deploys deliberate?

The rules are intentionally strict because agents are fast and confident. Git is the safety net; do not cut holes in it.

---

## Branch model

Five long-lived branches. Four are the working environment branches; `main` is the phase-complete truth.

| Branch | Use | Lifetime |
|---|---|---|
| `main` | phase/product-complete, stable, deployable | forever |
| `dev-frontend` | integration for `apps/web`, `apps/embed`, `packages/ui`, `packages/map` | forever |
| `dev-backend` | integration for `apps/api`, `apps/worker`, `packages/db`, `packages/core`, `packages/shared` | forever |
| `prod-frontend` | exactly what is deployed to Netlify production | forever |
| `prod-backend` | exactly what is deployed to Vercel production | forever |
| `feat/<slug>` | new behavior | hours–days |
| `fix/<slug>` | bug fix | hours |
| `refactor/<slug>` | behavior-preserving change | hours–days |
| `docs/<slug>` | documentation | hours |
| `chore/<slug>` | tooling, deps, config | hours |
| `hotfix/<slug>` | production emergency | minutes–hours |

Rules:

- Never commit directly to `main`, `dev-frontend`, `dev-backend`, `prod-frontend`, or `prod-backend`. All changes arrive through a PR.
- Feature branches start from the matching dev branch: frontend from `dev-frontend`, backend from `dev-backend`.
- `main` receives merges from both dev branches only when a **phase or product is complete**, after G5/G6 checks and human approval.
- `prod-*` receives merges from `main` only when the human explicitly says **“merge to production and deploy.”** No other event deploys production.
- Keep feature branches short-lived; merge within 1–3 days.
- Delete the feature branch after merge.
- Enable branch protection on all five long-lived branches: require PR, require checks, block force-push and deletion.

### Full-stack features

A feature that touches both surfaces uses two PRs:

1. Backend first: `feat/<slug>-api` → `dev-backend` (contract, DB, API).
2. Frontend second: `feat/<slug>-web` → `dev-frontend` (UI, client).
3. If the backend PR changes `packages/shared`, merge `dev-backend` into `dev-frontend` (or cherry-pick the shared commit) before starting the frontend PR.

This keeps each dev branch reviewable and avoids a long-lived cross-surface branch.

---

## Feature flow

Every feature ends with commits, a pushed branch, a PR, and a merge into the matching dev branch.

```bash
# 1. Start from the correct dev branch
git fetch origin
git switch dev-backend
git pull --ff-only
git switch -c feat/ingest-api

# 2. Make several atomic commits
git status
git add apps/api/src/ingest apps/api/src/ingest/*.test.ts
git commit -m "feat(ingest): validate canonical telemetry envelope" \
  -m "Rejects bad coordinates and oversized sensor maps before persistence." \
  -m "Refs: FEAT-001, T-006"
# ...more commits...

# 3. Push and open the PR
git push -u origin feat/ingest-api
gh pr create --base dev-backend --head feat/ingest-api --fill

# 4. Wait for checks and review
gh pr checks --watch
gh pr view --web

# 5. Merge into the dev branch, preserving the commits
gh pr merge --merge --delete-branch
```

Use the same flow with `dev-frontend` for web/embed work. Do not squash by default; the several commits are the history the human asked to keep. Squash only when the human explicitly asks.

### Phase completion → `main`

Only after a phase or product is complete:

```bash
gh pr create --base main --head dev-backend \
  --title "release: M1 backend" \
  --body "Phase M1 complete. See project/05-plan.md and project/STATE.md."
gh pr checks --watch
gh pr merge --merge

gh pr create --base main --head dev-frontend \
  --title "release: M1 frontend" \
  --body "Phase M1 complete. See project/05-plan.md and project/STATE.md."
gh pr checks --watch
gh pr merge --merge
```

Then tag from `main`:

```bash
git switch main && git pull --ff-only
git tag -a v0.1.0 -m "v0.1.0 — M1 first live point"
git push origin v0.1.0
```

### Production deploy → `prod-*`

Only on explicit human instruction: **“merge to production and deploy.”**

```bash
# main must contain the phase-complete state
gh pr create --base prod-backend --head main \
  --title "deploy: M1 backend" \
  --body "Explicit production approval. Rollback: previous Vercel deployment."
gh pr checks --watch
gh pr merge --merge

gh pr create --base prod-frontend --head main \
  --title "deploy: M1 frontend" \
  --body "Explicit production approval. Rollback: previous Netlify deploy."
gh pr checks --watch
gh pr merge --merge
```

Then trigger the Netlify and Vercel production deploys from the `prod-*` branches, run `scripts/smoke.sh`, and record the deploy IDs in the release notes.

If `prod-*` contains a hotfix that is not in `main`, merge `prod-*` back into `main` first, then re-merge `main` into `prod-*`.

---

## Commits

**Conventional Commits**, enforced by `.githooks/commit-msg`:

```
<type>(<scope>): <imperative summary>

<why this change is needed>

Refs: FEAT-001, T-003
```

| Type | Use |
|---|---|
| `feat` | user-visible behavior |
| `fix` | bug fix |
| `docs` | documentation only |
| `refactor` | no behavior change |
| `perf` | performance |
| `test` | tests only |
| `build` | build system, deps |
| `ci` | pipeline |
| `chore` | maintenance |
| `revert` | revert a previous commit |

Rules:

- Summary ≤72 chars, imperative mood ("add", not "added").
- One logical change per commit. Several commits per feature are expected.
- Body explains **why**, not what. The diff shows what.
- Reference the spec/task ID.
- Never commit generated files, secrets, or unrelated formatting.
- If a commit needs "and" in the summary, it is probably two commits.

Good:

```
feat(ingest): add idempotent batch ingest

Repeating the same key within 24h must not create duplicate rows.
Batch validation returns per-index errors without failing valid points.

Refs: FEAT-001, T-006
```

Bad:

```
update stuff
```

---

## Staging discipline

- `git status` before every commit.
- Stage explicit paths: `git add apps/api/src/ingest/service.ts apps/api/src/ingest/service.test.ts`.
- Never `git add .` or `git add -A`; they capture scratch files and secrets.
- Review `git diff --staged` before committing.
- If you see unexpected changes, stop and ask; do not revert someone else's work.

---

## Pull requests

A PR is a unit of review, not a unit of work. Keep it under ~400 changed lines when possible.

### PR template

```markdown
## What
One paragraph.

## Why
Link to FEAT-### / T-### / issue.

## How
Key decisions and trade-offs.

## Verification
- [ ] `pnpm test`
- [ ] `pnpm lint`
- [ ] `pnpm build`
- [ ] Manual: <steps>

## Risk and rollback
What can break, and how to undo it.

## Screenshots
Before/after for UI changes.
```

### Review rules

- At least one human approval for `main`, `dev-*`, and `prod-*` merges.
- Author resolves comments; reviewer re-checks only changed parts.
- No self-merge without approval, even if CI is green.
- Merge commits by default (`gh pr merge --merge`) to preserve the feature commits.
- Rebase only your own feature branch, never a shared branch; resolve conflicts locally.
- Do not merge with a red pipeline.

---

## Parallel agents and worktrees

One agent per worktree, one branch per worktree, one task per branch.

```bash
# Backend task
git fetch origin
git worktree add ../local-matrix-feat-ingest -b feat/ingest-api origin/dev-backend
cd ../local-matrix-feat-ingest

# Frontend task
git worktree add ../local-matrix-feat-map -b feat/live-map origin/dev-frontend
cd ../local-matrix-feat-map
```

Rules:

- Never run two agents in the same working directory.
- Give each agent a disjoint file scope; overlapping scopes cause conflicts.
- Baseline check before handing the worktree to an agent: `install && test` must be green.
- After the agent finishes: run the same checks, review the diff, then push and open the PR.
- Remove the worktree after merge:

```bash
git worktree remove ../local-matrix-feat-ingest
git branch -d feat/ingest-api
git worktree prune
```

### Parallelization checklist

- [ ] Tasks touch disjoint files.
- [ ] No shared migration or lockfile edits.
- [ ] Each worktree has its own env/DB/port.
- [ ] Merge order is known.
- [ ] One owner reviews all agent diffs together.

---

## Conflicts

1. Understand both sides; do not blindly accept "ours" or "theirs".
2. Prefer the version that preserves both intents; if impossible, ask.
3. Re-run tests after resolution.
4. Never commit conflict markers.
5. If a conflict is large, split the branch or merge in smaller steps.

```bash
git fetch origin
git merge origin/dev-backend
# resolve, then
git add <resolved-files>
git commit
```

Never rebase or force-push a shared branch without coordination.

---

## Releases and tags

- Semantic versioning: `MAJOR.MINOR.PATCH`.
- Annotated tags: `git tag -a v1.2.0 -m "v1.2.0"`.
- Tag from `main` after the phase-complete merge, never from a feature branch.
- Changelog entry required before tagging.
- Production deploys happen only from `prod-frontend` / `prod-backend`, after explicit approval.
- Record the Netlify deploy ID, Vercel deployment ID, and migration version in the release notes.

---

## Emergency hotfix

Only when the human explicitly approves a production hotfix.

```bash
git fetch origin
git switch prod-backend
git pull --ff-only
git switch -c hotfix/session-expiry

# smallest fix + regression test
git add apps/api/src/auth/session.ts apps/api/src/auth/session.test.ts
git commit -m "fix(auth): expire sessions after 30m idle" \
  -m "Refs: FEAT-050, T-009"

git push -u origin hotfix/session-expiry
gh pr create --base prod-backend --head hotfix/session-expiry --fill
gh pr checks --watch
gh pr merge --merge --delete-branch

# Keep main and the dev branch in sync
gh pr create --base main --head prod-backend --title "sync: hotfix session expiry" --fill
gh pr merge --merge
gh pr create --base dev-backend --head main --title "sync: hotfix session expiry" --fill
gh pr merge --merge

git switch main && git pull --ff-only
git tag -a v0.1.1 -m "v0.1.1 — session expiry hotfix"
git push origin v0.1.1
```

After the hotfix: write a short postmortem, add the regression test, and fix the process gap.

---

## Recovery

| Situation | Command | Caution |
|---|---|---|
| Undo last commit, keep changes | `git reset --soft HEAD~1` | local only |
| Discard unstaged changes | `git restore <file>` | destructive |
| Recover a lost commit | `git reflog` → `git cherry-pick <sha>` | safe |
| Undo a pushed commit | `git revert <sha>` | never force-push shared |
| Stash before switching | `git stash push -m "wip: notes"` | do not forget it |
| See what changed | `git diff`, `git diff --staged` | read before commit |

**Never** run `git reset --hard`, `git clean -fd`, or `git push --force` on shared branches without explicit human approval.

---

## Agent permissions

| Action | Default |
|---|---|
| Read history, diff, status | allowed |
| Create branch/worktree from `dev-*` | allowed |
| Stage explicit paths | allowed |
| Commit on a feature branch | allowed when checks pass |
| Push feature branch | allowed when the feature is complete |
| Open PR to `dev-*` | allowed when the feature is complete |
| Merge feature PR to `dev-*` | allowed after CI green and human review |
| Merge `dev-*` to `main` | human approval required (phase complete) |
| Merge `main` to `prod-*` / deploy | explicit human instruction only |
| Rebase/force-push shared branch | human only |
| Tag/release | human only |
| Delete branch/worktree | allowed after merge, confirm first |

If the agent is unsure whether a file is someone else's work, it must stop and ask.

---

## Exit checklist

- [ ] Branch started from the correct `dev-*` branch.
- [ ] Commits are atomic and Conventional.
- [ ] `git status` is clean except intended files.
- [ ] PR has what/why/how/verification/risk.
- [ ] Checks pass locally and in CI.
- [ ] Review approved; no unresolved blocking comments.
- [ ] Feature PR merged to `dev-*`; branch deleted.
- [ ] `main` only updated at phase completion.
- [ ] `prod-*` only updated on explicit production instruction.
- [ ] Worktree/branch cleaned up after merge.
- [ ] Release tagged from `main` with changelog and rollback plan.

Next: [08-security.md](08-security.md).
