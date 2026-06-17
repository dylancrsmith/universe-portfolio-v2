import * as THREE from "three";

export const scene = new THREE.Scene();

const canvas = document.getElementById('universe');

export const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Camera
export const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  20000
);

// Start above & back, looking into space
camera.position.set(0, 350, 1300);
camera.lookAt(0, 0, -3000);

const ambient = new THREE.AmbientLight(0x406080, 0.6);
scene.add(ambient);

export function setupResize() {
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}
