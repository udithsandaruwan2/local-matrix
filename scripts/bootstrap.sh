#!/usr/bin/env bash
# Bootstrap the framework into a new or existing project.
# Usage: ./scripts/bootstrap.sh [target-dir] [project-name] [--copy] [--force] [--no-hooks]

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck disable=SC1091
. "$ROOT/scripts/lib.sh"

TARGET=""
NAME=""
COPY=0
FORCE=0
HOOKS=1

for arg in "$@"; do
  case "$arg" in
    --copy)     COPY=1 ;;
    --force)    FORCE=1 ;;
    --no-hooks) HOOKS=0 ;;
    -h|--help)
      sed -n '2,3p' "$0"
      exit 0
      ;;
    -*)
      die "unknown flag: $arg"
      ;;
    *)
      if [ -z "$TARGET" ]; then
        TARGET="$arg"
      elif [ -z "$NAME" ]; then
        NAME="$arg"
      else
        die "unexpected argument: $arg"
      fi
      ;;
  esac
done

[ -n "$TARGET" ] || TARGET="."
mkdir -p "$TARGET"
TARGET="$(cd "$TARGET" && pwd)"

if [ -z "$NAME" ]; then
  NAME="$(basename "$TARGET")"
fi

say "Framework source: $ROOT"
say "Target:           $TARGET"
say "Project name:     $NAME"

if [ "$TARGET" = "$ROOT" ]; then
  say "Initializing the framework source directory in place."
else
  if [ -f "$TARGET/AGENTS.md" ] && [ "$FORCE" != "1" ]; then
    die "$TARGET already has AGENTS.md. Use --force to overwrite framework files."
  fi

  existing="$(find "$TARGET" -mindepth 1 -maxdepth 1 ! -name '.git' -print -quit 2>/dev/null || true)"
  if [ -n "$existing" ] && [ "$FORCE" != "1" ]; then
    die "$TARGET is not empty. Use --force to add framework files (review the diff afterwards)."
  fi

  if [ "$FORCE" = "1" ] && [ -n "$existing" ]; then
    backup="$TARGET/.apf-backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup"
    for f in AGENTS.md README.md CHANGELOG.md .gitignore .editorconfig Makefile framework.conf; do
      [ -e "$TARGET/$f" ] && cp -a "$TARGET/$f" "$backup/" 2>/dev/null || true
    done
    if [ -n "$(find "$backup" -mindepth 1 -print -quit 2>/dev/null)" ]; then
      say "Backed up existing top-level files to $backup"
    else
      rmdir "$backup" 2>/dev/null || true
    fi
  fi

  say "Copying framework files (excluding .git, examples, node_modules)..."
  tar -C "$ROOT" \
    --exclude='./.git' \
    --exclude='./examples' \
    --exclude='./node_modules' \
    --exclude='./dist' \
    --exclude='./build' \
    --exclude='./.agents/.cache' \
    --exclude='./CLAUDE.md' \
    --exclude='./GEMINI.md' \
    --exclude='./.rules' \
    --exclude='./.claude' \
    --exclude='./.opencode' \
    --exclude='./.cursor' \
    --exclude='./.windsurf' \
    --exclude='./.roo' \
    --exclude='./.junie' \
    --exclude='./.aider.conf.yml' \
    --exclude='./.github/copilot-instructions.md' \
    -cf - . | tar -C "$TARGET" -xf -
fi

# ---------------------------------------------------------------- personalize
OWNER="$(git -C "$TARGET" config user.name 2>/dev/null || true)"
[ -n "$OWNER" ] || OWNER="${USER:-human}"
TODAY="$(date +%Y-%m-%d)"

replace_token "$TARGET/AGENTS.md" "{{PROJECT_NAME}}" "$NAME"
replace_token "$TARGET/project/STATE.md" "{{PROJECT_NAME}}" "$NAME"
replace_token "$TARGET/project/STATE.md" "{{DATE}}" "$TODAY"
replace_token "$TARGET/project/STATE.md" "{{OWNER}}" "$OWNER"

# Replace framework-facing README/CHANGELOG only in a copied project.
if [ "$TARGET" != "$ROOT" ]; then
  if [ -f "$TARGET/README.md" ] && grep -q 'agent-project-framework:readme' "$TARGET/README.md" 2>/dev/null; then
    cp "$TARGET/$TEMPLATES_DIR/project-readme.md" "$TARGET/README.md"
    replace_token "$TARGET/README.md" "{{PROJECT_NAME}}" "$NAME"
  fi
  if [ -f "$TARGET/CHANGELOG.md" ] && grep -q 'agent-project-framework:changelog' "$TARGET/CHANGELOG.md" 2>/dev/null; then
    cp "$TARGET/$TEMPLATES_DIR/project-changelog.md" "$TARGET/CHANGELOG.md"
    replace_token "$TARGET/CHANGELOG.md" "<YYYY-MM-DD>" "$TODAY"
  fi
fi

chmod +x "$TARGET/scripts/"*.sh 2>/dev/null || true

# ---------------------------------------------------------------- adapters
sync_args=("$TARGET")
[ "$COPY" = "1" ] && sync_args+=("--copy")
[ "$FORCE" = "1" ] && sync_args+=("--force")

if [ -x "$TARGET/scripts/sync-adapters.sh" ]; then
  "$TARGET/scripts/sync-adapters.sh" "${sync_args[@]}"
else
  warn "sync-adapters.sh not found; run it manually after copying."
fi

# ---------------------------------------------------------------- hooks
if [ "$HOOKS" = "1" ] && [ -x "$TARGET/scripts/install-hooks.sh" ]; then
  "$TARGET/scripts/install-hooks.sh" "$TARGET" || true
fi

say ""
say "Done. Next steps:"
say "  1. cd $TARGET"
say "  2. Fill AGENTS.md section 11 (stack, commands, never-touch paths)."
say "  3. Open the project in your agent and say:"
say "     \"Read AGENTS.md and project/STATE.md. Run project-kickoff for phase 0.\""
say "  4. Verify: ./scripts/doctor.sh && ./scripts/token-audit.sh"
