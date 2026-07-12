export function MethodStep({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="border-t border-hairline py-6">
      <p className="text-sm font-bold text-accent">{index}</p>
      <h3 className="mt-1 text-xl font-bold text-ink">{title}</h3>
      <p className="mt-2 text-ink-muted">{body}</p>
    </div>
  );
}
