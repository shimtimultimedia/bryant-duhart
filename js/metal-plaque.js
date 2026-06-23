/*
 * metal-plaque.js — shared "floating metal plaque" used by the About and
 * Social pages (and conceptually matching the home hero plaque, which has
 * its own variant with bloom + 3D text).
 *
 * setupMetalPlaque(canvas, stack) builds one graphite-metal slab in the
 * given <canvas>, lit by an environment map + a cursor-tracked key light,
 * tilting toward the cursor. The same rotation is mirrored onto `stack`
 * (the HTML overlay) via a CSS matrix3d transform each frame, so the
 * overlay's content moves with the metal as one object.
 *
 * No-op on mobile or when WebGL is unavailable, so the page's HTML overlay
 * stands on its own as a graceful fallback.
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

const TILT_PITCH  = 0.22;
const TILT_YAW    = 0.36;
const TILT_LERP   = 0.14;
const LIGHT_RANGE = 9;

export function setupMetalPlaque(canvas, stack) {
  if (window.innerWidth < MOBILE_BREAKPOINT) return false;
  if (!canvas) return false;

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
    return false;
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
  function onPointerMove(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  }
  window.addEventListener("pointermove", onPointerMove, { passive: true });

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
    window.removeEventListener("pointermove", onPointerMove);
    plaque.geometry.dispose();
    plaqueMaterial.dispose();
    pmrem.dispose();
    renderer.dispose();
  }

  canvas.classList.add("active");
  window.addEventListener("resize", layout, { passive: true });
  window.addEventListener("pagehide", dispose, { once: true });
  requestAnimationFrame(() => { layout(); animate(); });
  return true;
}
