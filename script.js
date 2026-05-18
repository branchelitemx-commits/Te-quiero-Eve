import * as THREE from 'https://unpkg.com/three@0.165.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.165.0/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById('space-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x02030b, 0.00042);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
  alpha: false,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set(0, 2.5, 16);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.04;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.55;
controls.enablePan = false;
controls.minDistance = 8;
controls.maxDistance = 35;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.2;

const ambientLight = new THREE.AmbientLight(0x879dff, 0.32);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xf6f2ff, 1.5);
keyLight.position.set(18, 22, 12);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.bias = -0.00008;
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x5fa8ff, 0.9, 120);
rimLight.position.set(-20, -5, -18);
scene.add(rimLight);

const sunGlow = new THREE.PointLight(0xffd4a6, 1.7, 80, 1.8);
sunGlow.position.set(14, 3, 0);
scene.add(sunGlow);

function createStarfield(count = 5000) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const i3 = i * 3;
    const radius = THREE.MathUtils.randFloat(120, 1400);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

    positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = radius * Math.cos(phi);
    positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

    color.setHSL(0.55 + Math.random() * 0.1, 0.45, 0.75 + Math.random() * 0.2);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.35,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
  return stars;
}

const stars = createStarfield();

function createPlanet({ radius, colorA, colorB, roughness, metalness, position, emissive = 0x000000, emissiveIntensity = 0 }) {
  const geometry = new THREE.SphereGeometry(radius, 48, 48);
  const material = new THREE.MeshStandardMaterial({
    color: colorA,
    roughness,
    metalness,
    emissive,
    emissiveIntensity,
  });

  if (!material.map) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.colorB = { value: new THREE.Color(colorB) };
      shader.vertexShader = `varying vec3 vPos;\n${shader.vertexShader}`;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvPos = position;'
      );
      shader.fragmentShader = `uniform vec3 colorB;\nvarying vec3 vPos;\n${shader.fragmentShader}`;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>\nfloat t = smoothstep(-1.0, 1.0, normalize(vPos).y);\ndiffuseColor.rgb = mix(diffuseColor.rgb, colorB, t * 0.45);`
      );
    };
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set(position.x, position.y, position.z);
  scene.add(mesh);

  return mesh;
}

const earth = createPlanet({
  radius: 2.1,
  colorA: 0x2a8fdc,
  colorB: 0x2dd39f,
  roughness: 0.85,
  metalness: 0.05,
  position: { x: 0, y: 0, z: 0 },
});

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(2.22, 40, 40),
  new THREE.MeshBasicMaterial({
    color: 0x7fcfff,
    transparent: true,
    opacity: 0.11,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  })
);
atmosphere.position.copy(earth.position);
scene.add(atmosphere);

const planets = [
  { radius: 0.6, colorA: 0xb9a28e, colorB: 0x8a7f7a, roughness: 0.9, metalness: 0.06, dist: 6.2, speed: 0.0028, tilt: 0.12 },
  { radius: 1.0, colorA: 0xd8b48f, colorB: 0xc3825a, roughness: 0.82, metalness: 0.08, dist: 9.4, speed: 0.0019, tilt: -0.18 },
  { radius: 0.8, colorA: 0xd06b48, colorB: 0x8c3f2f, roughness: 0.88, metalness: 0.06, dist: 12.5, speed: 0.0015, tilt: 0.22 },
  { radius: 1.65, colorA: 0xdab082, colorB: 0x9c6f52, roughness: 0.77, metalness: 0.12, dist: 17, speed: 0.0011, tilt: -0.09 },
];

const orbiters = planets.map((cfg, idx) => {
  const mesh = createPlanet({
    radius: cfg.radius,
    colorA: cfg.colorA,
    colorB: cfg.colorB,
    roughness: cfg.roughness,
    metalness: cfg.metalness,
    position: {
      x: Math.cos(idx * 1.45) * cfg.dist,
      y: cfg.tilt * 10,
      z: Math.sin(idx * 1.45) * cfg.dist,
    },
  });

  if (idx === 3) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(cfg.radius * 1.5, cfg.radius * 2.2, 64),
      new THREE.MeshStandardMaterial({
        color: 0xd9c091,
        side: THREE.DoubleSide,
        roughness: 0.9,
        metalness: 0.04,
        transparent: true,
        opacity: 0.78,
      })
    );
    ring.rotation.x = Math.PI * 0.45;
    mesh.add(ring);
  }

  return { mesh, ...cfg, angle: idx * 1.45 };
});

let time = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = 0.016;
  time += dt;

  stars.rotation.y += 0.00007;
  stars.rotation.x = Math.sin(time * 0.04) * 0.03;

  earth.rotation.y += 0.0018;
  atmosphere.rotation.y -= 0.0006;

  orbiters.forEach((planet) => {
    planet.angle += planet.speed;
    planet.mesh.position.x = Math.cos(planet.angle) * planet.dist;
    planet.mesh.position.z = Math.sin(planet.angle) * planet.dist;
    planet.mesh.position.y = Math.sin(planet.angle * 0.75) * (planet.tilt * 7);
    planet.mesh.rotation.y += 0.002;
  });

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
