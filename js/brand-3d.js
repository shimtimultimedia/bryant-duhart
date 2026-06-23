/*
 * brand-3d.js — renders the header logo: a 3D isometric cube, echoing
 * the Shimti Multimedia brand mark. The cube holds a fixed isometric
 * pose; the key light tracks the cursor so highlights sweep across its
 * faces and edges as the pointer moves, reading as polished metal.
 *
 * Loaded dynamically by include.js once the header canvas is in
 * the DOM. Resolves Three.js through the page importmap ("three" /
 * "three/addons/"), which every page carries and which points at
 * the locally vendored copy under js/vendor/. Nothing is fetched
 * from a third-party CDN at runtime, so an offline machine, a CDN
 * outage, or a browser shield/ad-blocker can no longer kill the 3D.
 *
 * Same "three" specifier as hero-3d.js, so the core module is
 * parsed once and shared across both files.
 */

import * as THREE             from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment }    from "three/addons/environments/RoomEnvironment.js";

const ORTHO_H = 2;     // world-height of the camera frustum
const PADDING = 0.1;   // breathing room so the cube's corners don't clip
// Classic isometric tilt: spin 45° about Y, then tilt ~35.26° about X
// so the top and two side faces all show — the same 3-face view as the
// Shimti Multimedia cube this mark echoes.
const ISO_TILT = Math.atan(1 / Math.SQRT2);  // ≈ 35.26°

function init() {
  const canvas = document.getElementById("brand-3d-canvas");
  if (!canvas) return;

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return; // No WebGL — text fallback stays visible
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  // Filmic tone mapping + sRGB output — matches the hero title so both
  // 3D marks share the same highlight roll-off and color response.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();

  // Environment map — same fix as the hero title: a metallic surface
  // needs surroundings to reflect or it renders near-black. A neutral
  // studio room, pre-filtered by PMREMGenerator, gives the BD mark soft
  // light gradients and a polished sheen instead of a flat fill.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // Orthographic camera — same flat-with-depth treatment as the
  // hero title, no perspective distortion at this tiny size.
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  camera.position.set(0, 0, 10);

  function updateCamera() {
    const aspect = (canvas.clientWidth / canvas.clientHeight) || 1;
    camera.left   = -ORTHO_H * aspect / 2;
    camera.right  =  ORTHO_H * aspect / 2;
    camera.top    =  ORTHO_H / 2;
    camera.bottom = -ORTHO_H / 2;
    camera.updateProjectionMatrix();
  }
  updateCamera();

  // Lighting — matches the hero so the two 3D marks read as part
  // of the same scene aesthetically.
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.9);
  fillLight.position.set(-3, -1, 3);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
  rimLight.position.set(0, 2, -3);
  scene.add(rimLight);

  // ───────────────────── Cursor tracking ─────────────────────
  // Global pointer position, normalized -1..+1. The header mark is
  // tiny, so we track the whole window — move the mouse anywhere on the
  // page and the BD's key light follows. `mouseS` is the eased value
  // the light actually chases, so it glides rather than snaps.
  const mouse  = { x: 0, y: 0 };
  const mouseS = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  });

  // Bookkeeping for re-render on resize. natW/natH are the cube's
  // on-screen size at its iso pose (scale 1), so fitMesh can rescale on
  // resize without rebuilding anything.
  let mesh = null;
  let natW = 0, natH = 0;

  function fitMesh() {
    if (!mesh) return;
    const aspect = (canvas.clientWidth / canvas.clientHeight) || 1;
    const maxH = ORTHO_H * (1 - 2 * PADDING);
    const maxW = ORTHO_H * aspect * (1 - 2 * PADDING);
    const scale = Math.min(maxH / natH, maxW / natW);
    mesh.scale.setScalar(scale);
  }

  function render() {
    renderer.render(scene, camera);
  }

  // Build the cube synchronously — no font, no async load. Rounded
  // edges so they catch the clearcoat highlight like the polished
  // metal of the Shimti cube.
  {
    const geo = new RoundedBoxGeometry(1, 1, 1, 4, 0.12);

    // Polished white metal under a clearcoat — brushed silver/chrome on
    // the black header. Full metalness so the environment map does the
    // lighting; the clearcoat catches the crisp highlight that tracks
    // the cursor. Same material language as the hero title.
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 1.0,
      roughness: 0.3,
      envMapIntensity: 1.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.12,
    });

    mesh = new THREE.Mesh(geo, material);
    // Order YXZ so the 45° spin about Y happens before the tilt about X,
    // landing the cube in a true isometric pose.
    mesh.rotation.order = "YXZ";
    mesh.rotation.set(ISO_TILT, Math.PI / 4, 0);

    // Measure the cube's on-screen footprint at this pose so it fits.
    mesh.updateMatrixWorld(true);
    const size = new THREE.Vector3();
    new THREE.Box3().setFromObject(mesh).getSize(size);
    natW = size.x;
    natH = size.y;

    scene.add(mesh);
    fitMesh();
    render();
    canvas.parentElement?.classList.add("brand-mark-ready");

    // Start the render loop so the key light can follow the cursor.
    // The cube holds its iso pose; only the light moves, which is
    // user-initiated motion and therefore fine under reduced-motion.
    animate();
  }

  // Re-render on viewport changes (e.g. dpr changes, header reflow).
  window.addEventListener("resize", () => {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    updateCamera();
    fitMesh();
    render();
  });

  // ───────────────────── Light follows cursor ─────────────────────
  // The mesh stays put; the key light tracks the pointer so the BD's
  // highlight slides with the mouse, matching the hero title. Fill and
  // rim stay fixed at their creation positions to hold steady form;
  // the env map supplies the ambient richness. Range is tighter than
  // the hero's because this mark is small.
  const LIGHT_RANGE = 7;

  function animate() {
    const t = performance.now() / 1000;

    // Ease the smoothed cursor toward the real one.
    mouseS.x += (mouse.x - mouseS.x) * 0.12;
    mouseS.y += (mouse.y - mouseS.y) * 0.12;

    // Key light rides in front of the mark (positive z) and slides with
    // the pointer (screen-up → light-up).
    keyLight.position.set(
      mouseS.x * LIGHT_RANGE,
      -mouseS.y * LIGHT_RANGE,
      5,
    );
    // Gentle intensity breathing for life; steady under reduced motion.
    keyLight.intensity = prefersReduced ? 2.4 : 2.4 + Math.sin(t * 0.60) * 0.6;

    render();
    requestAnimationFrame(animate);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
