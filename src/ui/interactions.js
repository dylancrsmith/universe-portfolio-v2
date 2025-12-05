// ui/interactions.js
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { gsap } from "https://cdn.skypack.dev/gsap@3.12.5";
import { showPanelForPlanet, hideAllPanels } from "./panels.js";

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let cameraRef, planetsRef, domRef, sunRef;
let hovered = null;
let isZooming = false;

let prePlanetPos = null;
let prePlanetTarget = null;

let topNav;
let backBtn;

const follow = {
  target: null,
  angle: 0,
  radius: 200,
  height: 80,
  speed: 0.005,
  blend: 0,
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

  document.querySelectorAll("#top-nav .nav-item").forEach(item => {
    item.addEventListener("click", () => {
      focusOnPlanet(item.dataset.planet);
    });
  });
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
  follow.blend = 0;

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

// ------------------- CLICK → ZOOM -------------------
function onClick(e) {
  if (isZooming) return;

  const rect = domRef.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, cameraRef);
  const hit = raycaster.intersectObjects(planetsRef)[0];
  if (!hit) return;

  zoomToPlanet(hit.object);
}

export function focusOnPlanet(name) {
  if (isZooming) return;
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
  follow.blend = 0;

  const start = cameraRef.position.clone();
  const planetPos = planet.getWorldPosition(new THREE.Vector3());

  const direction = planetPos.clone().sub(start).normalize();

  const t = { v: 0 };

  gsap.to(t, {
    v: 1,
    duration: 2.4,
    ease: "power2.out",
    onUpdate: () => {
      const livePos = planet.getWorldPosition(new THREE.Vector3());
      const dist = follow.radius * 0.75;

      const targetPos = livePos.clone().sub(direction.clone().multiplyScalar(dist));
      cameraRef.position.lerpVectors(start, targetPos, t.v);
      cameraRef.lookAt(livePos);
    },
    onComplete: () => {
      startOrbit(planet);
      showPanelForPlanet(planet.name);
      showBackButton();
    }
  });
}

function startOrbit(planet) {
  const pos = planet.getWorldPosition(new THREE.Vector3());
  const rel = cameraRef.position.clone().sub(pos);

  follow.angle = Math.atan2(rel.z, rel.x);
  follow.active = true;

  gsap.to(follow, {
    blend: 1,
    duration: 1.4,
    ease: "power2.out"
  });

  isZooming = false;
}

// ------------------- UPDATE (orbit) -------------------
export function updateInteractions() {
  if (!follow.active || !follow.target) return;

  const p = follow.target;
  const pos = p.getWorldPosition(new THREE.Vector3());

  follow.angle += follow.speed;

  const ideal = new THREE.Vector3(
    pos.x + Math.cos(follow.angle) * follow.radius,
    pos.y + follow.height,
    pos.z + Math.sin(follow.angle) * follow.radius
  );

  cameraRef.position.lerp(ideal, 0.06 * follow.blend);
  cameraRef.lookAt(pos);
}

// ------------------- UTILS -------------------
function getLookTarget() {
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraRef.quaternion);
  return cameraRef.position.clone().add(dir);
}
