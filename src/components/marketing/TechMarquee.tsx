import { getTranslations } from 'next-intl/server';
import { techLogos, type TechLogo } from '@/lib/tech/logos';

function TechLogoMark({ logo, duplicate = false }: { logo: TechLogo; duplicate?: boolean }) {
  return (
    <span
      role={duplicate ? undefined : 'img'}
      aria-label={duplicate ? undefined : logo.name}
      aria-hidden={duplicate || undefined}
      className="marquee__logo h-12 w-32 shrink-0 bg-ink-muted transition-colors duration-200 hover:bg-ink"
      style={{
        WebkitMaskImage: `url(/logos/${logo.file}.svg)`,
        maskImage: `url(/logos/${logo.file}.svg)`,
      }}
    />
  );
}

export function TechMarqueeView({ label, logos }: { label: string; logos: TechLogo[] }) {
  return (
    <section aria-label={label} className="border-y border-hairline bg-surface-alt py-10">
      <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-ink-muted">{label}</p>
      <div className="marquee group relative overflow-hidden">
        <div className="marquee__track flex w-max items-center gap-16 group-hover:[animation-play-state:paused]">
          {logos.map((l) => (
            <TechLogoMark key={l.file} logo={l} />
          ))}
          {logos.map((l) => (
            <TechLogoMark key={`dup-${l.file}`} logo={l} duplicate />
          ))}
        </div>
      </div>
    </section>
  );
}

export async function TechMarquee({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'techMarquee' });
  return <TechMarqueeView label={t('label')} logos={techLogos} />;
}
