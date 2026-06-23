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
};

const PAGE_KIND = PAGE_PATH.includes("portfolio.html") ? "portfolio" : "home";
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

const MAX_PIXEL_RATIO = 1.75;
const DEPTH          = 0.18;
const ORTHO_HEIGHT   = 3.6;
const PADDING        = 0.04;
const PLAQUE_RADIUS  = 0.07;
const TITLE_BAND_FRAC = 0.32;

const CUBE_SIZE_MIN = 0.18;
const CUBE_SIZE_MAX = 0.36;
const CUBE_GAP_FILL = 0.34;
const CUBE_VERTICAL_NUDGE = 0.02;
const CUBE_CENTER_DEADZONE = 0.025;
const CUBE_MAX_SPIN_SPEED = 4.25;
const CUBE_SPIN_CURVE = 1.15;

const TILT_PITCH = 0.13;
const TILT_YAW   = 0.20;
const LIGHT_RANGE = 8;
const MOUSE_SMOOTHING = 0.11;

const BLOOM_THRESHOLD = 0.88;
const BLOOM_STRENGTH  = 0.28;
const BLOOM_RADIUS    = 0.22;

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
  renderer.toneMappingExposure = 0.92;
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
  const plaqueBio    = heroPlaque ? heroPlaque.querySelector(".plaque-bio") : null;

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

  let plaque = null;
  let titleInner = null;
  let centerCube = null;
  let cubeRotor = null;
  let centerCubeMesh = null;
  let centerCubeEdges = null;

  let titleNatW = 0;
  let titleNatH = 0;
  let titleScale = 1;
  let titleBottomWorldY = 0;
  let cubeCurrentSize = 0;
  let heroFont = null;
  let rafId = 0;
  let stopped = false;
  let lastFrameTime = performance.now();

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
    if (CENTER_SHAPE === "dodecahedron") {
      return new THREE.DodecahedronGeometry(size * 0.78, 0);
    }

    return new RoundedBoxGeometry(size, size, size, 4, size * 0.08);
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
    const plaqueH = ORTHO_HEIGHT * (1 - 2 * PADDING);
    const plaqueW = ORTHO_HEIGHT * aspect * (1 - 2 * PADDING);

    if (plaque) {
      plaque.geometry.dispose();
      plaque.geometry = new RoundedBoxGeometry(plaqueW, plaqueH, DEPTH, 5, PLAQUE_RADIUS);
    }

    let bandFrac = TITLE_BAND_FRAC;
    if (titleSlot) {
      const f = titleSlot.getBoundingClientRect().height / h;
      if (f > 0.05 && f < 0.9) bandFrac = f;
    }

    const bandH = plaqueH * bandFrac;

    if (titleInner && titleNatW) {
      const maxW = plaqueW * 0.82;
      const maxH = bandH * 0.62;
      titleScale = Math.min(maxW / titleNatW, maxH / titleNatH);

      titleInner.scale.set(titleScale, titleScale, 1);
      titleInner.position.set(0, plaqueH / 2 - bandH / 2, DEPTH);
      titleBottomWorldY = titleInner.position.y - (titleNatH * titleScale) / 2;
    }

    if (centerCube) {
      let cubeWorldY = plaqueH * 0.18;
      let cubeSize = 0.26;

      if (plaqueBio && titleInner) {
        const canvasRect = canvas.getBoundingClientRect();
        const bioRect = plaqueBio.getBoundingClientRect();

        if (canvasRect.height > 0 && bioRect.height > 0) {
          const bioTopWorldY = screenYToWorldY(bioRect.top, canvasRect);
          const gapWorldH = titleBottomWorldY - bioTopWorldY;

          if (gapWorldH > 0.12) {
            cubeWorldY = bioTopWorldY + gapWorldH / 2 + CUBE_VERTICAL_NUDGE;
            cubeSize = clamp(gapWorldH * CUBE_GAP_FILL, CUBE_SIZE_MIN, CUBE_SIZE_MAX);
          }
        }
      }

      rebuildCube(cubeSize);
      centerCube.position.set(0, cubeWorldY, DEPTH + cubeSize * 0.58);
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

  function animate() {
    if (stopped) return;

    const now = performance.now();
    const t = now / 1000;
    const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    renderFrame(t, dt);
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
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
