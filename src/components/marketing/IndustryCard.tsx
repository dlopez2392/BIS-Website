export function IndustryCard({ label, title, body }: { label: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-alt p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-accent">{label}</p>
      <h3 className="mt-3 text-xl font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-ink-muted">{body}</p>
    </div>
  );
}
