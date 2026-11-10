'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { ExampleStatus } from '@/lib/home/examples';
import type { FocusId } from '@/lib/home/focus';

export interface ExampleCard {
  id: string; area: FocusId; areaLabel: string;
  status: ExampleStatus; statusLabel: string;
  title: string; body: string; link: string; alt: string;
  src: string; width: number; height: number; href: string; external?: boolean;
}

/**
 * The work, as cards a visitor can open, with a filter by area.
 *
 * Every card says what it is with a dot and a word (live, demo or concept):
 * a concept drawn with sample data sits beside a client's live site, and the
 * reader must never have to guess which is which.
 */
export function WorkExamples({ items, areas, labels }: {
  items: ExampleCard[];
  areas: { id: FocusId; label: string }[];
  labels: { filter: string; all: string; newTab: string };
}) {
  const [area, setArea] = useState<FocusId | 'all'>('all');
  const shown = area === 'all' ? items : items.filter((x) => x.area === area);

  return (
    <>
      <div className="hm-filter" role="group" aria-label={labels.filter}>
        <button type="button" aria-pressed={area === 'all'} onClick={() => setArea('all')}>{labels.all}</button>
        {areas.map((a) => (
          <button key={a.id} type="button" aria-pressed={area === a.id} onClick={() => setArea(a.id)}>{a.label}</button>
        ))}
      </div>
      <ul className="hm-work" data-work-examples>
        {shown.map((x) => {
          const inner = (
            <>
              {x.link} <span aria-hidden="true">{x.external ? '↗' : '→'}</span>
              {x.external ? <span className="sr-only"> ({labels.newTab})</span> : null}
            </>
          );
          return (
            <li key={x.id} className="hm-ex" data-example={x.id} data-status={x.status}>
              <div className="hm-ex-img">
                <Image src={x.src} alt={x.alt} width={x.width} height={x.height} sizes="(min-width: 960px) 24rem, (min-width: 620px) 50vw, 100vw" />
              </div>
              <div className="hm-ex-body">
                <div className="hm-ex-meta">
                  <span className="hm-k">{x.areaLabel}</span>
                  <span className="hm-stat"><i aria-hidden="true" />{x.statusLabel}</span>
                </div>
                <h3>{x.title}</h3>
                <p>{x.body}</p>
                {x.external
                  ? <a href={x.href} target="_blank" rel="noopener" className="hm-more">{inner}</a>
                  : <Link href={x.href} className="hm-more">{inner}</Link>}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
