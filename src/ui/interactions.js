// ui/interactions.js
import * as THREE from "three";
import { gsap } from "gsap";
import { showPanelForPlanet, hideAllPanels } from "./panels.js";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let cameraRef, planetsRef, domRef, sunRef;
let hovered = null;
let isZooming = false;
let zoomVel = 0;

let prePlanetPos = null;
let prePlanetTarget = null;

let topNav;
let backBtn;

const follow = {
  target: null,
  radius: 200,
  offset: new THREE.Vector3(),
  active: false
};

// ------------------- SETUP -------------------
export function setupInteractions(camera, planets, dom, sun) {
  cameraRef = camera;
  planetsRef = planets;
  domRef = dom;
  sunRef = sun;

  topNav = document.getElementById("top-nav");

  planetsRef.forEach(p => {
    p.userData.baseScale = p.scale.clone();
    p.userData.baseEmissive = p.material.emissiveIntensity ?? 0.3;
  });

  domRef.addEventListener("pointermove", onHover);
  domRef.addEventListener("pointerleave", clearHover);
  domRef.addEventListener("pointerdown", onClick);
  domRef.addEventListener("wheel", onWheel, { passive: true });

  document.querySelectorAll("#top-nav .nav-item").forEach(item => {
    item.addEventListener("click", () => {
      focusOnPlanet(item.dataset.planet);
    });
  });
}

// ------------------- STATE EXPORT -------------------
export function isFollowingPlanet() {
  return follow.active;
}

export function setZooming(val) {
  isZooming = val;
}

// ------------------- NAV -------------------
export function showTopNav() {
  if (topNav) topNav.classList.add("show");
}

export function hideTopNav() {
  if (topNav) topNav.classList.remove("show");
}

// ------------------- BACK BUTTON -------------------
function ensureBackButton() {
  if (backBtn) return;

  backBtn = document.createElement("button");
  backBtn.textContent = "← Back";

  Object.assign(backBtn.style, {
    position: "fixed",
    top: "20px",
    left: "20px",
    padding: "8px 14px",
    borderRadius: "20px",
    border: "none",
    background: "rgba(0,0,0,0.75)",
    color: "white",
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
    zIndex: "50",
    opacity: "0",
    pointerEvents: "none",
    transition: "opacity 0.3s"
  });

  backBtn.addEventListener("click", backToHome);
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

// ------------------- BACK → REVERSE ZOOM -------------------
function backToHome() {
  hideAllPanels();
  follow.active = false;
  isZooming = true;

  const startPos = cameraRef.position.clone();
  const startLook = getLookTarget();

  const endPos = prePlanetPos || new THREE.Vector3(0, 350, 1300);
  const endLook = prePlanetTarget || new THREE.Vector3(0, 0, -3000);

  const t = { v: 0 };

  gsap.to(t, {
    v: 1,
    duration: 2,
    ease: "power2.inOut",
    onUpdate: () => {
      cameraRef.position.lerpVectors(startPos, endPos, t.v);
      const look = new THREE.Vector3().lerpVectors(startLook, endLook, t.v);
      cameraRef.lookAt(look);
    },
    onComplete: () => {
      isZooming = false;
      showTopNav();
      hideBackButton();
    }
  });
}

// ------------------- HOVER -------------------
function onHover(e) {
  const rect = domRef.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, cameraRef);

  const hit = raycaster.intersectObjects(planetsRef)[0]?.object || null;

  if (hit !== hovered) {
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

// ------------------- SCROLL ZOOM -------------------
function onWheel(e) {
  if (isZooming || follow.active) return;
  zoomVel -= e.deltaY * 1.5;
}

// ------------------- CLICK → ZOOM -------------------
function onClick(e) {
  if (isZooming || follow.active) return;

  const rect = domRef.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, cameraRef);

  // Include the sun so occluded planets can't be clicked
  const hits = raycaster.intersectObjects([...planetsRef, sunRef]);
  const hit = hits[0];
  if (!hit || !planetsRef.includes(hit.object)) return;

  zoomToPlanet(hit.object);
}

export function focusOnPlanet(name) {
  if (isZooming || follow.active) return;
  const planet = planetsRef.find(p => p.name === name);
  if (planet) zoomToPlanet(planet);
}

function zoomToPlanet(planet) {
  hideTopNav();
  hideAllPanels();
  isZooming = true;

  prePlanetPos = cameraRef.position.clone();
  prePlanetTarget = getLookTarget();

  follow.target = planet;
  follow.active = false;

  // Freeze the planet so we can aim at a fixed point
  const savedSpeed = planet.userData.orbitSpeed;
  planet.userData.orbitSpeed = 0;

  const planetPos = planet.position.clone();

  // Approach from the camera's side of the planet in XZ — camera always moves
  // toward the planet naturally. Y=150 keeps the whole flight path above the
  // sun sphere's top (Y=90) so we never clip through it.
  const toCam = new THREE.Vector3()
    .subVectors(cameraRef.position, planetPos)
    .setY(0)
    .normalize();
  const dest = planetPos.clone().addScaledVector(toCam, follow.radius);
  dest.y = 150;

  gsap.to(cameraRef.position, {
    x: dest.x,
    y: dest.y,
    z: dest.z,
    duration: 2,
    ease: "power2.inOut",
    onUpdate: () => cameraRef.lookAt(planetPos),
    onComplete: () => {
      planet.userData.orbitSpeed = savedSpeed;
      // Record the offset so we can translate with the planet as it continues orbiting
      follow.offset.copy(cameraRef.position).sub(planet.position);
      follow.active = true;
      isZooming = false;
      showPanelForPlanet(planet.name);
      showBackButton();
    }
  });
}

// ------------------- UPDATE (follow planet + scroll zoom) -------------------
export function updateInteractions() {
  // Scroll zoom — only in home view
  if (!follow.active && Math.abs(zoomVel) > 0.5) {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraRef.quaternion);
    cameraRef.position.addScaledVector(dir, zoomVel * 0.04);
    zoomVel *= 0.85;
  } else if (!follow.active) {
    zoomVel = 0;
  }

  if (!follow.active || !follow.target) return;

  const pos = follow.target.position;
  const ideal = pos.clone().add(follow.offset);
  cameraRef.position.lerp(ideal, 0.05);
  cameraRef.lookAt(pos);
}

// ------------------- UTILS -------------------
function getLookTarget() {
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraRef.quaternion);
  return cameraRef.position.clone().add(dir);
}
