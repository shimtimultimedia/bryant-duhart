// Regression guard for js/frame-gate.js. Run: node --test build/
//
// The 3D loops once asked for 30 fps and got 20 on a 60 Hz phone, because a strict
// `elapsed >= 1000 / 30` cap skipped every tick that arrived a fraction of a
// millisecond early. These tests drive the gate with simulated screen refreshes, with
// timestamp jitter like a real browser's, and check the rate actually delivered.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createFrameGate } from "../js/frame-gate.js";

// Deterministic jitter, so a failure always reproduces.
function* refreshTimes(hz, seconds, jitterMs, seed = 7) {
  let state = seed;
  const random = () => ((state = (state * 1103515245 + 12345) % 2147483648) / 2147483648);
  const frame = 1000 / hz;
  for (let i = 0; i < hz * seconds; i += 1) {
    yield i * frame + (random() * 2 - 1) * jitterMs;
  }
}

function deliveredFps(hz, target, jitterMs) {
  const gate = createFrameGate(target);
  const seconds = 20;
  let draws = 0;
  for (const now of refreshTimes(hz, seconds, jitterMs)) {
    if (gate.ready(now)) draws += 1;
  }
  return draws / seconds;
}

for (const hz of [60, 90, 120, 144]) {
  test(`30 fps cap delivers ~30 fps on a ${hz} Hz screen with jitter`, () => {
    const fps = deliveredFps(hz, 30, 0.4);
    assert.ok(fps >= 27.5 && fps <= 30.5, `delivered ${fps} fps on ${hz} Hz`);
  });
}

test("a screen slower than the cap draws every frame", () => {
  assert.equal(deliveredFps(24, 30, 0.4), 24);
});

test("reset() lets the very next frame draw", () => {
  const gate = createFrameGate(30);
  assert.equal(gate.ready(1000), true);
  assert.equal(gate.ready(1016.7), false);
  gate.reset();
  assert.equal(gate.ready(1033.3 - 16), true);
});
