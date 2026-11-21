import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Matrix4,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";
import { HOUSES_PATHS } from "@/components/brand/logo-paths";

/**
 * «Valle de luz» de Excellence Reformas (diseño propio, three.js).
 * Miles de luces sobre un valle nocturno: crecen al acercarse, se apartan del
 * cursor y, al pasar por el botón principal, se reúnen formando las casas del
 * logotipo: tu casa también merece un Glow Up.
 */

export type NightScene = {
  setScroll(progress: number): void;
  pointer(x: number | null, y?: number): void;
  assemble(on: boolean): void;
  resize(): void;
  dispose(): void;
};

type Options = { reduced: boolean; mobile: boolean; onLoaded: () => void; onIntroDone: () => void };

const PALETTE = [
  { c: "#FFFFFF", w: 0.26 },
  { c: "#E9EEF3", w: 0.14 },
  { c: "#A9BED3", w: 0.22 },
  { c: "#7292B0", w: 0.22 },
  { c: "#FFD48A", w: 0.1 }, // luz cálida, como ventanas encendidas
  { c: "#3E6A96", w: 0.06 },
];

const LOOP = 90; // longitud del valle (se repite sin fin)

function pickColor(r: number) {
  let acc = 0;
  for (const p of PALETTE) {
    acc += p.w;
    if (r <= acc) return new Color(p.c);
  }
  return new Color(PALETTE[0].c);
}

function terrain(x: number, z: number) {
  return -1.6 + 0.011 * x * x + 0.55 * Math.sin(z * 0.09 + x * 0.12) + 0.3 * Math.sin(x * 0.33 + z * 0.02);
}

/** Puntos dentro de las casas del logotipo (rasterizando sus trazados). */
function sampleLogo(count: number): Array<[number, number]> {
  const W = 460;
  const H = 136;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.scale(W / 920, H / 272);
  ctx.fillStyle = "#fff";
  for (const d of HOUSES_PATHS) ctx.fill(new Path2D(d));
  const data = ctx.getImageData(0, 0, W, H).data;
  const filled: Array<[number, number]> = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 140) filled.push([x / W, y / H]);
  if (!filled.length) return [];
  const out: Array<[number, number]> = [];
  for (let i = 0; i < count; i++) out.push(filled[Math.floor(Math.random() * filled.length)]);
  return out;
}

const LOGO_RATIO = 272 / 920; // alto / ancho de las casas del logotipo
const LOGO_DEPTH = 12; // distancia a la que se dibuja el logotipo

const vertex = /* glsl */ `
  uniform float uTime, uTravel, uLoop, uAssemble, uIntro, uPixelRatio, uAspect, uMouseActive, uSize;
  uniform vec2 uMouse, uLogo;
  uniform mat4 uCam;
  attribute float aSize, aPhase, aKind, aLogo;
  attribute vec3 aColor, aTarget;
  varying vec3 vColor;
  varying float vAlpha, vGlow, vWarm, vPetal, vRot;

  void main() {
    vec3 p = position;
    p.z = mod(p.z + uTravel, uLoop) - uLoop + 4.0;
    p.x += sin(uTime * 0.55 + aPhase * 6.2831) * 0.07 * (1.0 + aKind);
    p.y += sin(uTime * 0.8 + aPhase * 12.0) * 0.05;
    if (aKind > 1.5) p.y += sin(uTime * 0.25 + aPhase * 20.0) * 0.45;

    float a = smoothstep(0.0, 1.0, clamp(uAssemble * 1.25 - aPhase * 0.25, 0.0, 1.0));
    // Objetivo del logotipo, fijo delante de la cámara (se adapta al ancho de pantalla).
    vec3 local = vec3(aTarget.x * uLogo.x, aTarget.y * uLogo.x * ${LOGO_RATIO.toFixed(4)} + uLogo.y, -${LOGO_DEPTH.toFixed(1)} + aTarget.z);
    vec3 target = (uCam * vec4(local, 1.0)).xyz;
    vec3 pos = aLogo > 0.5 ? mix(p, target, a) : p + vec3(0.0, a * (0.6 + aPhase * 1.6), 0.0);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 ndc = clip.xy / clip.w;

    // El cursor aparta las luces cercanas en pantalla.
    vec2 d = (ndc - uMouse) * vec2(uAspect, 1.0);
    float dist = length(d);
    float r = 0.34;
    float push = (1.0 - smoothstep(0.0, r, dist)) * uMouseActive * (1.0 - a * aLogo);
    ndc += normalize(d + 1e-5) / vec2(uAspect, 1.0) * push * push * 0.2;
    clip.xy = ndc * clip.w;
    gl_Position = clip;

    float depth = -mv.z;
    float bloom = mix(0.4, 1.0, 1.0 - smoothstep(4.0, 34.0, depth)); // florecen al acercarse
    float size = aSize * bloom * uSize * uPixelRatio * (40.0 / max(depth, 1.0));
    size *= mix(1.0, 0.7, a * aLogo);
    gl_PointSize = clamp(size * uIntro, 0.0, 72.0 * uPixelRatio);
    // De cerca, las luces del suelo se abren en flores de cinco pétalos.
    vPetal = aKind < 0.5 ? smoothstep(9.0, 24.0, gl_PointSize / uPixelRatio) * (1.0 - a * aLogo) : 0.0;
    vRot = aPhase * 6.2831 + uTime * 0.12;

    float fog = 1.0 - smoothstep(24.0, uLoop - 6.0, depth);
    float nearFade = smoothstep(0.8, 3.0, depth);
    float dim = aLogo > 0.5 ? 1.0 : 1.0 - 0.7 * uAssemble;
    vAlpha = fog * nearFade * dim * uIntro;
    vGlow = (1.0 - smoothstep(0.0, r * 0.75, dist)) * uMouseActive + a * aLogo * 0.35;
    vColor = aColor;
    vWarm = aColor.r > 0.95 && aColor.b < 0.7 ? 1.0 : 0.0;
  }
`;

const fragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha, vGlow, vWarm, vPetal, vRot;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.5, 0.0, d);
    float glow = exp(-d * d * 30.0);
    // flor: cinco pétalos y un corazón brillante
    float ang = atan(c.y, c.x) + vRot;
    float petal = pow(abs(cos(2.5 * ang)), 0.6); // cinco pétalos redondeados
    float rr = 0.15 + 0.28 * petal;
    float flower = smoothstep(rr, rr - 0.13, d) * (0.28 + 0.5 * petal * (1.0 - d)) + smoothstep(0.11, 0.0, d) * 1.3;
    float shape = mix(core * 0.35 + glow, flower + glow * 0.3, vPetal);
    // destello en cruz para las luces cálidas
    float spark = vWarm * (exp(-abs(c.x) * 40.0) + exp(-abs(c.y) * 40.0)) * smoothstep(0.5, 0.1, d) * 0.7;
    float i = clamp((shape + spark) * vAlpha, 0.0, 1.0);
    vec3 col = min(vColor * (1.15 + vGlow * 1.6), vec3(1.0));
    // Mezcla aditiva: three.js ya multiplica el color por el alfa.
    gl_FragColor = vec4(col, i);
  }
`;

export function createNightScene(container: HTMLElement, o: Options): NightScene {
  // Lienzo transparente: el cielo y el resplandor del horizonte son CSS (detrás).
  const renderer = new WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
  const dpr = Math.min(window.devicePixelRatio || 1, o.mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.display = "block";
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(60, 1, 0.1, 140);
  const baseY = 2.3;
  camera.position.set(0, o.reduced ? baseY : 7.5, 0);
  camera.lookAt(0, 0.9, -20);
  const basePitch = camera.rotation.x;

  // --- Partículas ---------------------------------------------------------
  const N = o.mobile ? 7000 : 15000;
  const M = o.mobile ? 2600 : 5200; // las que forman el logotipo
  const positions = new Float32Array(N * 3);
  const colors = new Float32Array(N * 3);
  const targets = new Float32Array(N * 3);
  const sizes = new Float32Array(N);
  const phases = new Float32Array(N);
  const kinds = new Float32Array(N);
  const logo = new Float32Array(N);

  // Puntos del logotipo, normalizados (ancho 1); el shader los coloca delante de la cámara.
  const logoPts = sampleLogo(M);

  for (let i = 0; i < N; i++) {
    const r = Math.random();
    const kind = r < 0.72 ? 0 : r < 0.9 ? 1 : 2; // 0 flor de luz, 1 hoja tenue, 2 polvo en el aire
    const x = (Math.random() * 2 - 1) * (kind === 2 ? 16 : 21);
    const z = -Math.random() * LOOP;
    const y = kind === 2 ? terrain(x, z) + 0.8 + Math.random() * 5.5 : terrain(x, z) + Math.random() * 0.35;
    positions.set([x, y, z], i * 3);
    const col = kind === 1 ? new Color("#3E6A96") : pickColor(Math.random());
    colors.set([col.r, col.g, col.b], i * 3);
    sizes[i] = kind === 0 ? 1 + Math.random() * 1.8 : kind === 1 ? 0.7 + Math.random() * 0.6 : 0.35 + Math.random() * 0.4;
    phases[i] = Math.random();
    kinds[i] = kind;
    if (i < logoPts.length) {
      const [u, v] = logoPts[i];
      targets.set([u - 0.5, 0.5 - v, (Math.random() - 0.5) * 0.4], i * 3);
      logo[i] = 1;
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new BufferAttribute(colors, 3));
  geometry.setAttribute("aTarget", new BufferAttribute(targets, 3));
  geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
  geometry.setAttribute("aPhase", new BufferAttribute(phases, 1));
  geometry.setAttribute("aKind", new BufferAttribute(kinds, 1));
  geometry.setAttribute("aLogo", new BufferAttribute(logo, 1));

  const uniforms = {
    uTime: { value: 0 },
    uTravel: { value: 0 },
    uLoop: { value: LOOP },
    uAssemble: { value: 0 },
    uIntro: { value: o.reduced ? 1 : 0 },
    uPixelRatio: { value: dpr },
    uAspect: { value: 1 },
    uMouse: { value: [0, 0] as [number, number] },
    uMouseActive: { value: 0 },
    uSize: { value: o.mobile ? 1.15 : 1 },
    uLogo: { value: [12, 1] as [number, number] },
    uCam: { value: new Matrix4() },
  };
  const material = new ShaderMaterial({
    uniforms,
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  // --- Estado ---------------------------------------------------------------
  let scroll = 0;
  let scrollSmooth = 0;
  let idle = 0;
  let assembleTarget = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0, active: 0, targetActive: 0 };
  let introT = o.reduced ? 1 : 0;
  let introDone = o.reduced;
  let raf = 0;
  let last = performance.now();
  let visible = true;
  let loaded = false;

  const resize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uAspect.value = w / h;
    // Las casas ocupan como mucho el 62 % del ancho (82 % en móvil) y quedan
    // centradas sobre el titular, que se atenúa mientras se dibujan.
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * LOGO_DEPTH;
    const visibleW = halfH * 2 * camera.aspect;
    const width = Math.min(visibleW * (camera.aspect < 0.9 ? 0.82 : 0.62), (halfH * 2 * 0.5) / LOGO_RATIO);
    uniforms.uLogo.value = [width, halfH * (camera.aspect < 0.9 ? 0.2 : 0.1)];
  };
  resize();

  const ease = (t: number) => 1 - Math.pow(1 - t, 3);

  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    uniforms.uTime.value += dt;

    if (!introDone) {
      introT = Math.min(1, introT + dt / 2.4);
      uniforms.uIntro.value = ease(introT);
      camera.position.y = 7.5 + (baseY - 7.5) * ease(introT);
      if (introT >= 1) {
        introDone = true;
        o.onIntroDone();
      }
    }

    const k = 1 - Math.exp(-dt * 4);
    scrollSmooth += (scroll - scrollSmooth) * k;
    const speed = 0.9 * (1 - uniforms.uAssemble.value) + 0; // deriva lenta al estar quieto
    idle += dt * speed;
    uniforms.uTravel.value = idle + scrollSmooth * 32;

    uniforms.uAssemble.value += (assembleTarget - uniforms.uAssemble.value) * (1 - Math.exp(-dt * 2.6));
    mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 8));
    mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 8));
    mouse.active += (mouse.targetActive - mouse.active) * (1 - Math.exp(-dt * 5));
    uniforms.uMouse.value = [mouse.x, mouse.y];
    uniforms.uMouseActive.value = mouse.active;

    // la cámara se inclina un poco hacia el cursor
    camera.rotation.y += (-mouse.x * 0.05 * mouse.active - camera.rotation.y) * k;
    camera.rotation.x += (basePitch + mouse.y * 0.025 * mouse.active - camera.rotation.x) * k;
    camera.updateMatrixWorld();
    uniforms.uCam.value.copy(camera.matrixWorld);

    renderer.render(scene, camera);
    if (!loaded) {
      loaded = true;
      o.onLoaded();
    }
    if (!o.reduced && visible) raf = requestAnimationFrame(frame);
  };

  const start = () => {
    cancelAnimationFrame(raf);
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  // Con movimiento reducido: una sola imagen fija (y se repinta al cambiar el tamaño).
  if (o.reduced) {
    requestAnimationFrame(frame);
    o.onIntroDone();
  } else start();

  const io = new IntersectionObserver(([entry]) => {
    const was = visible;
    visible = entry.isIntersecting && document.visibilityState === "visible";
    if (visible && !was && !o.reduced) start();
  });
  io.observe(container);
  const onVis = () => {
    const was = visible;
    visible = document.visibilityState === "visible";
    if (visible && !was && !o.reduced) start();
  };
  document.addEventListener("visibilitychange", onVis);

  return {
    setScroll(p) {
      scroll = p;
    },
    pointer(x, y) {
      if (x === null) {
        mouse.targetActive = 0;
        return;
      }
      mouse.tx = x;
      mouse.ty = y ?? 0;
      mouse.targetActive = 1;
    },
    assemble(on) {
      assembleTarget = on ? 1 : 0;
      if (o.reduced) {
        uniforms.uAssemble.value = assembleTarget;
        requestAnimationFrame(frame);
      }
    },
    resize() {
      resize();
      if (o.reduced) requestAnimationFrame(frame);
    },
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
