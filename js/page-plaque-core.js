/*
 * page-plaque-core.js — shared foundation for page-level 3D plaques.
 *
 * This file intentionally does not auto-run. It exports small helpers that
 * reproduce the homepage plaque architecture safely:
 *   - orthographic camera sizing
 *   - metal/clearcoat material setup
 *   - RoomEnvironment PMREM support
 *   - pointer-driven light/tilt smoothing
 *   - HTML overlay matrix synchronization
 *
 * Later page renderers should import this module instead of cloning the same
 * plaque math into every page.
 */

export const PAGE_PLAQUE_DEFAULTS = Object.freeze({
  mobileBreakpoint: 720,
  maxPixelRatio: 1.75,
  orthoHeight: 3.6,
  padding: 0.04,
  plaqueDepth: 0.18,
  plaqueRadius: 0.07,
  tiltPitch: 0.14,
  tiltYaw: 0.22,
  tiltLerp: 0.1,
  lightRange: 9,
});

export function isDesktopViewport(width = window.innerWidth, breakpoint = PAGE_PLAQUE_DEFAULTS.mobileBreakpoint) {
  return width >= breakpoint;
}

export function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export function clampPixelRatio(ratio = window.devicePixelRatio || 1, max = PAGE_PLAQUE_DEFAULTS.maxPixelRatio) {
  return Math.min(ratio, max);
}

export function createPointerTracker(target = window) {
  const pointer = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };

  function onPointerMove(event) {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    pointer.x = (event.clientX / width) * 2 - 1;
    pointer.y = (event.clientY / height) * 2 - 1;
  }

  target.addEventListener("pointermove", onPointerMove, { passive: true });

  return {
    pointer,
    smooth,
    dispose() {
      target.removeEventListener("pointermove", onPointerMove);
    },
  };
}

export function createOrthographicCamera(THREE, canvas, orthoHeight = PAGE_PLAQUE_DEFAULTS.orthoHeight) {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  camera.position.set(0, 0, 10);
  updateOrthographicCamera(camera, canvas, orthoHeight);
  return camera;
}

export function updateOrthographicCamera(camera, canvas, orthoHeight = PAGE_PLAQUE_DEFAULTS.orthoHeight) {
  const aspect = (canvas?.clientWidth || 1) / (canvas?.clientHeight || 1);
  const height = orthoHeight;
  const width = height * aspect;
  camera.left = -width / 2;
  camera.right = width / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.updateProjectionMatrix();
}

export function createRenderer(THREE, canvas, options = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
    ...options,
  });

  renderer.setPixelRatio(clampPixelRatio());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  return renderer;
}

export function createEnvironment(THREE, RoomEnvironment, renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  return pmrem;
}

export function createPlaqueLights(THREE, scene) {
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

  return { keyLight, fillLight, rimLight };
}

export function createMetalMaterial(THREE, overrides = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: 0x2b2b2b,
    metalness: 1.0,
    roughness: 0.62,
    envMapIntensity: 0.8,
    clearcoat: 0.35,
    clearcoatRoughness: 0.5,
    ...overrides,
  });
}

export function createRoundedPlaque(RoundedBoxGeometry, width, height, material, options = {}) {
  const depth = options.depth ?? PAGE_PLAQUE_DEFAULTS.plaqueDepth;
  const radius = options.radius ?? PAGE_PLAQUE_DEFAULTS.plaqueRadius;
  const segments = options.segments ?? 4;
  return new RoundedBoxGeometry(width, height, depth, segments, radius);
}

export function calculatePlaqueSize(canvas, options = {}) {
  const orthoHeight = options.orthoHeight ?? PAGE_PLAQUE_DEFAULTS.orthoHeight;
  const padding = options.padding ?? PAGE_PLAQUE_DEFAULTS.padding;
  const aspect = (canvas?.clientWidth || 1) / (canvas?.clientHeight || 1);
  return {
    width: orthoHeight * aspect * (1 - 2 * padding),
    height: orthoHeight * (1 - 2 * padding),
  };
}

export function createCssMirrorMatrices(THREE) {
  return {
    basisFlip: new THREE.Matrix4().makeScale(1, -1, 1),
    mirror: new THREE.Matrix4(),
  };
}

export function matrix3dFromObject(THREE, object, matrices) {
  object.updateMatrix();
  matrices.mirror.copy(matrices.basisFlip).multiply(object.matrix).multiply(matrices.basisFlip);
  const values = matrices.mirror.elements.map((value) => (
    Math.abs(value) < 1e-10 ? 0 : Number(value.toFixed(10))
  ));
  return `matrix3d(${values.join(",")})`;
}

export function stepPlaqueMotion(THREE, config) {
  const {
    assembly,
    overlay,
    tracker,
    keyLight,
    matrices,
    timeSeconds,
    reducedMotion = prefersReducedMotion(),
    options = {},
  } = config;

  const tiltPitch = options.tiltPitch ?? PAGE_PLAQUE_DEFAULTS.tiltPitch;
  const tiltYaw = options.tiltYaw ?? PAGE_PLAQUE_DEFAULTS.tiltYaw;
  const tiltLerp = options.tiltLerp ?? PAGE_PLAQUE_DEFAULTS.tiltLerp;
  const lightRange = options.lightRange ?? PAGE_PLAQUE_DEFAULTS.lightRange;

  tracker.smooth.x += (tracker.pointer.x - tracker.smooth.x) * tiltLerp;
  tracker.smooth.y += (tracker.pointer.y - tracker.smooth.y) * tiltLerp;

  if (keyLight) {
    keyLight.position.set(tracker.smooth.x * lightRange, -tracker.smooth.y * lightRange, 6);
    keyLight.intensity = reducedMotion ? 1.6 : 1.6 + Math.sin(timeSeconds * 0.55) * 0.3;
  }

  const wobbleX = reducedMotion ? 0 : Math.sin(timeSeconds * 0.6) * 0.012;
  const wobbleY = reducedMotion ? 0 : Math.cos(timeSeconds * 0.45) * 0.016;
  const targetX = tracker.smooth.y * -tiltPitch + wobbleX;
  const targetY = tracker.smooth.x * tiltYaw + wobbleY;

  assembly.rotation.x += (targetX - assembly.rotation.x) * tiltLerp;
  assembly.rotation.y += (targetY - assembly.rotation.y) * tiltLerp;

  if (overlay && matrices) {
    overlay.style.transform = matrix3dFromObject(THREE, assembly, matrices);
  }
}

export function disposeObject3D(object) {
  object.traverse?.((child) => {
    if (child.geometry) child.geometry.dispose?.();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose?.());
      else child.material.dispose?.();
    }
  });
}
