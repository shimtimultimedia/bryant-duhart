"""
build_portraits.py — turn transparent portrait PNGs into the aligned WebP frames that
crossfade behind the site (images/portraits/portrait-N.webp).

The site pins the portrait to the bottom-left of the screen (css/base.css #portrait-bg),
so where the head sits inside each 1920x1080 frame decides where Bryant appears next to
the plaque. Each source is shifted horizontally so its head centre lands on HEAD_CENTRE_X,
the position the layout was designed around. Frames keep full alpha and are saved as
lossy WebP (visually identical, about a ninth of the PNG size).

Usage (from the project root or build/):
    python build/build_portraits.py <folder with 1.png, 2.png, ...>

After running, bump ASSET_VERSION in update_site_refs.py and js/include.js, run
update_site_refs.py, and set PORTRAIT_COUNT in js/include.js if the number changed.
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "images" / "portraits"
HEAD_CENTRE_X = 607      # head centre of the original single portrait the layout was tuned to
HEAD_BAND_PX = 260       # rows from the top of the subject used to find the head
ALPHA_SOLID = 64         # alpha above this counts as subject


def head_centre(image: Image.Image) -> int:
    alpha = image.getchannel("A").point(lambda v: 255 if v > ALPHA_SOLID else 0)
    top = alpha.getbbox()[1]
    band = alpha.crop((0, top, alpha.width, top + HEAD_BAND_PX))
    xs = [x for y in range(band.height) for x in range(band.width) if band.getpixel((x, y))]
    return round(sum(xs) / len(xs))


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    sources = sorted(Path(sys.argv[1]).glob("*.png"), key=lambda p: (len(p.stem), p.stem))
    if not sources:
        sys.exit(f"No .png files in {sys.argv[1]}")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for number, source in enumerate(sources, start=1):
        image = Image.open(source).convert("RGBA")
        shift = HEAD_CENTRE_X - head_centre(image)
        frame = Image.new("RGBA", image.size, (0, 0, 0, 0))
        frame.alpha_composite(image, dest=(max(shift, 0), 0), source=(max(-shift, 0), 0))
        target = OUT_DIR / f"portrait-{number}.webp"
        frame.save(target, "WEBP", quality=88, method=6, alpha_quality=100)
        print(f"{source.name} -> {target.relative_to(ROOT)} (shifted {shift:+d}px, {target.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
