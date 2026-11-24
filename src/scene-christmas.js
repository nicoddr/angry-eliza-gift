import * as THREE from 'three';

function createSoftCircleTexture(size = 128, innerColor = 'rgba(255,255,255,1)', midColor = 'rgba(255,255,255,0.45)') {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, innerColor);
  grad.addColorStop(0.38, midColor);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWrappingPaperTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Deep crimson velvet base
  const bgGrad = ctx.createLinearGradient(0, 0, size, size);
  bgGrad.addColorStop(0, '#991827');
  bgGrad.addColorStop(0.5, '#861420');
  bgGrad.addColorStop(1, '#75111B');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Fine woven fabric / paper crossgrain
  ctx.strokeStyle = 'rgba(255, 225, 225, 0.045)';
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

  // Subtle gold foil winter specks
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 240; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.6 + rand() * 1.4;
    ctx.fillStyle = `rgba(235, 200, 128, ${0.08 + rand() * 0.22})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createSnowGroundTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const half = size / 2;

  const grad = ctx.createRadialGradient(half, half, 20, half, half, half);
  grad.addColorStop(0, 'rgba(222, 232, 245, 0.98)');
  grad.addColorStop(0.45, 'rgba(182, 200, 224, 0.85)');
  grad.addColorStop(0.76, 'rgba(65, 92, 124, 0.35)');
  grad.addColorStop(1, 'rgba(9, 19, 29, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle snow sparkles
  let seed = 1337;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 650; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const dist = Math.hypot(x - half, y - half) / half;
    if (dist > 0.85) continue;
    ctx.fillStyle = `rgba(255, 255, 255, ${(1 - dist) * 0.28})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStarMesh(goldMat) {
  const outerR = 0.21;
  const innerR = 0.088;
  const shape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = Math.cos(angle) * r;
    const y = -Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.014,
    bevelSegments: 2,
  });
  geo.center();
  return new THREE.Mesh(geo, goldMat);
}

function createChristmasTree(glowSpriteTex) {
  const treeGroup = new THREE.Group();

  // Trunk
  const trunkMat = new THREE.MeshStandardMaterial({
    color: 0x3f271a,
    roughness: 0.92,
  });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.19, 0.56, 12), trunkMat);
  trunk.position.y = 0.28;
  treeGroup.add(trunk);

  // Pine foliage material using vertex colors for rich evergreen -> snow-frosted tips
  const foliageMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.84,
    metalness: 0.04,
  });

  const tiers = [
    { r: 0.94, h: 1.02, y: 0.86 },
    { r: 0.78, h: 0.92, y: 1.38 },
    { r: 0.62, h: 0.82, y: 1.85 },
    { r: 0.45, h: 0.72, y: 2.26 },
    { r: 0.29, h: 0.58, y: 2.62 },
  ];

  const deepGreen = new THREE.Color('#0C2B1B');
  const richSpruce = new THREE.Color('#1B5136');
  const frostSnow = new THREE.Color('#DDE9F3');
  const tmpColor = new THREE.Color();

  tiers.forEach((tier, tierIdx) => {
    const geo = new THREE.ConeGeometry(tier.r, tier.h, 28, 7);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);

      const normY = (y + tier.h * 0.5) / tier.h; // 0 at bottom rim, 1 at tip
      const radial = Math.hypot(x, z);
      const angle = Math.atan2(z, x);

      // Scalloped boughs & gentle droop on outer branches
      if (radial > 0.02) {
        const flute = 1 + 0.11 * Math.sin(angle * 9 + tierIdx * 1.1) + 0.05 * Math.cos(angle * 5);
        x *= flute;
        z *= flute;
        y -= (1 - normY) * 0.065 * (radial / tier.r);
      }

      pos.setXYZ(i, x, y, z);

      // Blend deep interior shadow -> lush pine -> frosted snow on branch outer ridges
      tmpColor.copy(deepGreen).lerp(richSpruce, Math.min(1, normY * 0.65 + (radial / tier.r) * 0.55));
      const snowAmount =
        radial > tier.r * 0.45 && normY < 0.42
          ? Math.max(0, 0.35 + 0.45 * Math.sin(angle * 9 + tierIdx * 1.1)) * 0.55
          : 0;
      tmpColor.lerp(frostSnow, snowAmount);
      colors[i * 3] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const cone = new THREE.Mesh(geo, foliageMat);
    cone.position.y = tier.y;
    treeGroup.add(cone);
  });

  // Golden Topper Star + Halo + Warm Light
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xf7d586,
    emissive: 0xffc857,
    emissiveIntensity: 1.55,
    metalness: 0.65,
    roughness: 0.22,
  });
  const star = createStarMesh(starMat);
  star.position.set(0, 3.02, 0);
  treeGroup.add(star);

  const starHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowSpriteTex,
      color: 0xffd782,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  starHalo.position.copy(star.position);
  starHalo.scale.set(0.95, 0.95, 1);
  treeGroup.add(starHalo);

  const starLight = new THREE.PointLight(0xffcf78, 2.5, 7.2, 1.8);
  starLight.position.set(0, 3.05, 0.28);
  treeGroup.add(starLight);

  // Spiraling Twinkling Fairy Lights
  const lightPalette = [0xffcf70, 0xffe8b3, 0xe84d5b, 0xffb347, 0xfff5dc];
  const fairyLights = [];
  const bulbGeo = new THREE.SphereGeometry(0.029, 10, 10);

  for (let i = 0; i < 54; i++) {
    const t = i / 53;
    const h = 0.45 + t * 2.34;
    const maxR = THREE.MathUtils.lerp(0.91, 0.16, t) * 0.96;
    const angle = t * Math.PI * 11.5;

    const color = lightPalette[i % lightPalette.length];
    const mat = new THREE.MeshBasicMaterial({ color });
    const bulb = new THREE.Mesh(bulbGeo, mat);
    bulb.position.set(Math.cos(angle) * maxR, h, Math.sin(angle) * maxR);
    treeGroup.add(bulb);

    fairyLights.push({
      mesh: bulb,
      baseColor: new THREE.Color(color),
      phase: i * 0.87,
      speed: 1.8 + (i % 5) * 0.45,
    });
  }

  // Glossy Metallic Baubles / Ornaments
  const baubleMats = [
    new THREE.MeshStandardMaterial({ color: 0xb81d2c, metalness: 0.72, roughness: 0.18 }),
    new THREE.MeshStandardMaterial({ color: 0xe3be6b, metalness: 0.85, roughness: 0.16 }),
    new THREE.MeshStandardMaterial({ color: 0xf4eee1, metalness: 0.38, roughness: 0.2 }),
  ];
  const baubleGeo = new THREE.SphereGeometry(0.056, 14, 14);
  for (let i = 0; i < 22; i++) {
    const t = 0.08 + (i / 22) * 0.78;
    const h = 0.48 + t * 2.24;
    const r = THREE.MathUtils.lerp(0.92, 0.24, t) * 0.88;
    const angle = i * 2.39996; // Golden angle distribution
    const bauble = new THREE.Mesh(baubleGeo, baubleMats[i % baubleMats.length]);
    bauble.position.set(Math.cos(angle) * r, h, Math.sin(angle) * r);
    treeGroup.add(bauble);
  }

  // Soft warm ambient mid-tree glow light
  const treeWarmLight = new THREE.PointLight(0xffb85c, 1.35, 5.2, 1.9);
  treeWarmLight.position.set(0, 1.55, 0.55);
  treeGroup.add(treeWarmLight);

  return { treeGroup, fairyLights, star, starHalo, starLight };
}

function createGiftBox(wrapTex, glowSpriteTex) {
  const giftGroup = new THREE.Group();

  const W = 1.28;
  const H = 1.18;
  const D = 1.28;
  const wallT = 0.055;

  const wrapMat = new THREE.MeshStandardMaterial({
    map: wrapTex,
    roughness: 0.54,
    metalness: 0.08,
  });

  const liningMat = new THREE.MeshStandardMaterial({
    color: 0x3b0910,
    roughness: 0.88,
    metalness: 0.02,
  });

  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xe2bf73,
    emissive: 0x3a280a,
    emissiveIntensity: 0.22,
    metalness: 0.48,
    roughness: 0.26,
  });

  // 1. Hollow 5-panel Box Base
  // Bottom slab
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(W, wallT, D), wrapMat);
  bottom.position.y = -H / 2 + wallT / 2;
  giftGroup.add(bottom);

  // Inner velvet bottom pad + golden magic glow
  const innerPad = new THREE.Mesh(
    new THREE.PlaneGeometry(W - wallT * 2.1, D - wallT * 2.1),
    liningMat
  );
  innerPad.rotation.x = -Math.PI / 2;
  innerPad.position.y = -H / 2 + wallT + 0.002;
  giftGroup.add(innerPad);

  const interiorGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(W - wallT * 2.4, D - wallT * 2.4),
    new THREE.MeshBasicMaterial({
      map: glowSpriteTex,
      color: 0xffd77d,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  interiorGlow.rotation.x = -Math.PI / 2;
  interiorGlow.position.y = -H / 2 + wallT + 0.02;
  giftGroup.add(interiorGlow);

  // 4 outer walls (outer crimson, inner velvet lining planes for clean look when opened)
  const wallH = H - wallT;
  const wallY = wallT / 2;

  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(W, wallH, wallT), wrapMat);
  frontWall.position.set(0, wallY, D / 2 - wallT / 2);
  giftGroup.add(frontWall);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, wallH, wallT), wrapMat);
  backWall.position.set(0, wallY, -D / 2 + wallT / 2);
  giftGroup.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, D - wallT * 2), wrapMat);
  leftWall.position.set(-W / 2 + wallT / 2, wallY, 0);
  giftGroup.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, D - wallT * 2), wrapMat);
  rightWall.position.set(W / 2 - wallT / 2, wallY, 0);
  giftGroup.add(rightWall);

  // Inner wall linings so looking into the open box shows rich dark velvet
  const innerW = W - wallT * 2;
  const innerD = D - wallT * 2;
  const liningSpecs = [
    { w: innerW, h: wallH, x: 0, z: innerD / 2 - 0.002, ry: Math.PI },
    { w: innerW, h: wallH, x: 0, z: -innerD / 2 + 0.002, ry: 0 },
    { w: innerD, h: wallH, x: -innerW / 2 + 0.002, z: 0, ry: Math.PI / 2 },
    { w: innerD, h: wallH, x: innerW / 2 - 0.002, z: 0, ry: -Math.PI / 2 },
  ];
  liningSpecs.forEach((spec) => {
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(spec.w, spec.h), liningMat);
    plane.position.set(spec.x, wallY, spec.z);
    plane.rotation.y = spec.ry;
    giftGroup.add(plane);
  });

  // Gold Satin Vertical Ribbons on all 4 exterior sides
  const ribbonW = 0.17;
  const ribbonH = H - 0.004;
  const ribFB = new THREE.Mesh(new THREE.BoxGeometry(ribbonW, ribbonH, D + 0.012), ribbonMat);
  giftGroup.add(ribFB);

  const ribLR = new THREE.Mesh(new THREE.BoxGeometry(W + 0.012, ribbonH, ribbonW), ribbonMat);
  giftGroup.add(ribLR);

  // Interior golden light (ramps up as the lid opens)
  const interiorLight = new THREE.PointLight(0xffcf73, 0, 4.2, 1.7);
  interiorLight.position.set(0, 0.25, 0);
  giftGroup.add(interiorLight);

  // 2. Animated Gift Box Lid + Cross Ribbons + Sculpted 3D Satin Bow
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, H / 2, 0);
  giftGroup.add(lidGroup);

  const lidW = W + 0.095;
  const lidD = D + 0.095;
  const lidH = 0.23;

  const lidCap = new THREE.Mesh(new THREE.BoxGeometry(lidW, lidH, lidD), wrapMat);
  lidCap.position.y = 0.02;
  lidGroup.add(lidCap);

  // Gold ribbon cross bands on lid
  const lidRibFB = new THREE.Mesh(
    new THREE.BoxGeometry(ribbonW, lidH + 0.014, lidD + 0.014),
    ribbonMat
  );
  lidRibFB.position.y = 0.02;
  lidGroup.add(lidRibFB);

  const lidRibLR = new THREE.Mesh(
    new THREE.BoxGeometry(lidW + 0.014, lidH + 0.014, ribbonW),
    ribbonMat
  );
  lidRibLR.position.y = 0.02;
  lidGroup.add(lidRibLR);

  // Sculpted 3D Satin Bow
  const bowGroup = new THREE.Group();
  bowGroup.position.y = lidH / 2 + 0.028;
  lidGroup.add(bowGroup);

  // 4 sculpted pinched ribbon loops
  const loopCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.14, 0.14, 0.05),
      new THREE.Vector3(0.28, 0.11, 0),
      new THREE.Vector3(0.22, 0.01, -0.04),
      new THREE.Vector3(0, 0, 0),
    ],
    false
  );
  const loopGeo = new THREE.TubeGeometry(loopCurve, 24, 0.046, 10, false);
  loopGeo.scale(1, 0.72, 1.35);

  for (let i = 0; i < 4; i++) {
    const loop = new THREE.Mesh(loopGeo, ribbonMat);
    loop.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;
    bowGroup.add(loop);
  }

  // Secondary smaller diagonal top loops for fullness
  for (let i = 0; i < 2; i++) {
    const innerLoop = new THREE.Mesh(loopGeo, ribbonMat);
    innerLoop.scale.setScalar(0.74);
    innerLoop.rotation.y = i * Math.PI + 0.18;
    innerLoop.position.y = 0.03;
    bowGroup.add(innerLoop);
  }

  // Central Satin Knot
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.068, 16, 14), ribbonMat);
  knot.scale.set(1.15, 0.82, 1.15);
  knot.position.y = 0.03;
  bowGroup.add(knot);

  // 2 Gently Draped Ribbon Tails
  [-1, 1].forEach((dir) => {
    const tailCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.02, 0),
      new THREE.Vector3(dir * 0.14, -0.005, 0.14),
      new THREE.Vector3(dir * 0.27, -0.02, 0.29),
      new THREE.Vector3(dir * 0.36, -0.025, 0.42),
    ]);
    const tailGeo = new THREE.TubeGeometry(tailCurve, 16, 0.032, 8, false);
    tailGeo.scale(1, 0.38, 1);
    const tail = new THREE.Mesh(tailGeo, ribbonMat);
    bowGroup.add(tail);
  });

  return { giftGroup, lidGroup, interiorLight, interiorGlow };
}

export function buildChristmasScene(scene) {
  const glowSpriteTex = createSoftCircleTexture(128, 'rgba(255,255,255,1)', 'rgba(255,235,190,0.45)');
  const snowSpriteTex = createSoftCircleTexture(64, 'rgba(255,255,255,0.95)', 'rgba(225,238,255,0.42)');
  const wrapTex = createWrappingPaperTexture();
  const snowGroundTex = createSnowGroundTexture();

  // 1. Winter Night Sky Dome
  const skyGeo = new THREE.SphereGeometry(26, 32, 24);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTopColor: { value: new THREE.Color('#060E18') },
      uHorizonColor: { value: new THREE.Color('#14283F') },
      uMoonDir: { value: new THREE.Vector3(-0.42, 0.44, -0.79).normalize() },
    },
    vertexShader: `
      varying vec3 vWorldDir;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldDir = normalize(worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uMoonDir;
      varying vec3 vWorldDir;

      void main() {
        float h = clamp(vWorldDir.y * 0.85 + 0.18, 0.0, 1.0);
        vec3 col = mix(uHorizonColor, uTopColor, pow(h, 0.72));

        // Soft wintry moonlight atmospheric halo
        float moonDot = max(dot(normalize(vWorldDir), uMoonDir), 0.0);
        col += vec3(0.16, 0.22, 0.32) * pow(moonDot, 7.0);
        col += vec3(0.32, 0.36, 0.42) * pow(moonDot, 42.0);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyDome);

  // Subtle Upper-Sky Starfield
  const starCount = 160;
  const starPos = new Float32Array(starCount * 3);
  let starSeed = 99;
  const randStar = () => {
    starSeed = (starSeed * 1664525 + 1013904223) % 4294967296;
    return starSeed / 4294967296;
  };
  for (let i = 0; i < starCount; i++) {
    const theta = randStar() * Math.PI * 2;
    const phi = 0.2 + randStar() * 1.15;
    const r = 21 + randStar() * 3;
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.cos(phi) + 1.5;
    starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starPoints = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({
      map: snowSpriteTex,
      color: 0xe6effa,
      size: 0.16,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  scene.add(starPoints);

  // 2. Snowy Ground Plane with Undulating Drifts & Soft Radial Alpha
  const groundGeo = new THREE.PlaneGeometry(24, 24, 52, 52);
  groundGeo.rotateX(-Math.PI / 2);
  const gPos = groundGeo.attributes.position;
  for (let i = 0; i < gPos.count; i++) {
    const gx = gPos.getX(i);
    const gz = gPos.getZ(i);
    const distFromGift = Math.hypot(gx, gz);
    // Keep center right under the gift flat so the box sits level
    const flatMask = THREE.MathUtils.smoothstep(distFromGift, 1.0, 3.0);
    const drift =
      (Math.sin(gx * 0.45) * 0.11 + Math.cos(gz * 0.38 + gx * 0.2) * 0.09) * flatMask;
    gPos.setY(i, drift);
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    map: snowGroundTex,
    transparent: true,
    roughness: 0.9,
    metalness: 0.02,
    depthWrite: true,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -1.02;
  scene.add(ground);

  // 3. Hero 3D Christmas Tree (framed inside mobile portrait viewport behind gift box)
  const { treeGroup, fairyLights, star, starHalo, starLight } = createChristmasTree(glowSpriteTex);
  treeGroup.position.set(0.56, -1.02, -3.0);
  treeGroup.scale.setScalar(0.95);
  scene.add(treeGroup);

  // Secondary distant evergreen silhouette (visible on tablets/desktops for depth)
  const distantTree = createChristmasTree(glowSpriteTex);
  distantTree.treeGroup.position.set(-1.85, -1.02, -5.0);
  distantTree.treeGroup.scale.setScalar(0.72);
  distantTree.starLight.intensity = 0.8;
  scene.add(distantTree.treeGroup);

  // 4. 3D Falling Snow Particles
  const snowCount = 750;
  const snowPositions = new Float32Array(snowCount * 3);
  const snowMeta = new Float32Array(snowCount * 3); // [fallSpeed, swayFreq, phase]

  let snowSeed = 2026;
  const randSnow = () => {
    snowSeed = (snowSeed * 1664525 + 1013904223) % 4294967296;
    return snowSeed / 4294967296;
  };

  for (let i = 0; i < snowCount; i++) {
    snowPositions[i * 3] = (randSnow() - 0.5) * 12.0;
    snowPositions[i * 3 + 1] = -1.0 + randSnow() * 6.8;
    snowPositions[i * 3 + 2] = -5.2 + randSnow() * 8.4;

    snowMeta[i * 3] = 0.34 + randSnow() * 0.44;
    snowMeta[i * 3 + 1] = 0.7 + randSnow() * 1.1;
    snowMeta[i * 3 + 2] = randSnow() * Math.PI * 2;
  }

  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
  const snowMat = new THREE.PointsMaterial({
    map: snowSpriteTex,
    color: 0xf0f6ff,
    size: 0.085,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const snowSystem = new THREE.Points(snowGeo, snowMat);
  scene.add(snowSystem);

  // 5. Hollow 3D Gift Box
  const { giftGroup, lidGroup, interiorLight, interiorGlow } = createGiftBox(wrapTex, glowSpriteTex);
  giftGroup.position.set(0, -0.35, 0);
  giftGroup.rotation.y = -0.22;
  scene.add(giftGroup);

  // 6. Golden Sparkle Burst inside Gift Box
  const sparkleCount = 90;
  const sparklePos = new Float32Array(sparkleCount * 3);
  const sparkleVel = new Float32Array(sparkleCount * 3);
  for (let i = 0; i < sparkleCount; i++) {
    sparklePos[i * 3] = (randSnow() - 0.5) * 0.5;
    sparklePos[i * 3 + 1] = -0.3 + randSnow() * 0.35;
    sparklePos[i * 3 + 2] = (randSnow() - 0.5) * 0.5;

    const angle = randSnow() * Math.PI * 2;
    const speed = 0.45 + randSnow() * 1.15;
    sparkleVel[i * 3] = Math.cos(angle) * speed;
    sparkleVel[i * 3 + 1] = 1.15 + randSnow() * 1.75;
    sparkleVel[i * 3 + 2] = Math.sin(angle) * speed;
  }
  const sparkleGeo = new THREE.BufferGeometry();
  sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePos, 3));
  const sparkleMat = new THREE.PointsMaterial({
    map: glowSpriteTex,
    color: 0xffe296,
    size: 0.14,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sparklePoints = new THREE.Points(sparkleGeo, sparkleMat);
  sparklePoints.visible = false;
  scene.add(sparklePoints);

  let sparkleActive = false;
  let sparkleElapsed = 0;

  function triggerSparkles() {
    sparkleActive = true;
    sparkleElapsed = 0;
    sparklePoints.visible = true;
    sparkleMat.opacity = 1;
  }

  // 7. Winter Scene Lighting
  const hemiLight = new THREE.HemisphereLight(0x8bb4de, 0x202d3c, 0.85);
  scene.add(hemiLight);

  const moonLight = new THREE.DirectionalLight(0xc2daff, 1.35);
  moonLight.position.set(-3.8, 5.2, 3.2);
  scene.add(moonLight);

  const warmGiftFill = new THREE.DirectionalLight(0xffe1b8, 1.15);
  warmGiftFill.position.set(2.4, 2.2, 4.4);
  scene.add(warmGiftFill);

  const rimLight = new THREE.DirectionalLight(0x7ca7d9, 0.65);
  rimLight.position.set(1.5, 2.8, -4.2);
  scene.add(rimLight);

  function update(time, dt) {
    // Update falling snow
    const posArr = snowGeo.attributes.position.array;
    for (let i = 0; i < snowCount; i++) {
      const idx = i * 3;
      const speed = snowMeta[idx];
      const freq = snowMeta[idx + 1];
      const phase = snowMeta[idx + 2];

      posArr[idx + 1] -= speed * dt;
      posArr[idx] += Math.sin(time * freq + phase) * 0.22 * dt;

      if (posArr[idx + 1] < -1.05) {
        posArr[idx + 1] = 5.6 + (i % 7) * 0.08;
        posArr[idx] = ((i * 0.6180339887) % 1 - 0.5) * 12.0;
      }
    }
    snowGeo.attributes.position.needsUpdate = true;

    // Twinkle fairy lights on both trees
    for (let i = 0; i < fairyLights.length; i++) {
      const fl = fairyLights[i];
      const pulse = 0.58 + 0.42 * Math.sin(time * fl.speed + fl.phase);
      fl.mesh.material.color.copy(fl.baseColor).multiplyScalar(pulse);
    }

    // Gentle star shimmer
    star.rotation.y = Math.sin(time * 0.55) * 0.14;
    const starPulse = 0.68 + 0.18 * Math.sin(time * 2.2);
    starHalo.material.opacity = starPulse;
    starHalo.scale.setScalar(0.92 + 0.1 * Math.sin(time * 2.2));

    // Update opening golden sparkles
    if (sparkleActive) {
      sparkleElapsed += dt;
      const spArr = sparkleGeo.attributes.position.array;
      for (let i = 0; i < sparkleCount; i++) {
        const idx = i * 3;
        spArr[idx] += sparkleVel[idx] * dt;
        spArr[idx + 1] += sparkleVel[idx + 1] * dt;
        spArr[idx + 2] += sparkleVel[idx + 2] * dt;
        sparkleVel[idx + 1] -= 0.72 * dt; // soft gravity
      }
      sparkleGeo.attributes.position.needsUpdate = true;

      const fade = Math.max(0, 1 - sparkleElapsed / 2.2);
      sparkleMat.opacity = fade * fade;
      if (sparkleElapsed >= 2.2) {
        sparkleActive = false;
        sparklePoints.visible = false;
      }
    }
  }

  return {
    giftGroup,
    lidGroup,
    interiorLight,
    interiorGlow,
    treeGroup,
    update,
    triggerSparkles,
  };
}
