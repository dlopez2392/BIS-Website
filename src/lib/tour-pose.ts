/**
 * Where the /platform story frame points its camera.
 *
 * Each tour step names a FOCUS in its own screenshot — the point the words
 * beside it are about, in percent of the image, and how far to zoom in on
 * it. This turns that into the CSS transform for one layer of the frame.
 *
 * Pure, and separate from `platform-tour.ts`, because that module reads the
 * disk (`hasShot`) and so can never be imported by the client component
 * that applies these transforms.
 */
export interface Focus {
  /** Horizontal centre of interest, 0–100, percent of the IMAGE's width. */
  x: number;
  /** Vertical centre of interest, 0–100, percent of the IMAGE's height. */
  y: number;
  /** 1 shows the whole capture; 1.6 fills the frame with 1/1.6 of it. */
  scale: number;
}

/** The frame's own shape. The wide captures are 16:10, so they fill it. */
export const FRAME_ASPECT = 16 / 10;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number) => Math.round(v * 100) / 100;

/**
 * The transform that brings `focus` as close to the centre of the frame as
 * it can go WITHOUT dragging an edge of the layer into view.
 *
 * The layer is `object-fit: contain`, so a capture taller than the frame
 * (the booking page and the report are 4:5) sits in a centred column of it.
 * The focus is mapped from image percent into frame percent first, and the
 * pan is then clamped against the frame's edges: scaling by `s` about
 * `(x, y)` puts the left edge at `x(1-s)` and the right at `x + s(100-x)`,
 * so a horizontal shift `tx` keeps both outside the frame only while
 * `-(100-x)(s-1) <= tx <= x(s-1)`. Same vertically.
 *
 * Without the clamp, a focus near a corner would pan the capture's own edge
 * into the middle of the frame and show the empty ground behind it.
 */
export function framePose(focus: Focus, imageAspect: number, frameAspect = FRAME_ASPECT) {
  const s = Math.max(1, focus.scale);
  // The image's box inside the frame, in frame percent.
  const w = imageAspect < frameAspect ? (100 * imageAspect) / frameAspect : 100;
  const h = imageAspect < frameAspect ? 100 : (100 * frameAspect) / imageAspect;
  const x = (100 - w) / 2 + (w * clamp(focus.x, 0, 100)) / 100;
  const y = (100 - h) / 2 + (h * clamp(focus.y, 0, 100)) / 100;

  const tx = clamp(50 - x, -(100 - x) * (s - 1), x * (s - 1));
  const ty = clamp(50 - y, -(100 - y) * (s - 1), y * (s - 1));

  return {
    transformOrigin: `${round(x)}% ${round(y)}%`,
    transform: `translate(${round(tx)}%, ${round(ty)}%) scale(${s})`,
  };
}
