import type { CSSProperties } from 'react';
import type { IndustryId } from '@/lib/industries';
import { ScenePlayer } from './ScenePlayer';

export type IndustryKind = IndustryId;

/**
 * A short looping 3D scene for one industry card on /industries, from the same
 * kit as the service scenes (ServiceScene.tsx, globals.css "Service scenes"):
 * the page's violet and cyan on a lit dark stage, transform and opacity only,
 * still under reduced motion, stopped off screen. The Señal plates these
 * replace were light with no subject; each of these is the trade's own
 * object, so a reader finds their industry before reading its label:
 *
 * - legal:       a set of scales tips one way, then the other, and settles.
 * - medical:     a solid cross turns in front of a heartbeat trace.
 * - logistics:   crates ride a road from the yard to a pin.
 * - trades:      two gears mesh.
 * - agriculture: rows of a crop come up in a wave under a sun.
 *
 * `band` (the default) draws the scene as a card's 16:9 header, edge to edge;
 * without it, the scene is a framed object, as on the industry's own page.
 */
export function IndustryScene({ kind, band = true }: { kind: IndustryKind; band?: boolean }) {
  return (
    <ScenePlayer kind={kind} band={band}>
      <div className="scene-floor" />
      {kind === 'legal' ? <Legal />
        : kind === 'medical' ? <Medical />
        : kind === 'logistics' ? <Logistics />
        : kind === 'trades' ? <Trades />
        : <Agriculture />}
    </ScenePlayer>
  );
}

const v = (vars: Record<string, string | number>) => vars as CSSProperties;

function Legal() {
  return (
    <div className="scene-stage in-legal">
      <span className="in-legal-base" />
      <span className="in-legal-post" />
      <span className="in-legal-post in-legal-post-x" />
      <span className="in-legal-finial" />
      <div className="in-legal-beam">
        <div className="in-legal-pan in-legal-pan-l">
          <i className="in-legal-cord" />
          <i className="in-legal-dish" />
          <i className="in-legal-doc" />
        </div>
        <div className="in-legal-pan in-legal-pan-r">
          <i className="in-legal-cord" />
          <i className="in-legal-dish" />
          <i className="in-legal-coin" />
        </div>
      </div>
    </div>
  );
}

const CROSS = 'M38 8 H62 V38 H92 V62 H62 V92 H38 V62 H8 V38 H38 Z';
const TRACE = 'M0 40 H70 L82 40 L90 18 L100 66 L110 8 L120 52 L128 40 H260';
const LAYERS = Array.from({ length: 8 }, (_, i) => i);

function Medical() {
  return (
    <div className="scene-stage in-med">
      <svg viewBox="0 0 260 80" className="in-med-trace" preserveAspectRatio="none">
        <path pathLength={100} className="in-med-glow" d={TRACE} />
        <path pathLength={100} d={TRACE} />
      </svg>
      <span className="in-med-pulse" />
      <div className="in-med-cross">
        {LAYERS.map((i) => (
          <svg key={i} viewBox="0 0 100 100" className="in-med-layer" style={v({ '--i': i })}><path d={CROSS} /></svg>
        ))}
        <svg viewBox="0 0 100 100" className="in-med-face">
          <defs>
            <linearGradient id="in-med-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgb(124 58 237)" />
              <stop offset="1" stopColor="rgb(34 211 238)" />
            </linearGradient>
          </defs>
          <path d={CROSS} fill="url(#in-med-g)" />
          <path d={CROSS} className="in-med-rim" />
        </svg>
      </div>
    </div>
  );
}

/** A box on the floor plane: `--w` by `--d`, `--h` tall, in `--u`. */
function Box({ className, style }: { className: string; style?: CSSProperties }) {
  return (
    <div className={`in-box ${className}`} style={style}>
      <i className="bx-top" /><i className="bx-n" /><i className="bx-s" /><i className="bx-e" /><i className="bx-w" />
    </div>
  );
}

function Logistics() {
  return (
    <div className="scene-stage in-log">
      <span className="in-log-road" />
      <Box className="in-log-yard" style={v({ '--w': 54, '--d': 40, '--h': 26 })} />
      {[0, 1, 2].map((i) => (
        <Box key={i} className="in-log-crate" style={v({ '--w': 22, '--d': 22, '--h': 20, '--i': i })} />
      ))}
      <span className="in-log-ring" />
      <span className="in-log-pin" />
    </div>
  );
}

/** A gear's outline, centred on 50,50, with a hole: teeth `n`, radii in px. */
function gearPath(n: number, outer: number, root: number, hole: number): string {
  const step = (Math.PI * 2) / n;
  const pt = (a: number, r: number) => `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = i * step;
    pts.push(pt(a - step * 0.3, root), pt(a - step * 0.16, outer), pt(a + step * 0.16, outer), pt(a + step * 0.3, root));
  }
  return `M${pts.join(' L')} Z M${50 + hole} 50 A${hole} ${hole} 0 1 0 ${50 - hole} 50 A${hole} ${hole} 0 1 0 ${50 + hole} 50 Z`;
}

const BIG = gearPath(12, 48, 39, 12);
const SMALL = gearPath(8, 48, 36, 14);
const GEAR_LAYERS = Array.from({ length: 6 }, (_, i) => i);

function Gear({ path, className }: { path: string; className: string }) {
  return (
    <div className={`in-gear ${className}`}>
      <div className="in-gear-spin">
        {GEAR_LAYERS.map((i) => (
          <svg key={i} viewBox="0 0 100 100" className="in-gear-layer" style={v({ '--i': i })}>
            <path d={path} fillRule="evenodd" />
          </svg>
        ))}
      </div>
    </div>
  );
}

function Trades() {
  return (
    <div className="scene-stage in-trades">
      <Gear path={BIG} className="in-gear-big" />
      <Gear path={SMALL} className="in-gear-small" />
    </div>
  );
}

const ROWS = [0, 1, 2, 3];
const COLS = [0, 1, 2, 3, 4, 5];

function Agriculture() {
  return (
    <>
      <span className="in-ag-sun" />
      <div className="scene-stage in-ag">
        <span className="in-ag-field" />
        {ROWS.map((r) => COLS.map((c) => (
          <span key={`${r}-${c}`} className="in-ag-plant" style={v({ '--r': r, '--c': c })}>
            <i className="in-ag-stem" /><i className="in-ag-leaf" /><i className="in-ag-leaf in-ag-leaf-r" />
          </span>
        )))}
      </div>
    </>
  );
}
