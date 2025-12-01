export function showPlanetInfo(planetName) {
  const panel = document.getElementById("planet-info");
  if (!panel) return;

  let title = planetName || "Planet";
  let body = "";

  switch (planetName) {
    case "About Me":
      title = "About Me";
      body = `
        <p class="terminal-line">I'm Dylan – AI & Data Science student and developer.</p>
        <p class="terminal-line">I build intelligent systems that learn from data and interact with the world.</p>
        <p class="terminal-line">Current focus: reinforcement learning, creative coding, and real-world AI tools.</p>
      `;
      break;

    case "Projects":
      title = "Projects";
      body = `
        <p class="terminal-line">NEAT vs Q-learning racing environment (gym-style car on custom tracks).</p>
        <p class="terminal-line">RealEstateBot 2.0 — UK property lead generation & analytics tool.</p>
        <p class="terminal-line">Universe Portfolio — this interactive Three.js space CV.</p>
        <p class="terminal-line"><code>More projects coming soon…</code></p>
      `;
      break;

    case "CV":
      title = "CV / Resume";
      body = `
        <p class="terminal-line">View my most up-to-date CV and experience.</p>
        <p class="terminal-line">Skills across Python, JS, data science, reinforcement learning, and creative coding.</p>
        <p class="terminal-line">
          <a href="#" style="color:#93c5fd; text-decoration:none;">[Download CV — coming soon]</a>
        </p>
      `;
      break;

    case "Contact":
      title = "Contact";
      body = `
        <p class="terminal-line">Open to internships, collaborations, and AI / data projects.</p>
        <p class="terminal-line">Email: <a href="mailto:dylan3002smith@gmail.com" style="color:#93c5fd;">dylan3002smith@gmail.com</a></p>
        <p class="terminal-line">GitHub: <a href="https://github.com/dylsmith17" target="_blank" style="color:#93c5fd;">dylsmith17</a></p>
      `;
      break;

    default:
      body = `<p class="terminal-line">This planet is still under construction.</p>`;
  }

  panel.innerHTML = `
    <h2>${title}</h2>
    ${body}
  `;

  panel.classList.remove("hidden");
}

export function hidePlanetInfo() {
  const panel = document.getElementById("planet-info");
  if (!panel) return;
  panel.classList.add("hidden");
}
