// ui/panels.js
// Right-hand planet panel + left-hand project detail panel

const PROJECTS = [
  {
    id: "realestatebot",
    name: "RealEstateBot 2.0",
    tagline: "AI property deal finder for UK developers.",
    description:
      "Scrapes UK portals, scores deals with custom rules & analytics, and exports an investor-ready shortlist.",
    tech: ["Python", "Selenium", "Pandas", "FastAPI"],
    github: "https://github.com/dylsmith17"
  },
  {
    id: "neat-car",
    name: "NEAT Racing AI",
    tagline: "Neuroevolution racing agent on custom tracks.",
    description:
      "Evolves neural controllers with NEAT to drive a top-down car around complex circuits with sensors and checkpoints.",
    tech: ["Python", "NEAT", "Pygame"],
    github: "https://github.com/dylsmith17"
  },
  {
    id: "universe-portfolio",
    name: "Universe Portfolio",
    tagline: "This interactive 3D solar-system CV.",
    description:
      "Three.js scene with orbiting planets, shaders, and UI panels that turns a portfolio into a small universe.",
    tech: ["Three.js", "GSAP", "JavaScript"],
    github: "https://github.com/dylsmith17"
  },
  {
    id: "imdb-nlp",
    name: "IMDB Sentiment Analysis",
    tagline: "NLP classifier on IMDB movie reviews.",
    description:
      "Cleans review text, builds TF-IDF features, and benchmarks classic ML models for sentiment prediction.",
    tech: ["Python", "scikit-learn", "NLP"],
    github: "https://github.com/dylsmith17"
  }
];

let rightPanel;          // #planet-panel
let rightContent;        // #planet-panel-content
let leftPanel;           // #project-detail
let leftContent;         // #project-detail-content

export function setupPanels() {
  rightPanel = document.getElementById("planet-panel");
  rightContent = document.getElementById("planet-panel-content");
  leftPanel = document.getElementById("project-detail");
  leftContent = document.getElementById("project-detail-content");

  if (!rightContent) return;

  // delegate clicks in project list → show detail panel
  rightContent.addEventListener("click", (e) => {
    const item = e.target.closest("[data-project-id]");
    if (!item) return;
    const proj = PROJECTS.find(p => p.id === item.dataset.projectId);
    if (proj) showProjectDetail(proj);
  });
}

export function hideAllPanels() {
  if (rightPanel) rightPanel.classList.remove("show");
  if (leftPanel) leftPanel.classList.remove("show");
}

export function showPanelForPlanet(planetName) {
  hideAllPanels();
  if (!rightPanel || !rightContent) return;

  if (planetName === "Projects") {
    // normal whitespace for list, not hacker text
    rightContent.classList.remove("hacker-mode");
    renderProjectsList();
    rightPanel.classList.add("show");
    return;
  }

  // hacker text mode for other planets
  rightContent.classList.add("hacker-mode");
  const text = buildPlanetText(planetName);
  rightPanel.classList.add("show");
  hackerText(rightContent, text, 12);
}

function buildPlanetText(name) {
  if (name === "About Me") {
    return `
Dylan Craddock-Smith
AI & Data Science @ MMU

Building RL agents, automation tools,
and creative interfaces in code.
    `;
  }

  if (name === "CV") {
    return `
CV / Resume

Overview of experience, education and skills.
Download link coming soon.
    `;
  }

  if (name === "Contact") {
    return `
Contact

Email: dylan3002smith@gmail.com
GitHub: dylsmith17
Open to internships and collaborations.
    `;
  }

  return `
This planet is still under construction.
  `;
}

// ---------- PROJECT LIST (RIGHT PANEL) ----------
function renderProjectsList() {
  rightContent.innerHTML = `
    <h1 class="pp-title">PROJECTS</h1>
    <p class="pp-hint">Click a project to view details.</p>
    <div id="project-list">
      ${PROJECTS.map(
        (p, idx) => `
        <div class="project-list-item" data-project-id="${p.id}">
          <div class="proj-line">
            <span class="proj-index">${idx + 1}.</span>
            <span class="proj-name">${p.name}</span>
          </div>
          <div class="proj-tagline">${p.tagline}</div>
        </div>
      `
      ).join("")}
    </div>
  `;
}

// ---------- PROJECT DETAIL (LEFT PANEL) ----------
function showProjectDetail(project) {
  if (!leftPanel || !leftContent) return;

  leftContent.innerHTML = `
    <div class="proj-header">
      <h2>${project.name}</h2>
      <p class="proj-sub">${project.tagline}</p>
    </div>

    <div class="proj-body">
      <p>${project.description}</p>

      <div class="proj-tech-row">
        ${project.tech.map(t => `<span class="pill">${t}</span>`).join("")}
      </div>

      <div class="proj-links">
        <button class="btn-ghost" onclick="window.open('${project.github}', '_blank')">
          View on GitHub →
        </button>
      </div>

      <div class="proj-screenshot-placeholder">
        Screenshot / preview coming soon.
      </div>
    </div>
  `;

  leftPanel.classList.add("show");
}

// ---------- HACKER TEXT ----------
function hackerText(element, text, speed = 15) {
  const chars = "!<>-_\\/[]{}—=+*^?#________";
  const lines = text.split("\n");

  let output = "";
  let lineIndex = 0;

  function randomChar() {
    return chars[Math.floor(Math.random() * chars.length)];
  }

  function revealLine() {
    const line = lines[lineIndex];
    let i = 0;

    const interval = setInterval(() => {
      const display = line
        .split("")
        .map((ch, idx) => (idx < i ? ch : randomChar()))
        .join("");

      element.innerHTML = output + display + "\n";
      i++;

      if (i > line.length) {
        clearInterval(interval);
        output += line + "\n";
        lineIndex++;
        if (lineIndex < lines.length) {
          setTimeout(revealLine, 110);
        }
      }
    }, speed);
  }

  element.innerHTML = "";
  revealLine();
}
