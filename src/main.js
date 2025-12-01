import { scene, camera, renderer, setupResize } from './core/scene.js';
import { createStarfield } from './universe/starfield.js';
import { createSun } from './universe/sun.js';
import { createPlanets, updatePlanets } from './universe/planets.js';
import { setupUI, updateUI } from './ui/ui.js';
import { initWarpStars, updateWarpStars } from './universe/warpStars.js';
import { setupInteractions, updateInteractions } from './ui/interactions.js';

setupResize();

// World
const { farStars, nearStars } = createStarfield(scene);
const sun = createSun(scene);
const planets = createPlanets(scene, sun);

// 2D warp starfield
initWarpStars();

// UI overlay (enter button, intro camera)
setupUI(camera, sun);

// Hover interactions (planets glow + scale on hover)
setupInteractions(camera, planets, renderer.domElement);

let lastTime = 0;

function animate(time) {
  requestAnimationFrame(animate);

  const t = time * 0.001;
  const delta = (time - lastTime) / 1000;
  lastTime = time;

  // Sun animation
  if (sun) {
    sun.rotation.y += 0.002;

    if (sun.userData.corona) {
      sun.userData.corona.material.uniforms.time.value = t;
    }

    if (sun.userData.plasma) {
      const plasma = sun.userData.plasma;
      plasma.material.opacity = 0.3 + Math.sin(t * 3.0) * 0.2;
      plasma.rotation.y += 0.001;
    }
  }

  // Starfield drift
  if (farStars) farStars.rotation.y += 0.00003;
  if (nearStars) {
    nearStars.rotation.y += 0.0001;
    nearStars.rotation.x += 0.00005;
  }

  // Planets movement
  updatePlanets(planets, sun);

  // 2D warp stars animation
  updateWarpStars(delta);

  // UI intro camera movement
  updateUI(delta);

  // Hover interactions (glow + scale)
  updateInteractions(delta);

  renderer.render(scene, camera);
}

animate();
