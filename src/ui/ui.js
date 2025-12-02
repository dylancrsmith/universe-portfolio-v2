import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { setWarpSpeed } from "../universe/warpStars.js";
import { showTopNav } from "./interactions.js";   // ⭐ ADD THIS IMPORT ⭐

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

    // start camera intro
    introActive = true;
    introT = 0;
    startPos.copy(cameraRef.position);
    targetPos.copy(sunRef.position).add(new THREE.Vector3(0, 400, 600));

    // Warp effect
    setWarpSpeed(10);
    setTimeout(() => setWarpSpeed(2), 1500);

    // fade overlay out
    overlayEl.classList.add("hidden");
  });
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

    // ⭐ FIX: Show navigation bar when the intro finishes ⭐
    showTopNav();

    return;  // Stop updating camera
  }

  // Interpolate camera
  cameraRef.position.lerpVectors(startPos, targetPos, introT);
  cameraRef.lookAt(sunRef.position);
}
