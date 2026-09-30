import type { VideoSlot } from '@/lib/work';

/**
 * A 30-second vertical spot, shown the way a phone shows it.
 *
 * Plain `<video controls>` on purpose. The browser's own controls are
 * keyboard- and screen-reader-accessible in every engine, and a custom play
 * button would have to re-earn all of that. What the component adds is only
 * policy:
 *
 * - NEVER autoplays. These spots carry a voice and music; sound that starts
 *   on its own is the fastest way to make a visitor leave, and muted autoplay
 *   would throw the voice away. A visitor presses play.
 * - `preload="none"`: nothing but the poster is fetched until they do, so a
 *   page with two films costs two ~40KB posters, not ~5MB of video.
 * - WebM (VP9 + Opus) first, MP4 (H.264 + AAC) as the fallback Safari takes.
 *
 * The spoken lines are also on screen in the cut itself, so the film reads
 * with the sound off; `label` names what it is for a screen reader.
 */
export function AdFilm({ slot, label, caption, className = '' }: {
  slot: VideoSlot;
  label: string;
  caption?: string;
  className?: string;
}) {
  return (
    <figure className={`m-0 ${className}`}>
      <video
        controls
        playsInline
        preload="none"
        poster={slot.poster}
        width={slot.width}
        height={slot.height}
        aria-label={label}
        className="block h-auto w-full rounded-2xl border border-hairline bg-black shadow-lg"
      >
        <source src={slot.webm} type="video/webm" />
        <source src={slot.mp4} type="video/mp4" />
      </video>
      {caption ? <figcaption className="mt-2 text-xs text-ink-muted">{caption}</figcaption> : null}
    </figure>
  );
}
