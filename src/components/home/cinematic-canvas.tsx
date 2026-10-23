"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

const SHADER_UTILS = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  vec3 curlNoise(vec3 p) {
    const float e = 0.1;
    vec3 dx = vec3(e, 0.0, 0.0);
    vec3 dy = vec3(0.0, e, 0.0);
    vec3 dz = vec3(0.0, 0.0, e);
    vec3 p_x0 = snoise(p - dx) * vec3(1.0);
    vec3 p_x1 = snoise(p + dx) * vec3(1.0);
    vec3 p_y0 = snoise(p - dy) * vec3(1.0);
    vec3 p_y1 = snoise(p + dy) * vec3(1.0);
    vec3 p_z0 = snoise(p - dz) * vec3(1.0);
    vec3 p_z1 = snoise(p + dz) * vec3(1.0);
    float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
    float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
    float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;
    return normalize(vec3(x, y, z) / (2.0 * e));
  }
`;

function backgroundTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = "#0A1240";
    context.fillRect(0, 0, 1024, 1024);
    const gradient = context.createRadialGradient(512, 180, 0, 512, 180, 860);
    gradient.addColorStop(0, "#182C7E");
    gradient.addColorStop(0.45, "#0A1448");
    gradient.addColorStop(1, "#030616");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1024, 1024);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeHaloTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, "rgba(47, 143, 163, 0.2)");
    gradient.addColorStop(0.4, "rgba(47, 143, 163, 0.08)");
    gradient.addColorStop(1, "rgba(47, 143, 163, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeDotTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.4, "rgba(190,215,255,0.35)");
    gradient.addColorStop(1, "rgba(190,215,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeDust(
  count: number,
): THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 3.6 + Math.random() * 4.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.cos(phi) * 0.7;
    positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    map: makeDotTexture(),
    color: new THREE.Color("#7FA0FF"),
    size: 0.035,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  return new THREE.Points(geometry, material);
}

function makeChromatidCurves(): {
  left: THREE.CatmullRomCurve3;
  right: THREE.CatmullRomCurve3;
} {
  const toCurve = (values: THREE.Vector3[]) =>
    new THREE.CatmullRomCurve3(values, false, "catmullrom", 0.5);
  return {
    left: toCurve(chromatidPath(-1)),
    right: toCurve(chromatidPath(1)),
  };
}

const CENTROMERE_T = 0.44;

// A single sister chromatid: two near-straight arms meeting at the primary
// constriction, splayed apart in depth so the pair reads as a 3D structure.
function chromatidPath(side: number): THREE.Vector3[] {
  const samples = [
    0, 0.06, 0.12, 0.18, 0.25, 0.32, 0.38, CENTROMERE_T, 0.5, 0.56, 0.63, 0.7,
    0.78, 0.86, 0.93, 1,
  ];
  return samples.map((u) => {
    const d = u - CENTROMERE_T;
    // Arms leave the centromere almost parallel to the axis and then flare
    // outward, which is what gives the chromatid pair its bowed shape.
    const spread = 0.13 + 4.64 * Math.pow(Math.abs(d), 1.45);
    return new THREE.Vector3(
      side * spread,
      -d * 4.6,
      side * (0.08 + 0.62 * Math.abs(d)) + Math.sin(u * Math.PI * 2) * 0.04,
    );
  });
}

function chromatidRadius(t: number, thickness: number): number {
  const taper = Math.pow(Math.sin(Math.PI * t), 0.36);
  const waist =
    1 - 0.45 * Math.exp(-Math.pow((t - CENTROMERE_T) / 0.06, 2));
  return (0.035 + 0.205 * taper) * waist * thickness;
}

// The chromatid body is drawn as a braid of glowing strands rather than a solid
// volume, so the structure stays crisp and reads as light instead of tissue.
const STRAND_TWIST = Math.PI * 3.6;

function buildStrandBundle(
  curve: THREE.CatmullRomCurve3,
  isMobile: boolean,
  phaseOffset: number,
): THREE.Group {
  const group = new THREE.Group();
  const strands = isMobile ? 9 : 15;
  const segments = isMobile ? 150 : 260;
  const tubeRadius = isMobile ? 0.013 : 0.0105;
  const frames = curve.computeFrenetFrames(segments, false);
  const point = new THREE.Vector3();

  for (let i = 0; i < strands; i += 1) {
    const phase = phaseOffset + (i / strands) * Math.PI * 2;
    const ring = 0.45 + 0.55 * ((i % 3) / 2);
    const points: THREE.Vector3[] = [];
    for (let s = 0; s <= segments; s += 1) {
      const t = s / segments;
      const radius = chromatidRadius(t, 1) * ring;
      const angle = phase + t * STRAND_TWIST;
      curve.getPointAt(t, point);
      points.push(
        point
          .clone()
          .addScaledVector(frames.normals[s], Math.cos(angle) * radius)
          .addScaledVector(frames.binormals[s], Math.sin(angle) * radius),
      );
    }
    const strandCurve = new THREE.CatmullRomCurve3(
      points,
      false,
      "catmullrom",
      0.5,
    );
    const geometry = new THREE.TubeGeometry(
      strandCurve,
      segments,
      tubeRadius,
      6,
      false,
    );

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector3(9999, 9999, 9999) },
        uCore: { value: new THREE.Color(i % 4 === 0 ? "#EAF9FF" : "#6FE0FF") },
        uEdge: { value: new THREE.Color("#1E5BFF") },
        uSeed: { value: i * 1.7 + phaseOffset },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec3 uMouse;
        uniform float uSeed;
        varying vec2 vUv;
        varying float vFlow;
        void main() {
          vUv = uv;
          vec3 pos = position;
          vec4 world = modelMatrix * vec4(pos, 1.0);
          float distanceToMouse = distance(world.xyz, uMouse);
          if (distanceToMouse < 2.4) {
            vec3 repulse = normalize(world.xyz - uMouse);
            float force = pow(1.0 - distanceToMouse / 2.4, 2.0);
            pos += repulse * force * 0.4;
          }
          vFlow = uv.x * 26.0 - uTime * 1.5 + uSeed;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uCore;
        uniform vec3 uEdge;
        varying vec2 vUv;
        varying float vFlow;
        void main() {
          float pulse = 0.5 + 0.5 * sin(vFlow);
          float head = smoothstep(0.75, 1.0, sin(vFlow - 0.6));
          vec3 color =
            mix(uEdge, uCore, 0.3 + 0.7 * pulse) + vec3(0.7) * head;
          float fade =
            smoothstep(0.0, 0.05, vUv.x) * smoothstep(1.0, 0.95, vUv.x);
          gl_FragColor = vec4(
            color * (1.05 + 0.6 * pulse),
            (0.34 + 0.3 * pulse) * fade
          );
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    group.add(new THREE.Mesh(geometry, material));
  }

  return group;
}

function makeGlowPoints(
  positions: THREE.Vector3[],
  size: number,
  innerColor: string,
  outerColor: string,
): THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> {
  const array = new Float32Array(positions.length * 3);
  const randoms = new Float32Array(positions.length);
  positions.forEach((point, index) => {
    array[index * 3] = point.x;
    array[index * 3 + 1] = point.y;
    array[index * 3 + 2] = point.z;
    randoms[index] = Math.random();
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(array, 3));
  geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector3(9999, 9999, 9999) },
      uInner: { value: new THREE.Color(innerColor) },
      uOuter: { value: new THREE.Color(outerColor) },
    },
    vertexShader: `
      uniform float uTime;
      uniform vec3 uMouse;
      uniform vec3 uInner;
      uniform vec3 uOuter;
      attribute float aRandom;
      varying float vAlpha;
      varying vec3 vColor;
      ${SHADER_UTILS}
      void main() {
        vec3 pos = position;
        pos += curlNoise(pos * 2.0 + uTime * 0.2) * 0.02;
        vec4 world = modelMatrix * vec4(pos, 1.0);
        float distanceToMouse = distance(world.xyz, uMouse);
        if (distanceToMouse < 2.0) {
          vec3 repulse = normalize(world.xyz - uMouse);
          float force = pow(1.0 - distanceToMouse / 2.0, 2.0);
          pos += repulse * force * 0.5;
        }
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = ${size.toFixed(1)} * (0.7 + 0.6 * aRandom) * (10.0 / -mvPosition.z);
        vColor = mix(uOuter, uInner, aRandom);
        float camDist = length(mvPosition.xyz);
        float depthFade = smoothstep(13.0, 6.0, camDist);
        vAlpha = (0.34 + 0.28 * aRandom) * (0.5 + 0.5 * depthFade);
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float alpha = (1.0 - smoothstep(0.18, 0.5, d)) * vAlpha;
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
}

function buildCore(curves: {
  left: THREE.CatmullRomCurve3;
  right: THREE.CatmullRomCurve3;
}, count: number): THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> {
  const positions: THREE.Vector3[] = [];
  let attempts = 0;
  while (positions.length < count && attempts < count * 4) {
    attempts += 1;
    const curve = Math.random() > 0.5 ? curves.left : curves.right;
    const t = Math.random();
    const waist = Math.exp(-Math.pow((t - CENTROMERE_T) / 0.07, 2));
    if (Math.random() < 0.6 * waist) continue;
    const point = curve.getPointAt(t);
    point.x += (Math.random() - 0.5) * 0.045;
    point.y += (Math.random() - 0.5) * 0.045;
    point.z += (Math.random() - 0.5) * 0.045;
    positions.push(point);
  }
  return makeGlowPoints(positions, 1.8, "#FFD9EC", "#D9A45B");
}

function buildBridge(
  curves: {
    left: THREE.CatmullRomCurve3;
    right: THREE.CatmullRomCurve3;
  },
  count: number,
): THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> {
  const positions: THREE.Vector3[] = [];
  const start = curves.left.getPointAt(CENTROMERE_T);
  const end = curves.right.getPointAt(CENTROMERE_T);
  for (let i = 0; i < count; i += 1) {
    const t = Math.random();
    const point = start.clone().lerp(end, t);
    point.x += (Math.random() - 0.5) * 0.07;
    point.y += (Math.random() - 0.5) * 0.1;
    point.z += (Math.random() - 0.5) * 0.07;
    positions.push(point);
  }
  return makeGlowPoints(positions, 2.2, "#FFE6F2", "#C98A3C");
}

function buildMembraneGeometry(
  curve: THREE.CatmullRomCurve3,
  thickness: number,
): THREE.BufferGeometry {
  const tubular = 180;
  const radial = 16;
  const frames = curve.computeFrenetFrames(tubular, false);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  for (let i = 0; i <= tubular; i += 1) {
    const t = i / tubular;
    curve.getPointAt(t, point);
    const radius = chromatidRadius(t, thickness) * 1.12 + 0.016;
    for (let j = 0; j <= radial; j += 1) {
      const angle = (j / radial) * Math.PI * 2;
      normal
        .copy(frames.normals[i])
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(frames.binormals[i], Math.sin(angle) * 0.86)
        .normalize();
      positions.push(
        point.x + normal.x * radius,
        point.y + normal.y * radius,
        point.z + normal.z * radius,
      );
      normals.push(normal.x, normal.y, normal.z);
      uvs.push(t, j / radial);
    }
  }
  for (let i = 0; i < tubular; i += 1) {
    for (let j = 0; j < radial; j += 1) {
      const a = (radial + 1) * i + j;
      const b = (radial + 1) * (i + 1) + j;
      const c = (radial + 1) * (i + 1) + j + 1;
      const d = (radial + 1) * i + j + 1;
      indices.push(a, b, d, b, c, d);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeBoundingSphere();
  return geometry;
}

function makeGlowShell(
  curve: THREE.CatmullRomCurve3,
  thickness: number,
): THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial> {
  const geometry = buildMembraneGeometry(curve, thickness);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#2E6BE6") },
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      ${SHADER_UTILS}
      void main() {
        vec3 pos = position;
        pos += normal * snoise(pos * 1.1 + uTime * 0.18) * 0.018;
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        float rim = 1.0 - clamp(dot(normalize(vViewPosition), normalize(vNormal)), 0.0, 1.0);
        rim = pow(rim, 2.6);
        gl_FragColor = vec4(uColor, rim * 0.07 + 0.008);
      }
    `,
    transparent: true,
    side: THREE.FrontSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(geometry, material);
}

function buildTelomereCaps(
  curves: {
    left: THREE.CatmullRomCurve3;
    right: THREE.CatmullRomCurve3;
  },
  isMobile: boolean,
): THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> {
  const positions: THREE.Vector3[] = [];
  const perTip = isMobile ? 8 : 14;
  [curves.left, curves.right].forEach((curve) => {
    [0.02, 0.98].forEach((t) => {
      const tip = curve.getPointAt(t);
      for (let i = 0; i < perTip; i += 1) {
        positions.push(
          new THREE.Vector3(
            tip.x + (Math.random() - 0.5) * 0.07,
            tip.y + (Math.random() - 0.5) * 0.07,
            tip.z + (Math.random() - 0.5) * 0.07,
          ),
        );
      }
    });
  });
  return makeGlowPoints(positions, 3.4, "#EAFBFF", "#63C8FF");
}

export function CinematicCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const track = document.querySelector<HTMLElement>("[data-cinematic-hero]");
    const mobile = window.innerWidth < 768;
    const scene = new THREE.Scene();
    scene.background = backgroundTexture();

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 0.4, mobile ? 10.2 : 9.0);
    camera.lookAt(0, -0.1, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.4 : 1.8));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.domElement.style.pointerEvents = "auto";
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.style.touchAction = "pan-y";
    renderer.domElement.dataset.cinematicWebgl = "true";
    mount.appendChild(renderer.domElement);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      mobile ? 0.2 : 0.24,
      0.45,
      0.5,
    );
    composer.addPass(bloom);

    const curves = makeChromatidCurves();
    const chromosome = new THREE.Group();
    const leftStrands = buildStrandBundle(curves.left, mobile, 0);
    const rightStrands = buildStrandBundle(curves.right, mobile, Math.PI);
    const leftShell = makeGlowShell(curves.left, 1);
    const rightShell = makeGlowShell(curves.right, 0.96);
    const caps = buildTelomereCaps(curves, mobile);
    const core = buildCore(curves, mobile ? 90 : 160);
    const bridge = buildBridge(curves, mobile ? 18 : 30);
    chromosome.add(
      leftStrands,
      rightStrands,
      leftShell,
      rightShell,
      caps,
      core,
      bridge,
    );
    chromosome.position.y = -1.1;
    chromosome.scale.setScalar(0.94);
    scene.add(chromosome);

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeHaloTexture(),
        color: new THREE.Color("#2F8FA3"),
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    halo.position.set(0, -0.8, -3.2);
    halo.scale.set(8, 8, 1);
    scene.add(halo);

    const dust = makeDust(mobile ? 260 : 520);
    scene.add(dust);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(9999, 9999);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const targetMouse3D = new THREE.Vector3(9999, 9999, 9999);

    const onMouseMove = (event: PointerEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    const onMouseOut = () => mouse.set(9999, 9999);
    window.addEventListener("pointermove", onMouseMove, { passive: true });
    window.addEventListener("pointerout", onMouseOut);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      scene.background = backgroundTexture();
    };
    window.addEventListener("resize", onResize);

    const clock = new THREE.Clock();
    let frame = 0;
    let progress = 0;
    let lastTime = 0;
    let dragging = false;
    let hasInteracted = false;
    let lastX = 0;
    let lastY = 0;
    let userRotY = 0;
    let userRotX = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let velocityY = 0;
    let velocityX = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging = true;
      hasInteracted = true;
      lastX = event.clientX;
      lastY = event.clientY;
      velocityY = 0;
      velocityX = 0;
      renderer.domElement.style.cursor = "grabbing";
      try {
        renderer.domElement.setPointerCapture(event.pointerId);
      } catch {
        // Ignore capture failures on older browsers.
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      targetRotY += dx * 0.006;
      targetRotX = THREE.MathUtils.clamp(targetRotX + dy * 0.004, -0.7, 0.7);
      velocityY = dx * 0.006;
      velocityX = dy * 0.004;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      renderer.domElement.style.cursor = "grab";
      try {
        renderer.domElement.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore capture release failures.
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    const start = new THREE.Vector3(
      0,
      0.4,
      mobile ? 10.2 : 9.0,
    );
    const end = new THREE.Vector3(
      mobile ? 3.2 : 4.8,
      mobile ? 1.2 : 1.5,
      mobile ? 11.2 : 10.5,
    );
    const current = new THREE.Vector3().copy(start);

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const delta = Math.min(0.05, time - lastTime);
      lastTime = time;

      if (track) {
        const rect = track.getBoundingClientRect();
        const total = Math.max(1, track.offsetHeight - window.innerHeight);
        const target = THREE.MathUtils.clamp(-rect.top / total, 0, 1);
        progress += (target - progress) * 0.075;
        track.style.setProperty("--hero-progress", progress.toFixed(4));
      }

      current.copy(start).lerp(end, progress);
      camera.position.lerp(current, 0.1);
      camera.lookAt(0, -0.1, 0);
      if (!dragging) {
        targetRotY += velocityY;
        targetRotX = THREE.MathUtils.clamp(targetRotX + velocityX, -0.7, 0.7);
        velocityY *= 0.94;
        velocityX *= 0.9;
        if (!hasInteracted && Math.abs(velocityY) < 0.0006) targetRotY += 0.0011;
      }
      userRotY += (targetRotY - userRotY) * 0.12;
      userRotX += (targetRotX - userRotX) * 0.12;
      renderer.domElement.dataset.rotY = userRotY.toFixed(3);
      renderer.domElement.dataset.rotX = userRotX.toFixed(3);
      chromosome.rotation.y =
        progress * 0.55 + Math.sin(time * 0.05) * 0.025 + userRotY;
      chromosome.rotation.x = Math.sin(time * 0.07) * 0.025 + userRotX;
      dust.rotation.y += delta * 0.012;
      chromosome.position.y = -1.1 + Math.sin(time * 0.2) * 0.015;

      if (mouse.x !== 9999) {
        raycaster.setFromCamera(mouse, camera);
        const intersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(plane, intersection)) {
          targetMouse3D.copy(intersection);
        }
      } else {
        targetMouse3D.set(9999, 9999, 9999);
      }

      [caps, core, bridge].forEach((points) => {
        points.material.uniforms.uTime.value = time / 2;
        points.material.uniforms.uMouse.value.lerp(targetMouse3D, 0.1);
      });
      [leftShell, rightShell].forEach((mesh) => {
        mesh.material.uniforms.uTime.value = time;
      });
      [leftStrands, rightStrands].forEach((group) => {
        group.children.forEach((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.material instanceof THREE.ShaderMaterial) {
            mesh.material.uniforms.uTime.value = time;
            mesh.material.uniforms.uMouse.value.lerp(targetMouse3D, 0.1);
          }
        });
      });

      composer.render();
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMouseMove);
      window.removeEventListener("pointerout", onMouseOut);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else if (material) {
          material.dispose();
        }
      });
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      if (track) track.style.removeProperty("--hero-progress");
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}
