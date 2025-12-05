import { scene, camera, renderer, setupResize } from './core/scene.js';
import { createStarfield } from './universe/starfield.js';
import { createSun } from './universe/sun.js';
import { createPlanets, updatePlanets } from './universe/planets.js';
import { setupUI, updateUI } from './ui/ui.js';
import { initWarpStars, updateWarpStars } from './universe/warpStars.js';
import { setupInteractions, updateInteractions } from './ui/interactions.js';
import { setupPanels } from './ui/panels.js';

// ⭐ Parallax import (you already added this)
import { setupStarParallax, updateStarParallax } from "./ui/starParallax.js";

setupResize();

// 3D world
const { farStars, nearStars } = createStarfield(scene);

// ⭐ STEP 1: Setup parallax RIGHT AFTER creating stars
setupStarParallax(renderer.domElement, farStars, nearStars);

const sun = createSun(scene);
const planets = createPlanets(scene, sun);

// Panels (right + left)
setupPanels();

// 2D warp layer
initWarpStars();

// UI overlay (enter button)
setupUI(camera, sun);

// Hover + click + nav interactions
setupInteractions(camera, planets, renderer.domElement, sun);

let prev = 0;
function animate(t) {
  requestAnimationFrame(animate);

  const dt = (t - prev) / 1000;
  prev = t;

  // Sun anims
  sun.rotation.y += 0.002;

  if (sun.userData.corona) {
    sun.userData.corona.material.uniforms.time.value = t * 0.001;
  }

  if (sun.userData.plasma) {
    sun.userData.plasma.rotation.y += 0.001;
    sun.userData.plasma.material.opacity = 0.3 + Math.sin(t * 0.004) * 0.2;
  }

  // Starfield drift
  farStars.rotation.y += 0.00003;
  nearStars.rotation.y += 0.0001;

  // ⭐ STEP 3: Update parallax effect every frame

  
  updateStarParallax();

  // Planet movement
  updatePlanets(planets, sun);

  // Warp stars
  updateWarpStars(dt);

  // UI intro motion
  updateUI(dt);

  // Camera orbit + interactions
  updateInteractions(dt);

  renderer.render(scene, camera);
}

animate();
