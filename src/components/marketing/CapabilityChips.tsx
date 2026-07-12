export function CapabilityChips({
  id, heading, items, emphatic = false,
}: { id?: string; heading: string; items: string[]; emphatic?: boolean }) {
  const headingId = id ? `${id}-h` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className="mt-10 scroll-mt-24">
      <h2 id={headingId} className="text-lg font-bold text-ink">{heading}</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className={
              emphatic
                ? 'rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-ink'
                : 'rounded-full border border-hairline bg-surface-alt px-3 py-1.5 text-sm text-ink-muted'
            }
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
