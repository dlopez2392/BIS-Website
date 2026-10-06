import type { IndustryArtifact as Artifact } from '@/lib/industries';

/**
 * The one concrete thing an industry page shows instead of describing:
 * what actually lands on the owner's desk after Sofía takes a call — an
 * intake sheet, a reminder thread, a dispatch note.
 *
 * Rendered as text, never as an image of text, so a screen reader and a
 * search engine read the same sheet a visitor sees. Every name in it is
 * invented and the caption says so, on the same principle as the platform
 * screenshots: an example passed off as a real client's would be a
 * fabricated case study.
 */
export function IndustryArtifact({
  artifact, heading, caption,
}: { artifact: Artifact; heading: string; caption: string }) {
  return (
    <figure className="ind-art m-0" data-industry-artifact>
      <figcaption className="sr-only">{heading}</figcaption>
      <div className="ind-art-sheet">
        <header className="ind-art-head">
          <p className="ind-art-label">{artifact.label}</p>
          <p className="ind-art-meta">{artifact.meta}</p>
        </header>

        {artifact.rows ? (
          <dl className="ind-art-rows">
            {artifact.rows.map((r) => (
              <div key={r.k}>
                <dt>{r.k}</dt>
                <dd>{r.v}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {artifact.thread ? (
          <ol className="ind-art-thread">
            {artifact.thread.map((m, i) => (
              <li key={i} data-who={m.who} lang={m.lang}>{m.text}</li>
            ))}
          </ol>
        ) : null}

        {artifact.quote ? (
          <blockquote className="ind-art-quote">
            <p lang="es">{artifact.quote}</p>
            {artifact.quoteNote ? <footer>{artifact.quoteNote}</footer> : null}
          </blockquote>
        ) : null}

        {artifact.translation ? <p className="ind-art-note">{artifact.translation}</p> : null}
        <p className="ind-art-foot">{artifact.footnote}</p>
      </div>
      <p className="mt-2 text-xs text-ink-muted">{caption}</p>
    </figure>
  );
}
