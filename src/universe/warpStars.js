// 2D lightspeed-style starfield on <canvas id="warp-canvas">

const STAR_COUNT = 900;
let canvas, ctx;
let width, height, midW, midH;

let stars = [];
let currentSpeed = 2;
let targetSpeed = 2;

class Star {
  constructor() {
    this.reset();
    this.prevPositions = [];
  }

  reset() {
    this.x = (Math.random() - 0.5) * width;
    this.y = (Math.random() - 0.5) * height;
    this.z = Math.random() * width;
    this.prevPositions = [];
  }

  update(dt) {
    this.z -= currentSpeed * 300 * dt;

    const scale = width / this.z;
    const sx = this.x * scale + midW;
    const sy = this.y * scale + midH;

    this.prevPositions.unshift({ x: sx, y: sy });

    const maxTail = Math.max(1, Math.floor(currentSpeed * 3));
    while (this.prevPositions.length > maxTail) {
      this.prevPositions.pop();
    }

    if (this.z <= 10) {
      this.reset();
    }
  }

  draw() {
    if (!this.prevPositions.length) return;

    const head = this.prevPositions[0];
    const tail = this.prevPositions[this.prevPositions.length - 1];

    const brightness = Math.min(1, currentSpeed / 6);
    ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.5 * brightness})`;
    ctx.lineWidth = Math.max(1, (width / this.z) * 0.015);

    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(head.x, head.y);
    ctx.stroke();
  }
}

export function initWarpStars() {
  canvas = document.getElementById("warp-canvas");
  if (!canvas) {
    console.warn("warp-canvas not found");
    return;
  }
  ctx = canvas.getContext("2d");
  handleResize();

  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push(new Star());
  }

  window.addEventListener("resize", handleResize);
}

function handleResize() {
  if (!canvas) return;
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
  midW = width / 2;
  midH = height / 2;
}

export function updateWarpStars(dt) {
  if (!ctx || !stars.length) return;

  const k = 1 - Math.exp(-dt * 5);
  currentSpeed += (targetSpeed - currentSpeed) * k;

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, 0, width, height);

  stars.forEach((star) => {
    star.update(dt);
    star.draw();
  });
}

export function setWarpSpeed(speed) {
  targetSpeed = speed;
}
