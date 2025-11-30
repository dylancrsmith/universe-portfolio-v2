import * as THREE from "https://unpkg.com/three@0.164.0/build/three.module.js";

export function createPlanets(scene) {
  const geometry = new THREE.SphereGeometry(1.2, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color: 0x5ad0ff,
    metalness: 0.4,
    roughness: 0.3,
  });

  const planet = new THREE.Mesh(geometry, material);
  planet.position.set(0, 0, 0);
  scene.add(planet);

  const light = new THREE.PointLight(0xffffff, 2.5);
  light.position.set(5, 5, 5);
  scene.add(light);

  const rimLight = new THREE.DirectionalLight(0x3b8bff, 1);
  rimLight.position.set(-5, -3, -5);
  scene.add(rimLight);
}
