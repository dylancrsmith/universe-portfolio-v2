import { isFollowingPlanet } from './interactions.js';

const labels = [];

export function setupPlanetLabels(planets) {
  planets.forEach((planet, i) => {
    const el = document.createElement('div');
    el.className = 'planet-label';
    el.textContent = planet.name;
    document.body.appendChild(el);
    labels.push({ el, planet });
    scheduleSweep(el, 1500 + i * 900);
  });
}

function scheduleSweep(el, delay) {
  setTimeout(() => {
    if (!el.isConnected) return;
    el.classList.add('sweep');
    setTimeout(() => {
      el.classList.remove('sweep');
      scheduleSweep(el, 4000 + Math.random() * 3000);
    }, 900);
  }, delay);
}

export function updatePlanetLabels(camera, renderer) {
  const hidden = isFollowingPlanet();
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;

  labels.forEach(({ el, planet }) => {
    if (hidden) {
      el.style.opacity = '0';
      return;
    }

    const pos = planet.position.clone();
    pos.y += planet.geometry.parameters.radius + 28;

    const projected = pos.project(camera);

    if (projected.z > 1) {
      el.style.opacity = '0';
      return;
    }

    const x = (projected.x + 1) / 2 * w;
    const y = -(projected.y - 1) / 2 * h;

    if (x < 0 || x > w || y < 0 || y > h) {
      el.style.opacity = '0';
      return;
    }

    el.style.opacity = '1';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  });
}
