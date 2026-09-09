import { Link } from '@/i18n/navigation';

export function InsightCard({
  href, category, title, date, minReadLabel,
}: { href: string; category: string; title: string; date?: string; minReadLabel?: string }) {
  const meta = [date, minReadLabel].filter(Boolean).join(' · ');
  return (
    <Link href={href} className="group block rounded-card border border-hairline bg-surface-alt p-6 transition hover:border-primary">
      <p className="label">{category}</p>
      <h3 className="mt-3 text-lg font-bold text-ink group-hover:text-link">{title}</h3>
      {meta && <p className="mt-3 text-xs text-ink-muted">{meta}</p>}
    </Link>
  );
}
