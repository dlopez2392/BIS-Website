import { Link } from '@/i18n/navigation';

export function ResourceCTA({ kicker, title, body, button, href }: { kicker: string; title: string; body: string; button: string; href: string }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="rounded-2xl border border-hairline bg-surface-alt p-10 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-accent">{kicker}</p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-ink-muted">{body}</p>
        <Link href={href} className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 font-bold text-on-primary">{button}</Link>
      </div>
    </section>
  );
}
