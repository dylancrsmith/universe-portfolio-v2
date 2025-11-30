export function setupUI(camera) {
  const overlay = document.getElementById("overlay");
  const enterBtn = document.getElementById("enter");
  const ui = document.getElementById("ui");
  const backBtn = document.getElementById("back-button");

  enterBtn.onclick = () => {
    overlay.style.display = "none";
    ui.style.display = "block";
  };

  backBtn.onclick = () => {
    camera.position.set(0, 0, 15);
  };
}
