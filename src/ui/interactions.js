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

// drag orbit state
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragMoved = false;
const DRAG_THRESHOLD = 5;

// keyboard orbit state
const keys = {};
window.addEventListener("keydown", e => { keys[e.key.toLowerCase()] = true; });
window.addEventListener("keyup",   e => { keys[e.key.toLowerCase()] = false; });

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

  const isTouch = 'ontouchstart' in window;

  if (!isTouch) {
    domRef.addEventListener("pointermove", onPointerMove);
    domRef.addEventListener("pointerleave", clearHover);
    domRef.addEventListener("pointerdown", onPointerDown);
    domRef.addEventListener("pointerup", onPointerUp);
    domRef.addEventListener("pointercancel", onPointerCancel);
    domRef.addEventListener("wheel", onWheel, { passive: true });
  } else {
    domRef.addEventListener("touchstart", onTouchStart, { passive: true });
    domRef.addEventListener("touchmove", onTouchMove, { passive: false });
    domRef.addEventListener("touchend", onTouchEnd, { passive: true });
  }

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

// ------------------- HOVER HIGHLIGHT -------------------
function updateHover(clientX, clientY) {
  const rect = domRef.getBoundingClientRect();
  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

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

// ------------------- DESKTOP POINTER EVENTS -------------------
function onPointerDown(e) {
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragMoved = false;
}

function onPointerMove(e) {
  updateHover(e.clientX, e.clientY);

  if (!isDragging || isZooming || follow.active) return;

  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  if (!dragMoved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
    dragMoved = true;
  }

  if (dragMoved) {
    orbitCamera(dx * 0.004, dy * 0.003);
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    domRef.style.cursor = "grabbing";
    markInteraction();
  }
}

function onPointerUp(e) {
  if (!dragMoved && !isZooming && !follow.active) {
    const rect = domRef.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, cameraRef);

    const hits = raycaster.intersectObjects([...planetsRef, sunRef]);
    const hit = hits[0];
    if (hit && planetsRef.includes(hit.object)) {
      zoomToPlanet(hit.object);
    }
  }

  isDragging = false;
  dragMoved = false;
  domRef.style.cursor = hovered ? "pointer" : "default";
}

function onPointerCancel() {
  isDragging = false;
  dragMoved = false;
  clearHover();
}

// ------------------- TOUCH EVENTS (mobile) -------------------
let lastPinchDist = null;

function getPinchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function onTouchStart(e) {
  if (e.touches.length === 2) {
    isDragging = false;
    lastPinchDist = getPinchDist(e.touches);
  } else if (e.touches.length === 1) {
    lastPinchDist = null;
    isDragging = true;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    dragMoved = false;
  }
}

function onTouchMove(e) {
  if (e.touches.length === 2) {
    if (lastPinchDist === null) return;
    e.preventDefault();
    if (isZooming || follow.active) return;
    const dist = getPinchDist(e.touches);
    const delta = dist - lastPinchDist;
    lastPinchDist = dist;
    markInteraction();
    zoomVel += delta * 4;
  } else if (e.touches.length === 1 && isDragging && !isZooming && !follow.active) {
    const dx = e.touches[0].clientX - dragStartX;
    const dy = e.touches[0].clientY - dragStartY;

    if (!dragMoved && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) {
      dragMoved = true;
    }

    if (dragMoved) {
      e.preventDefault();
      orbitCamera(dx * 0.005, dy * 0.004);
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      markInteraction();
    }
  }
}

function onTouchEnd(e) {
  if (e.touches.length < 2) lastPinchDist = null;

  if (e.touches.length === 0) {
    if (!dragMoved && !isZooming && !follow.active) {
      const touch = e.changedTouches[0];
      const rect = domRef.getBoundingClientRect();
      mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, cameraRef);
      const hits = raycaster.intersectObjects([...planetsRef, sunRef]);
      const hit = hits[0];
      if (hit && planetsRef.includes(hit.object)) {
        zoomToPlanet(hit.object);
      }
    }
    isDragging = false;
    dragMoved = false;
  }
}

// ------------------- SCROLL ZOOM -------------------
function onWheel(e) {
  if (isZooming || follow.active) return;
  markInteraction();
  zoomVel -= e.deltaY * 1.5;
}

function markInteraction() {
  lastInteraction = Date.now();
  window.dispatchEvent(new Event("user-interacted"));
}

// ------------------- ORBIT CAMERA -------------------
function orbitCamera(deltaTheta, deltaPhi) {
  const pivot = sunRef.position;
  const offset = cameraRef.position.clone().sub(pivot);

  const r = offset.length();
  let theta = Math.atan2(offset.x, offset.z);
  let phi = Math.acos(Math.max(-1, Math.min(1, offset.y / r)));

  theta -= deltaTheta;
  phi = Math.max(0.1, Math.min(Math.PI * 0.45, phi + deltaPhi));

  cameraRef.position.set(
    pivot.x + r * Math.sin(phi) * Math.sin(theta),
    pivot.y + r * Math.cos(phi),
    pivot.z + r * Math.sin(phi) * Math.cos(theta)
  );

  cameraRef.lookAt(pivot);
}

// ------------------- ZOOM TO PLANET -------------------
export function focusOnPlanet(name) {
  if (isZooming || follow.active) return;
  const planet = planetsRef.find(p => p.name === name);
  if (planet) zoomToPlanet(planet);
}

function zoomToPlanet(planet) {
  hideTopNav();
  hideAllPanels();
  markInteraction();
  isZooming = true;

  prePlanetPos = cameraRef.position.clone();
  prePlanetTarget = getLookTarget();

  follow.target = planet;
  follow.active = false;

  const savedSpeed = planet.userData.orbitSpeed;
  planet.userData.orbitSpeed = 0;

  const planetPos = planet.position.clone();

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
      follow.offset.copy(cameraRef.position).sub(planet.position);
      follow.active = true;
      isZooming = false;
      showPanelForPlanet(planet.name);
      showBackButton();
    }
  });
}

// ------------------- UPDATE LOOP -------------------
export function updateInteractions() {
  // Keyboard orbit — WASD + arrow keys
  if (!isZooming && !follow.active) {
    const speed = 0.018;
    if (keys["a"] || keys["arrowleft"])  orbitCamera(-speed, 0);
    if (keys["d"] || keys["arrowright"]) orbitCamera(speed, 0);
    if (keys["w"] || keys["arrowup"])    orbitCamera(0, -speed);
    if (keys["s"] || keys["arrowdown"])  orbitCamera(0,  speed);
    if (Object.values(keys).some(Boolean)) markInteraction();
  }

  if (!follow.active && Math.abs(zoomVel) > 0.5) {
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraRef.quaternion);
    const next = cameraRef.position.clone().addScaledVector(dir, zoomVel * 0.04);
    const dist = next.distanceTo(sunRef.position);
    if (dist > 450 && dist < 1600) {
      cameraRef.position.copy(next);
    } else {
      zoomVel = 0;
    }
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
