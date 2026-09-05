import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

/**
 * Each card links to that industry's own page. The whole card is the target,
 * not just the arrow, so it behaves the way a card that looks clickable should.
 */
export function IndustryCard({ label, title, body, href }: { label: string; title: string; body: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-hairline bg-surface-alt p-6 motion-safe:transition hover:border-link hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-accent">{label}</p>
      <h3 className="mt-3 text-xl font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-ink-muted">{body}</p>
      <span aria-hidden="true" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-link">
        <ArrowRight className="h-4 w-4 motion-safe:transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
