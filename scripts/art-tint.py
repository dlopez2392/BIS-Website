#!/usr/bin/env python3
"""
Tint a generated greyscale still and ship it as a site asset.

    python3 scripts/art-tint.py <source image> <name> <version> [--crop WxH] [--jpg]
    # -> public/art/<name>.<version>.webp   (or .jpg with --jpg, for the OG plate)

Needs `pip install imageio-ffmpeg numpy` (the same as hero-encode.py); the
WebP is written by the project's own `sharp`, so nothing else is installed.

The tint is scripts/bis_tint.py — the SAME arithmetic the hero footage wears,
so a plate on a card and the aurora behind the headline are one family by
construction. After the blend the still is composited over the site's dark
surface (#0b0a18), so its darkest pixel is the page it sits on and a plate has
no visible seam in either theme.

`--crop WxH` takes a centre crop at that aspect BEFORE resizing, for the wide
bands (page headers are 3.5:1, the CTA band 3:1) generated at 16:9. The
final width is the crop's width; masters are shipped at the size given and
next/image emits the rest.

The record of what was generated — model, prompt, seed — belongs in
public/art/manifest.json, written by `npm run higgsfield -- --jobs`. Without
it the family cannot be extended or regenerated at another ratio.
"""
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from imageio_ffmpeg import get_ffmpeg_exe

sys.path.insert(0, str(Path(__file__).parent))
from bis_tint import css_gradient, over_ground, tint  # noqa: E402

FFMPEG = get_ffmpeg_exe()


def read_rgb(src: Path) -> np.ndarray:
    """Decode any still ffmpeg understands (png, jpg, webp) to (h, w, 3) uint8."""
    info = subprocess.run([FFMPEG, "-hide_banner", "-i", str(src)], capture_output=True, text=True).stderr
    m = re.search(r"(\d{2,5})x(\d{2,5})", info)
    if not m:
        raise SystemExit(f"could not read the size of {src}")
    w, h = int(m.group(1)), int(m.group(2))
    raw = subprocess.run(
        [FFMPEG, "-v", "error", "-i", str(src), "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.uint8).reshape(h, w, 3)


def centre_crop(img: np.ndarray, cw: int, ch: int) -> np.ndarray:
    h, w = img.shape[:2]
    target = cw / ch
    if w / h > target:
        nw = int(round(h * target)); x0 = (w - nw) // 2
        return img[:, x0:x0 + nw]
    nh = int(round(w / target)); y0 = (h - nh) // 2
    return img[y0:y0 + nh, :]


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--") and "=" not in a and a != "--crop"}
    crop = None
    if "--crop" in sys.argv:
        crop = sys.argv[sys.argv.index("--crop") + 1]
        args = [a for a in args if a != crop]
    if len(args) != 3:
        raise SystemExit(__doc__)
    src, name, version = Path(args[0]), args[1], args[2]
    ext = "jpg" if "--jpg" in flags else "webp"
    out = Path("public/art") / f"{name}.{version}.{ext}"
    if out.exists():
        raise SystemExit(f"{out} exists. /art/ is cached immutably for a year: bump the version, never overwrite.")

    img = read_rgb(src)
    width = None
    if crop:
        cw, ch = (int(v) for v in crop.lower().split("x"))
        img = centre_crop(img, cw, ch)
        width = cw
    frame = img.astype(np.float32) / 255
    h, w = frame.shape[:2]
    result = over_ground(tint(frame, css_gradient(w, h)))
    rgb = (result * 255 + 0.5).astype(np.uint8)

    # sharp is already a project dependency (next/image), so the encode goes
    # through it rather than adding an image library to Python.
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(out.suffix + ".raw")
    tmp.write_bytes(rgb.tobytes())
    encode = "webp({ quality: 72 })" if ext == "webp" else "jpeg({ quality: 78, mozjpeg: true })"
    resize = f".resize({{ width: {width} }})" if width else ""
    node = (
        f"const sharp=require('sharp');sharp(require('fs').readFileSync('{tmp}'),{{raw:{{width:{w},height:{h},channels:3}}}})"
        f"{resize}.{encode}.toFile('{out}').then(i=>console.log(i.width+'x'+i.height, Math.round(i.size/1024)+'KB'))"
    )
    subprocess.run(["node", "-e", node], check=True)
    tmp.unlink()
    print(f"{out}")


if __name__ == "__main__":
    main()
