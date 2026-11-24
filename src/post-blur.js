import * as THREE from 'three';

const FULLSCREEN_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// 13-tap Gaussian Blur Horizontal Pass
const BLUR_H_FRAG = `
  uniform sampler2D tDiffuse;
  uniform vec2 uTexelSize;
  uniform float uSpread;
  varying vec2 vUv;

  void main() {
    vec2 stepUv = vec2(uTexelSize.x * uSpread, 0.0);
    vec3 sum = texture2D(tDiffuse, vUv).rgb * 0.13005;

    sum += (texture2D(tDiffuse, vUv + stepUv * 1.0).rgb + texture2D(tDiffuse, vUv - stepUv * 1.0).rgb) * 0.12385;
    sum += (texture2D(tDiffuse, vUv + stepUv * 2.0).rgb + texture2D(tDiffuse, vUv - stepUv * 2.0).rgb) * 0.10698;
    sum += (texture2D(tDiffuse, vUv + stepUv * 3.0).rgb + texture2D(tDiffuse, vUv - stepUv * 3.0).rgb) * 0.08383;
    sum += (texture2D(tDiffuse, vUv + stepUv * 4.0).rgb + texture2D(tDiffuse, vUv - stepUv * 4.0).rgb) * 0.05954;
    sum += (texture2D(tDiffuse, vUv + stepUv * 5.0).rgb + texture2D(tDiffuse, vUv - stepUv * 5.0).rgb) * 0.03836;
    sum += (texture2D(tDiffuse, vUv + stepUv * 6.0).rgb + texture2D(tDiffuse, vUv - stepUv * 6.0).rgb) * 0.02242;

    gl_FragColor = vec4(sum, 1.0);
  }
`;

// 13-tap Gaussian Blur Vertical Pass + Warm Gallery Background Illumination
const BLUR_V_FRAG = `
  uniform sampler2D tDiffuse;
  uniform vec2 uTexelSize;
  uniform float uSpread;
  uniform float uIlluminate;
  varying vec2 vUv;

  void main() {
    vec2 stepUv = vec2(0.0, uTexelSize.y * uSpread);
    vec3 col = texture2D(tDiffuse, vUv).rgb * 0.13005;

    col += (texture2D(tDiffuse, vUv + stepUv * 1.0).rgb + texture2D(tDiffuse, vUv - stepUv * 1.0).rgb) * 0.12385;
    col += (texture2D(tDiffuse, vUv + stepUv * 2.0).rgb + texture2D(tDiffuse, vUv - stepUv * 2.0).rgb) * 0.10698;
    col += (texture2D(tDiffuse, vUv + stepUv * 3.0).rgb + texture2D(tDiffuse, vUv - stepUv * 3.0).rgb) * 0.08383;
    col += (texture2D(tDiffuse, vUv + stepUv * 4.0).rgb + texture2D(tDiffuse, vUv - stepUv * 4.0).rgb) * 0.05954;
    col += (texture2D(tDiffuse, vUv + stepUv * 5.0).rgb + texture2D(tDiffuse, vUv - stepUv * 5.0).rgb) * 0.03836;
    col += (texture2D(tDiffuse, vUv + stepUv * 6.0).rgb + texture2D(tDiffuse, vUv - stepUv * 6.0).rgb) * 0.02242;

    // Gentle gallery ambient illumination lift so winter backdrop glows softly behind the canvas
    vec3 lifted = col * 1.38 + vec3(0.095, 0.09, 0.085);
    col = mix(col, lifted, uIlluminate);

    // Warm radial gallery halo behind the centered painting
    vec2 d = (vUv - vec2(0.5, 0.56)) * vec2(1.0, 1.25);
    float glow = exp(-dot(d, d) * 2.5);
    col += vec3(0.32, 0.27, 0.21) * glow * uIlluminate;

    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`;

export function createBlurCompositor(renderer, width, height) {
  let rtWidth = Math.max(2, Math.floor(width * 0.5));
  let rtHeight = Math.max(2, Math.floor(height * 0.5));

  const rtParams = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    colorSpace: THREE.SRGBColorSpace,
    depthBuffer: true,
    stencilBuffer: false,
  };

  const rtRaw = new THREE.WebGLRenderTarget(rtWidth, rtHeight, rtParams);
  const rtBlurH = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
    ...rtParams,
    depthBuffer: false,
  });

  const quadSceneH = new THREE.Scene();
  const quadSceneV = new THREE.Scene();
  const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadGeo = new THREE.PlaneGeometry(2, 2);

  const blurHMat = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: rtRaw.texture },
      uTexelSize: { value: new THREE.Vector2(1 / rtWidth, 1 / rtHeight) },
      uSpread: { value: 1.75 },
    },
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: BLUR_H_FRAG,
    depthTest: false,
    depthWrite: false,
  });

  const blurVMat = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: rtBlurH.texture },
      uTexelSize: { value: new THREE.Vector2(1 / rtWidth, 1 / rtHeight) },
      uSpread: { value: 1.75 },
      uIlluminate: { value: 0.0 },
    },
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: BLUR_V_FRAG,
    depthTest: false,
    depthWrite: false,
  });

  quadSceneH.add(new THREE.Mesh(quadGeo, blurHMat));
  quadSceneV.add(new THREE.Mesh(quadGeo, blurVMat));

  function resize(newWidth, newHeight) {
    rtWidth = Math.max(2, Math.floor(newWidth * 0.5));
    rtHeight = Math.max(2, Math.floor(newHeight * 0.5));
    rtRaw.setSize(rtWidth, rtHeight);
    rtBlurH.setSize(rtWidth, rtHeight);
    blurHMat.uniforms.uTexelSize.value.set(1 / rtWidth, 1 / rtHeight);
    blurVMat.uniforms.uTexelSize.value.set(1 / rtWidth, 1 / rtHeight);
  }

  function render(bgScene, bgCamera, paintingScene, paintingCamera, blurAmount, illuminateAmount) {
    if (blurAmount < 0.005) {
      // Closed & early emergence: render bgScene directly to screen at full native DPR sharpness
      renderer.setRenderTarget(null);
      renderer.clear(true, true, true);
      renderer.render(bgScene, bgCamera);
      return;
    }

    const spread = 1.75 * Math.min(1.0, Math.max(0.0, blurAmount));
    blurHMat.uniforms.uSpread.value = spread;
    blurVMat.uniforms.uSpread.value = spread;
    blurVMat.uniforms.uIlluminate.value = Math.min(1.0, Math.max(0.0, illuminateAmount));

    // Pass 1: Render winter background scene into half-res target
    renderer.setRenderTarget(rtRaw);
    renderer.clear(true, true, true);
    renderer.render(bgScene, bgCamera);

    // Pass 2: Horizontal 13-tap Gaussian blur -> rtBlurH
    renderer.setRenderTarget(rtBlurH);
    renderer.clear(true, false, false);
    renderer.render(quadSceneH, quadCamera);

    // Pass 3: Vertical 13-tap Gaussian blur + warm illumination -> screen
    renderer.setRenderTarget(null);
    renderer.clear(true, true, true);
    renderer.render(quadSceneV, quadCamera);

    // Pass 4: Clear depth buffer and render 3D painting razor-sharp over the blurred background
    renderer.clearDepth();
    renderer.render(paintingScene, paintingCamera);
  }

  return {
    resize,
    render,
  };
}
