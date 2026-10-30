#!/usr/bin/env bash
# Generate IDE/agent adapter files from AGENTS.md and .agents/skills.
# Usage: ./scripts/sync-adapters.sh [target-dir] [--copy] [--force]

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

TARGET="$ROOT"
COPY=0
FORCE=0

for arg in "$@"; do
  case "$arg" in
    --copy)  COPY=1 ;;
    --force) FORCE=1 ;;
    -h|--help)
      sed -n '2,4p' "$0"
      exit 0
      ;;
    -*)
      printf 'error: unknown flag %s\n' "$arg" >&2
      exit 2
      ;;
    *)
      TARGET="$arg"
      ;;
  esac
done

TARGET="$(cd "$TARGET" && pwd)" || {
  printf 'error: target directory does not exist: %s\n' "$TARGET" >&2
  exit 1
}

# Load the target's config when syncing a copied project.
if [ -f "$TARGET/framework.conf" ]; then
  # shellcheck disable=SC1091
  . "$TARGET/framework.conf"
fi

SCRIPT_DIR="$TARGET/scripts"
# lib.sh resolves ROOT from its own location, which must be the target.
if [ -f "$TARGET/scripts/lib.sh" ]; then
  # shellcheck disable=SC1091
  . "$TARGET/scripts/lib.sh"
else
  printf 'error: %s/scripts/lib.sh not found\n' "$TARGET" >&2
  exit 1
fi

AGENTS="$TARGET/AGENTS.md"
SKILLS="$TARGET/$SKILLS_DIR"

[ -f "$AGENTS" ] || { err "AGENTS.md not found in $TARGET"; exit 1; }

ADAPTERS="${ADAPTERS:-claude opencode cursor copilot gemini windsurf roo zed aider junie}"

generated=0
skipped=0

write_header() {
  printf '<!-- %s; edit AGENTS.md or .agents/skills, then run scripts/sync-adapters.sh -->\n\n' "$MARKER"
}

yaml_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

# ---------------------------------------------------------------- claude
if printf '%s\n' "$ADAPTERS" | grep -qw claude; then
  link_path "$AGENTS" "$TARGET/CLAUDE.md" "AGENTS.md"
  link_path "$SKILLS" "$TARGET/.claude/skills" "../.agents/skills"
  generated=$((generated + 1))
fi

# ---------------------------------------------------------------- opencode
if printf '%s\n' "$ADAPTERS" | grep -qw opencode; then
  link_path "$SKILLS" "$TARGET/.opencode/skills" "../.agents/skills"
  generated=$((generated + 1))
fi

# ---------------------------------------------------------------- gemini
if printf '%s\n' "$ADAPTERS" | grep -qw gemini; then
  link_path "$AGENTS" "$TARGET/GEMINI.md" "AGENTS.md"
  generated=$((generated + 1))
fi

# ---------------------------------------------------------------- zed
if printf '%s\n' "$ADAPTERS" | grep -qw zed; then
  link_path "$AGENTS" "$TARGET/.rules" "AGENTS.md"
  generated=$((generated + 1))
fi

# ---------------------------------------------------------------- cursor
if printf '%s\n' "$ADAPTERS" | grep -qw cursor; then
  cursor_dir="$TARGET/.cursor/rules"
  mkdir -p "$cursor_dir"

  core="$cursor_dir/000-agents.mdc"
  if can_write "$core"; then
    {
      printf -- '---\ndescription: "Core project rules, phase model, and context map for AI agents"\nalwaysApply: true\n---\n\n'
      write_header
      cat "$AGENTS"
    } > "$core"
    generated=$((generated + 1))
  else
    skipped=$((skipped + 1))
  fi

  if [ -d "$SKILLS" ]; then
    for skill in "$SKILLS"/*/SKILL.md; do
      [ -f "$skill" ] || continue
      name="$(basename "$(dirname "$skill")")"
      desc="$(skill_description "$skill")"
      [ -n "$desc" ] || desc="Use when the $name procedure is relevant."
      dest="$cursor_dir/100-skill-$name.mdc"
      if can_write "$dest"; then
        {
          printf -- '---\ndescription: "%s"\nalwaysApply: false\n---\n\n' "$(yaml_escape "$desc")"
          write_header
          skill_body "$skill"
        } > "$dest"
        generated=$((generated + 1))
      else
        skipped=$((skipped + 1))
      fi
    done
  fi
fi

# ---------------------------------------------------------------- copilot
if printf '%s\n' "$ADAPTERS" | grep -qw copilot; then
  dest="$TARGET/.github/copilot-instructions.md"
  mkdir -p "$(dirname "$dest")"
  if can_write "$dest"; then
    {
      write_header
      printf '# GitHub Copilot instructions\n\n'
      printf 'Skills are on-demand procedures in `.agents/skills/`. Load one only when its trigger matches.\n\n'
      cat "$AGENTS"
    } > "$dest"
    generated=$((generated + 1))
  else
    skipped=$((skipped + 1))
  fi
fi

# ---------------------------------------------------------------- windsurf
if printf '%s\n' "$ADAPTERS" | grep -qw windsurf; then
  dest="$TARGET/.windsurf/rules/00-agents.md"
  mkdir -p "$(dirname "$dest")"
  if can_write "$dest"; then
    {
      printf -- '---\ntrigger: always_on\n---\n\n'
      write_header
      cat "$AGENTS"
    } > "$dest"
    generated=$((generated + 1))
  else
    skipped=$((skipped + 1))
  fi
fi

# ---------------------------------------------------------------- roo
if printf '%s\n' "$ADAPTERS" | grep -qw roo; then
  dest="$TARGET/.roo/rules/00-agents.md"
  mkdir -p "$(dirname "$dest")"
  if can_write "$dest"; then
    {
      write_header
      cat "$AGENTS"
    } > "$dest"
    generated=$((generated + 1))
  else
    skipped=$((skipped + 1))
  fi
fi

# ---------------------------------------------------------------- aider
if printf '%s\n' "$ADAPTERS" | grep -qw aider; then
  dest="$TARGET/.aider.conf.yml"
  if can_write "$dest"; then
    {
      printf '# %s\n' "$MARKER"
      printf 'read:\n  - AGENTS.md\n'
    } > "$dest"
    generated=$((generated + 1))
  else
    skipped=$((skipped + 1))
  fi
fi

# ---------------------------------------------------------------- junie
if printf '%s\n' "$ADAPTERS" | grep -qw junie; then
  dest="$TARGET/.junie/guidelines.md"
  mkdir -p "$(dirname "$dest")"
  if can_write "$dest"; then
    {
      write_header
      cat "$AGENTS"
    } > "$dest"
    generated=$((generated + 1))
  else
    skipped=$((skipped + 1))
  fi
fi

say "Adapters synced for: $ADAPTERS"
say "Generated: $generated file(s); skipped: $skipped"
say "Canonical sources: AGENTS.md, $SKILLS_DIR/"
