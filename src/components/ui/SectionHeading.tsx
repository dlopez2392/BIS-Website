export function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-10">
      {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gold">{eyebrow}</p>}
      <h2 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h2>
    </div>
  );
}
