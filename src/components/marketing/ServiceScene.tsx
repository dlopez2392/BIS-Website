import { ScenePlayer } from './ScenePlayer';

export type SceneKind = 'ai' | 'infra' | 'web';

/**
 * A short looping 3D scene for one service on /services, drawn in CSS (see
 * globals.css "Service scenes"), in place of the Señal plate the section used
 * to carry. The plates were mood; these say what the service does:
 *
 * - ai:    paperwork rides a line through a spinning gate and comes out done.
 * - infra: a solid shield turns while a scan ring sweeps it and the devices
 *          it protects orbit beneath.
 * - web:   a site's layers lift apart and settle back into one page, and its
 *          call button lights once the page is whole.
 *
 * Built from the page's own violet and cyan rather than rendered as video, so
 * there is nothing to download, nothing to re-render when the accent moves,
 * and it is sharp at any size. Decorative: what the section says, it says in
 * text, so the scene is hidden from assistive technology. It holds a still,
 * composed pose under `prefers-reduced-motion`, and stops while off screen.
 */
export function ServiceScene({ kind }: { kind: SceneKind }) {
  return (
    <ScenePlayer kind={kind}>
      <div className="scene-floor" />
      {kind === 'ai' ? <AiScene /> : kind === 'infra' ? <InfraScene /> : <WebScene />}
    </ScenePlayer>
  );
}

const DOCS = [0, 1, 2, 3, 4];

function AiScene() {
  return (
    <div className="scene-stage sc-ai">
      <div className="sc-ai-track" />
      <div className="sc-ai-gate">
        <span className="sc-ai-ring" />
        <span className="sc-ai-ring sc-ai-ring-inner" />
        <span className="sc-ai-core" />
      </div>
      {DOCS.map((i) => (
        <div key={i} className="sc-ai-doc" style={{ ['--i' as string]: i }}>
          <span className="sc-ai-line" />
          <span className="sc-ai-line" />
          <span className="sc-ai-line sc-ai-line-short" />
          <span className="sc-ai-check">
            <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </span>
        </div>
      ))}
    </div>
  );
}

const SHIELD = 'M50 4 L90 18 V50 C90 76 72 92 50 100 C28 92 10 76 10 50 V18 Z';
const LAYERS = Array.from({ length: 9 }, (_, i) => i);
const DEVICES = [0, 1, 2, 3, 4, 5];

function InfraScene() {
  return (
    <div className="scene-stage sc-infra">
      <div className="sc-infra-orbit">
        {DEVICES.map((i) => (
          <span key={i} className="sc-infra-device" style={{ ['--i' as string]: i }} />
        ))}
      </div>
      <div className="sc-infra-shield">
        <span className="sc-infra-glow" />
        {LAYERS.map((i) => (
          <svg key={i} viewBox="0 0 100 104" className="sc-infra-layer" style={{ ['--i' as string]: i }}>
            <path d={SHIELD} />
          </svg>
        ))}
        <svg viewBox="0 0 100 104" className="sc-infra-face">
          <defs>
            <linearGradient id="sc-infra-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgb(124 58 237)" />
              <stop offset="1" stopColor="rgb(34 211 238)" />
            </linearGradient>
          </defs>
          <path d={SHIELD} fill="url(#sc-infra-g)" />
          <path d={SHIELD} className="sc-infra-rim" />
          <rect x="37" y="48" width="26" height="22" rx="4" className="sc-infra-lock" />
          <path d="M42 48 V40 a8 8 0 0 1 16 0 V48" className="sc-infra-shackle" />
        </svg>
      </div>
      <div className="sc-infra-scan" />
    </div>
  );
}

function WebScene() {
  return (
    <div className="scene-stage sc-web">
      <div className="sc-web-stack">
        <div className="sc-web-layer sc-web-frame" style={{ ['--z' as string]: 0 }}>
          <span className="sc-web-bar"><i /><i /><i /></span>
        </div>
        <div className="sc-web-layer sc-web-hero" style={{ ['--z' as string]: 1 }} />
        <div className="sc-web-layer sc-web-text" style={{ ['--z' as string]: 2 }}>
          <span /><span /><span className="sc-web-short" />
        </div>
        <div className="sc-web-layer sc-web-cards" style={{ ['--z' as string]: 3 }}>
          <span /><span /><span />
        </div>
        <div className="sc-web-layer sc-web-cta" style={{ ['--z' as string]: 4 }}>
          <span className="sc-web-button" />
        </div>
      </div>
    </div>
  );
}
