/*
 * hero-3d.js — premium home hero plaque renderer.
 *
 * Renders a graphite-metal 3D plaque, raised 3D title/subtitle, and a
 * center graphite cube. The title uses real TextGeometry material groups:
 * - material slot 0: lit front/back caps
 * - material slot 1: dark metallic sidewalls/bevels
 *
 * Glow is real screen-space bloom via EffectComposer + UnrealBloomPass.
 * Bloom is selective: only the title text is rendered into the bloom pass,
 * so the plaque, cube, bio overlay, and metal sidewalls remain controlled.
 *
 * The HTML bio is mirrored with the same orthographic rotation matrix as the
 * 3D plaque so the whole object reads as one solid tilted assembly.
 */

import * as THREE             from "three";
import { FontLoader }         from "three/addons/loaders/FontLoader.js";
import { TextGeometry }       from "three/addons/geometries/TextGeometry.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment }    from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer }     from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass }         from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass }    from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass }         from "three/addons/postprocessing/ShaderPass.js";

const PAGE_PATH = window.location.pathname.toLowerCase();

const PAGE_PLAQUE_CONFIGS = {
  home: {
    title: "BRYANT DUHART",
    subtitle: "PORTFOLIO",
    shape: "cube",
  },
  portfolio: {
    title: "WHAT I DO",
    subtitle: "CREATIVE WORK",
    shape: "dodecahedron",
  },
  services: {
    title: "WHAT I OFFER",
    subtitle: "AI POWERED MULTIMEDIA",
    shape: "icosahedron",
  },
  social: {
    title: "MY NETWORK",
    subtitle: "SHIMTI ECOSYSTEM",
    shape: "octahedron",
  },
  contact: {
    title: "GET IN TOUCH",
    subtitle: "BUSINESS NETWORKING",
    shape: "sphere",
  },
  about: {
    title: "MY STORY",
    subtitle: "SHORT BIOGRAPHY",
    shape: "tetrahedron",
  },
};

function resolvePageKind() {
  if (PAGE_PATH.includes("portfolio.html")) return "portfolio";
  if (PAGE_PATH.includes("services.html")) return "services";
  if (PAGE_PATH.includes("social.html")) return "social";
  if (PAGE_PATH.includes("contact.html")) return "contact";
  if (PAGE_PATH.includes("about.html")) return "about";
  return "home";
}

const PAGE_KIND = resolvePageKind();
const PAGE_PLAQUE_CONFIG = PAGE_PLAQUE_CONFIGS[PAGE_KIND] || PAGE_PLAQUE_CONFIGS.home;

const TITLE_TEXT = PAGE_PLAQUE_CONFIG.title;
const SUBTITLE_TEXT = PAGE_PLAQUE_CONFIG.subtitle;
const CENTER_SHAPE = PAGE_PLAQUE_CONFIG.shape;
const SUB_SCALE     = 0.42;
const SUB_GAP       = 0.34;

const FONT_URL          = "js/vendor/fonts/helvetiker_bold.typeface.json";
const MOBILE_BREAKPOINT = 720;

const DEFAULT_LAYER = 0;
const BLOOM_LAYER   = 1;

const MAX_PIXEL_RATIO = 2.25;
const DEPTH          = 0.18;
const ORTHO_HEIGHT   = 3.6;
const PADDING        = 0.04;
const PLAQUE_RADIUS  = 0.07;
const CUBE_CENTER_DEADZONE = 0.025;
const CUBE_MAX_SPIN_SPEED = 4.25;
const CUBE_SPIN_CURVE = 1.15;

const TILT_PITCH = 0.13;
const TILT_YAW   = 0.20;
const LIGHT_RANGE = 8;
const MOUSE_SMOOTHING = 0.11;

// Interface tab plates: real duplicate plaques rendered as children of the
// assembly, parked behind the main plaque and sliding out sideways on open.
const TAB_PLATE_Z_OFFSET = -DEPTH * 1.7;  // sit behind the main plaque (true depth occlusion)
const TAB_SLIDE_SMOOTH   = 0.18;          // per-frame ease toward open/closed
const TAB_PLATE_PAD      = 0.12;          // world units of metal margin around the DOM content
const TAB_BEHIND_FRAC    = 0.06;          // fraction of the plate that stays tucked behind when open

// Title fills only part of its DOM slot so the bloom glow has headroom and
// short titles (height-limited) don't balloon to the slot's full height.
const TITLE_SLOT_FILL = 0.62;

const BLOOM_THRESHOLD = 0.88;
const BLOOM_STRENGTH  = 0.28;
/* Radius kept tight: at 0.22 the halo bled ~a full text-height above the
   title, making it read closer to the plaque edge than it actually is. */
const BLOOM_RADIUS    = 0.14;

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

function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.94;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  return renderer;
}

function createTransparentBloomPipeline(renderer, scene, camera) {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);

  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.setPixelRatio(pixelRatio);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(1, 1),
    BLOOM_STRENGTH,
    BLOOM_RADIUS,
    BLOOM_THRESHOLD,
  );
  bloomComposer.addPass(bloomPass);

  const finalComposer = new EffectComposer(renderer);
  finalComposer.setPixelRatio(pixelRatio);
  finalComposer.addPass(new RenderPass(scene, camera));

  const mixPass = new ShaderPass(new THREE.ShaderMaterial({
    uniforms: {
      baseTexture:  { value: null },
      bloomTexture: { value: bloomComposer.renderTarget2.texture },
      exposure:     { value: renderer.toneMappingExposure },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D baseTexture;
      uniform sampler2D bloomTexture;
      uniform float exposure;
      varying vec2 vUv;

      vec3 aces(vec3 x) {
        return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
      }

      vec3 toSRGB(vec3 c) {
        return mix(c * 12.92, 1.055 * pow(max(c, 0.0), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
      }

      void main() {
        vec4 base = texture2D(baseTexture, vUv);
        vec3 bloom = texture2D(bloomTexture, vUv).rgb;
        vec3 mapped = toSRGB(aces((base.rgb + bloom) * exposure));
        gl_FragColor = vec4(mapped * base.a, base.a);
      }`,
    transparent: true,
  }), "baseTexture");

  mixPass.material.blending = THREE.NoBlending;
  finalComposer.addPass(mixPass);

  return { bloomComposer, finalComposer, bloomPass, mixPass };
}

function init() {
  if (window.innerWidth < MOBILE_BREAKPOINT) return;
  if (window.__hero3dReady) return;

  const canvas       = document.getElementById("hero-3d");
  const heroPlaque   = document.getElementById("hero-plaque");
  const plaqueStack  = document.getElementById("plaque-stack");
  const heroTitle    = document.getElementById("hero-title");
  const heroSubtitle = document.getElementById("hero-subtitle");
  const titleSlot    = heroPlaque ? heroPlaque.querySelector(".plaque-title-slot") : null;
  const shapeSlot    = heroPlaque ? heroPlaque.querySelector(".plaque-shape-slot") : null;
  const dockItems    = heroPlaque
    ? Array.from(heroPlaque.querySelectorAll(".plaque-dock-item"))
    : [];
  const webglTabsEnabled = dockItems.length
    && plaqueStack
    && matchMedia("(min-width: 721px)").matches;

  if (!canvas) return;

  window.__hero3dReady = true;

  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  camera.position.set(0, 0, 10);
  camera.layers.enable(DEFAULT_LAYER);

  function updateOrtho() {
    const aspect = canvas.clientWidth / canvas.clientHeight || 1;
    const h = ORTHO_HEIGHT;
    const w = h * aspect;

    camera.left = -w / 2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = -h / 2;
    camera.updateProjectionMatrix();
  }

  let renderer;
  try {
    renderer = createRenderer(canvas);
  } catch {
    window.__hero3dReady = false;
    return;
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envMap;

  const pipeline = createTransparentBloomPipeline(renderer, scene, camera);

  scene.add(new THREE.AmbientLight(0xffffff, 0.30));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffffff, 0.34);
  fillLight.position.set(-3, -1, 3);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
  rimLight.position.set(0, 2.4, -3.2);
  scene.add(rimLight);

  const mouse  = { x: 0, y: 0 };
  const mouseS = { x: 0, y: 0 };

  function updateMouseFromClientPoint(clientX, clientY) {
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = (clientY / window.innerHeight) * 2 - 1;
  }

  function onPointerMove(event) {
    updateMouseFromClientPoint(event.clientX, event.clientY);
  }

  function onTouchMove(event) {
    const touch = event.touches[0];
    if (touch) updateMouseFromClientPoint(touch.clientX, touch.clientY);
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("mousemove", onPointerMove, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });

  const titleFrontMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xfff1d0,
    emissive: 0xffd28a,
    emissiveIntensity: 0.62,
    metalness: 0.0,
    roughness: 0.24,
    clearcoat: 0.65,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.85,
    side: THREE.FrontSide,
  });

  const titleSideMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x121212,
    metalness: 1.0,
    roughness: 0.52,
    envMapIntensity: 0.95,
    clearcoat: 0.45,
    clearcoatRoughness: 0.38,
  });

  const plaqueMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x1b1b1b,
    metalness: 1.0,
    roughness: 0.50,
    envMapIntensity: 1.05,
    clearcoat: 0.55,
    clearcoatRoughness: 0.34,
  });

  const cubeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x242424,
    metalness: 1.0,
    roughness: 0.48,
    envMapIntensity: 1.0,
    clearcoat: 0.58,
    clearcoatRoughness: 0.32,
  });

  const cubeEdgeMaterial = new THREE.LineBasicMaterial({
    color: 0x8f8f8f,
    transparent: true,
    opacity: 0.22,
  });

  const assembly = new THREE.Group();
  assembly.rotation.order = "YXZ";
  scene.add(assembly);

  const cssBasisFlip = new THREE.Matrix4().makeScale(1, -1, 1);
  const cssMirrorMatrix = new THREE.Matrix4();

  const tabPlates = [];

  let plaque = null;
  let titleInner = null;
  let centerCube = null;
  let cubeRotor = null;
  let centerCubeMesh = null;
  let centerCubeEdges = null;

  let titleNatW = 0;
  let titleNatH = 0;
  let titleScale = 1;
  let cubeCurrentSize = 0;
  let heroFont = null;
  let rafId = 0;
  let stopped = false;
  let lastFrameTime = performance.now();

  // Paused is not stopped. stop() is teardown - it disposes geometry, materials and the
  // renderer, and cannot be undone. This is the reversible one: the scene stays built and
  // only the frame loop halts, so resuming is a single rAF and the plaque looks identical
  // the instant it comes back.
  let paused = false;

  function buildTextGeo(text, size) {
    const geometry = new TextGeometry(text, {
      font: heroFont,
      size,
      depth: DEPTH,
      curveSegments: 14,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.012,
      bevelSegments: 5,
    });

    geometry.center();
    geometry.computeBoundingBox();
    geometry.computeVertexNormals();
    return geometry;
  }

  function buildCenterGeometry(size) {
    switch (CENTER_SHAPE) {
      case "dodecahedron":
        return new THREE.DodecahedronGeometry(size * 0.78, 0);
      case "icosahedron":
        return new THREE.IcosahedronGeometry(size * 0.78, 0);
      case "octahedron":
        return new THREE.OctahedronGeometry(size * 0.84, 0);
      case "sphere":
        return new THREE.SphereGeometry(size * 0.48, 28, 18);
      case "tetrahedron":
        return new THREE.TetrahedronGeometry(size * 0.86, 0);
      case "cube":
      default:
        return new RoundedBoxGeometry(size, size, size, 4, size * 0.08);
    }
  }

  function rebuildCube(size) {
    if (!centerCubeMesh || !centerCubeEdges) return;
    if (Math.abs(size - cubeCurrentSize) < 0.01) return;

    cubeCurrentSize = size;

    centerCubeMesh.geometry.dispose();
    centerCubeMesh.geometry = buildCenterGeometry(size);

    centerCubeEdges.geometry.dispose();
    centerCubeEdges.geometry = new THREE.EdgesGeometry(centerCubeMesh.geometry);
  }

  function screenYToWorldY(screenY, canvasRect) {
    const frac = (screenY - canvasRect.top) / canvasRect.height;
    return ORTHO_HEIGHT / 2 - frac * ORTHO_HEIGHT;
  }

  function resizePipeline(width, height) {
    renderer.setSize(width, height, false);
    pipeline.bloomComposer.setSize(width, height);
    pipeline.finalComposer.setSize(width, height);
  }

  function layout() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;

    resizePipeline(w, h);
    updateOrtho();

    const aspect = w / h;
    const pxPerWorld = h / ORTHO_HEIGHT;
    let plaqueH = ORTHO_HEIGHT * (1 - 2 * PADDING);
    let plaqueW = ORTHO_HEIGHT * aspect * (1 - 2 * PADDING);

    // The .plaque-stack box IS the plaque. CSS padding on the stack is the
    // single source of truth for interior margins -- never add sizing fudge factors here.
    if (plaqueStack && plaqueStack.offsetWidth > 0 && plaqueStack.offsetHeight > 0) {
      plaqueW = plaqueStack.offsetWidth / pxPerWorld;
      plaqueH = plaqueStack.offsetHeight / pxPerWorld;
    }

    if (plaque) {
      plaque.geometry.dispose();
      plaque.geometry = new RoundedBoxGeometry(plaqueW, plaqueH, DEPTH, 5, PLAQUE_RADIUS);
    }

    for (const tab of tabPlates) {
      const cw = tab.dom.offsetWidth;
      const ch = tab.dom.offsetHeight;
      if (!cw || !ch) continue;

      const worldW = cw / pxPerWorld + TAB_PLATE_PAD;
      const worldH = ch / pxPerWorld + TAB_PLATE_PAD;

      tab.mesh.geometry.dispose();
      tab.mesh.geometry = new RoundedBoxGeometry(worldW, worldH, DEPTH, 5, PLAQUE_RADIUS);

      const desiredOpenPxX = (plaqueW / 2 + worldW / 2 - worldW * TAB_BEHIND_FRAC) * pxPerWorld;
      const maxOpenPxX = Math.max(0, w / 2 - cw / 2 - 18);

      tab.openPxX = Math.min(desiredOpenPxX, maxOpenPxX);
      tab.openWorldX = tab.openPxX / pxPerWorld;
      tab.hiddenPxOpen = Math.max(0, plaqueStack.offsetWidth / 2 - tab.openPxX + cw / 2);
      tab.contentWidth = Math.max(168, cw - tab.hiddenPxOpen - 28);

      tab.surface.style.width = `${tab.contentWidth}px`;
      tab.surface.style.boxSizing = "border-box";
    }

    // All 3D layout mirrors DOM slot rects. Never position or size a 3D
    // element from plaque geometry -- add/resize the DOM slot instead.
    const canvasRect = canvas.getBoundingClientRect();

    if (titleInner && titleNatW && titleSlot) {
      const slotRect = titleSlot.getBoundingClientRect();
      const maxW = Math.min(plaqueW * 0.82, slotRect.width / pxPerWorld);
      const maxH = (slotRect.height / pxPerWorld) * TITLE_SLOT_FILL;
      titleScale = Math.min(maxW / titleNatW, maxH / titleNatH);

      titleInner.scale.set(titleScale, titleScale, 1);
      titleInner.position.set(
        (slotRect.left + slotRect.width / 2 - canvasRect.left - canvasRect.width / 2) / pxPerWorld,
        screenYToWorldY(slotRect.top + slotRect.height / 2, canvasRect),
        DEPTH,
      );
    }

    if (centerCube && shapeSlot) {
      const slotRect = shapeSlot.getBoundingClientRect();
      const cubeSize = slotRect.height / pxPerWorld;
      rebuildCube(cubeSize);
      centerCube.position.set(
        (slotRect.left + slotRect.width / 2 - canvasRect.left - canvasRect.width / 2) / pxPerWorld,
        screenYToWorldY(slotRect.top + slotRect.height / 2, canvasRect),
        DEPTH + cubeSize * 0.58,
      );
    }
  }

  function renderFrame(t, dt) {
    const smoothing = 1 - Math.pow(1 - MOUSE_SMOOTHING, dt * 60);
    mouseS.x += (mouse.x - mouseS.x) * smoothing;
    mouseS.y += (mouse.y - mouseS.y) * smoothing;

    const cursorEnergy = clamp(Math.hypot(mouseS.x, mouseS.y) / Math.SQRT2, 0, 1);
    const sweep = 0.5 + 0.5 * Math.sin(t * 0.72 + mouseS.x * 1.8 - mouseS.y * 1.1);

    keyLight.position.set(mouseS.x * LIGHT_RANGE, -mouseS.y * LIGHT_RANGE, 6);
    keyLight.intensity = prefersReduced ? 1.20 : 1.20 + cursorEnergy * 0.30 + sweep * 0.08;
    fillLight.intensity = 0.28 + cursorEnergy * 0.08;
    rimLight.intensity = 0.90 + cursorEnergy * 0.18;

    titleFrontMaterial.emissiveIntensity = 0.42 + cursorEnergy * 0.30 + sweep * 0.08;
    titleFrontMaterial.envMapIntensity = 0.78 + cursorEnergy * 0.15;

    let wobbleX = 0;
    let wobbleY = 0;

    if (!prefersReduced) {
      wobbleX = Math.sin(t * 0.50) * 0.008;
      wobbleY = Math.cos(t * 0.38) * 0.010;
    }

    const targetX = mouseS.y * -TILT_PITCH + wobbleX;
    const targetY = mouseS.x * TILT_YAW + wobbleY;

    assembly.rotation.x += (targetX - assembly.rotation.x) * 0.09;
    assembly.rotation.y += (targetY - assembly.rotation.y) * 0.09;

    if (tabPlates.length) {
      const tabEase = 1 - Math.pow(1 - TAB_SLIDE_SMOOTH, dt * 60);

      for (const tab of tabPlates) {
        const target = tab.dom.classList.contains("is-open") ? 1 : 0;
        tab.openAmount += (target - tab.openAmount) * tabEase;

        if (tab.openAmount < 0.002 && target === 0) {
          tab.openAmount = 0;
          if (tab.mesh.visible) tab.mesh.visible = false;
          if (tab.dom.style.opacity !== "0") {
            tab.dom.style.opacity = "0";
            tab.dom.style.pointerEvents = "none";
          }
          tab.dom.style.clipPath = tab.dir > 0
            ? "inset(0 0 0 100%)"
            : "inset(0 100% 0 0)";
          tab.surface.style.transform = "";
          tab.dom.style.transform = "translate(-50%, -50%)";
          continue;
        }

        tab.mesh.visible = true;
        tab.mesh.position.x = tab.dir * tab.openWorldX * tab.openAmount;

        const fade = clamp((tab.openAmount - 0.18) / 0.82, 0, 1);
        const tabW = tab.dom.offsetWidth || 1;
        const plaqueW = plaqueStack ? plaqueStack.offsetWidth : 0;
        const currentX = tab.openPxX * tab.openAmount;
        const hiddenPx = Math.max(0, plaqueW / 2 - currentX + tabW / 2 + 12);
        const tuckedInset = clamp((hiddenPx / tabW) * 100, 0, 100);

        tab.dom.style.opacity = String(fade);
        tab.dom.style.clipPath = tab.dir > 0
          ? `inset(0 0 0 ${tuckedInset}%)`
          : `inset(0 ${tuckedInset}% 0 0)`;
        tab.surface.style.transform = tab.dir > 0
          ? `translateX(${tab.hiddenPxOpen}px)`
          : "translateX(0)";
        tab.dom.style.pointerEvents = fade > 0.6 ? "auto" : "none";
        tab.dom.style.transform =
          `translate(-50%, -50%) translateX(${tab.dir * tab.openPxX * tab.openAmount}px)`;
      }
    }

    if (cubeRotor) {
      const spinYInput = signedCurve(mouseS.x, CUBE_CENTER_DEADZONE, CUBE_SPIN_CURVE);
      const spinXInput = signedCurve(mouseS.y, CUBE_CENTER_DEADZONE, CUBE_SPIN_CURVE);

      const cubeSpinSpeed = prefersReduced
        ? CUBE_MAX_SPIN_SPEED * 0.45
        : CUBE_MAX_SPIN_SPEED;

      cubeRotor.rotation.y += spinYInput * cubeSpinSpeed * dt;
      cubeRotor.rotation.x += spinXInput * cubeSpinSpeed * dt;
      cubeRotor.rotation.z += spinXInput * spinYInput * cubeSpinSpeed * 0.20 * dt;
    }

    if (plaqueStack) {
      assembly.updateMatrix();
      cssMirrorMatrix.copy(cssBasisFlip).multiply(assembly.matrix).multiply(cssBasisFlip);

      const m = cssMirrorMatrix.elements.map(value => (
        Math.abs(value) < 1e-10 ? 0 : Number(value.toFixed(10))
      ));

      plaqueStack.style.transform = `matrix3d(${m.join(",")})`;
    }

    camera.layers.set(BLOOM_LAYER);
    pipeline.bloomComposer.render();

    camera.layers.set(DEFAULT_LAYER);
    pipeline.finalComposer.render();
  }

  // If any frame throws, the rAF chain would die SILENTLY — plaque frozen,
  // nothing in the console. Fail loudly and hand the page back to the DOM
  // text fallback instead of leaving a corpse on screen.
  function restoreDomFallback() {
    if (heroTitle) heroTitle.classList.remove("hidden-by-3d");
    if (heroSubtitle) heroSubtitle.classList.remove("hidden-by-3d");
    canvas.classList.remove("active");
    if (heroPlaque) heroPlaque.classList.remove("plaque-active", "webgl-tabs");
    if (plaqueStack) plaqueStack.style.transform = "";

    for (const tab of tabPlates) {
      tab.dom.removeAttribute("style");
    }
  }

  function animate() {
    if (stopped || paused) return;

    const now = performance.now();
    const t = now / 1000;
    const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    try {
      renderFrame(t, dt);
    } catch (error) {
      console.error("hero-3d: render frame failed; restoring DOM fallback.", error);
      restoreDomFallback();
      stop();
      return;
    }

    rafId = requestAnimationFrame(animate);
  }

  function disposeObject(object) {
    object.traverse((child) => {
      if (child.geometry) child.geometry.dispose();

      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) material.dispose();
      }
    });
  }

  function stop() {
    if (stopped) return;
    stopped = true;

    cancelAnimationFrame(rafId);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("mousemove", onPointerMove);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("resize", layout);
    window.removeEventListener("pagehide", stop);

    disposeObject(assembly);
    envMap.dispose();
    pmrem.dispose();
    pipeline.bloomComposer.dispose();
    pipeline.finalComposer.dispose();
    renderer.dispose();
    window.__hero3dReady = false;
  }

  new FontLoader().load(
    FONT_URL,
    (font) => {
      if (stopped) return;
      heroFont = font;

      const nameGeo = buildTextGeo(TITLE_TEXT, 1.0);
      const subGeo  = buildTextGeo(SUBTITLE_TEXT, SUB_SCALE);

      const nb = nameGeo.boundingBox;
      const sb = subGeo.boundingBox;

      const nameH = nb.max.y - nb.min.y;
      const subH  = sb.max.y - sb.min.y;
      const nameW = nb.max.x - nb.min.x;
      const subW  = sb.max.x - sb.min.x;

      const titleMaterials = [titleFrontMaterial, titleSideMaterial];
      const nameMesh = new THREE.Mesh(nameGeo, titleMaterials);
      const subMesh  = new THREE.Mesh(subGeo, titleMaterials);

      nameMesh.layers.enable(BLOOM_LAYER);
      subMesh.layers.enable(BLOOM_LAYER);

      nameMesh.position.y =  (subH + SUB_GAP) / 2;
      subMesh.position.y  = -(nameH + SUB_GAP) / 2;

      titleInner = new THREE.Group();
      titleInner.add(nameMesh, subMesh);

      titleNatW = Math.max(nameW, subW);
      titleNatH = nameH + subH + SUB_GAP;

      plaque = new THREE.Mesh(
        new RoundedBoxGeometry(1, 1, DEPTH, 5, PLAQUE_RADIUS),
        plaqueMaterial,
      );

      centerCube = new THREE.Group();
      cubeRotor = new THREE.Group();
      cubeRotor.rotation.set(-0.58, 0.74, 0.08);

      centerCubeMesh = new THREE.Mesh(
        buildCenterGeometry(0.26),
        cubeMaterial,
      );
      centerCubeEdges = new THREE.LineSegments(
        new THREE.EdgesGeometry(centerCubeMesh.geometry),
        cubeEdgeMaterial,
      );

      cubeRotor.add(centerCubeMesh, centerCubeEdges);
      centerCube.add(cubeRotor);

      assembly.add(plaque, titleInner, centerCube);

      if (webglTabsEnabled) {
        for (const item of dockItems) {
          const dom = item.querySelector(".plaque-tab");
          const surface = dom ? dom.querySelector(".plaque-tab-surface") : null;
          if (!dom || !surface) continue;

          const mesh = new THREE.Mesh(
            new RoundedBoxGeometry(1, 1, DEPTH, 5, PLAQUE_RADIUS),
            plaqueMaterial,
          );
          mesh.position.set(0, 0, TAB_PLATE_Z_OFFSET);
          mesh.visible = false;
          assembly.add(mesh);

          // The DOM panel becomes a pure content layer; JS owns its position,
          // slide, and fade so it tracks the 3D plate exactly. No CSS transition.
          dom.style.top = "50%";
          dom.style.left = "50%";
          dom.style.right = "auto";
          dom.style.bottom = "auto";
          dom.style.transformOrigin = "center center";
          dom.style.transition = "none";
          dom.style.clipPath = item.classList.contains("plaque-tab-right")
            ? "inset(0 0 0 100%)"
            : "inset(0 100% 0 0)";
          surface.style.transform = "";
          dom.style.opacity = "0";
          dom.style.pointerEvents = "none";

          tabPlates.push({
            dom,
            surface,
            dir: item.classList.contains("plaque-tab-right") ? 1 : -1,
            mesh,
            openAmount: 0,
            openWorldX: 0,
            openPxX: 0,
            hiddenPxOpen: 0,
            contentWidth: 0,
          });
        }

        if (tabPlates.length && heroPlaque) heroPlaque.classList.add("webgl-tabs");
      }

      if (heroTitle) heroTitle.classList.add("hidden-by-3d");
      if (heroSubtitle) heroSubtitle.classList.add("hidden-by-3d");
      canvas.classList.add("active");
      if (heroPlaque) heroPlaque.classList.add("plaque-active");

      requestAnimationFrame(() => {
        layout();
        lastFrameTime = performance.now();
        rafId = requestAnimationFrame(animate);
      });
    },
    undefined,
    (error) => {
      console.warn("3D hero font failed to load; falling back to DOM text.", error);
      stop();
    },
  );

  window.addEventListener("resize", layout, { passive: true });
  window.addEventListener("pagehide", stop, { once: true });

  /*
   * Render only while the plaque is actually on a screen someone is looking at.
   *
   * The loop ran unconditionally: bloom, a post-processing chain and a full WebGL frame,
   * sixty times a second, for as long as the tab existed - with the hero scrolled far
   * offscreen, and in background tabs. Nothing about that reached a viewer's eye; it
   * reached their battery and the main thread, and it is a large part of why Lighthouse
   * marks these pages down.
   *
   * Nothing here changes a single pixel of how the plaque looks. It changes when the
   * frames are drawn at all.
   */
  function pause() {
    if (paused || stopped) return;
    paused = true;
    cancelAnimationFrame(rafId);
  }

  function resume() {
    if (!paused || stopped) return;
    paused = false;
    // Reset the clock, or the first frame back computes dt from however long the tab sat
    // hidden and the animation jumps.
    lastFrameTime = performance.now();
    rafId = requestAnimationFrame(animate);
  }

  // Scrolled out of view is the same as not being looked at. Assume on-screen until the
  // observer says otherwise, so a browser without it simply keeps the old behaviour.
  let onScreen = true;

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
    else if (onScreen) resume();
  });

  // Observe the SECTION, never the canvas.
  //
  // .hero-3d-canvas is display:none until this module adds .active once the font has
  // loaded, and a display:none element never intersects anything. Observing it meant the
  // observer fired isIntersecting:false immediately, paused the loop before it had
  // started, and the plaque never rendered at all. #hero-plaque is laid out from first
  // paint, so it reports honestly.
  const visibilityTarget = heroPlaque || canvas.parentElement;
  if (typeof IntersectionObserver === "function" && visibilityTarget) {
    new IntersectionObserver((entries) => {
      onScreen = entries[0].isIntersecting;
      if (onScreen && !document.hidden) resume();
      else pause();
    }, { threshold: 0 }).observe(visibilityTarget);
  }
}

// init() refuses to start below the mobile breakpoint, but a page can load in
// a narrow window and be widened later (or the viewport can report 0x0 during
// startup in some embedders). Without this retry the 3D would never appear
// until a full reload.
function boot() {
  if (window.innerWidth >= MOBILE_BREAKPOINT) {
    init();
    return;
  }

  window.addEventListener("resize", function retryInit() {
    if (window.innerWidth >= MOBILE_BREAKPOINT && !window.__hero3dReady) {
      window.removeEventListener("resize", retryInit);
      init();
    }
  }, { passive: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
