import { PROJECTS } from "./projects.js";

const listPanel = document.getElementById("project-list-panel");
const detailPanel = document.getElementById("project-detail-panel");

const listContainer = document.getElementById("project-list");
const detailContainer = document.getElementById("project-detail");

export function showProjectList() {
  listPanel.classList.add("show");

  // build clickable list
  listContainer.innerHTML = "";
  PROJECTS.forEach((p, i) => {
    const item = document.createElement("div");
    item.textContent = `${i + 1}. ${p.name}`;
    item.onclick = () => showProjectDetail(p);
    listContainer.appendChild(item);
  });
}

export function hideProjectList() {
  listPanel.classList.remove("show");
}

export function showProjectDetail(project) {
  detailPanel.classList.add("show");

  detailContainer.innerHTML = `
    <img src="${project.img}" />
    <h3>${project.name}</h3>
    <p>${project.description}</p>
    <a href="${project.link}" target="_blank">View on GitHub →</a>
  `;
}

export function hideProjectDetail() {
  detailPanel.classList.remove("show");
}

export function hideAllProjectPanels() {
  hideProjectList();
  hideProjectDetail();
}
