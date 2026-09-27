# build/

Source tools that **do not deploy with the site**. Run them locally
when something needs regenerating.

## Files

| File | What it does |
|---|---|
| `build_portraits.py` | Reads transparent portrait PNGs (`1.png`, `2.png`, ...) from a folder you name, shifts each so the head sits where the layout expects it, and writes `images/portraits/portrait-N.webp` — the frames that crossfade behind the site (`#portrait-bg` in `css/base.css`, cycled by `js/include.js`). |
| `build_silhouette_mask.py` | Legacy. Cut the original single portrait out of `images/bd_bg.png`; its `bd_bg-cutout.webp` output is no longer used by the site. |
| `update_site_refs.py` | Updates cache-busting versions, canonical/OG image URLs, `sitemap.xml`, and `robots.txt` from constants at the top of the script. |
| `frame-gate.test.mjs` | Tests `js/frame-gate.js`, the 30 fps cap both 3D scripts use, on simulated 60–144 Hz screens. Run with `node --test "build/*.test.mjs"`; CI runs it in `.github/workflows/quality.yml`. |

## Running

Release checks: `node --test --test-concurrency=1 "build/*.test.mjs"`.
Browser tests need Playwright 1.61.1 and its Chromium browser. CI installs both
using `npm install --no-save --package-lock=false playwright@1.61.1` and
`npx --no-install playwright install --with-deps chromium`.
Each browser suite serves raw repository files on its own loopback port; no
running development preview is required. The website gains no runtime dependency.

Both scripts resolve paths from their own location, so they can be run
from the project root or from inside `build/`.

```bash
# from project root
python build/build_portraits.py ~/Downloads/portraits
python build/update_site_refs.py

# or from inside build/
python build_portraits.py ~/Downloads/portraits
python update_site_refs.py
```

Edit the tuning constants near the top of the script
(`SUBJECT_THRESHOLD`, `EDGE_ERODE_RADIUS`, `BLUR_SIGMA`, etc.) when the
mask needs to be tighter, looser, or have softer/harder edges. Each
re-run overwrites `images/bd_bg-mask.png` and `images/bd_bg-cutout.webp`.

After regenerating, bump the `?v=` cache buster on the portraits and
the other site assets by changing `ASSET_VERSION` in
`update_site_refs.py` and in `js/include.js` (the script does not edit
that constant), then run `update_site_refs.py`. If the number of
portraits changes, update `PORTRAIT_COUNT` in `js/include.js`. If you don't,
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
