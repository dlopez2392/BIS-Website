import Image from 'next/image';
import { Check } from 'lucide-react';
import type { ArtProps } from '@/lib/art';

/**
 * One service group on /services. With a Señal plate (`art`, present only
 * once its file is) the group carries its own band of light: beside the
 * words on a wide screen, a short strip above them on a phone, so the
 * plate never pushes the argument below the fold. Without one it is the
 * text block it always was.
 */
export function ServiceGroup({
  id, title, body, proof, bullets, art,
}: { id: string; title: string; body: string; proof: string; bullets: string[]; art?: ArtProps }) {
  return (
    <div id={id} className="scroll-mt-24 border-t border-hairline py-12">
      <div className={art ? 'grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start md:gap-10' : undefined}>
        {art && (
          <Image
            {...art}
            alt=""
            aria-hidden="true"
            sizes="(min-width: 48rem) 18rem, 100vw"
            className="aspect-[21/9] w-full rounded-xl border border-hairline object-cover md:order-last md:aspect-video"
          />
        )}
        <div>
          <h2 className="text-2xl font-extrabold text-ink">{title}</h2>
          <p className="mt-3 max-w-2xl text-ink-muted">{body}</p>
          <p className="mt-4 max-w-2xl rounded-md bg-surface-alt p-4 text-sm italic text-ink-muted">{proof}</p>
        </div>
      </div>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-ink">
            <Check size={16} className="mt-0.5 shrink-0 text-link" /> {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
