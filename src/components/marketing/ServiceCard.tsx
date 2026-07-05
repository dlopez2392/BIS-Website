import type { LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';

export function ServiceCard({
  icon: Icon, title, body, href, learnMore,
}: { icon: LucideIcon; title: string; body: string; href: string; learnMore: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-alt p-6">
      <Icon className="text-primary" size={28} />
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm text-ink-muted">{body}</p>
      <Link href={href} className="mt-4 inline-block text-sm font-bold text-primary">{learnMore} &gt;</Link>
    </div>
  );
}
