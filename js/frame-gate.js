/*
 * frame-gate.js - frame-rate cap for requestAnimationFrame loops.
 *
 * requestAnimationFrame fires once per screen refresh (60, 90, 120 Hz...), and its
 * timestamps jitter by a fraction of a millisecond. A cap written as
 * `now - last >= 1000 / 30` skips the tick that lands at 33.2 ms and draws on the next
 * one at 50 ms, so a "30 fps" loop ran at 20 fps on a 60 Hz phone (measured on a
 * Galaxy A57: median 49 ms between frames, for both the header cube and the plaque).
 *
 * The gate instead draws on the tick that lands closest to the target: it draws now
 * unless the next tick, one refresh later, would be nearer to the target than this one.
 * That holds at any refresh rate and needs no tuned tolerance.
 *
 * build/frame-gate.test.mjs simulates 60/90/120/144 Hz with jitter and fails if the
 * delivered rate drifts from the target.
 */
export function createFrameGate(fps) {
  const interval = 1000 / fps;
  let lastDraw = -Infinity;
  let lastTick = -Infinity;

  return {
    // Call once per animation frame with its timestamp; true means draw this frame.
    ready(now) {
      // Time between screen refreshes, as last observed. Clamped so a pause (a hidden
      // tab, an idle stop) does not read as a very slow screen.
      const tick = Math.min(Math.max(now - lastTick, 0), interval);
      lastTick = now;
      const elapsed = now - lastDraw;
      if (elapsed + tick / 2 < interval) return false;
      lastDraw = now;
      return true;
    },
    // Forget the last draw, so the next frame draws at once (after a pause or a wake-up).
    reset() {
      lastDraw = -Infinity;
    },
  };
}
