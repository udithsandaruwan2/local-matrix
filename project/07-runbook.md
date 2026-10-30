# 07 — Runbook

Fill from `.agents/templates/runbook.md` before the first production release.

## Branch and deploy gates

- Feature PRs merge to `dev-frontend` or `dev-backend` after CI and review.
- `main` only receives both dev branches at phase/product completion, with human approval.
- Production deploys run only from `prod-frontend` / `prod-backend` after the human says “merge to production and deploy.”
- Record the Netlify deploy ID, Vercel deployment ID, and migration version for every production release.
- Roll back by promoting the previous Netlify deploy and Vercel deployment; restore the Neon branch only if the migration is unsafe.

## Minimum contents

- Service overview, critical paths, dependencies.
- Deploy and rollback commands.
- Alerts and first checks.
- Common failures and fixes.
- Backup/restore.
- Incident communication template.
- Contacts.

Keep it usable under pressure. Test the rollback quarterly.
