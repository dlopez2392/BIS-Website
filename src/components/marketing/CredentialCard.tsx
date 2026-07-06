export function CredentialCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-alt p-5">
      <h3 className="font-bold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{body}</p>
    </div>
  );
}
