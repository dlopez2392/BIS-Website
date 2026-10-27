'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';
import { Link } from '@/i18n/navigation';

/**
 * A link toward a conversion that says, in Vercel Analytics, where it was
 * pressed: `cta_click` with what it was (`cta`), the service it belongs to
 * when it has one, and the page. The booking itself is counted separately
 * (`assessment_booked`, PlatformEmbed); this is the step before it, so a page
 * that sends people toward booking can be told from one that does not.
 */
export function TrackedLink({
  href, cta, service, className, children,
}: {
  href: string;
  cta: 'assessment' | 'service' | 'first_step';
  service?: string;
  className?: string;
  children: ReactNode;
}) {
  const path = usePathname();
  return (
    <Link
      href={href}
      className={className}
      onClick={() => track('cta_click', service ? { cta, service, path } : { cta, path })}
    >
      {children}
    </Link>
  );
}
