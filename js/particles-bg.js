/*
 * particles-bg.js — builds the decorative particle field once.
 *
 * Cursor-driven version:
 * - Cursor right of horizontal center: particles move right.
 * - Cursor left of horizontal center: particles move left.
 * - Cursor near horizontal center: particles stop exactly where they are.
 * - Distance from horizontal center controls speed.
 * - Vertical cursor position is ignored; particles never move vertically.
 *
 * This preserves the working visual behavior. The only hardening here is:
 * - safer duplicate-init protection
 * - named cleanup handlers
 * - pause while the tab/document is hidden
 * - frame-rate-independent mouse smoothing
 */

const PARTICLE_COUNT = 140;
const TYPES = ["dash", "dash", "dash", "dot", "dot", "square", "rect"];

const MOBILE_QUERY = "(max-width: 720px)";

// Horizontal cursor motion tuning.
const CENTER_DEADZONE = 0.035;
const MAX_PARTICLE_SPEED = 340; // px/sec at full left/right screen edge
const SPEED_CURVE = 1.25;
const MOUSE_SMOOTHING = 0.12;

// Extra offscreen travel so particles wrap cleanly instead of popping at
// the visible viewport edge.
const WRAP_MARGIN = 72;

function random(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function signedCurve(value, deadzone, curve) {
  const absValue = Math.abs(value);
  if (absValue <= deadzone) return 0;

  const normalized = clamp((absValue - deadzone) / (1 - deadzone), 0, 1);
  const curved = Math.pow(normalized, curve);

  return Math.sign(value) * curved;
}

function pickType() {
  return TYPES[Math.floor(Math.random() * TYPES.length)];
}

function dimensions(type) {
  if (type === "dash") return [random(10, 42), Math.random() < 0.72 ? 1 : 2];
  if (type === "dot") return [1, 1];

  if (type === "square") {
    const size = Math.floor(random(2, 6));
    return [size, size];
  }

  return [random(5, 16), random(2, 6)];
}

function createLayer() {
  let layer = document.getElementById("particles-bg");
  if (layer) return layer;

  layer = document.createElement("div");
  layer.id = "particles-bg";
  layer.setAttribute("aria-hidden", "true");
  document.body.prepend(layer);

  return layer;
}

function buildParticles() {
  if (matchMedia(MOBILE_QUERY).matches) return;

  const layer = createLayer();

  // Guard against duplicate setup from reloads, injected scripts, or
  // accidental double execution.
  if (layer.dataset.particlesReady === "true") return;

  layer.dataset.particlesReady = "true";
  layer.replaceChildren();

  let viewportW = window.innerWidth || 1;
  let viewportH = window.innerHeight || 1;
  let isPaused = document.hidden;

  const particles = [];

  const mouse = { x: 0 };
  const mouseS = { x: 0 };

  let lastFrameTime = performance.now();
  let rafId = 0;
  let stopped = false;

  function updateMouseFromClientX(clientX) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
  }

  function onPointerMove(event) {
    updateMouseFromClientX(event.clientX);
  }

  function onTouchMove(event) {
    const touch = event.touches[0];
    if (touch) updateMouseFromClientX(touch.clientX);
  }

  function placeParticle(particleState) {
    particleState.el.style.transform =
      `translate3d(${particleState.x.toFixed(2)}px, ${particleState.y.toFixed(2)}px, 0)`;
  }

  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const type = pickType();
    const [width, height] = dimensions(type);

    const particle = document.createElement("span");
    particle.className = `particle particle-${type}`;

    particle.style.setProperty("--w", `${width}px`);
    particle.style.setProperty("--h", `${height}px`);
    particle.style.setProperty("--alpha", random(0.18, 0.78).toFixed(2));

    // Disable the old CSS keyframe animation per particle so JS fully
    // controls position and can freeze motion without snapping.
    particle.style.animation = "none";

    const state = {
      el: particle,
      width,
      height,
      x: random(-WRAP_MARGIN, viewportW + WRAP_MARGIN),
      yFrac: random(0, 1),
      y: 0,
      speedFactor: random(0.55, 1.25),
    };

    state.y = state.yFrac * viewportH;

    placeParticle(state);
    particles.push(state);
    layer.appendChild(particle);
  }

  function onResize() {
    viewportW = window.innerWidth || 1;
    viewportH = window.innerHeight || 1;

    for (const particle of particles) {
      particle.y = particle.yFrac * viewportH;
      particle.x = clamp(particle.x, -WRAP_MARGIN, viewportW + WRAP_MARGIN);
      placeParticle(particle);
    }
  }

  function onVisibilityChange() {
    isPaused = document.hidden;
    lastFrameTime = performance.now();
  }

  function animate() {
    if (stopped) return;

    const now = performance.now();
    const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    let horizontalInput = 0;
    let baseVelocity = 0;

    if (!isPaused) {
      // Frame-rate-independent smoothing. At normal 60fps it behaves like
      // the original MOUSE_SMOOTHING value, but it stays stable on faster
      // or slower displays.
      const smoothing = 1 - Math.pow(1 - MOUSE_SMOOTHING, dt * 60);
      mouseS.x += (mouse.x - mouseS.x) * smoothing;

      // Horizontal-only movement. Vertical cursor position intentionally has
      // no effect.
      horizontalInput = signedCurve(mouseS.x, CENTER_DEADZONE, SPEED_CURVE);
      baseVelocity = horizontalInput * MAX_PARTICLE_SPEED;

      if (baseVelocity !== 0) {
        for (const particle of particles) {
          particle.x += baseVelocity * particle.speedFactor * dt;

          if (particle.x > viewportW + WRAP_MARGIN) {
            particle.x = -WRAP_MARGIN - particle.width;
          } else if (particle.x < -WRAP_MARGIN - particle.width) {
            particle.x = viewportW + WRAP_MARGIN;
          }

          placeParticle(particle);
        }
      }
    }

    window.__particlesBgState = {
      mode: "cursor-horizontal-js",
      particles: PARTICLE_COUNT,
      ready: true,
      paused: isPaused,
      mouseX: Number(mouseS.x.toFixed(4)),
      horizontalInput: Number(horizontalInput.toFixed(4)),
      velocityPxPerSecond: Number(baseVelocity.toFixed(2)),
      stopped: baseVelocity === 0,
      updatedAt: now,
    };

    rafId = requestAnimationFrame(animate);
  }

  function stopParticles(reason = "pagehide") {
    if (stopped) return;

    stopped = true;
    cancelAnimationFrame(rafId);

    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("mousemove", onPointerMove);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pagehide", onPageHide);
    document.removeEventListener("visibilitychange", onVisibilityChange);

    layer.dataset.particlesReady = "false";

    window.__particlesBgState = {
      mode: "cursor-horizontal-js",
      particles: PARTICLE_COUNT,
      ready: false,
      stopped: true,
      reason,
      updatedAt: performance.now(),
    };
  }

  function onPageHide() {
    stopParticles("pagehide");
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("mousemove", onPointerMove, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("pagehide", onPageHide, { once: true });
  document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });

  window.__particlesBgStop = stopParticles;

  window.__particlesBgState = {
    mode: "cursor-horizontal-js",
    particles: PARTICLE_COUNT,
    ready: true,
    paused: isPaused,
    mouseX: 0,
    horizontalInput: 0,
    velocityPxPerSecond: 0,
    stopped: true,
    startedAt: performance.now(),
  };

  rafId = requestAnimationFrame(animate);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", buildParticles, { once: true });
} else {
  buildParticles();
}