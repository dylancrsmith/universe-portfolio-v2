import * as THREE from "three";
import { setWarpSpeed } from "../universe/warpStars.js";
import { showTopNav, setZooming } from "./interactions.js";

let overlayEl;
let enterBtn;

let cameraRef = null;
let sunRef = null;

// Camera intro state
let introActive = false;
let introT = 0;
const introDuration = 3.0;
const startPos = new THREE.Vector3();
const targetPos = new THREE.Vector3();

/**
 * Setup overlay + click handler.
 */
export function setupUI(camera, sun) {
  cameraRef = camera;
  sunRef = sun;

  overlayEl = document.getElementById("overlay");
  enterBtn = document.getElementById("enter-button");

  if (!overlayEl || !enterBtn) {
    console.warn("UI overlay elements not found.");
    return;
  }

  enterBtn.addEventListener("click", () => {
    if (!cameraRef || !sunRef) return;

    // Lock out planet clicks for the whole intro journey
    setZooming(true);

    introActive = true;
    introT = 0;
    startPos.copy(cameraRef.position);
    targetPos.copy(sunRef.position).add(new THREE.Vector3(0, 400, 600));

    setWarpSpeed(10);
    setTimeout(() => setWarpSpeed(2), 1500);

    overlayEl.classList.add("hidden");
  });
}

let controlsHintEl = null;

function showControlsHint() {
  const isTouch = 'ontouchstart' in window;
  controlsHintEl = document.createElement("div");
  controlsHintEl.id = "controls-hint";

  if (isTouch) {
    controlsHintEl.innerHTML =
      "<span>swipe to orbit</span>" +
      "<span>pinch to zoom</span>" +
      "<span>tap a planet to explore</span>";
  } else {
    controlsHintEl.innerHTML =
      "<span>wasd to orbit</span>" +
      "<span>scroll to zoom</span>" +
      "<span>click a planet to explore</span>";
  }

  document.body.appendChild(controlsHintEl);
  requestAnimationFrame(() => controlsHintEl.classList.add("visible"));

  window.addEventListener("user-interacted", dismissControlsHint, { once: true });
}

function dismissControlsHint() {
  if (!controlsHintEl) return;
  controlsHintEl.classList.remove("visible");
  setTimeout(() => { controlsHintEl?.remove(); controlsHintEl = null; }, 1200);
}

/**
 * Called each frame from main.js
 */
export function updateUI(deltaTime) {
  if (!introActive || !cameraRef || !sunRef) return;

  introT += deltaTime / introDuration;

  // Intro COMPLETED
  if (introT >= 1) {
    introT = 1;
    introActive = false;
    setZooming(false);
    showTopNav();
    showControlsHint();
    return;
  }

  // Interpolate camera
  cameraRef.position.lerpVectors(startPos, targetPos, introT);
  cameraRef.lookAt(sunRef.position);
}
