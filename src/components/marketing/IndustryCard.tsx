import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { ArtProps } from '@/lib/art';

/**
 * Each card links to that industry's own page. The whole card is the target,
 * not just the arrow, so it behaves the way a card that looks clickable should.
 * With a Señal plate (`art`, present only once its file is) the card opens on
 * a 16:9 band of light; without one it is the text card it always was.
 */
export function IndustryCard({
  label, title, body, href, art,
}: { label: string; title: string; body: string; href: string; art?: ArtProps }) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-hairline bg-surface-alt motion-safe:transition hover:border-link hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
    >
      {art && (
        <Image {...art} alt="" aria-hidden="true" sizes="(min-width: 48rem) 22rem, 100vw" className="aspect-video w-full object-cover" />
      )}
      <span className="flex flex-1 flex-col p-6">
        <span className="text-xs font-bold uppercase tracking-widest text-accent">{label}</span>
        <span className="mt-3 text-xl font-bold text-ink">{title}</span>
        <span className="mt-2 text-sm text-ink-muted">{body}</span>
        <span aria-hidden="true" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-link">
          <ArrowRight className="h-4 w-4 motion-safe:transition group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}
