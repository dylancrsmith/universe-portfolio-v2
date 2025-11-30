import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

// Config for portfolio planets
const PLANET_CONFIG = [
  { name: "About Me", size: 20, color: 0x4fc3f7, speed: 0.0045 },
  { name: "Projects", size: 26, color: 0x8b4513, speed: 0.0038 },
  { name: "CV",       size: 30, color: 0x00ff88, speed: 0.0032 },
  { name: "Contact",  size: 24, color: 0x9c27b0, speed: 0.0026 },
];

const BASE_ORBIT_RADIUS = 600;

// Create planets + attach text rings
export function createPlanets(scene, sun) {
  const planets = [];

  PLANET_CONFIG.forEach((cfg, index) => {
    const geo = new THREE.SphereGeometry(cfg.size, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
      color: cfg.color,
      emissive: cfg.color,
      emissiveIntensity: 0.3,
      roughness: 0.4,
      metalness: 0.2,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = cfg.name;

    const radius = BASE_ORBIT_RADIUS * (0.25 + index * 0.2);
    const angle = Math.random() * Math.PI * 2;

    mesh.userData.orbitRadius = radius;
    mesh.userData.orbitAngle = angle;
    mesh.userData.orbitSpeed = cfg.speed;
    mesh.userData.textSprites = [];

    mesh.position.set(
      Math.cos(angle) * radius,
      0,
      sun.position.z + Math.sin(angle) * radius
    );

    createEquatorTextRing(mesh, cfg.name);

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

function createEquatorTextRing(planet, label) {
  const radius = planet.geometry.parameters.radius + 15;

  const letters = label.split("");
  const repetitions = 6;
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
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    drawLetter(ctx, letter);

    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
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
  ctx.clearRect(0, 0, 256, 256);
  ctx.font = "bold 110px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.shadowColor = "rgba(255,255,255,0.8)";
  ctx.shadowBlur = 25;
  ctx.fillStyle = "rgba(255,255,255,0.95)";

  ctx.fillText(letter, 128, 128);
}
