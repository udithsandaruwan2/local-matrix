---
name: git-steward
description: Use when creating branches, committing, opening or reviewing pull requests, using worktrees for parallel agents, resolving conflicts, tagging releases, or recovering from a git mistake.
---

# Git Steward

Keep `main` shippable and history readable. Git is the safety net for fast agents; do not cut holes in it.

## Inputs

- The task/commit scope
- `project/STATE.md`
- Current `git status`, branch, and recent log

## Procedure

### 1. Inspect before acting

```bash
git status --short --branch
git log --oneline -5
git diff --stat
```

Rules:

- Never commit or discard changes you did not create.
- If the working tree has unexpected changes, stop and ask.
- Confirm you are on the intended branch.
- Check that generated files and secrets are not staged.

### 2. Create a branch

```bash
git switch main
git pull --ff-only
git switch -c feat/<slug>
```

| Type | Prefix |
|---|---|
| feature | `feat/` |
| bug | `fix/` |
| refactor | `refactor/` |
| docs | `docs/` |
| tooling | `chore/` |
| emergency | `hotfix/` |

Keep branches short-lived. One task per branch.

### 3. Work in isolation for parallel agents

```bash
git worktree add ../<repo>-<slug> -b <branch>
cd ../<repo>-<slug>
<install>
<test>   # baseline must be green before the agent starts
```

Rules:

- One agent per worktree.
- Disjoint file scopes.
- Separate env/DB/port.
- Merge order decided before starting.
- Remove the worktree after merge:

```bash
git worktree remove ../<repo>-<slug>
git branch -d <branch>
git worktree prune
```

### 4. Stage explicitly

```bash
git add src/notes/service.ts tests/notes.test.ts
git diff --staged
```

Never `git add .` or `git add -A`. Never stage `.env`, credentials, build output, or unrelated files.

### 5. Commit atomically

```bash
git commit -m "feat(notes): add offline draft queue" -m "<why>

Refs: FEAT-001, T-003"
```

Rules:

- Conventional Commits, summary ≤72 chars, imperative mood.
- One logical change.
- Body explains why, not what.
- No "and" in the summary; split the commit.
- Checks must be green before committing.

The local hook (`.githooks/commit-msg`) validates the format. Install it with `./scripts/install-hooks.sh`.

### 6. Open a PR when asked

Use `.github/pull_request_template.md`:

- What, why, how.
- Verification commands.
- Risk and rollback.
- Screenshots for UI.

Target size: ≤400 changed lines. If larger, explain why or split.

### 7. Review and merge

- Rebase on latest `main`; resolve conflicts locally.
- Run checks after the rebase.
- Require human approval.
- Squash-merge by default to keep `main` linear.
- Delete the branch after merge.
- Never merge with a red pipeline.

### 8. Resolve conflicts deliberately

```bash
git fetch origin
git rebase origin/main
# edit conflicts to preserve both intents
git add <resolved>
git rebase --continue
```

Rules:

- Understand both sides before choosing.
- Never leave conflict markers.
- Re-run tests after resolution.
- Do not rebase a branch someone else is using without coordination.

### 9. Tag releases

```bash
git switch main
git pull --ff-only
git tag -a v1.2.0 -m "v1.2.0"
git push origin v1.2.0
```

Tag only after the changelog and release checks are complete. Human-only.

### 10. Recover safely

| Goal | Command | Notes |
|---|---|---|
| Undo last local commit, keep changes | `git reset --soft HEAD~1` | local only |
| Discard one file | `git restore <file>` | destructive |
| Find a lost commit | `git reflog` | then cherry-pick |
| Undo a pushed commit | `git revert <sha>` | never force-push shared |
| Park work | `git stash push -m "wip: ..."` | remember to pop |

**Never** run `git reset --hard`, `git clean -fd`, or `git push --force` on a shared branch without explicit approval.

## Permission matrix

| Action | Agent default |
|---|---|
| status/diff/log | allowed |
| branch/worktree | allowed |
| stage explicit paths | allowed |
| commit on feature branch | allowed when checks pass |
| push feature branch | only when asked |
| open PR | only when asked |
| merge to main | human only |
| rebase/force-push shared | human only |
| tag/release | human only |
| delete branch/worktree | after merge, confirm |

## Guardrails

- Never rewrite shared history.
- Never commit secrets or unrelated changes.
- Never bypass the commit hook with `--no-verify` unless the human asks.
- Never assume a clean tree; check.
- Never resolve a conflict by discarding the other side without understanding it.
- If unsure whose work a change is, stop.

## Output contract

```markdown
## Git
Branch: <name>
Commits: <n> (<types>)
Checks: <commands + result>
PR: <url or "not opened">
Risk: <note>
Next: <one action>
```
## References

- `docs/07-git-workflow.md`
- `.githooks/commit-msg`
