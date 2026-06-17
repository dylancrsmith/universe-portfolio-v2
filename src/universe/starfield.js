import * as THREE from "three";


export function createStarfield(scene) {
  const isMobile = window.innerWidth < 768;

  // Far background stars (dense, tiny, big radius)
  const farStarCount = 8000;
  const farPositions = new Float32Array(farStarCount * 3);
  for (let i = 0; i < farStarCount; i++) {
    farPositions[i * 3] = (Math.random() - 0.5) * 30000;
    farPositions[i * 3 + 1] = (Math.random() - 0.5) * 20000;
    farPositions[i * 3 + 2] = (Math.random() - 0.5) * 14000;
  }
  const farGeo = new THREE.BufferGeometry();
  farGeo.setAttribute('position', new THREE.BufferAttribute(farPositions, 3));

  const farMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: isMobile ? 2.5 : 1.4,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const farStars = new THREE.Points(farGeo, farMat);
  farStars.position.z = -4000;
  scene.add(farStars);

  // Foreground stars (for subtle motion / later warp)
  const nearStarCount = 600;
  const nearPositions = new Float32Array(nearStarCount * 3);
  for (let i = 0; i < nearStarCount; i++) {
    nearPositions[i * 3] = (Math.random() - 0.5) * 3000;
    nearPositions[i * 3 + 1] = (Math.random() - 0.5) * 3000;
    nearPositions[i * 3 + 2] = (Math.random() - 0.5) * 3000;
  }
  const nearGeo = new THREE.BufferGeometry();
  nearGeo.setAttribute('position', new THREE.BufferAttribute(nearPositions, 3));

  const nearMat = new THREE.PointsMaterial({
    color: 0x4fc3f7,
    size: isMobile ? 4.5 : 2.8,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const nearStars = new THREE.Points(nearGeo, nearMat);
  scene.add(nearStars);

  return { farStars, nearStars };
}
