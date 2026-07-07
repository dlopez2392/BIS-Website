export function InsightCard({ category, title }: { category: string; title: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-alt p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-gold">{category}</p>
      <h3 className="mt-3 text-lg font-bold text-ink">{title}</h3>
    </div>
  );
}
