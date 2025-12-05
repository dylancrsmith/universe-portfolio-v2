// --- STAR PARALLAX SYSTEM (Lightweight Mouse Repulsion) ---

let mouseX = 0;
let mouseY = 0;

const parallaxState = {
  far: null,
  near: null,
  strengthFar: 200,     // soft movement, deep space feel
  strengthNear: 120,   // stronger movement for close stars
};

/**
 * Called once on startup
 */
export function setupStarParallax(domElement, farStars, nearStars) {
  parallaxState.far = farStars;
  parallaxState.near = nearStars;

  domElement.addEventListener("pointermove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  domElement.addEventListener("pointerleave", () => {
    mouseX = 0;
    mouseY = 0;
  });
}

/**
 * Called every frame from main.js
 */
export function updateStarParallax() {
  const { far, near, strengthFar, strengthNear } = parallaxState;
  if (!far || !near) return;

  // target offsets based on cursor position
  const farX = -mouseX * strengthFar;
  const farY = mouseY * strengthFar;

  const nearX = -mouseX * strengthNear;
  const nearY = mouseY * strengthNear;

  // Smooth easing (LERP)
  far.position.x += (farX - far.position.x) * 0.04;
  far.position.y += (farY - far.position.y) * 0.04;

  near.position.x += (nearX - near.position.x) * 0.06;
  near.position.y += (nearY - near.position.y) * 0.06;
}
