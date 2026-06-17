// --- STAR PARALLAX SYSTEM (Lightweight Mouse Repulsion) ---
import { isFollowingPlanet } from "./interactions.js";

let mouseX = 0;
let mouseY = 0;

const parallaxState = {
  far: null,
  near: null,
  nebula: null,
  strengthFar: 200,
  strengthNear: 120,
  strengthNebula: 40,
};

export function setupStarParallax(domElement, farStars, nearStars, nebula) {
  parallaxState.far = farStars;
  parallaxState.near = nearStars;
  parallaxState.nebula = nebula;

  domElement.addEventListener("pointermove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  domElement.addEventListener("pointerleave", () => {
    mouseX = 0;
    mouseY = 0;
  });
}

export function updateStarParallax() {
  const { far, near, nebula, strengthFar, strengthNear, strengthNebula } = parallaxState;
  if (!far || !near) return;

  // Freeze parallax while camera is at a planet
  if (isFollowingPlanet()) {
    far.position.x += (0 - far.position.x) * 0.05;
    far.position.y += (0 - far.position.y) * 0.05;
    near.position.x += (0 - near.position.x) * 0.05;
    near.position.y += (0 - near.position.y) * 0.05;
    if (nebula) {
      nebula.position.x += (0 - nebula.position.x) * 0.05;
      nebula.position.y += (0 - nebula.position.y) * 0.05;
    }
    return;
  }

  const farX = -mouseX * strengthFar;
  const farY = mouseY * strengthFar;
  const nearX = -mouseX * strengthNear;
  const nearY = mouseY * strengthNear;
  const nebX = -mouseX * strengthNebula;
  const nebY = mouseY * strengthNebula;

  far.position.x += (farX - far.position.x) * 0.04;
  far.position.y += (farY - far.position.y) * 0.04;
  near.position.x += (nearX - near.position.x) * 0.06;
  near.position.y += (nearY - near.position.y) * 0.06;
  if (nebula) {
    nebula.position.x += (nebX - nebula.position.x) * 0.05;
    nebula.position.y += (nebY - nebula.position.y) * 0.05;
  }
}
