import * as THREE from 'three';
import { PAINTING_W, PAINTING_H, PAINTING_D } from './details-data.js';

function createWeaveBumpTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const step = 8;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const warp = ((x / step) + (y / step)) % 2 === 0;
      ctx.fillStyle = warp ? '#b4b4b4' : '#585858';
      ctx.fillRect(x + 1, y + 1, step - 2, step - 2);
      ctx.fillStyle = warp ? '#949494' : '#6c6c6c';
      ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(28, 34);
  return tex;
}

function createLinenEdgeTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#d3c6af';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(130, 114, 90, 0.16)';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 10);
  return tex;
}

function createWoodTexture() {
  const w = 512;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#bc9466';
  ctx.fillRect(0, 0, w, h);

  let seed = 77;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < 65; i++) {
    const y = rand() * h;
    ctx.strokeStyle = `rgba(116, 78, 42, ${0.08 + rand() * 0.16})`;
    ctx.lineWidth = 1 + rand() * 2.4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      w * 0.33,
      y + (rand() - 0.5) * 10,
      w * 0.66,
      y + (rand() - 0.5) * 10,
      w,
      y + (rand() - 0.5) * 6
    );
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createBackCanvasTexture() {
  const w = 1024;
  const h = 1250;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Warm raw unprimed linen canvas
  ctx.fillStyle = '#dfd4be';
  ctx.fillRect(0, 0, w, h);

  // Subtle radial warmth & edge darkening
  const vignette = ctx.createRadialGradient(w * 0.5, h * 0.48, 120, w * 0.5, h * 0.5, w * 0.78);
  vignette.addColorStop(0, 'rgba(248, 240, 224, 0.22)');
  vignette.addColorStop(1, 'rgba(128, 108, 82, 0.18)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Woven linen grain
  ctx.strokeStyle = 'rgba(115, 96, 72, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 6) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Soft interior shadow frame where wooden stretcher bars touch the linen
  const inset = 68;
  ctx.strokeStyle = 'rgba(72, 54, 34, 0.24)';
  ctx.lineWidth = 18;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

  // Handwritten dedication ("Je t'aime" + "11.21.2026")
  ctx.save();
  ctx.translate(w * 0.5, h * 0.455);
  ctx.rotate(-0.038);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Subtle ink absorption bleed
  ctx.shadowColor = 'rgba(35, 25, 20, 0.18)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1.5;

  // Big "Je t'aime"
  ctx.fillStyle = '#241c19';
  ctx.font = '700 168px "Caveat", cursive';
  ctx.fillText("Je t'aime", 0, -34);

  // Organic pen-stroke weight reinforcement
  ctx.globalAlpha = 0.35;
  ctx.fillText("Je t'aime", 1.2, -33.2);
  ctx.globalAlpha = 1;

  // Date below
  ctx.fillStyle = '#332823';
  ctx.font = '600 76px "Caveat", cursive';
  ctx.fillText('11.21.2026', 4, 88);

  // Delicate hand-drawn miniature ink heart below the date
  ctx.strokeStyle = '#6f2229';
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 152);
  ctx.bezierCurveTo(-18, 134, -34, 152, 0, 178);
  ctx.bezierCurveTo(34, 152, 18, 134, 0, 152);
  ctx.stroke();

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export async function buildPainting(imageUrl, maxAnisotropy = 8) {
  // Ensure handwriting font is ready before drawing back canvas texture (with safe timeout)
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('700 120px "Caveat"'),
        document.fonts.load('600 72px "Caveat"'),
      ]),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch {
    // Safe fallback to cursive if offline
  }

  // Load main painting texture
  const loader = new THREE.TextureLoader();
  const frontTex = await loader.loadAsync(imageUrl);
  frontTex.colorSpace = THREE.SRGBColorSpace;
  frontTex.anisotropy = maxAnisotropy;

  const weaveBump = createWeaveBumpTexture();
  weaveBump.anisotropy = maxAnisotropy;

  const edgeLinenTex = createLinenEdgeTexture();
  const woodTex = createWoodTexture();
  const backTex = createBackCanvasTexture();
  backTex.anisotropy = maxAnisotropy;

  const paintingGroup = new THREE.Group();

  const W = PAINTING_W;
  const H = PAINTING_H;
  const D = PAINTING_D;

  // 1. Front Painted Canvas Surface
  const frontMat = new THREE.MeshStandardMaterial({
    map: frontTex,
    bumpMap: weaveBump,
    bumpScale: 0.0055,
    roughness: 0.72,
    metalness: 0.02,
  });
  const frontPlane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), frontMat);
  frontPlane.position.z = D / 2;
  paintingGroup.add(frontPlane);

  // 2. Gallery-Wrapped Linen Side Rails
  const sideMat = new THREE.MeshStandardMaterial({
    map: edgeLinenTex,
    bumpMap: weaveBump,
    bumpScale: 0.004,
    roughness: 0.88,
    metalness: 0.01,
  });

  const wallT = 0.014;
  const leftSide = new THREE.Mesh(new THREE.BoxGeometry(wallT, H, D), sideMat);
  leftSide.position.set(-W / 2 + wallT / 2, 0, 0);
  paintingGroup.add(leftSide);

  const rightSide = new THREE.Mesh(new THREE.BoxGeometry(wallT, H, D), sideMat);
  rightSide.position.set(W / 2 - wallT / 2, 0, 0);
  paintingGroup.add(rightSide);

  const topSide = new THREE.Mesh(new THREE.BoxGeometry(W - wallT * 2, wallT, D), sideMat);
  topSide.position.set(0, H / 2 - wallT / 2, 0);
  paintingGroup.add(topSide);

  const bottomSide = new THREE.Mesh(new THREE.BoxGeometry(W - wallT * 2, wallT, D), sideMat);
  bottomSide.position.set(0, -H / 2 + wallT / 2, 0);
  paintingGroup.add(bottomSide);

  // 3. Recessed Raw Linen Back Plane (rotated PI on Y so handwriting reads cleanly left->right)
  const backMat = new THREE.MeshStandardMaterial({
    map: backTex,
    bumpMap: weaveBump,
    bumpScale: 0.0045,
    roughness: 0.88,
    metalness: 0.01,
  });
  const backPlane = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.028, H - 0.028), backMat);
  backPlane.position.z = -D / 2 + 0.038;
  backPlane.rotation.y = Math.PI;
  paintingGroup.add(backPlane);

  // 4. Physical 3D Pinewood Stretcher Bars + Corner Wedges + Staples + Sawtooth Hanger
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.82,
    metalness: 0.02,
  });

  const barW = 0.105;
  const barD = 0.034;
  const barZ = -D / 2 + barD / 2 + 0.002;
  const innerSpanW = W - 0.028;
  const innerSpanH = H - 0.028;

  // Top and Bottom horizontal stretcher bars
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(innerSpanW, barW, barD), woodMat);
  topBar.position.set(0, innerSpanH / 2 - barW / 2, barZ);
  paintingGroup.add(topBar);

  const bottomBar = new THREE.Mesh(new THREE.BoxGeometry(innerSpanW, barW, barD), woodMat);
  bottomBar.position.set(0, -innerSpanH / 2 + barW / 2, barZ);
  paintingGroup.add(bottomBar);

  // Left and Right vertical stretcher bars (fitted cleanly between top & bottom bars)
  const vertBarH = innerSpanH - barW * 2;
  const leftBar = new THREE.Mesh(new THREE.BoxGeometry(barW, vertBarH, barD), woodMat);
  leftBar.position.set(-innerSpanW / 2 + barW / 2, 0, barZ);
  paintingGroup.add(leftBar);

  const rightBar = new THREE.Mesh(new THREE.BoxGeometry(barW, vertBarH, barD), woodMat);
  rightBar.position.set(innerSpanW / 2 - barW / 2, 0, barZ);
  paintingGroup.add(rightBar);

  // 4 Triangular Corner Wedges (keys) inside the inner stretcher corners
  const wedgeShape = new THREE.Shape();
  wedgeShape.moveTo(0, 0);
  wedgeShape.lineTo(0.095, 0);
  wedgeShape.lineTo(0, 0.095);
  wedgeShape.closePath();
  const wedgeGeo = new THREE.ExtrudeGeometry(wedgeShape, {
    depth: 0.014,
    bevelEnabled: false,
  });

  const innerCornerX = innerSpanW / 2 - barW;
  const innerCornerY = innerSpanH / 2 - barW;
  const wedgeCorners = [
    { x: -innerCornerX, y: innerCornerY, rz: -Math.PI / 2 },
    { x: innerCornerX, y: innerCornerY, rz: Math.PI },
    { x: innerCornerX, y: -innerCornerY, rz: Math.PI / 2 },
    { x: -innerCornerX, y: -innerCornerY, rz: 0 },
  ];
  wedgeCorners.forEach((c) => {
    const wedge = new THREE.Mesh(wedgeGeo, woodMat);
    wedge.position.set(c.x, c.y, barZ - 0.007);
    wedge.rotation.z = c.rz;
    paintingGroup.add(wedge);
  });

  // Silver Canvas Staples along the back perimeter
  const stapleMat = new THREE.MeshStandardMaterial({
    color: 0xc2c8d0,
    metalness: 0.85,
    roughness: 0.28,
  });
  const stapleGeoH = new THREE.BoxGeometry(0.022, 0.005, 0.004);
  const stapleGeoV = new THREE.BoxGeometry(0.005, 0.022, 0.004);
  const stapleZ = -D / 2 + 0.001;

  for (let i = -5; i <= 5; i++) {
    const xPos = (i / 5.5) * (innerSpanW * 0.44);
    const sTop = new THREE.Mesh(stapleGeoH, stapleMat);
    sTop.position.set(xPos, innerSpanH / 2 - 0.022, stapleZ);
    paintingGroup.add(sTop);

    const sBot = new THREE.Mesh(stapleGeoH, stapleMat);
    sBot.position.set(xPos, -innerSpanH / 2 + 0.022, stapleZ);
    paintingGroup.add(sBot);
  }
  for (let i = -6; i <= 6; i++) {
    const yPos = (i / 6.5) * (innerSpanH * 0.44);
    const sLeft = new THREE.Mesh(stapleGeoV, stapleMat);
    sLeft.position.set(-innerSpanW / 2 + 0.022, yPos, stapleZ);
    paintingGroup.add(sLeft);

    const sRight = new THREE.Mesh(stapleGeoV, stapleMat);
    sRight.position.set(innerSpanW / 2 - 0.022, yPos, stapleZ);
    paintingGroup.add(sRight);
  }

  // Brass Sawtooth Picture Hanger centered on the top stretcher bar
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd4ae5c,
    metalness: 0.85,
    roughness: 0.25,
  });
  const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.026, 0.006), brassMat);
  hanger.position.set(0, innerSpanH / 2 - barW * 0.52, -D / 2);
  paintingGroup.add(hanger);

  // 5. Subtle Gold Focus Halo for Front Detail Stops
  const focusRingMat = new THREE.MeshBasicMaterial({
    color: 0xdfc07f,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const focusRing = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.122, 64), focusRingMat);
  focusRing.position.set(0, 0, D / 2 + 0.008);
  focusRing.visible = false;
  paintingGroup.add(focusRing);

  let focusActive = false;
  let focusActivatedAt = 0;

  function setFocusSpot(uv, span = 0.4) {
    if (!uv) {
      focusActive = false;
      focusRing.visible = false;
      focusRingMat.opacity = 0;
      return;
    }
    const localX = (uv.u - 0.5) * W;
    const localY = (0.5 - uv.v) * H;
    focusRing.position.set(localX, localY, D / 2 + 0.008);
    focusRing.scale.setScalar(Math.max(0.7, span * 2.25));
    focusRing.visible = true;
    focusActive = true;
    focusActivatedAt = performance.now() * 0.001;
  }

  function update(time) {
    if (!focusActive) return;
    const age = time - focusActivatedAt;
    // Gently glow on arrival, then fade down softly so brushstrokes stay unobstructed
    const baseOpacity = age < 1.6 ? 0.55 : Math.max(0.14, 0.55 - (age - 1.6) * 0.22);
    const breath = 0.88 + 0.12 * Math.sin(time * 2.4);
    focusRingMat.opacity = baseOpacity * breath;
  }

  return {
    paintingGroup,
    focusRing,
    setFocusSpot,
    update,
  };
}
