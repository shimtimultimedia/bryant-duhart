/*
 * about-plaque-3d.js — the About page is one big floating 3D metal plaque
 * carrying a random image slideshow, with the bio laid across the bottom.
 *
 * Two independent pieces:
 *   1. initSlideshow() — runs always (desktop + mobile): cross-/slide-fades
 *      through the project's images in a shuffled, non-repeating order.
 *   2. initPlaque() — the WebGL metal plaque (same material/lighting/tilt as
 *      the home hero). Desktop only; tilts toward the cursor and mirrors that
 *      rotation onto the HTML overlay via a CSS matrix3d so the slideshow +
 *      text move with the metal as one object.
 *
 * Three.js resolves through the page importmap to the locally vendored copy.
 * No WebGL / mobile / no-JS → the slideshow still runs and the bio falls
 * back to readable dark-on-light text.
 */

import * as THREE             from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment }    from "three/addons/environments/RoomEnvironment.js";

const MOBILE_BREAKPOINT = 720;
const MAX_PIXEL_RATIO   = 1.75;

const DEPTH         = 0.18;
const ORTHO_HEIGHT  = 3.6;
const PADDING       = 0.04;
const PLAQUE_RADIUS = 0.07;

// Bigger, looser, clearly bidirectional tilt (was 0.14 / 0.22 @ 0.1 lerp).
const TILT_PITCH = 0.22;
const TILT_YAW   = 0.36;
const TILT_LERP  = 0.14;
const LIGHT_RANGE = 9;

// Slideshow images from the images/ directory. The portrait of Bryant
// (bd_bg*) is intentionally excluded — it's already the site-wide background
// on every page — as are the silhouette mask and duplicate .png/.avif formats.
const SLIDE_IMAGES = [
  "images/bd_business_skyline.webp",
  "images/services/web-design.svg",
  "images/services/graphic-design.svg",
  "images/services/video.svg",
  "images/services/3d-design.svg",
  "images/services/music-production.svg",
  "images/services/audio-services.svg",
  "images/services/film-concepts.svg",
  "images/services/photography.svg",
  "images/services/animation.svg",
  "images/services/game-development.svg",
  "images/services/app-development.svg",
  "images/services/ai-consulting.svg",
  "images/services/creative-direction.svg",
];
const SLIDE_INTERVAL_MS = 4200;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initSlideshow() {
  const stage = document.getElementById("about-slideshow");
  if (!stage || stage.dataset.ready === "true") return;
  stage.dataset.ready = "true";

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const slides = SLIDE_IMAGES.map((src, i) => {
    const img = document.createElement("img");
    img.className = "about-slide";
    img.src = src;
    img.alt = "";
    img.decoding = "async";
    img.loading = i === 0 ? "eager" : "lazy";
    stage.appendChild(img);
    return img;
  });
  if (!slides.length) return;

  // Shuffled, non-repeating order: play through every image before any
  // repeats, and never show the same image twice in a row across reshuffles.
  let queue = [];
  let last = -1;
  function nextIndex() {
    if (queue.length === 0) {
      queue = shuffle([...slides.keys()]);
      if (queue[0] === last && queue.length > 1) [queue[0], queue[1]] = [queue[1], queue[0]];
    }
    last = queue.shift();
    return last;
  }

  let currentIndex = nextIndex();
  slides[currentIndex].classList.add("is-current");

  function advance() {
    const prev = slides[currentIndex];
    currentIndex = nextIndex();
    const next = slides[currentIndex];
    prev.classList.remove("is-current");
    prev.classList.add("is-leaving");
    next.classList.remove("is-leaving");
    next.classList.add("is-current");
    // Clear the leaving state after the transition so it's ready to re-enter.
    setTimeout(() => prev.classList.remove("is-leaving"), 1200);
  }

  if (prefersReduced) stage.classList.add("reduced-motion");
  setInterval(advance, SLIDE_INTERVAL_MS);
}

function initPlaque() {
  if (window.innerWidth < MOBILE_BREAKPOINT) return;

  const section = document.getElementById("about-plaque");
  const canvas  = document.getElementById("about-plaque-canvas");
  const stack   = document.getElementById("about-plaque-stack");
  if (!section || !canvas) return;

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  camera.position.set(0, 0, 10);

  function updateOrtho() {
    const aspect = canvas.clientWidth / canvas.clientHeight || 1;
    const h = ORTHO_HEIGHT, w = h * aspect;
    camera.left = -w / 2; camera.right = w / 2;
    camera.top = h / 2;   camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
  fillLight.position.set(-3, -1, 3);
  scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
  rimLight.position.set(0, 2, -3);
  scene.add(rimLight);

  const plaqueMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x2b2b2b, metalness: 1.0, roughness: 0.62,
    envMapIntensity: 0.8, clearcoat: 0.35, clearcoatRoughness: 0.5,
  });

  const assembly = new THREE.Group();
  assembly.rotation.order = "YXZ";
  scene.add(assembly);

  const plaque = new THREE.Mesh(
    new RoundedBoxGeometry(1, 1, DEPTH, 4, PLAQUE_RADIUS),
    plaqueMaterial,
  );
  assembly.add(plaque);

  const mouse = { x: 0, y: 0 }, mouseS = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  const cssBasisFlip = new THREE.Matrix4().makeScale(1, -1, 1);
  const cssMirror = new THREE.Matrix4();

  function layout() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    updateOrtho();
    const aspect = w / h;
    const plaqueH = ORTHO_HEIGHT * (1 - 2 * PADDING);
    const plaqueW = ORTHO_HEIGHT * aspect * (1 - 2 * PADDING);
    plaque.geometry.dispose();
    plaque.geometry = new RoundedBoxGeometry(plaqueW, plaqueH, DEPTH, 4, PLAQUE_RADIUS);
  }

  function animate() {
    const t = performance.now() / 1000;
    mouseS.x += (mouse.x - mouseS.x) * TILT_LERP;
    mouseS.y += (mouse.y - mouseS.y) * TILT_LERP;

    keyLight.position.set(mouseS.x * LIGHT_RANGE, -mouseS.y * LIGHT_RANGE, 6);
    keyLight.intensity = prefersReduced ? 1.6 : 1.6 + Math.sin(t * 0.55) * 0.3;

    let wobbleX = 0, wobbleY = 0;
    if (!prefersReduced) {
      wobbleX = Math.sin(t * 0.65) * 0.02;
      wobbleY = Math.cos(t * 0.5) * 0.028;
    }
    const targetX = mouseS.y * -TILT_PITCH + wobbleX;
    const targetY = mouseS.x *  TILT_YAW   + wobbleY;
    assembly.rotation.x += (targetX - assembly.rotation.x) * TILT_LERP;
    assembly.rotation.y += (targetY - assembly.rotation.y) * TILT_LERP;

    if (stack) {
      assembly.updateMatrix();
      cssMirror.copy(cssBasisFlip).multiply(assembly.matrix).multiply(cssBasisFlip);
      const m = cssMirror.elements.map(v => (Math.abs(v) < 1e-10 ? 0 : Number(v.toFixed(10))));
      stack.style.transform = `matrix3d(${m.join(",")})`;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function dispose() {
    window.removeEventListener("resize", layout);
    plaque.geometry.dispose();
    plaqueMaterial.dispose();
    pmrem.dispose();
    renderer.dispose();
  }

  canvas.classList.add("active");
  section.classList.add("about-plaque-active");
  window.addEventListener("resize", layout, { passive: true });
  window.addEventListener("pagehide", dispose, { once: true });
  requestAnimationFrame(() => { layout(); animate(); });
}

function init() {
  initSlideshow();   // always
  initPlaque();      // desktop + WebGL only
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
