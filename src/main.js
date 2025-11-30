import { scene, camera, renderer, setupResize } from './core/scene.js';
import { createStarfield } from './universe/starfield.js';
import { createSun } from './universe/sun.js';

setupResize();

// Create world
const { farStars, nearStars } = createStarfield(scene);
const sun = createSun(scene);

function animate(time) {
  requestAnimationFrame(animate);

  const t = time * 0.001;

  // Rotate sun slowly
  if (sun) {
    sun.rotation.y += 0.002;
  }

  // Animate corona shader
  if (sun && sun.userData.corona) {
    sun.userData.corona.material.uniforms.time.value = t;
  }

  // Animate plasma
  if (sun && sun.userData.plasma) {
    const plasma = sun.userData.plasma;
    plasma.material.opacity = 0.3 + Math.sin(t * 3.0) * 0.2;
    plasma.rotation.y += 0.001;
  }

  // Subtle star motion
  if (farStars) {
    farStars.rotation.y += 0.00003;
  }
  if (nearStars) {
    nearStars.rotation.y += 0.0001;
    nearStars.rotation.x += 0.00005;
  }

  renderer.render(scene, camera);
}

animate();
