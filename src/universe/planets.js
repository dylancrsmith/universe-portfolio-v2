import * as THREE from "three";

// Config for portfolio planets
const PLANET_CONFIG = [
  { name: "About Me", size: 20, color: 0x4fc3f7, speed: 0.0045, repetitions: 3 },
  { name: "Projects", size: 26, color: 0x8b4513, speed: 0.0038 },
  { name: "CV",       size: 30, color: 0x00ff88, speed: 0.0032 },
  { name: "Contact",  size: 24, color: 0x9c27b0, speed: 0.0026 },
];

const BASE_ORBIT_RADIUS = 600;

// Create planets + attach text rings
export function createPlanets(scene, sun) {
  const planets = [];

  PLANET_CONFIG.forEach((cfg, index) => {
    const orbitRadius = BASE_ORBIT_RADIUS * (0.25 + index * 0.2);
    createOrbitRing(scene, sun, orbitRadius);

    const geo = new THREE.SphereGeometry(cfg.size, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      map: generatePlanetTexture(cfg.color),
      emissive: cfg.color,
      emissiveIntensity: 0.3,
      roughness: 0.7,
      metalness: 0.1,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = cfg.name;

    const angle = Math.random() * Math.PI * 2;

    mesh.userData.orbitRadius = orbitRadius;
    mesh.userData.orbitAngle = angle;
    mesh.userData.orbitSpeed = cfg.speed;
    mesh.userData.textSprites = [];

    mesh.position.set(
      Math.cos(angle) * orbitRadius,
      0,
      sun.position.z + Math.sin(angle) * orbitRadius
    );

    createEquatorTextRing(mesh, cfg.name, cfg.repetitions ?? 6);

    scene.add(mesh);
    planets.push(mesh);
  });

  return planets;
}

// Update positions + rotate text each frame
export function updatePlanets(planets, sun) {
  planets.forEach((planet) => {
    const data = planet.userData;

    data.orbitAngle += data.orbitSpeed;
    const r = data.orbitRadius;

    planet.position.x = Math.cos(data.orbitAngle) * r;
    planet.position.z = sun.position.z + Math.sin(data.orbitAngle) * r;

    const sprites = data.textSprites || [];
    const rotSpeed = 0.002;

    sprites.forEach((sprite) => {
      sprite.userData.angle += rotSpeed;
      const a = sprite.userData.angle;
      const rr = sprite.userData.radius;

      sprite.position.x = Math.cos(a) * rr;
      sprite.position.z = Math.sin(a) * rr;

      const dir = new THREE.Vector3(
        sprite.position.x,
        sprite.position.y,
        sprite.position.z
      ).normalize();

      sprite.lookAt(dir.clone().multiplyScalar(2));
    });
  });
}

// === helpers ===

function createOrbitRing(scene, sun, orbitRadius) {
  const points = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    points.push(new THREE.Vector3(
      Math.cos(a) * orbitRadius,
      0,
      sun.position.z + Math.sin(a) * orbitRadius
    ));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.08,
  });
  scene.add(new THREE.Line(geo, mat));
}

function generatePlanetTexture(baseColor) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");

  const r = (baseColor >> 16) & 0xff;
  const g = (baseColor >> 8) & 0xff;
  const b = baseColor & 0xff;

  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, size, size);

  // Dark patches
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const rad = Math.random() * 40 + 10;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, rad);
    grd.addColorStop(0, `rgba(0,0,0,${Math.random() * 0.35})`);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bright highlights
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const rad = Math.random() * 25 + 5;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, rad);
    grd.addColorStop(0, `rgba(255,255,255,${Math.random() * 0.15})`);
    grd.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createEquatorTextRing(planet, label, repetitions = 6) {
  const radius = planet.geometry.parameters.radius + 15;

  const letters = label.split("");
  const seq = [];

  for (let r = 0; r < repetitions; r++) {
    seq.push(...letters, " ");
  }

  seq.reverse();

  const total = seq.length;
  const step = (Math.PI * 2) / total;
  const sprites = [];

  seq.forEach((letter, i) => {
    if (letter === " ") return;

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    drawLetter(ctx, letter);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;

    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      alphaTest: 0.05,
    });

    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(22, 22, 1);

    const angle = i * step;
    const x = Math.cos(angle) * radius;
    const y = 0;
    const z = Math.sin(angle) * radius;

    sprite.position.set(x, y, z);

    const dir = new THREE.Vector3(x, y, z).normalize();
    sprite.lookAt(dir.clone().multiplyScalar(2));

    sprite.userData = { angle, radius, baseLetter: letter };

    planet.add(sprite);
    sprites.push(sprite);
  });

  planet.userData.textSprites = sprites;
}

function drawLetter(ctx, letter) {
  ctx.clearRect(0, 0, 64, 64);
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = "rgba(255,255,255,0.8)";
  ctx.shadowBlur = 6;
  ctx.fillStyle = "rgba(255,255,255,0.95)";

  ctx.fillText(letter, 32, 32);
}
