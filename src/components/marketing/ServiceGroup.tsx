import { Check } from 'lucide-react';

export function ServiceGroup({
  title, body, proof, bullets,
}: { title: string; body: string; proof: string; bullets: string[] }) {
  return (
    <div className="border-t border-hairline py-12">
      <h2 className="text-2xl font-extrabold text-ink">{title}</h2>
      <p className="mt-3 max-w-2xl text-ink-muted">{body}</p>
      <p className="mt-4 max-w-2xl rounded-md bg-surface-alt p-4 text-sm italic text-ink-muted">{proof}</p>
      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-ink">
            <Check size={16} className="mt-0.5 shrink-0 text-primary" /> {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
