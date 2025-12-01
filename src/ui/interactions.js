// ui/interactions.js
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let cameraRef = null;
let planetsRef = null;
let domRef = null;

let hovered = null;

export function setupInteractions(camera, planets, domElement) {
  cameraRef = camera;
  planetsRef = planets;
  domRef = domElement;

  // Save base scale + emissive strength
  planetsRef.forEach(p => {
    p.userData.baseScale = p.scale.clone();
    p.userData.baseEmissive = p.material.emissiveIntensity ?? 0.3;
  });

  domRef.addEventListener("pointermove", onPointerMove);
  domRef.addEventListener("pointerleave", clearHover);
}

function onPointerMove(e) {
  const rect = domRef.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, cameraRef);

  const hits = raycaster.intersectObjects(planetsRef, false);
  const hit = hits.length > 0 ? hits[0].object : null;

  if (hit !== hovered) {
    // un-hover old
    if (hovered) {
      hovered.material.emissiveIntensity = hovered.userData.baseEmissive;
      hovered.scale.copy(hovered.userData.baseScale);
    }

    hovered = hit;

    if (hovered) {
      hovered.material.emissiveIntensity = hovered.userData.baseEmissive * 2.2;
      hovered.scale.copy(hovered.userData.baseScale).multiplyScalar(1.12);
      domRef.style.cursor = "pointer";
    } else {
      domRef.style.cursor = "default";
    }
  }
}

function clearHover() {
  if (hovered) {
    hovered.material.emissiveIntensity = hovered.userData.baseEmissive;
    hovered.scale.copy(hovered.userData.baseScale);
  }
  hovered = null;
  domRef.style.cursor = "default";
}

export function updateInteractions() {
  // nothing needed per-frame for simple hover
}
