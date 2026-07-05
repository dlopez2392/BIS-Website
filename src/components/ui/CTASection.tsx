import { Link } from '@/i18n/navigation';

export function CTASection({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <section className="bg-primary text-on-primary">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl opacity-90">{body}</p>
        <Link href="/contact" className="mt-8 inline-block rounded-md bg-on-primary px-6 py-3 font-bold text-primary hover:opacity-90">
          {cta} &gt;
        </Link>
      </div>
    </section>
  );
}
