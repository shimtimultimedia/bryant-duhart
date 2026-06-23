# Service images

Each service card on the home page shows the matching file here. Right now
these are **original monochrome SVG icon illustrations** (placeholders that
already look intentional). Replace any of them with a real photo whenever you
have one.

Cards reference them as, e.g.:

```html
<img class="service-image" src="images/services/web-design.svg?v=NN" ...>
```

| File (current) | Service |
|---|---|
| `web-design.svg` | Web Design |
| `graphic-design.svg` | Graphic Design |
| `video.svg` | Video |
| `3d-design.svg` | 3D Design |
| `music-production.svg` | Music Production |
| `audio-services.svg` | Audio Services |
| `film-concepts.svg` | Film Concepts |
| `photography.svg` | Photography |
| `animation.svg` | Animation |
| `game-development.svg` | Game Development |
| `app-development.svg` | App Development |
| `ai-consulting.svg` | AI Consulting |
| `creative-direction.svg` | Creative Direction |

## Swapping in a real photo

1. Add the photo here. Recommended: **16:9, ~1600×900, `.webp`** (the cards
   use `aspect-ratio: 16/9` and `object-fit: cover`, so 16:9 fills with no crop).
2. In `index.html`, change that card's `src` from `…/<slug>.svg` to
   `…/<slug>.webp`.
3. Bump the cache version: set `ASSET_VERSION` in `build/update_site_refs.py`
   and run it.

The SVG and the photo use the same `.service-image` box, so there's no layout
shift when you switch.
