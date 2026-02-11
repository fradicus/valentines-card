import confetti from "https://esm.sh/canvas-confetti@1.9.3";
import {
  resumeAudio,
  playOpen,
  playPop,
  playChime,
  playBuzz,
  playHover,
  playShimmer,
  playDramatic,
} from "./sounds.js";

/* ========= editable content ========= */
const CONTENT = {
  message:
    "I made you a chaotic little website because you deserve something fun as hell. 💘",
  questionTitle: "Will you be my Valentine? 💖",
};

/* ========= DOM refs ========= */
const envelopeBtn = document.getElementById("envelopeBtn");
const messageEl = document.getElementById("message");
const hint = document.getElementById("hint");
const cardShell = document.getElementById("cardShell");
const continueBtn = document.getElementById("continueBtn");

const modalBackdrop = document.getElementById("modalBackdrop");
const questionTitle = document.getElementById("questionTitle");
const questionSub = document.getElementById("questionSub");
const choiceRow = document.getElementById("choiceRow");

const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");

const butterfly = document.getElementById("butterfly");
const tooSlow = document.getElementById("tooSlow");

/* ========= inject content ========= */
messageEl.textContent = CONTENT.message;
questionTitle.textContent = CONTENT.questionTitle;

/* ========= state ========= */
let opened = false;
let modalVisible = false;
let noCount = 0;
let yesScale = 1;
let butterflyLaunched = false;
let idleTimer = null;

/* ========= idle timeout (butterfly) ========= */
const IDLE_MS = 15000;

function resetIdleTimer() {
  if (butterflyLaunched) return;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!butterflyLaunched && !modalVisible) launchButterfly();
  }, IDLE_MS);
}

document.addEventListener("mousemove", resetIdleTimer);
document.addEventListener("click", resetIdleTimer);
document.addEventListener("touchstart", resetIdleTimer);
resetIdleTimer();

/* ========= confetti helper ========= */
const CONFETTI_COLORS = [
  "#B39DDB",
  "#D1C4E9",
  "#7E57C2",
  "#EA80FC",
  "#FF80AB",
  "#FFFFFF",
];

function burstConfetti(intensity = 1) {
  confetti({
    particleCount: Math.floor(120 * intensity),
    spread: 70,
    origin: { y: 0.7 },
    colors: CONFETTI_COLORS,
  });
  confetti({
    particleCount: Math.floor(60 * intensity),
    spread: 120,
    origin: { y: 0.6 },
    colors: CONFETTI_COLORS,
  });
}

/* ========= envelope open ========= */
function openEnvelope() {
  if (opened) return;
  opened = true;
  resumeAudio();
  playOpen();
  envelopeBtn.classList.add("open");
  hint.classList.add("gone");
  burstConfetti(0.5);

  // reveal continue button after the letter finishes sliding up
  setTimeout(() => {
    continueBtn.classList.add("visible");
    continueBtn.tabIndex = 0;
  }, 1600);
}

/* ========= continue -> modal ========= */
function transitionToModal() {
  playShimmer();
  continueBtn.classList.remove("visible");
  continueBtn.tabIndex = -1;

  // fade card shell out
  cardShell.classList.add("fading");

  setTimeout(() => {
    showModal();
  }, 500);
}

/* ========= modal helpers ========= */
function showModal() {
  modalVisible = true;
  noCount = 0;
  yesScale = 1;
  yesBtn.style.transform = "scale(1)";
  yesBtn.disabled = false;
  noBtn.disabled = false;
  noBtn.style.position = "";
  noBtn.style.left = "";
  noBtn.style.top = "";
  questionTitle.textContent = CONTENT.questionTitle;
  questionSub.textContent = "Choose wisely.";

  modalBackdrop.classList.add("show");
  playPop();
}

function hideModal() {
  modalBackdrop.classList.remove("show");
  modalVisible = false;
}

/* ========= NO logic ========= */
const NO_LINES = [
  "Are you sure? 😭",
  "Wait… really?",
  "Ok but like… reconsider.",
  "I will simply pretend I didn't see that.",
  "You meant YES. Try again.",
  "This button is feeling unsafe. 😈",
  "Final answer??",
  "The audacity...",
  "💔 ...fine. (jk try again)",
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function moveNoButtonChaotically() {
  const rect = choiceRow.getBoundingClientRect();
  noBtn.style.position = "absolute";
  const pad = 8;
  const maxX = rect.width - noBtn.offsetWidth - pad;
  const maxY = rect.height - noBtn.offsetHeight - pad;
  noBtn.style.left = `${randomBetween(pad, Math.max(pad, maxX))}px`;
  noBtn.style.top = `${randomBetween(pad, Math.max(pad, maxY))}px`;
}

function onNo() {
  resumeAudio();
  playBuzz();
  noCount++;

  yesScale = Math.min(yesScale + 0.18, 2.6);
  yesBtn.style.transform = `scale(${yesScale})`;

  questionSub.textContent =
    NO_LINES[Math.min(noCount - 1, NO_LINES.length - 1)];

  if (noCount >= 1) moveNoButtonChaotically();

  burstConfetti(Math.min(0.25 + noCount * 0.08, 0.9));
  modalBackdrop.classList.add("shake");
  setTimeout(() => modalBackdrop.classList.remove("shake"), 260);

  HEARTS.boost();
}

function onYes() {
  resumeAudio();
  playChime();
  questionTitle.textContent = "LETS GOOOO 💘";
  questionSub.textContent = "Correct answer. I knew you had taste.";
  burstConfetti(1.4);
  setTimeout(() => burstConfetti(1.0), 140);
  setTimeout(() => burstConfetti(0.8), 280);

  yesBtn.disabled = true;
  noBtn.disabled = true;

  setTimeout(() => hideModal(), 1200);
  HEARTS.goWild(1800);
}

/* ========= event listeners ========= */
envelopeBtn.addEventListener("click", (e) => {
  e.preventDefault();
  resumeAudio();
  openEnvelope();
});

continueBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  e.preventDefault();
  transitionToModal();
});

modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) hideModal();
});

yesBtn.addEventListener("click", onYes);
noBtn.addEventListener("click", onNo);

// hover sounds on heart buttons
[yesBtn, noBtn].forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    resumeAudio();
    playHover();
  });
});

/* ==========================================================
   BACKGROUND HEARTS (floating canvas)
   ========================================================== */
const canvas = document.getElementById("hearts-canvas");
const ctx = canvas.getContext("2d");

function resize() {
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener("resize", resize);
resize();

function heartPath(x, y, size) {
  ctx.beginPath();
  const h = size * 0.3;
  ctx.moveTo(x, y + h);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + h);
  ctx.bezierCurveTo(x - size / 2, y + (size + h) / 2, x, y + (size + h) / 2, x, y + size);
  ctx.bezierCurveTo(x, y + (size + h) / 2, x + size / 2, y + (size + h) / 2, x + size / 2, y + h);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + h);
  ctx.closePath();
}

const HEARTS = (() => {
  const particles = [];
  let speedMul = 1;
  let wildUntil = 0;

  function spawn(n = 2) {
    for (let i = 0; i < n; i++) {
      const size = randomBetween(8, 22);
      particles.push({
        x: randomBetween(0, window.innerWidth),
        y: window.innerHeight + randomBetween(0, 120),
        vy: randomBetween(0.5, 1.6),
        vx: randomBetween(-0.4, 0.4),
        size,
        rot: randomBetween(-0.2, 0.2),
        vr: randomBetween(-0.01, 0.01),
        alpha: randomBetween(0.2, 0.75),
        // use purples / pinks instead of only pinks
        hue: randomBetween(260, 340),
      });
    }
  }

  function boost() {
    speedMul = Math.min(speedMul + 0.08, 2.2);
    setTimeout(() => (speedMul = Math.max(1, speedMul - 0.12)), 600);
  }

  function goWild(ms = 1500) {
    wildUntil = Date.now() + ms;
  }

  function tick() {
    const now = Date.now();
    const isWild = now < wildUntil;
    spawn(isWild ? 6 : 2);

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * (isWild ? 2.2 : 1);
      p.y -= p.vy * speedMul * (isWild ? 2.6 : 1);
      p.rot += p.vr;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = `hsl(${p.hue} 80% 65%)`;
      heartPath(0, 0, p.size);
      ctx.fill();
      ctx.restore();

      if (p.y < -60 || p.x < -80 || p.x > window.innerWidth + 80) {
        particles.splice(i, 1);
      }
    }
    requestAnimationFrame(tick);
  }

  tick();
  return { boost, goWild };
})();

/* ==========================================================
   BUTTERFLY — idle-timeout snatch animation
   ========================================================== */
function launchButterfly() {
  if (butterflyLaunched) return;
  butterflyLaunched = true;
  clearTimeout(idleTimer);

  resumeAudio();
  playDramatic();

  const W = window.innerWidth;
  const H = window.innerHeight;

  // random entry edge  (0=top, 1=right, 2=bottom, 3=left)
  const side = Math.floor(Math.random() * 4);
  let sx, sy;
  switch (side) {
    case 0: sx = randomBetween(0.2 * W, 0.8 * W); sy = -120; break;
    case 1: sx = W + 120; sy = randomBetween(0.2 * H, 0.8 * H); break;
    case 2: sx = randomBetween(0.2 * W, 0.8 * W); sy = H + 120; break;
    default: sx = -120; sy = randomBetween(0.2 * H, 0.8 * H); break;
  }

  // target = center of card
  const cardRect = cardShell.getBoundingClientRect();
  const tx = cardRect.left + cardRect.width / 2;
  const ty = cardRect.top + cardRect.height / 2;

  // exit = random opposite-ish edge
  const ex = side === 1 ? -250 : side === 3 ? W + 250 : randomBetween(0, W);
  const ey = side === 0 ? H + 250 : side === 2 ? -250 : randomBetween(0, H);

  // show butterfly at start
  butterfly.style.left = `${sx}px`;
  butterfly.style.top = `${sy}px`;
  butterfly.style.transform = "translate(-50%,-50%)";
  butterfly.classList.add("visible");

  /* --- Phase 1: fly to card (2s) --- */
  const dur1 = 2000;
  const t0 = performance.now();

  function phase1(now) {
    const t = Math.min((now - t0) / dur1, 1);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const zigX = Math.sin(t * Math.PI * 7) * 50 * (1 - t);
    const zigY = Math.sin(t * Math.PI * 5) * 35 * (1 - t);

    const cx = sx + (tx - sx) * ease + zigX;
    const cy = sy + (ty - sy) * ease + zigY;

    // point butterfly in travel direction
    const dx = tx - sx + Math.cos(t * Math.PI * 7) * 50 * (1 - t);
    const dy = ty - sy + Math.cos(t * Math.PI * 5) * 35 * (1 - t);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    butterfly.style.left = `${cx}px`;
    butterfly.style.top = `${cy}px`;
    butterfly.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;

    if (t < 1) {
      requestAnimationFrame(phase1);
    } else {
      grabAndFly();
    }
  }

  /* --- Phase 2: shake card, then fly away with it --- */
  function grabAndFly() {
    let shakes = 0;
    const shakeId = setInterval(() => {
      const rx = (Math.random() - 0.5) * 24;
      const ry = (Math.random() - 0.5) * 12;
      cardShell.style.transition = "none";
      cardShell.style.transform = `translate(${rx}px,${ry}px) rotate(${rx / 3}deg)`;
      shakes++;
      if (shakes > 12) {
        clearInterval(shakeId);
        flyAway();
      }
    }, 45);
  }

  function flyAway() {
    const dur2 = 1400;
    const t1 = performance.now();
    const startCX = tx;
    const startCY = ty;

    function phase2(now) {
      const t = Math.min((now - t1) / dur2, 1);
      const ease = t * t; // accelerate out

      const bx = tx + (ex - tx) * ease;
      const by = ty + (ey - ty) * ease;

      butterfly.style.left = `${bx}px`;
      butterfly.style.top = `${by}px`;
      const a2 = Math.atan2(ey - ty, ex - tx) * (180 / Math.PI);
      butterfly.style.transform = `translate(-50%,-50%) rotate(${a2}deg)`;

      // card follows butterfly
      const cdx = bx - startCX;
      const cdy = by - startCY;
      const spin = t * 420;
      cardShell.style.transform = `translate(${cdx}px,${cdy}px) rotate(${spin}deg) scale(${1 - t * 0.6})`;
      cardShell.style.opacity = `${1 - t}`;

      if (t < 1) {
        requestAnimationFrame(phase2);
      } else {
        butterfly.classList.remove("visible");
        showTooSlow();
      }
    }
    requestAnimationFrame(phase2);
  }

  requestAnimationFrame(phase1);
}

function showTooSlow() {
  tooSlow.classList.add("show");
}
