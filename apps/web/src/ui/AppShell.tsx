/**
 * Dark widget shell previewing the design language from
 * project/06-specs/design-reference.md. Real widgets, rail, and top bar land
 * with T-008/T-053; tokens finalize in T-054.
 */
export function AppShell() {
  return (
    <div className="min-h-screen bg-app text-ink">
      <header className="flex items-center gap-3 border-b border-line px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-bold text-app">
          ◉
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide">Local Matrix</p>
          <p className="text-xs text-muted">Real-time location and sensor intelligence</p>
        </div>
        <span className="ml-auto rounded-full bg-accent-soft/60 px-3 py-1 text-xs font-medium text-accent">
          console scaffolding — widgets arrive in T-008
        </span>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-line bg-card p-5">
            <p className="text-xs uppercase tracking-widest text-muted">Live devices</p>
            <p className="mt-3 text-3xl font-bold tabular-nums">—</p>
          </article>
          <article className="rounded-xl border border-line bg-card p-5">
            <p className="text-xs uppercase tracking-widest text-muted">Alerts open</p>
            <p className="mt-3 text-3xl font-bold tabular-nums">—</p>
          </article>
          <article className="rounded-xl border border-line bg-card p-5">
            <p className="text-xs uppercase tracking-widest text-muted">Last event</p>
            <p className="mt-3 text-3xl font-bold tabular-nums">—</p>
          </article>
        </section>
      </main>
    </div>
  );
}
