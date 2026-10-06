import { describe, it, expect } from 'vitest';
import { framePose } from '../tour-pose';

const WIDE = 2560 / 1600; // the 16:10 captures
const TALL = 1280 / 1600; // the 4:5 booking page and report

describe('framePose — where the /platform story frame points', () => {
  it('scale 1 never pans: the whole capture, unmoved', () => {
    expect(framePose({ x: 90, y: 10, scale: 1 }, WIDE).transform).toBe('translate(0%, 0%) scale(1)');
  });

  it('a centred focus zooms in place', () => {
    const pose = framePose({ x: 50, y: 50, scale: 1.5 }, WIDE);
    expect(pose.transform).toBe('translate(0%, 0%) scale(1.5)');
    expect(pose.transformOrigin).toBe('50% 50%');
  });

  it('pans an off-centre focus toward the middle', () => {
    // At 2x about (40, 50) the edges sit at -40 and 160; centring needs +10,
    // which keeps the left edge at -30 — still outside the frame.
    expect(framePose({ x: 40, y: 50, scale: 2 }, WIDE).transform).toBe('translate(10%, 0%) scale(2)');
  });

  it('never pans an edge into view, however far the focus is from centre', () => {
    // At 1.5x about (90, 10), centring would need -40 / +40; the edges only
    // allow -5 / +5. Any more and the frame shows the ground behind the shot.
    expect(framePose({ x: 90, y: 10, scale: 1.5 }, WIDE).transform).toBe('translate(-5%, 5%) scale(1.5)');
  });

  it('maps a tall capture\'s focus into the column it occupies', () => {
    // A 4:5 image in a 16:10 frame is half the frame wide, centred: image
    // x=0 is frame x=25 and image x=100 is frame x=75.
    expect(framePose({ x: 0, y: 50, scale: 1 }, TALL).transformOrigin).toBe('25% 50%');
    expect(framePose({ x: 100, y: 50, scale: 1 }, TALL).transformOrigin).toBe('75% 50%');
  });

  it('treats a scale below 1 as 1 — the frame never shrinks a capture', () => {
    expect(framePose({ x: 50, y: 50, scale: 0.5 }, WIDE).transform).toBe('translate(0%, 0%) scale(1)');
  });
});
