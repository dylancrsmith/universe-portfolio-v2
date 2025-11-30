import * as THREE from "https://unpkg.com/three@0.164.0/build/three.module.js";

let renderer, scene, camera;

export function initScene() {
  const canvas = document.getElementById("universe");

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020312);

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 15);

  window.addEventListener("resize", onResize);

  return { scene, camera, renderer };
}

export function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
