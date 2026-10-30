/** Single-page placeholder; the MapLibre runtime replaces it in T-044. */
export function EmbedPlaceholder() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-app text-ink">
      <p className="text-xs uppercase tracking-widest text-muted">Local Matrix · embed</p>
      <p className="mt-2 text-lg font-semibold">embed runtime scaffold</p>
      <p className="mt-1 text-sm text-muted">
        MapLibre iframe runtime mounts here in T-044; the API serves the HTML shell with per-embed
        CSP
      </p>
    </div>
  );
}
