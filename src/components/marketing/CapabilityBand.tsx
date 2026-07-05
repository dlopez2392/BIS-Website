export function CapabilityBand({ items }: { items: string[] }) {
  return (
    <section className="border-y border-hairline bg-surface-alt">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:grid-cols-2 md:grid-cols-4">
        {items.map((it) => (
          <div key={it} className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-gold" />
            <span className="text-sm font-medium text-ink">{it}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
