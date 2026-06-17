// ui/panels.js
// Right-hand planet panel + left-hand project detail panel

const PROJECTS = [
  {
    id: "dreamstreak",
    name: "DreamStreak",
    tagline: "Sole backend engineer on a full-stack sleep app.",
    description:
      "Designed and built the entire backend from scratch: Express.js REST API, JWT authentication, PostgreSQL with Drizzle ORM, and push notifications. Frontend in React Native + Expo with an ambient sound player for sleep aid. University project — 90% personal mark, 84% overall.",
    tech: ["Express.js", "PostgreSQL", "Drizzle ORM", "JWT", "React Native", "Expo"],
    github: "https://github.com/dylancrsmith/SleepTracker"
  },
  {
    id: "neat-car",
    name: "NEAT Racing AI",
    tagline: "Neuroevolution agent that learns to drive.",
    description:
      "Evolves neural network controllers using the NEAT algorithm to drive a top-down car around complex circuits. Agents use sensor raycasts to perceive the track and checkpoints to measure progress — no hardcoded rules, behaviour emerges entirely through evolution.",
    tech: ["Python", "NEAT-Python", "Pygame"],
    github: "https://github.com/dylancrsmith/NEATCarClean"
  },
  {
    id: "imdb-nlp",
    name: "IMDB Sentiment Analysis",
    tagline: "NLP classifier on 50,000 movie reviews.",
    description:
      "End-to-end NLP pipeline on the IMDB dataset. Preprocesses and cleans review text, builds TF-IDF feature vectors, then benchmarks Logistic Regression, Naive Bayes and SVM models for binary sentiment classification.",
    tech: ["Python", "scikit-learn", "NLTK", "Pandas"],
    github: "https://github.com/dylancrsmith/IMDb_reviews_sentiment_analysis"
  },
  {
    id: "universe-portfolio",
    name: "Universe Portfolio",
    tagline: "This interactive 3D solar-system portfolio.",
    description:
      "Three.js scene with orbiting planets, custom corona shaders, GSAP camera animations and raycaster-based interaction. Each planet is a section of the portfolio.",
    tech: ["Three.js", "GSAP", "JavaScript", "Vite"],
    github: "https://github.com/dylancrsmith/universe-portfolio-v2"
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
  const { text, links } = buildPlanetData(planetName);
  rightPanel.classList.add("show");
  hackerText(rightContent, text, 12, () => {
    if (!links.length) return;
    const linkBlock = document.createElement("div");
    linkBlock.className = "panel-links";
    linkBlock.innerHTML = links.map(l =>
      `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`
    ).join("");
    rightContent.appendChild(linkBlock);
  });
}

function buildPlanetData(name) {
  if (name === "About Me") {
    return {
      text: `Dylan Craddock-Smith
BSc AI & Data Science
Manchester Metropolitan University
Predicted 1st Class  |  Graduating 2027

Specialising in machine learning, AI automation
and intelligent systems. Building projects across
reinforcement learning, NLP and creative tech.

Seeking graduate roles in AI / ML.`,
      links: []
    };
  }

  if (name === "CV") {
    return {
      text: `CV / Resume

Completing final projects before publishing
a full CV so every build is represented.

In the meantime — reach out directly:`,
      links: [
        { label: "dylan3002smith@gmail.com", url: "mailto:dylan3002smith@gmail.com" },
        { label: "linkedin.com/in/dylan-smith-9a0579413", url: "https://www.linkedin.com/in/dylan-smith-9a0579413" }
      ]
    };
  }

  if (name === "Contact") {
    return {
      text: `Get In Touch

Open to graduate roles, internships
and interesting collaborations.`,
      links: [
        { label: "dylan3002smith@gmail.com", url: "mailto:dylan3002smith@gmail.com" },
        { label: "linkedin.com/in/dylan-smith-9a0579413", url: "https://www.linkedin.com/in/dylan-smith-9a0579413" },
        { label: "github.com/dylancrsmith", url: "https://github.com/dylancrsmith" }
      ]
    };
  }

  return { text: "This planet is still under construction.", links: [] };
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
function hackerText(element, text, speed = 15, onComplete) {
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
        } else if (onComplete) {
          onComplete();
        }
      }
    }, speed);
  }

  element.innerHTML = "";
  revealLine();
}
