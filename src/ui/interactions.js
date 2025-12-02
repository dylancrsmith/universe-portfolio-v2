// ui/interactions.js
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { gsap } from "https://cdn.skypack.dev/gsap@3.12.5";

// Raycasting
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// References set at setup
let cameraRef = null;
let planetsRef = null;
let domRef = null;
let sunRef = null;

let hovered = null;

// UI
let topNav = null;
let backBtn = null;
let panelEl = null;
let panelContentEl = null;

// Prevent double zooming
let isZooming = false;

// Save camera position before zoom (so Back can reverse)
let prePlanetPos = null;
let prePlanetTarget = null;

// Orbit system
const cameraFollowData = {
  targetPlanet: null,
  orbitAngle: 0,
  orbitRadius: 200,
  height: 80,
  speed: 0.005,
  isOrbiting: false,
  orbitBlend: 0
};

// ====================== SETUP ======================
export function setupInteractions(camera, planets, domElement, sun) {
  cameraRef = camera;
  planetsRef = planets;
  domRef = domElement;
  sunRef = sun;

  topNav = document.getElementById("top-nav");
  panelEl = document.getElementById("planet-panel");
  panelContentEl = document.getElementById("planet-panel-content");

  // Save base scale + emissive
  planetsRef.forEach(p => {
    p.userData.baseScale = p.scale.clone();
    p.userData.baseEmissive = p.material.emissiveIntensity ?? 0.3;
  });

  // Hover events
  domRef.addEventListener("pointermove", onPointerMove);
  domRef.addEventListener("pointerleave", clearHover);

  // Click planet → zoom
  domRef.addEventListener("pointerdown", onPlanetClick);

  // TOP NAV CLICK HANDLERS
  document.querySelectorAll("#top-nav .nav-item").forEach(item => {
    item.addEventListener("click", () => {
      const planetName = item.dataset.planet;
      focusOnPlanet(planetName);    // ← fixed logic
    });
  });
}

// ====================== TOP NAV ======================
export function showTopNav() {
  if (topNav) topNav.classList.add("show");
}

export function hideTopNav() {
  if (topNav) topNav.classList.remove("show");
}

// ====================== BACK BUTTON ======================
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
    cursor: "pointer",
    fontFamily: "Inter, sans-serif",
    fontSize: "14px",
    zIndex: "50",
    opacity: "0",
    pointerEvents: "none",
    transition: "opacity 0.35s ease"
  });

  backBtn.addEventListener("click", onBackClick);
  document.body.appendChild(backBtn);
}

function showBackButton() {
  ensureBackButton();
  backBtn.style.opacity = 1;
  backBtn.style.pointerEvents = "auto";
}

function hideBackButton() {
  if (!backBtn) return;
  backBtn.style.opacity = 0;
  backBtn.style.pointerEvents = "none";
}

// Guess current look target
function getCurrentLookTarget() {
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraRef.quaternion);
  return cameraRef.position.clone().add(dir);
}

// ====================== BACK (reverse zoom) ======================
function onBackClick() {
  isZooming = false;

  cameraFollowData.isOrbiting = false;
  cameraFollowData.targetPlanet = null;
  cameraFollowData.orbitBlend = 0;

  hidePlanetPanel();

  const startPos = cameraRef.position.clone();
  const startTarget = getCurrentLookTarget();

  const targetPos  = prePlanetPos    ? prePlanetPos.clone()    : new THREE.Vector3(0, 350, 1300);
  const endTarget  = prePlanetTarget ? prePlanetTarget.clone() : new THREE.Vector3(0, 0, -3000);

  const tmp = { t: 0 };

  gsap.to(tmp, {
    t: 1,
    duration: 2.0,
    ease: "power2.inOut",
    onUpdate: () => {
      cameraRef.position.lerpVectors(startPos, targetPos, tmp.t);
      const look = new THREE.Vector3().lerpVectors(startTarget, endTarget, tmp.t);
      cameraRef.lookAt(look);
    },
    onComplete: () => {
      hideBackButton();
      showTopNav();
    }
  });
}

// ====================== HOVER EFFECTS ======================
function onPointerMove(e) {
  const rect = domRef.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left)/rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top)/rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, cameraRef);

  const hit = raycaster.intersectObjects(planetsRef, false)[0]?.object || null;

  if (hovered !== hit) {
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

// ====================== CLICK → ZOOM INTO PLANET ======================
function onPlanetClick(e) {
  if (isZooming) return;

  const rect = domRef.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left)/rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top)/rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, cameraRef);

  const hit = raycaster.intersectObjects(planetsRef, false)[0];
  if (!hit) return;

  zoomToPlanet(hit.object);
}

// Used by nav clicks AND raycast clicks
function zoomToPlanet(planet) {
  if (!planet) return;

  hideTopNav();

  prePlanetPos = cameraRef.position.clone();
  prePlanetTarget = getCurrentLookTarget();

  isZooming = true;

  cameraFollowData.targetPlanet = planet;
  cameraFollowData.isOrbiting = false;
  cameraFollowData.orbitBlend = 0;

  const start = cameraRef.position.clone();
  const planetPos = planet.getWorldPosition(new THREE.Vector3());
  const direction = planetPos.clone().sub(start).normalize();

  const tmp = { t: 0 };

  gsap.to(tmp, {
    t: 1,
    duration: 2.8,
    ease: "power2.out",
    onUpdate: () => {
      const livePos = planet.getWorldPosition(new THREE.Vector3());
      const stopDist = cameraFollowData.orbitRadius * 0.75;

      const targetPos = livePos.clone().sub(direction.clone().multiplyScalar(stopDist));

      cameraRef.position.lerpVectors(start, targetPos, tmp.t);
      cameraRef.lookAt(livePos);
    },
    onComplete: () => {
      const livePos = planet.getWorldPosition(new THREE.Vector3());
      const rel = cameraRef.position.clone().sub(livePos);

      cameraFollowData.orbitAngle = Math.atan2(rel.z, rel.x);

      gsap.to(cameraFollowData, {
        orbitBlend: 1,
        duration: 1.8,
        ease: "power2.out",
        onStart: () => (cameraFollowData.isOrbiting = true)
      });

      showBackButton();
      showPlanetPanel(planet.name);
    }
  });
}

// ====================== NAV → FOCUS PLANET ======================
export function focusOnPlanet(name) {
  if (isZooming) return;

  const planet = planetsRef.find(p => p.name === name);
  if (!planet) return;

  zoomToPlanet(planet);
}

// ====================== PANEL ======================
function showPlanetPanel(name) {
  let text = "";

  if (name === "About Me") {
    text = `
Dylan Craddock-Smith
AI & Data Science @ MMU
Building intelligent systems, automation tools,
RL agents & creative interfaces.
    `;
  }

  if (name === "Projects") {
    text = `
Projects
• RealEstateBot 2.0
• NEAT Self-Driving Car
• IMDB NLP Analysis
• Universe Portfolio V2
    `;
  }

  if (name === "CV") {
    text = `
CV
Download link coming soon.
    `;
  }

  if (name === "Contact") {
    text = `
Contact
Email: dylan3002smith@gmail.com
GitHub: dylsmith17
    `;
  }

  panelContentEl.innerHTML = "";
  panelEl.classList.add("show");

  setTimeout(() => hackerText(panelContentEl, text, 15), 250);
}

function hidePlanetPanel() {
  panelEl.classList.remove("show");
}

// ====================== HACKER TEXT ======================
function hackerText(element, text, speed = 12) {
  const chars = "!<>-_\\/[]{}—=+*^?#________";
  const lines = text.split("\n");
  let output = "";
  let lineIndex = 0;

  function randomChar() {
    return chars[Math.floor(Math.random() * chars.length)];
  }

  function revealLine() {
    const line = lines[lineIndex];
    let progress = 0;

    const interval = setInterval(() => {
      const display = line
        .split("")
        .map((ch, i) => (i < progress ? ch : randomChar()))
        .join("");

      element.innerHTML = output + display + "\n";
      progress++;

      if (progress > line.length) {
        clearInterval(interval);
        output += line + "\n";
        lineIndex++;
        if (lineIndex < lines.length) setTimeout(revealLine, 120);
      }
    }, speed);
  }

  revealLine();
}

// ====================== ORBIT UPDATE ======================
export function updateInteractions() {
  if (!cameraFollowData.isOrbiting || !cameraFollowData.targetPlanet) return;

  const p = cameraFollowData.targetPlanet;
  const pos = p.getWorldPosition(new THREE.Vector3());

  cameraFollowData.orbitAngle += cameraFollowData.speed;

  const ideal = new THREE.Vector3(
    pos.x + Math.cos(cameraFollowData.orbitAngle) * cameraFollowData.orbitRadius,
    pos.y + cameraFollowData.height,
    pos.z + Math.sin(cameraFollowData.orbitAngle) * cameraFollowData.orbitRadius
  );

  cameraRef.position.lerp(ideal, 0.06 * cameraFollowData.orbitBlend);
  cameraRef.lookAt(pos);
}
