import * as THREE from "three";

export function createNebula(scene) {
  const count = 3000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const palette = [
    [0.3, 0.1, 0.7],   // deep purple
    [0.1, 0.2, 0.8],   // indigo
    [0.0, 0.4, 0.6],   // teal-blue
    [0.5, 0.05, 0.5],  // violet
  ];

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 4000;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
    positions[i * 3 + 2] = -4000 + (Math.random() - 0.5) * 3000;

    const c = palette[Math.floor(Math.random() * palette.length)];
    const brightness = 0.4 + Math.random() * 0.6;
    colors[i * 3]     = c[0] * brightness;
    colors[i * 3 + 1] = c[1] * brightness;
    colors[i * 3 + 2] = c[2] * brightness;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color",    new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 6,
    vertexColors: true,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const nebula = new THREE.Points(geo, mat);
  scene.add(nebula);
  return nebula;
}
