import Image from 'next/image';
import type { ReactNode } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { ArtProps } from '@/lib/art';

/**
 * One service on /services, written for the owner who signs the cheque, not
 * the technician: who it is for ("You need this if"), what they receive
 * ("What you get"), the proof at full strength, a free first step that
 * costs them nothing, and a way to start the conversation about THIS
 * service. The product names a technician looks for are still here, as small
 * chips under the deliverables, rather than being the deliverables.
 *
 * The aside carries the proof and the next steps beside the argument on a
 * wide screen and under it on a phone, so the page's strongest sentence is
 * never the smallest, greyest one on it (the old layout set it in italics
 * on a muted box). `visual` replaces the Señal plate where a section has
 * something real to show instead (the platform's phone).
 *
 * The per-service link is deliberately the bordered secondary style, not the
 * solid button: on this site solid means "book an assessment", and the page
 * header already carries that one.
 */
export function ServiceSection({
  id, index, icon, title, outcome, body, needIfLabel, needIf, getLabel, get, toolsLabel, tools,
  proofLabel, proof, firstStepLabel, firstStep, cta, art, visual, children,
}: {
  id: string;
  index: number;
  icon: ReactNode;
  title: string;
  outcome: string;
  body: string;
  needIfLabel: string;
  needIf: string[];
  getLabel: string;
  get: string[];
  toolsLabel?: string;
  tools?: string[];
  proofLabel: string;
  proof: string;
  firstStepLabel: string;
  firstStep: { href: string; label: string };
  cta: { href: string; label: string };
  art?: ArtProps;
  visual?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24 border-t border-hairline py-16" data-service={id}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-accent">
            <span aria-hidden="true" className="inline-flex size-8 items-center justify-center rounded-lg border border-hairline bg-surface-alt text-link">
              {icon}
            </span>
            <span className="tabular-nums">{String(index).padStart(2, '0')}</span>
          </p>
          <h2 id={`${id}-h`} className="mt-4 text-3xl font-extrabold tracking-tight text-ink">{title}</h2>
          <p className="mt-2 text-lg font-semibold text-ink">{outcome}</p>
          <p className="mt-3 max-w-2xl text-ink-muted">{body}</p>

          <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="rounded-xl border border-hairline bg-surface-alt p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">{needIfLabel}</h3>
              <ul className="mt-3 space-y-3">
                {needIf.map((n) => (
                  <li key={n} className="flex gap-3 text-sm text-ink">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-ink-muted">{getLabel}</h3>
              <ul className="mt-3 space-y-2.5">
                {get.map((g) => (
                  <li key={g} className="flex gap-2.5 text-sm text-ink">
                    <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-link" />
                    {g}
                  </li>
                ))}
              </ul>
              {tools && tools.length > 0 && toolsLabel ? (
                <div className="mt-5">
                  <p id={`${id}-tools`} className="text-xs text-ink-muted">{toolsLabel}</p>
                  <ul aria-labelledby={`${id}-tools`} className="mt-2 flex flex-wrap gap-1.5">
                    {tools.map((t) => (
                      <li key={t} className="rounded-full border border-hairline px-2.5 py-1 text-xs text-ink-muted">{t}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          {visual ?? (art ? (
            <Image
              {...art}
              alt=""
              aria-hidden="true"
              sizes="(min-width: 64rem) 20rem, 100vw"
              className="hidden aspect-video w-full rounded-xl border border-hairline object-cover lg:block"
            />
          ) : null)}
          <figure className="m-0 rounded-xl border border-hairline bg-surface-alt p-5" data-service-proof>
            <p className="text-xs font-bold uppercase tracking-widest text-accent">{proofLabel}</p>
            <blockquote className="mt-2 border-l-2 border-accent pl-3 text-base font-semibold leading-snug text-ink">
              {proof}
            </blockquote>
          </figure>
          <Link
            href={firstStep.href}
            className="group flex items-center justify-between gap-3 rounded-xl border border-hairline p-4 hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            <span>
              <span className="block text-xs font-bold uppercase tracking-widest text-ink-muted">{firstStepLabel}</span>
              <span className="mt-1 block text-sm font-semibold text-ink">{firstStep.label}</span>
            </span>
            <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-link motion-safe:transition group-hover:translate-x-0.5" />
          </Link>
          <Link
            href={cta.href}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-hairline px-5 py-3 font-bold text-ink hover:bg-surface-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            {cta.label} <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </div>
      {children}
    </section>
  );
}
