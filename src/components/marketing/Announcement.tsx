export function Announcement({ kicker, title, body }: { kicker: string; title: string; body: string }) {
  return (
    <section className="border-y border-hairline bg-surface-alt">
      <div className="mx-auto max-w-4xl px-6 py-14 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gold">{kicker}</p>
        <h2 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-ink-muted">{body}</p>
      </div>
    </section>
  );
}
