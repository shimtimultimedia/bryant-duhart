"""
Build the transparent portrait used by the site background.

Outputs:
  images/bd_bg-mask.png      grayscale alpha mask, for inspection
  images/bd_bg-cutout.webp   RGBA portrait with transparent background

Why this exists:
  The source portrait has a white studio background but no alpha.
  We need transparency outside Bryant so the animated particle layer
  can show behind/around the subject. A live CSS mask proved too easy
  to cache badly and too easy to mis-read, so the page now consumes the
  precomposited transparent WebP directly.
"""
from PIL import Image
import cv2
import numpy as np
from scipy.ndimage import (
    binary_closing,
    binary_dilation,
    binary_erosion,
    binary_fill_holes,
    gaussian_filter,
    generate_binary_structure,
    iterate_structure,
    label,
)
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "images" / "bd_bg.png"
MASK_DST = ROOT / "images" / "bd_bg-mask.png"
CUTOUT_DST = ROOT / "images" / "bd_bg-cutout.webp"

WHITE_THRESHOLD = 252
MIN_COMPONENT_SIZE = 30_000
HEAD_CLOSE_RADIUS = 18
BODY_ROW_FILL_START = 1600
EDGE_DILATE_RADIUS = 0
EDGE_ERODE_RADIUS  = 1
BLUR_SIGMA = 0.35
SCRATCH_REPAIR_LINES = [
    # Thin white scan/edit scratches across the left cheek/beard area.
    # Coordinates are source-image pixels: x1, y1, x2, y2, thickness.
    (1290, 1102, 1495, 1102, 5),
    (1348, 1098, 1465, 1099, 5),
    (1400, 1084, 1490, 1084, 5),
]

def keep_large_components(mask: np.ndarray) -> np.ndarray:
    labels, _ = label(mask)
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    keep = np.where(sizes >= MIN_COMPONENT_SIZE)[0]
    return np.isin(labels, keep)


img = Image.open(SRC).convert("RGB")
arr = np.array(img)
h, w = arr.shape[:2]
print(f"Source: {SRC}  size={w}x{h}")

repair_mask = np.zeros((h, w), dtype=np.uint8)
for x1, y1, x2, y2, thickness in SCRATCH_REPAIR_LINES:
    cv2.line(repair_mask, (x1, y1), (x2, y2), 255, thickness)

if repair_mask.any():
    # For this particular artifact, inpainting leaves a smudge. The
    # scratch is almost horizontal and only a few pixels thick, so
    # vertical interpolation from nearby rows preserves the beard texture
    # more cleanly.
    repaired = arr.copy()
    ys, xs = np.where(repair_mask > 0)
    y_top = np.clip(ys - 14, 0, h - 1)
    y_bot = np.clip(ys + 14, 0, h - 1)
    repaired[ys, xs] = ((arr[y_top, xs].astype(np.uint16) + arr[y_bot, xs].astype(np.uint16)) // 2).astype(np.uint8)
    arr = repaired
    img = Image.fromarray(arr, mode="RGB")
    print(f"Repaired scratch pixels: {(repair_mask > 0).sum():,}")

# Detect the white studio background by connectivity to the image border.
# The previous face-protect oval made a huge region of white background
# opaque around the head; that was the visible halo. Boundary-connected
# removal keeps bright skin highlights while cutting away the actual
# studio background.
white = (arr >= WHITE_THRESHOLD).all(axis=2)
white_labels, _ = label(white, structure=np.ones((3, 3), dtype=bool))
border_labels = np.unique(np.concatenate([
    white_labels[0, :],
    white_labels[-1, :],
    white_labels[:, 0],
    white_labels[:, -1],
]))
border_labels = border_labels[border_labels != 0]
background = np.isin(white_labels, border_labels)
subject = ~background

subject = keep_large_components(subject)
print(f"Large subject components: {subject.sum():,} pixels")

# Close small gaps in the head/face region so blown-out highlights and
# anti-aliased edge pixels stay inside the silhouette. Compute the close
# on the full mask, then copy the head rows back; otherwise the lower
# edge of a cropped slice becomes a fake transparent horizontal seam.
head_struct = iterate_structure(generate_binary_structure(2, 1), HEAD_CLOSE_RADIUS)
closed = binary_closing(subject, structure=head_struct)
closed = binary_fill_holes(closed)
subject[:BODY_ROW_FILL_START] = closed[:BODY_ROW_FILL_START]

# The shirt is white and opens into the white background through the
# collar/V-neck, so fill only the body rows horizontally. Keeping this
# below the face avoids the blunt head cuts caused by the old full-image
# per-row fill.
for row in range(BODY_ROW_FILL_START, h):
    xs = np.where(subject[row])[0]
    if xs.size:
        subject[row, xs[0]:xs[-1] + 1] = True

subject = binary_fill_holes(subject)

if EDGE_DILATE_RADIUS:
    edge_struct = iterate_structure(generate_binary_structure(2, 1), EDGE_DILATE_RADIUS)
    subject = binary_dilation(subject, structure=edge_struct)

if EDGE_ERODE_RADIUS:
    # Pull the silhouette edge inward by a few pixels so the soft
    # Gaussian falloff applied below lands entirely on actual subject
    # pixels (skin, hair, suit) rather than on the anti-aliased
    # white-background transition zone of the original photo.
    # Without this step the precomposited cutout has a thin halo of
    # near-white semi-transparent pixels around the head that only
    # becomes visible when something dark passes behind it.
    erode_struct = iterate_structure(generate_binary_structure(2, 1), EDGE_ERODE_RADIUS)
    subject = binary_erosion(subject, structure=erode_struct)

mask = np.where(subject, 255, 0).astype(np.uint8)
if BLUR_SIGMA:
    mask = np.clip(gaussian_filter(mask.astype(np.float32), sigma=BLUR_SIGMA), 0, 255).astype(np.uint8)

Image.fromarray(mask, mode="L").save(MASK_DST, optimize=True)

rgba = img.convert("RGBA")
rgba_arr = np.array(rgba)

# White-matte decontamination for soft alpha edges. The source portrait
# was photographed on white, so semi-transparent edge pixels can carry
# white in their RGB values. Unmatting those pixels prevents a thin white
# fringe from appearing when dark particles pass behind the cutout.
alpha = mask.astype(np.float32) / 255.0
edge = (alpha > 0) & (alpha < 1)
if edge.any():
    rgb = rgba_arr[..., :3].astype(np.float32)
    a = alpha[..., None]
    unmatte = (rgb - 255.0 * (1.0 - a)) / np.maximum(a, 1 / 255.0)
    rgba_arr[..., :3] = np.where(edge[..., None], np.clip(unmatte, 0, 255), rgb).astype(np.uint8)

rgba = Image.fromarray(rgba_arr, mode="RGBA")
rgba.putalpha(Image.fromarray(mask, mode="L"))
rgba.save(CUTOUT_DST, "WEBP", quality=88, method=6)

print(f"Saved: {MASK_DST} ({os.path.getsize(MASK_DST):,} bytes)")
print(f"Saved: {CUTOUT_DST} ({os.path.getsize(CUTOUT_DST):,} bytes)")
