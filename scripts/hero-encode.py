#!/usr/bin/env python3
"""
Encode the hero backdrop, with the brand tint BAKED IN.

    python3 scripts/hero-encode.py <source video> <version>
    # -> public/hero/bis-hero.<version>.webm and .mp4

Needs `pip install imageio-ffmpeg numpy` (imageio-ffmpeg ships a static ffmpeg
with libvpx-vp9 and libx264, so nothing has to be installed system-wide).

WHY THE TINT IS BAKED. The site used to lay its violet -> cyan ramp over
greyscale footage in CSS (`.hero-tint`, `mix-blend-mode: color`), plus a
soft-light grain layer on top. Both are full-screen blends that the GPU has to
redo for EVERY video frame, and on a machine without a hardware video overlay
(older laptops, most integrated graphics under a browser's software path)
that is where the hero's frame rate went: measured at ~19 fps with 63 of 130
video frames dropped, against ~55 fps and 14 dropped with the two layers off.
Applying the same blend here, once, at encode time, gives the identical
picture for the price of a plain video.

The blend is the W3C `color` mode exactly as browsers implement it — the
tint's hue and saturation with the footage's luminance (SetLum with
ClipColor) — at the CSS layer's 0.85 opacity, and the gradient is CSS's own
118deg geometry with the same four stops. Interpolation is in sRGB, as CSS
gradients are by default.

Silver footage in, brand footage out: that is why `npm run higgsfield`'s
default prompt asks for colourless footage.
"""
import subprocess
import sys
from pathlib import Path

import numpy as np
from imageio_ffmpeg import get_ffmpeg_exe

FFMPEG = get_ffmpeg_exe()

# `.hero-tint`, as it was: linear-gradient(118deg, #7c3aed 0%, #6d4bd8 38%, #3a7fb0 68%, #22d3ee 100%)
ANGLE_DEG = 118
STOPS = [(0.00, (0x7C, 0x3A, 0xED)), (0.38, (0x6D, 0x4B, 0xD8)), (0.68, (0x3A, 0x7F, 0xB0)), (1.00, (0x22, 0xD3, 0xEE))]
TINT_OPACITY = 0.85


def probe(src: Path) -> tuple[int, int, str]:
    out = subprocess.run([FFMPEG, "-hide_banner", "-i", str(src)], capture_output=True, text=True).stderr
    for line in out.splitlines():
        if "Video:" in line:
            import re
            m = re.search(r"(\d{3,5})x(\d{3,5})", line)
            fps = re.search(r"([\d.]+) fps", line)
            return int(m.group(1)), int(m.group(2)), fps.group(1)
    raise SystemExit(f"could not read the video stream of {src}")


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


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    src, version = Path(sys.argv[1]), sys.argv[2]
    w, h, fps = probe(src)
    out_dir = Path("public/hero")
    webm, mp4 = out_dir / f"bis-hero.{version}.webm", out_dir / f"bis-hero.{version}.mp4"
    if webm.exists() or mp4.exists():
        raise SystemExit(f"{webm} or {mp4} exists. /hero/ is cached immutably for a year: bump the version, never overwrite.")

    tint = css_gradient(w, h)
    frame_bytes = w * h * 3

    decode = subprocess.Popen(
        [FFMPEG, "-v", "error", "-i", str(src), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE,
    )
    encode = subprocess.Popen(
        [
            FFMPEG, "-v", "error", "-y",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", fps, "-i", "-",
            # VP9: the footage is soft, so a high CRF holds up; row-mt keeps it from taking all afternoon.
            "-map", "0", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "42", "-deadline", "good", "-cpu-used", "2",
            "-row-mt", "1", "-pix_fmt", "yuv420p", "-an", str(webm),
            # H.264 High 4.1, fast-start, for the browsers that will not say they can play VP9.
            "-map", "0", "-c:v", "libx264", "-crf", "30", "-preset", "slow", "-profile:v", "high", "-level", "4.1",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(mp4),
        ],
        stdin=subprocess.PIPE,
    )
    assert decode.stdout and encode.stdin
    n = 0
    while True:
        raw = decode.stdout.read(frame_bytes)
        if len(raw) < frame_bytes:
            break
        frame = np.frombuffer(raw, dtype=np.uint8).reshape(h, w, 3).astype(np.float32) / 255
        blended = blend_color(frame, tint)
        out = (1 - TINT_OPACITY) * frame + TINT_OPACITY * blended
        encode.stdin.write((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8).tobytes())
        n += 1
    encode.stdin.close()
    decode.wait()
    if encode.wait() != 0:
        raise SystemExit("ffmpeg failed")
    for f in (webm, mp4):
        print(f"{f}  {f.stat().st_size / 1024:.0f} KB")
    print(f"{n} frames at {fps} fps, {w}x{h}, tint baked at {TINT_OPACITY:.2f}")


if __name__ == "__main__":
    main()
