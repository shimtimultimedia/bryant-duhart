# build/

Source tools that **do not deploy with the site**. Run them locally
when something needs regenerating.

## Files

| File | What it does |
|---|---|
| `build_silhouette_mask.py` | Reads `images/bd_bg.png`, produces `images/bd_bg-mask.png` (alpha mask for inspection) + `images/bd_bg-cutout.webp` (the transparent portrait used as a `<div id="portrait-bg">` background in `css/base.css`). |
| `update_site_refs.py` | Updates cache-busting versions, canonical/OG image URLs, `sitemap.xml`, and `robots.txt` from constants at the top of the script. |

## Running

Both scripts resolve paths from their own location, so they can be run
from the project root or from inside `build/`.

```bash
# from project root
python build/build_silhouette_mask.py
python build/update_site_refs.py

# or from inside build/
python build_silhouette_mask.py
python update_site_refs.py
```

Edit the tuning constants near the top of the script
(`SUBJECT_THRESHOLD`, `EDGE_ERODE_RADIUS`, `BLUR_SIGMA`, etc.) when the
mask needs to be tighter, looser, or have softer/harder edges. Each
re-run overwrites `images/bd_bg-mask.png` and `images/bd_bg-cutout.webp`.

After regenerating, bump the `?v=` cache buster on
`bd_bg-cutout.webp` and the other site assets by changing
`ASSET_VERSION` in `update_site_refs.py`, then run it. If you don't,
viewers may keep seeing cached files.

When the deploy URL changes, update `SITE_ORIGIN` in
`update_site_refs.py` and run the script. This keeps canonical URLs,
Open Graph URLs, the XML sitemap, and `robots.txt` aligned while keeping
the SEO tags static in the HTML for crawlers and social preview bots.

## Dependencies

Python 3.10+ with:
- `Pillow`
- `opencv-python` (for the scratch-repair pass)
- `scipy` (for morphological ops)
- `numpy`

```bash
pip install Pillow opencv-python scipy numpy
```

## Why this isn't deployed

GitHub Pages serves the entire repo by default. There's nothing
sensitive in the script, but shipping Python source to the web is
clutter — and visitors don't need it. The `build/` folder is
deliberately separated from the deployable tree (`css/`, `js/`,
`images/`, the HTML files, `favicon.svg`, `robots.txt`, `sitemap.xml`,
`.nojekyll`) so you can clearly see what gets uploaded.
