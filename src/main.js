import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PAINTING_W, PAINTING_H, PAINTING_D, DETAIL_STOPS } from './details-data.js';
import { buildChristmasScene } from './scene-christmas.js';
import { buildPainting } from './scene-painting.js';
import { createBlurCompositor } from './post-blur.js';

// Easing utilities
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// DOM References
const canvas = document.getElementById('webgl-canvas');
const btnOpen = document.getElementById('btn-open');
const btnDetails = document.getElementById('btn-details');
const btnFlip = document.getElementById('btn-flip');
const btnLang = document.getElementById('btn-lang');
const btnCloseDetails = document.getElementById('btn-close-details');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const touchHint = document.getElementById('touch-hint');
const tourProgress = document.getElementById('tour-progress');
const detailTitle = document.getElementById('detail-title');
const detailText = document.getElementById('detail-text');
const detailCardBody = document.querySelector('.detail-card-body');
const detailDotsWrap = document.getElementById('detail-dots');

// State
let appState = 'loading'; // 'loading' | 'closed' | 'opening' | 'gallery' | 'details'
let currentLang = 'en';
let currentStopIndex = 0;
let blurFactor = 0;
let illuminateFactor = 0;

// Opening animation timeline state
let openingElapsed = 0;
let sparklesTriggered = false;
let handedOffToPaintingScene = false;
const OPENING_DURATION = 2.9;
const HANDOFF_TIME = 0.95;

// Build detail pagination dots
const dotElements = DETAIL_STOPS.map(() => {
  const dot = document.createElement('span');
  dot.className = 'detail-dot';
  detailDotsWrap.appendChild(dot);
  return dot;
});

function setAppState(nextState) {
  appState = nextState;
  document.body.dataset.state = nextState;
}

// Three.js Renderer & Scenes
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.autoClear = false;

const bgScene = new THREE.Scene();
const paintingScene = new THREE.Scene();

const aspect = window.innerWidth / window.innerHeight;
const FOV = 45;
const bgCamera = new THREE.PerspectiveCamera(FOV, aspect, 0.1, 60);
const paintingCamera = new THREE.PerspectiveCamera(FOV, aspect, 0.05, 30);

// Dedicated Gallery Lighting for the 3D Painting (Front + Back so flipped canvas is warmly lit)
const pHemi = new THREE.HemisphereLight(0xfff4e2, 0x263242, 0.95);
paintingScene.add(pHemi);

const pKeyFront = new THREE.DirectionalLight(0xfff1dc, 1.45);
pKeyFront.position.set(2.2, 2.8, 3.8);
paintingScene.add(pKeyFront);

const pFillFront = new THREE.DirectionalLight(0xd9e7f8, 0.55);
pFillFront.position.set(-2.8, 0.8, 2.5);
paintingScene.add(pFillFront);

const pKeyBack = new THREE.DirectionalLight(0xffe9ca, 1.25);
pKeyBack.position.set(-1.6, 2.0, -3.6);
paintingScene.add(pKeyBack);

const pFillBack = new THREE.DirectionalLight(0xdfe8f5, 0.55);
pFillBack.position.set(2.2, -0.5, -3.2);
paintingScene.add(pFillBack);

// OrbitControls for Free 3D View & Manual Inspection
const controls = new OrbitControls(paintingCamera, canvas);
controls.enabled = false;
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.enablePan = true;
controls.enableZoom = true;
controls.minDistance = 0.45;
controls.maxDistance = 8.5;
controls.rotateSpeed = 0.82;
controls.zoomSpeed = 0.9;
controls.panSpeed = 0.75;
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN,
};

// Responsive Camera Pose Helpers
function getClosedCameraPose() {
  const a = window.innerWidth / window.innerHeight;
  if (a < 0.85) {
    const z = 3.85 + (0.85 - a) * 2.0;
    return {
      pos: new THREE.Vector3(0, 0.54, z),
      target: new THREE.Vector3(0, 0.08, 0),
    };
  }
  return {
    pos: new THREE.Vector3(0, 0.58, 3.7),
    target: new THREE.Vector3(0, 0.12, 0),
  };
}

function getGalleryCameraPose(side = 'front') {
  const a = window.innerWidth / window.innerHeight;
  const vFov = THREE.MathUtils.degToRad(FOV) * 0.5;
  const tanV = Math.tan(vFov);
  const tanH = tanV * a;

  const distW = (PAINTING_W * 0.5) / (0.78 * tanH);
  const distH = (PAINTING_H * 0.5) / (0.56 * tanV);
  const dist = Math.max(distW, distH, 2.55);

  const visibleH = 2 * dist * tanV;
  const targetY = -0.075 * visibleH;

  if (side === 'back') {
    return {
      pos: new THREE.Vector3(-0.16, targetY + 0.14, -dist),
      target: new THREE.Vector3(0, targetY, 0),
    };
  }
  return {
    pos: new THREE.Vector3(0.16, targetY + 0.14, dist),
    target: new THREE.Vector3(0, targetY, 0),
  };
}

function getDetailCameraPose(stop) {
  const a = window.innerWidth / window.innerHeight;
  const vFov = THREE.MathUtils.degToRad(FOV) * 0.5;
  const tanV = Math.tan(vFov);
  const tanH = tanV * a;

  const localX = (stop.u - 0.5) * PAINTING_W;
  const localY = (0.5 - stop.v) * PAINTING_H;

  const spanW = stop.side === 'back' ? PAINTING_W * 1.04 : stop.span;
  const spanH = stop.side === 'back' ? PAINTING_H * 1.04 : stop.span;

  const distW = (spanW * 0.5) / (0.74 * tanH);
  const distH = (spanH * 0.5) / (0.50 * tanV);
  const dist = Math.max(distW, distH, 0.78);

  const visibleH = 2 * dist * tanV;
  const yShift = 0.14 * visibleH;

  if (stop.side === 'back') {
    return {
      pos: new THREE.Vector3(localX - dist * 0.04, localY - yShift * 0.72, -PAINTING_D * 0.5 - dist),
      target: new THREE.Vector3(localX, localY - yShift, -PAINTING_D * 0.5),
    };
  }
  return {
    pos: new THREE.Vector3(localX + dist * 0.04, localY - yShift * 0.72, PAINTING_D * 0.5 + dist),
    target: new THREE.Vector3(localX, localY - yShift, PAINTING_D * 0.5),
  };
}

// Smooth Spherical Camera Tweening (prevents clipping through the canvas on front<->back transitions)
let activeTween = null;

function startCameraTween(toPos, toTarget, duration = 1.05) {
  const fromTarget = controls.target.clone();
  const fromOffset = paintingCamera.position.clone().sub(fromTarget);
  const toOffset = toPos.clone().sub(toTarget);

  const fromSph = new THREE.Spherical().setFromVector3(fromOffset);
  const toSph = new THREE.Spherical().setFromVector3(toOffset);

  // Shortest angular path for azimuth theta; break exact 180-deg ties smoothly around +X side
  let dTheta = toSph.theta - fromSph.theta;
  while (dTheta > Math.PI) dTheta -= Math.PI * 2;
  while (dTheta < -Math.PI) dTheta += Math.PI * 2;
  if (Math.abs(Math.abs(dTheta) - Math.PI) < 0.06) {
    dTheta = Math.PI;
  }

  activeTween = {
    elapsed: 0,
    duration,
    fromTarget,
    toTarget: toTarget.clone(),
    fromRadius: fromSph.radius,
    toRadius: toSph.radius,
    fromPhi: fromSph.phi,
    toPhi: toSph.phi,
    fromTheta: fromSph.theta,
    dTheta,
  };
}

function stepCameraTween(dt) {
  if (!activeTween) return;
  activeTween.elapsed += dt;
  const rawT = Math.min(1, activeTween.elapsed / activeTween.duration);
  const t = easeInOutCubic(rawT);

  const curTarget = new THREE.Vector3().lerpVectors(
    activeTween.fromTarget,
    activeTween.toTarget,
    t
  );
  const radius = THREE.MathUtils.lerp(activeTween.fromRadius, activeTween.toRadius, t);
  const phi = THREE.MathUtils.lerp(activeTween.fromPhi, activeTween.toPhi, t);
  const theta = activeTween.fromTheta + activeTween.dTheta * t;

  const offset = new THREE.Vector3().setFromSphericalCoords(radius, phi, theta);
  paintingCamera.position.copy(curTarget).add(offset);
  controls.target.copy(curTarget);
  paintingCamera.lookAt(curTarget);

  if (rawT >= 1) {
    activeTween = null;
  }
}

controls.addEventListener('start', () => {
  activeTween = null;
  if (touchHint && !touchHint.classList.contains('is-dismissed')) {
    touchHint.classList.add('is-dismissed');
  }
});

// Build Scenes & Compositor
const christmas = buildChristmasScene(bgScene);
const compositor = createBlurCompositor(renderer, window.innerWidth, window.innerHeight);

// Position closed bgCamera
const closedPose = getClosedCameraPose();
bgCamera.position.copy(closedPose.pos);
bgCamera.lookAt(closedPose.target);

let paintingCtrl = null;

async function init() {
  try {
    paintingCtrl = await buildPainting(
      './assets/angry-eliza.jpg',
      Math.min(8, renderer.capabilities.getMaxAnisotropy())
    );

    // Tuck painting cleanly inside the hollow gift box while closed
    const { paintingGroup } = paintingCtrl;
    paintingGroup.position.set(0, -0.35, 0);
    paintingGroup.rotation.set(0, -0.22, 0);
    paintingGroup.scale.setScalar(0.5);
    paintingGroup.visible = false; // Revealed when lid lifts
    bgScene.add(paintingGroup);

    setAppState('closed');
  } catch (err) {
    console.error('Failed to initialize gift experience:', err);
  }
}

// UI Update Helpers
function renderDetailStopUI(index, animateSwap = true) {
  const stop = DETAIL_STOPS[index];
  const copy = stop[currentLang];

  tourProgress.textContent = `${index + 1} / ${DETAIL_STOPS.length}`;
  btnPrev.disabled = index === 0;
  btnNext.textContent = index === DETAIL_STOPS.length - 1 ? 'Free View' : 'Next';

  dotElements.forEach((dot, idx) => {
    dot.classList.toggle('is-active', idx === index);
  });

  if (animateSwap) {
    detailCardBody.classList.add('is-swapping');
    setTimeout(() => {
      detailTitle.textContent = copy.title;
      detailText.textContent = copy.text;
      detailCardBody.classList.remove('is-swapping');
    }, 110);
  } else {
    detailTitle.textContent = copy.title;
    detailText.textContent = copy.text;
  }
}

function goToDetailStop(index) {
  currentStopIndex = Math.max(0, Math.min(DETAIL_STOPS.length - 1, index));
  const stop = DETAIL_STOPS[currentStopIndex];

  renderDetailStopUI(currentStopIndex, true);

  if (paintingCtrl) {
    paintingCtrl.setFocusSpot(stop.side === 'front' ? { u: stop.u, v: stop.v } : null, stop.span);
  }

  const pose = getDetailCameraPose(stop);
  startCameraTween(pose.pos, pose.target, 1.12);
}

function exitDetailsToGallery() {
  setAppState('gallery');
  if (paintingCtrl) paintingCtrl.setFocusSpot(null);
  const pose = getGalleryCameraPose('front');
  startCameraTween(pose.pos, pose.target, 1.05);
}

// Opening Animation Sequence
function startOpening() {
  if (appState !== 'closed' || !paintingCtrl) return;
  setAppState('opening');
  openingElapsed = 0;
  sparklesTriggered = false;
  handedOffToPaintingScene = false;
}

function updateOpening(dt) {
  openingElapsed += dt;
  const t = openingElapsed;
  const { giftGroup, lidGroup, interiorLight, interiorGlow } = christmas;
  const { paintingGroup } = paintingCtrl;

  // Phase 1 (0.00 - 0.45s): Joyful anticipation wiggle + interior glow
  if (t < 0.45) {
    const p = t / 0.45;
    giftGroup.rotation.z = Math.sin(p * Math.PI * 4) * 0.045 * (1 - p * 0.3);
    giftGroup.position.y = -0.35 + Math.sin(p * Math.PI * 2) * 0.03;
    interiorLight.intensity = p * 2.2;
    interiorGlow.material.opacity = p * 0.55;
  } else {
    giftGroup.rotation.z *= 0.85;
  }

  // Phase 2 (0.45 - 1.25s): Lid lifts, tilts backward, and glides away; painting emerges
  if (t >= 0.45) {
    if (!sparklesTriggered) {
      sparklesTriggered = true;
      christmas.triggerSparkles();
      paintingGroup.visible = true;
    }

    const lidP = Math.min(1, (t - 0.45) / 0.85);
    const lidE = easeOutCubic(lidP);
    lidGroup.position.y = 0.59 + lidE * 1.45;
    lidGroup.position.z = -lidE * 0.95;
    lidGroup.rotation.x = -lidE * 0.72;
    lidGroup.scale.setScalar(Math.max(0.01, 1 - Math.max(0, lidP - 0.55) * 2.1));
    if (lidP >= 1) lidGroup.visible = false;

    interiorLight.intensity = 2.2 + Math.sin(Math.min(1, (t - 0.45) / 0.6) * Math.PI) * 3.0;
    interiorGlow.material.opacity = Math.max(0, 0.8 - Math.max(0, (t - 0.95) * 0.6));
  }

  // Phase 2b (0.45 - 0.95s): Painting rises from inside the hollow box while occluded by front box wall
  if (t >= 0.45 && t < HANDOFF_TIME) {
    const emergeP = (t - 0.45) / (HANDOFF_TIME - 0.45);
    const e = easeOutCubic(emergeP);
    paintingGroup.position.y = THREE.MathUtils.lerp(-0.35, 0.36, e);
    paintingGroup.scale.setScalar(THREE.MathUtils.lerp(0.5, 0.84, e));
    paintingGroup.rotation.y = THREE.MathUtils.lerp(-0.22, 0.14, e);
  }

  // One-shot seamless handoff at t = 0.95s
  if (t >= HANDOFF_TIME && !handedOffToPaintingScene) {
    handedOffToPaintingScene = true;
    paintingScene.attach(paintingGroup);
    paintingCamera.position.copy(bgCamera.position);
    paintingCamera.quaternion.copy(bgCamera.quaternion);
    paintingCamera.updateProjectionMatrix();

    const galleryPose = getGalleryCameraPose('front');
    controls.target.copy(getClosedCameraPose().target);
    startCameraTween(galleryPose.pos, galleryPose.target, OPENING_DURATION - HANDOFF_TIME);
  }

  // Phase 3 (0.95 - 2.90s): Painting glides to gallery center, box sinks, background blurs & illuminates
  if (t >= HANDOFF_TIME) {
    const p = Math.min(1, (t - HANDOFF_TIME) / (OPENING_DURATION - HANDOFF_TIME));
    const e = easeInOutCubic(p);

    paintingGroup.position.set(
      THREE.MathUtils.lerp(paintingGroup.position.x, 0, Math.min(1, dt * 6.5)),
      THREE.MathUtils.lerp(0.36, 0, easeOutBack(Math.min(1, p * 1.15)) * 0.25 + e * 0.75),
      THREE.MathUtils.lerp(paintingGroup.position.z, 0, Math.min(1, dt * 6.5))
    );
    paintingGroup.scale.setScalar(THREE.MathUtils.lerp(0.84, 1.0, e));
    paintingGroup.rotation.y = THREE.MathUtils.lerp(0.14, 0, e) + Math.sin(p * Math.PI) * 0.22 * (1 - p);

    giftGroup.position.y = THREE.MathUtils.lerp(-0.35, -1.55, e);
    giftGroup.scale.setScalar(THREE.MathUtils.lerp(1.0, 0.82, e));

    blurFactor = e;
    illuminateFactor = easeOutCubic(p);
  }

  if (t >= OPENING_DURATION) {
    paintingGroup.position.set(0, 0, 0);
    paintingGroup.rotation.set(0, 0, 0);
    paintingGroup.scale.setScalar(1);
    giftGroup.visible = false;
    blurFactor = 1;
    illuminateFactor = 1;
    controls.enabled = true;
    setAppState('gallery');
  }
}

// Button Listeners
btnOpen.addEventListener('click', startOpening);

btnDetails.addEventListener('click', () => {
  if (appState !== 'gallery') return;
  setAppState('details');
  goToDetailStop(0);
});

btnNext.addEventListener('click', () => {
  if (appState !== 'details') return;
  if (currentStopIndex >= DETAIL_STOPS.length - 1) {
    exitDetailsToGallery();
  } else {
    goToDetailStop(currentStopIndex + 1);
  }
});

btnPrev.addEventListener('click', () => {
  if (appState !== 'details' || currentStopIndex <= 0) return;
  goToDetailStop(currentStopIndex - 1);
});

btnCloseDetails.addEventListener('click', () => {
  if (appState !== 'details') return;
  exitDetailsToGallery();
});

btnFlip.addEventListener('click', () => {
  if (appState !== 'gallery') return;
  const currentlyOnBack = paintingCamera.position.z < 0;
  const pose = getGalleryCameraPose(currentlyOnBack ? 'front' : 'back');
  startCameraTween(pose.pos, pose.target, 1.15);
});

btnLang.addEventListener('click', () => {
  currentLang = currentLang === 'en' ? 'fr' : 'en';
  btnLang.textContent = currentLang.toUpperCase();
  if (appState === 'details') {
    renderDetailStopUI(currentStopIndex, false);
  }
});

// Resize Handler
function handleResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const newAspect = w / h;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h);
  compositor.resize(w, h);

  bgCamera.aspect = newAspect;
  bgCamera.updateProjectionMatrix();
  paintingCamera.aspect = newAspect;
  paintingCamera.updateProjectionMatrix();

  if (appState === 'closed' || appState === 'loading') {
    const pose = getClosedCameraPose();
    bgCamera.position.copy(pose.pos);
    bgCamera.lookAt(pose.target);
  } else if (appState === 'gallery' && !activeTween) {
    const onBack = paintingCamera.position.z < 0;
    const pose = getGalleryCameraPose(onBack ? 'back' : 'front');
    startCameraTween(pose.pos, pose.target, 0.45);
  } else if (appState === 'details') {
    const pose = getDetailCameraPose(DETAIL_STOPS[currentStopIndex]);
    startCameraTween(pose.pos, pose.target, 0.45);
  }
}
window.addEventListener('resize', handleResize);

// Render Loop
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  christmas.update(elapsed, dt);
  if (paintingCtrl) paintingCtrl.update(elapsed);

  if (appState === 'closed') {
    // Gentle winter gift hover breathing
    christmas.giftGroup.position.y = -0.35 + Math.sin(elapsed * 1.4) * 0.015;
  } else if (appState === 'opening') {
    updateOpening(dt);
  }

  if (activeTween) {
    stepCameraTween(dt);
  } else if (controls.enabled) {
    controls.update();
  }

  // Subtle background parallax in gallery/details so blurred tree & snow breathe gently with camera orbit
  if (appState === 'gallery' || appState === 'details') {
    const basePose = getClosedCameraPose();
    const px = THREE.MathUtils.clamp(paintingCamera.position.x * 0.08, -0.45, 0.45);
    const py = THREE.MathUtils.clamp(paintingCamera.position.y * 0.06, -0.3, 0.3);
    bgCamera.position.set(basePose.pos.x + px, basePose.pos.y + py, basePose.pos.z);
    bgCamera.lookAt(basePose.target);
  }

  compositor.render(bgScene, bgCamera, paintingScene, paintingCamera, blurFactor, illuminateFactor);
}

init();
animate();
