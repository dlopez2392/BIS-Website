"""
The brand tint, once, for every generated asset.

`hero-encode.py` (video) and `art-tint.py` (stills) both import from here, so
the footage behind the headline and the plate on a service card can never
drift apart: one angle, one set of stops, one opacity, one blend.

Assets are GENERATED GREYSCALE and tinted here on purpose. A model cannot hit
#7c3aed on request; it can hit silver. Luminance is the only thing worth
asking it for, and the ramp is applied by arithmetic. The day the accent
moves, this file changes and every asset is re-run — nothing is regenerated.
"""
import numpy as np

# `.hero-tint`, as it was in CSS: linear-gradient(118deg, #7c3aed 0%, #6d4bd8 38%, #3a7fb0 68%, #22d3ee 100%)
ANGLE_DEG = 118
STOPS = [(0.00, (0x7C, 0x3A, 0xED)), (0.38, (0x6D, 0x4B, 0xD8)), (0.68, (0x3A, 0x7F, 0xB0)), (1.00, (0x22, 0xD3, 0xEE))]
TINT_OPACITY = 0.85
# The site's dark surface (`--color-surface` in dark mode). A still is
# composited over it so the darkest pixel a card ships IS the page behind it,
# and a plate on a dark page has no seam. Video keeps pure black: `.hero`
# declares this colour under the footage itself.
GROUND = (0x0B, 0x0A, 0x18)


def css_gradient(w: int, h: int) -> np.ndarray:
    """The tint as an (h, w, 3) float image in 0..1, CSS angle semantics."""
    a = np.deg2rad(ANGLE_DEG)
    dx, dy = np.sin(a), -np.cos(a)          # 0deg points up; y grows downward on screen
    length = w * abs(np.sin(a)) + h * abs(np.cos(a))
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    t = 0.5 + ((xs + 0.5 - w / 2) * dx + (ys + 0.5 - h / 2) * dy) / length
    t = np.clip(t, 0, 1)
    pos = np.array([s[0] for s in STOPS], dtype=np.float32)
    cols = np.array([s[1] for s in STOPS], dtype=np.float32) / 255
    out = np.empty((h, w, 3), dtype=np.float32)
    for c in range(3):
        out[..., c] = np.interp(t, pos, cols[:, c])
    return out


def lum(c: np.ndarray) -> np.ndarray:
    return 0.3 * c[..., 0] + 0.59 * c[..., 1] + 0.11 * c[..., 2]


def clip_color(c: np.ndarray) -> np.ndarray:
    l = lum(c)[..., None]
    n = c.min(axis=-1, keepdims=True)
    x = c.max(axis=-1, keepdims=True)
    c = np.where(n < 0, l + (c - l) * l / np.maximum(l - n, 1e-6), c)
    c = np.where(x > 1, l + (c - l) * (1 - l) / np.maximum(x - l, 1e-6), c)
    return c


def blend_color(backdrop: np.ndarray, source: np.ndarray) -> np.ndarray:
    """W3C `color`: the source's hue and saturation at the backdrop's luminance."""
    d = (lum(backdrop) - lum(source))[..., None]
    return clip_color(source + d)


def tint(frame: np.ndarray, gradient: np.ndarray) -> np.ndarray:
    """One frame (h, w, 3) in 0..1 -> the same frame wearing the brand."""
    blended = blend_color(frame, gradient)
    return np.clip((1 - TINT_OPACITY) * frame + TINT_OPACITY * blended, 0, 1)


def over_ground(frame: np.ndarray, alpha: float = 1.0) -> np.ndarray:
    """Composite a tinted frame over the site's dark surface."""
    g = np.array(GROUND, dtype=np.float32)[None, None, :] / 255
    return np.clip(alpha * frame + (1 - alpha) * g, 0, 1)
