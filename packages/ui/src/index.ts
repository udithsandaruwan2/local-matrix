/**
 * Design-system tokens live in Tailwind v4 theme CSS (T-054, see
 * project/06-specs/design-reference.md). Until then this package exposes only
 * the typed token names the apps must not hardcode.
 */

export const TOKEN_NAMES = [
  "bg-app",
  "bg-card",
  "border-subtle",
  "text-primary",
  "text-muted",
  "accent",
  "accent-2",
  "ok",
  "warn",
  "danger",
] as const;

export type TokenName = (typeof TOKEN_NAMES)[number];
