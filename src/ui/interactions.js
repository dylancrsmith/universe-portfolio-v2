// ui/interactions.js
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { gsap } from "https://cdn.skypack.dev/gsap@3.12.5";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let cameraRef = null;
let planetsRef = null;
let domRef = null;
let sunRef = null;

let hovered = null;
let backBtn = null;

// prevent re-clicking once we’ve zoomed to a planet
let isZooming = false;

// ===== CAMERA FOLLOW SYSTEM (from v1) =====
const cameraFollowData = {
  targetPlanet: null,
  orbitAngle: 0,
  orbitRadius: 200,
  height: 80,
  speed: 0.005,
  isOrbiting: false,
  orbitBlend: 0,
};

// overview offset: where the camera sits when showing the whole system
const OVERVIEW_OFFSET = new THREE.Vector3(0, 400, 900);

export function setupInteractions(camera, planets, domElement, sun) {
  cameraRef = camera;
  planetsRef = planets;
  domRef = domElement;
  sunRef = sun;

  // Save base scale + emissive strength
  planetsRef.forEach((p) => {
    p.userData.baseScale = p.scale.clone();
    p.userData.baseEmissive = p.material.emissiveIntensity ?? 0.3;
  });

  domRef.addEventListener("pointermove", onPointerMove);
  domRef.addEventListener("pointerleave", clearHover);
  domRef.addEventListener("pointerdown", onPlanetClick);
}

// ===== BACK BUTTON HELPERS =====
function ensureBackButton() {
  if (backBtn) return;

  backBtn = document.createElement("button");
  backBtn.textContent = "← Back";

  Object.assign(backBtn.style, {
    position: "fixed",
    top: "20px",
    left: "20px",
    padding: "8px 14px",
    borderRadius: "999px",
    border: "none",
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
    fontSize: "14px",
    cursor: "pointer",
    zIndex: "20",
    opacity: "0",
    pointerEvents: "none",
    transition: "opacity 0.3s ease",
  });

  backBtn.addEventListener("click", onBackClick);
  document.body.appendChild(backBtn);
}

function showBackButton() {
  ensureBackButton();
  backBtn.style.opacity = "1";
  backBtn.style.pointerEvents = "auto";
}

function hideBackButton() {
  if (!backBtn) return;
  backBtn.style.opacity = "0";
  backBtn.style.pointerEvents = "none";
}

// approximate current look target from camera orientation
function getCurrentLookTarget() {
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(
    cameraRef.quaternion
  );
  return cameraRef.position.clone().add(dir);
}

function onBackClick() {
  if (!cameraRef || !sunRef) return;

  // allow clicking planets again after we’re back
  isZooming = false;

  // stop orbit mode
  cameraFollowData.isOrbiting = false;
  cameraFollowData.targetPlanet = null;
  cameraFollowData.orbitBlend = 0;

  const sunPos = sunRef.position.clone();
  const startPos = cameraRef.position.clone();
  const startTarget = getCurrentLookTarget();     // where we're looking now
  const targetPos = sunPos.clone().add(OVERVIEW_OFFSET);
  const endTarget = sunPos.clone();               // we end up looking at the sun

  const tmp = { t: 0 };
  gsap.killTweensOf(cameraRef.position);

  gsap.to(tmp, {
    t: 1,
    duration: 2.2,
    ease: "power2.inOut",
    onUpdate: () => {
      // smooth position
      cameraRef.position.lerpVectors(startPos, targetPos, tmp.t);

      // smooth look direction (no instant snap)
      const lookTarget = new THREE.Vector3().lerpVectors(
        startTarget,
        endTarget,
        tmp.t
      );
      cameraRef.lookAt(lookTarget);
    },
    onComplete: () => {
      hideBackButton();
    },
  });
}

// ===== HOVER EFFECT =====
function onPointerMove(e) {
  const rect = domRef.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, cameraRef);

  const hits = raycaster.intersectObjects(planetsRef, false);
  const hit = hits.length > 0 ? hits[0].object : null;

  if (hit !== hovered) {
    if (hovered) {
      hovered.material.emissiveIntensity = hovered.userData.baseEmissive;
      hovered.scale.copy(hovered.userData.baseScale);
    }

    hovered = hit;

    if (hovered) {
      hovered.material.emissiveIntensity =
        hovered.userData.baseEmissive * 2.2;
      hovered.scale
        .copy(hovered.userData.baseScale)
        .multiplyScalar(1.12);
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

// ===== CLICK → ZOOM TO PLANET =====
function onPlanetClick(e) {
  if (isZooming) return; // 🔒 block further clicks once zoom started

  const rect = domRef.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, cameraRef);
  const hit = raycaster.intersectObjects(planetsRef, false)[0];
  if (!hit) return;

  isZooming = true; // lock clicks after first successful planet hit
  warpToPlanet(hit.object);
}

// ===== ZOOM TO PLANET + ENTER ORBIT =====
function warpToPlanet(planet) {
  gsap.killTweensOf(cameraRef.position);

  cameraFollowData.targetPlanet = planet;
  cameraFollowData.isOrbiting = false;
  cameraFollowData.orbitBlend = 0;

  const start = cameraRef.position.clone();

  const planetPosAtClick = planet.getWorldPosition(new THREE.Vector3());
  const approachDir = planetPosAtClick.clone().sub(start).normalize();
  const temp = { t: 0 };

  gsap.to(temp, {
    t: 1,
    duration: 2.8,
    ease: "power2.out",

    onUpdate: () => {
      const livePos = planet.getWorldPosition(new THREE.Vector3());
      const stopDistance = cameraFollowData.orbitRadius * 0.75;

      const targetPos = livePos.clone().sub(
        approachDir.clone().multiplyScalar(stopDistance)
      );

      cameraRef.position.lerpVectors(start, targetPos, temp.t);
      cameraRef.lookAt(livePos);
    },

    onComplete: () => {
      const livePos = planet.getWorldPosition(new THREE.Vector3());
      const relative = cameraRef.position.clone().sub(livePos);
      cameraFollowData.orbitAngle = Math.atan2(relative.z, relative.x);

      gsap.to(cameraFollowData, {
        orbitBlend: 1,
        duration: 1.8,
        ease: "power2.out",
        onStart: () => (cameraFollowData.isOrbiting = true),
      });

      showBackButton();
    },
  });
}

// ===== PER-FRAME UPDATE =====
export function updateInteractions() {
  if (cameraFollowData.isOrbiting && cameraFollowData.targetPlanet) {
    const p = cameraFollowData.targetPlanet;
    const pPos = p.getWorldPosition(new THREE.Vector3());

    cameraFollowData.orbitAngle += cameraFollowData.speed;

    const idealPos = new THREE.Vector3(
      pPos.x +
        Math.cos(cameraFollowData.orbitAngle) * cameraFollowData.orbitRadius,
      pPos.y + cameraFollowData.height,
      pPos.z +
        Math.sin(cameraFollowData.orbitAngle) * cameraFollowData.orbitRadius
    );

    cameraRef.position.lerp(idealPos, 0.06 * cameraFollowData.orbitBlend);
    cameraRef.lookAt(pPos);
  }
}
