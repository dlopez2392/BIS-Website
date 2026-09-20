import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { ArtProps } from '@/lib/art';

/**
 * A service, as a card. With a Señal plate (`art`, from lib/art.ts — present
 * only once the file is) the card opens on a 16:9 band of light and the icon
 * steps aside; without one it is the icon-and-text card it always was, so the
 * page reads correctly before any art exists and the day it lands.
 */
export function ServiceCard({
  icon: Icon, title, body, href, learnMore, art,
}: { icon: LucideIcon; title: string; body: string; href: string; learnMore: string; art?: ArtProps }) {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface-alt">
      {art && (
        <Image {...art} alt="" aria-hidden="true" sizes="(min-width: 48rem) 22rem, 100vw" className="aspect-video w-full object-cover" />
      )}
      <div className="p-6">
        {!art && <Icon className="text-link" size={28} />}
        <h3 className={art ? 'text-lg font-bold text-ink' : 'mt-4 text-lg font-bold text-ink'}>{title}</h3>
        <p className="mt-2 text-sm text-ink-muted">{body}</p>
        <Link href={href} className="mt-4 inline-block text-sm font-bold text-link">{learnMore} &gt;</Link>
      </div>
    </div>
  );
}
