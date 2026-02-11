import './style.css';

/* ===== SOUNDS (Web Audio API — no external files) ===== */
let audioCtx = null;
function actx() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return audioCtx; }
function resumeAudio() { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }

function tone(freq, dur, type = 'sine', vol = 0.15) {
  const c = actx(), o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, c.currentTime);
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + dur);
}
function noise(dur, vol = 0.05) {
  const c = actx(), sr = c.sampleRate, len = sr * dur;
  const buf = c.createBuffer(1, len, sr), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource(); src.buffer = buf;
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
  const g = c.createGain(); g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  src.connect(hp).connect(g).connect(c.destination); src.start(); src.stop(c.currentTime + dur);
}

function playOpen() {
  const c = actx(), o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(250, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(700, c.currentTime + 0.12);
  o.frequency.exponentialRampToValueAtTime(180, c.currentTime + 0.35);
  g.gain.setValueAtTime(0.09, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
  o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.4);
  noise(0.18, 0.04);
  setTimeout(() => tone(1100, 0.12, 'sine', 0.05), 90);
  setTimeout(() => tone(1400, 0.10, 'sine', 0.04), 170);
}
function playPop() {
  const c = actx(), o = c.createOscillator(), g = c.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(500, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(150, c.currentTime + 0.09);
  g.gain.setValueAtTime(0.13, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12);
  o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.12);
}
function playChime() {
  tone(523, 0.28, 'sine', 0.12);
  setTimeout(() => tone(659, 0.28, 'sine', 0.12), 90);
  setTimeout(() => tone(784, 0.35, 'sine', 0.12), 190);
  setTimeout(() => tone(1047, 0.45, 'sine', 0.10), 320);
}
function playBuzz() {
  const c = actx(), o = c.createOscillator(), g = c.createGain();
  o.type = 'square'; o.frequency.setValueAtTime(320, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(70, c.currentTime + 0.28);
  g.gain.setValueAtTime(0.06, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.32);
  o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 0.32);
}
function playHover() { tone(900, 0.04, 'sine', 0.03); }
function playShimmer() {
  tone(880, 0.18, 'sine', 0.06);
  setTimeout(() => tone(1100, 0.16, 'sine', 0.05), 60);
  setTimeout(() => tone(1320, 0.22, 'sine', 0.05), 130);
}
function playDramatic() {
  const c = actx(), o = c.createOscillator(), g = c.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(90, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(500, c.currentTime + 0.9);
  g.gain.setValueAtTime(0.07, c.currentTime);
  g.gain.linearRampToValueAtTime(0.10, c.currentTime + 0.5);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 1.3);
  o.connect(g).connect(c.destination); o.start(); o.stop(c.currentTime + 1.3);
  setTimeout(() => tone(400, 0.55, 'triangle', 0.04), 250);
  setTimeout(() => tone(520, 0.45, 'triangle', 0.035), 450);
}

/* ===== DOM REFERENCES ===== */
const envelopeScene = document.getElementById('envelopeScene');
const envelope      = document.getElementById('envelope');
const letter        = document.getElementById('letter');
const continueBtn   = document.getElementById('continueBtn');
const backdrop      = document.getElementById('backdrop');
const qTitle        = document.getElementById('qTitle');
const qSub          = document.getElementById('qSub');
const btnRow        = document.getElementById('btnRow');
const yesBtn        = document.getElementById('yesBtn');
const noBtn         = document.getElementById('noBtn');
const celebration   = document.getElementById('celebration');
const butterflyEl   = document.getElementById('butterfly');
const tooSlowEl     = document.getElementById('tooSlow');
const stage         = document.querySelector('.stage');

/* ===== STATE ===== */
let isOpen = false;
let noCount = 0;
let yesScale = 1;
let modalVisible = false;
let butterflyLaunched = false;
let idleTimer = null;

const TITLE_DEFAULT = 'Will you be my Valentine? 💖';
const SUB_DEFAULT   = 'Choose wisely…';
const IDLE_MS = 15000;

const NO_LINES = [];

/* ===== IDLE TIMER (butterfly) ===== */
function resetIdleTimer() {
  if (butterflyLaunched) return;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    // Only launch butterfly if still on the envelope/letter stage
    if (!butterflyLaunched && !modalVisible && celebration.classList.contains('hidden')) {
      launchButterfly();
    }
  }, IDLE_MS);
}
document.addEventListener('mousemove', resetIdleTimer);
document.addEventListener('click', resetIdleTimer);
document.addEventListener('touchstart', resetIdleTimer);
resetIdleTimer();

/* ===== ENVELOPE OPEN ===== */
function openEnvelope() {
  if (isOpen) {
    // Already open — re-show the continue button if modal isn't up
    if (!modalVisible) {
      continueBtn.classList.add('visible');
    }
    return;
  }
  isOpen = true;
  resumeAudio();
  playOpen();

  // Open flap (CSS transition)
  envelope.classList.add('opened');

  // After flap opens, raise the letter
  setTimeout(() => {
    letter.classList.add('rising');
  }, 500);

  // After letter rises, reveal the continue button
  setTimeout(() => {
    continueBtn.classList.add('visible');
    playPop();
  }, 1600);
}

envelopeScene.addEventListener('click', openEnvelope);

/* ===== CONTINUE → MODAL TRANSITION ===== */
continueBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  resumeAudio();
  playShimmer();
  continueBtn.classList.remove('visible');

  // Fade out the stage
  stage.classList.add('fading');

  setTimeout(() => {
    showModal();
  }, 500);
});

/* ===== MODAL ===== */
function showModal() {
  modalVisible = true;
  noCount = 0;
  yesScale = 1;
  yesBtn.style.transform = '';
  yesBtn.disabled = false;
  noBtn.disabled = false;
  noBtn.style.position = '';
  noBtn.style.left = '';
  noBtn.style.top = '';
  qTitle.textContent = TITLE_DEFAULT;
  qSub.textContent = SUB_DEFAULT;

  backdrop.classList.remove('hidden');
  playPop();
}

function hideModal() {
  backdrop.classList.add('hidden');
  modalVisible = false;
}

// Click outside modal to close
backdrop.addEventListener('click', (e) => {
  if (e.target === backdrop) hideModal();
});

/* ===== NO BUTTON ===== */
function moveNoBtn() {
  const rowRect = btnRow.getBoundingClientRect();
  const btnW = noBtn.offsetWidth;
  const btnH = noBtn.offsetHeight;

  noBtn.style.position = 'absolute';

  const pad = 4;
  const maxX = rowRect.width - btnW - pad;
  const maxY = rowRect.height - btnH - pad;

  noBtn.style.left = `${pad + Math.random() * Math.max(0, maxX)}px`;
  noBtn.style.top  = `${pad + Math.random() * Math.max(0, maxY)}px`;
}

// Desktop: dodge on hover after first NO click
let hoverDodgeEnabled = false;
noBtn.addEventListener('mouseenter', () => {
  if (hoverDodgeEnabled) {
    resumeAudio();
    playHover();
    moveNoBtn();
  }
});

noBtn.addEventListener('click', () => {
  resumeAudio();
  playBuzz();
  noCount++;
  hoverDodgeEnabled = true;

  // Grow YES button
  yesScale = Math.min(yesScale + 0.22, 3);
  yesBtn.style.transform = `scale(${yesScale})`;

  // Keep "Choose wisely…" — no text changes

  // Move NO button
  moveNoBtn();

  // Shake the modal
  backdrop.classList.add('shake');
  setTimeout(() => backdrop.classList.remove('shake'), 450);

  // Boost background hearts
  HEARTS.boost();
});

/* ===== YES BUTTON ===== */
yesBtn.addEventListener('mouseenter', () => { resumeAudio(); playHover(); });

yesBtn.addEventListener('click', () => {
  resumeAudio();
  playChime();
  yesBtn.disabled = true;
  noBtn.disabled = true;

  // Stop the butterfly from ever appearing after YES
  butterflyLaunched = true;
  clearTimeout(idleTimer);

  hideModal();

  setTimeout(() => {
    celebration.classList.remove('hidden');
    spawnCelebHearts();
  }, 400);

  HEARTS.goWild(3000);
});

/* ===== CELEBRATION HEARTS ===== */
function spawnCelebHearts() {
  const emojis = ['💖', '💗', '💕', '💘', '❤️', '💝', '✨', '🩷'];
  const count = 35;

  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('span');
      el.className = 'celeb-heart';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      el.style.left = `${Math.random() * 100}vw`;
      el.style.top = `${50 + Math.random() * 50}vh`;
      el.style.fontSize = `${18 + Math.random() * 28}px`;
      el.style.setProperty('--dur', `${2.5 + Math.random() * 3}s`);
      el.style.setProperty('--rot', `${-30 + Math.random() * 60}deg`);
      el.style.setProperty('--end-scale', `${0.3 + Math.random() * 0.5}`);
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }, i * 80);
  }
}

/* =========================================================
   BACKGROUND HEARTS (Canvas — lightweight, capped at 60)
   ========================================================= */
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function drawHeart(x, y, size) {
  ctx.beginPath();
  const t = size * 0.3;
  ctx.moveTo(x, y + t);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + t);
  ctx.bezierCurveTo(x - size / 2, y + (size + t) / 2, x, y + (size + t) / 2, x, y + size);
  ctx.bezierCurveTo(x, y + (size + t) / 2, x + size / 2, y + (size + t) / 2, x + size / 2, y + t);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + t);
  ctx.closePath();
}

const HEARTS = (() => {
  const ps = [];
  let speedMul = 1;
  let wildUntil = 0;

  function spawn(n = 1) {
    for (let i = 0; i < n; i++) {
      ps.push({
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 20 + Math.random() * 40,
        vy: 0.25 + Math.random() * 0.7,
        vx: -0.25 + Math.random() * 0.5,
        size: 6 + Math.random() * 14,
        rot: -0.2 + Math.random() * 0.4,
        vr: -0.006 + Math.random() * 0.012,
        alpha: 0.08 + Math.random() * 0.3,
        hue: 270 + Math.random() * 60, // purple/pink range
      });
    }
  }

  // Pre-seed a few hearts on screen so it's not empty on load
  for (let i = 0; i < 8; i++) {
    ps.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vy: 0.25 + Math.random() * 0.7,
      vx: -0.25 + Math.random() * 0.5,
      size: 6 + Math.random() * 14,
      rot: -0.2 + Math.random() * 0.4,
      vr: -0.006 + Math.random() * 0.012,
      alpha: 0.08 + Math.random() * 0.3,
      hue: 270 + Math.random() * 60,
    });
  }

  function boost() {
    speedMul = Math.min(speedMul + 0.2, 2.5);
    setTimeout(() => { speedMul = Math.max(1, speedMul - 0.25); }, 700);
  }

  function goWild(ms) {
    wildUntil = Date.now() + ms;
  }

  let lastSpawn = 0;

  function tick(now) {
    const wild = Date.now() < wildUntil;

    if (now - lastSpawn > (wild ? 60 : 300)) {
      spawn(wild ? 3 : 1);
      lastSpawn = now;
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.x += p.vx * (wild ? 2.2 : 1);
      p.y -= p.vy * speedMul * (wild ? 2.5 : 1);
      p.rot += p.vr;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = `hsl(${p.hue} 65% 55%)`;
      drawHeart(0, 0, p.size);
      ctx.fill();
      ctx.restore();

      if (p.y < -40) {
        ps.splice(i, 1);
      }
    }

    if (ps.length > 60) ps.splice(0, ps.length - 60);

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
  return { boost, goWild };
})();

/* =========================================================
   BUTTERFLY — idle-timeout snatch animation
   ========================================================= */
function randomBetween(a, b) { return Math.random() * (b - a) + a; }

function launchButterfly() {
  if (butterflyLaunched) return;
  butterflyLaunched = true;
  clearTimeout(idleTimer);
  resumeAudio();
  playDramatic();

  const W = window.innerWidth, H = window.innerHeight;
  const side = Math.floor(Math.random() * 4);
  let sx, sy;
  switch (side) {
    case 0: sx = randomBetween(0.2*W, 0.8*W); sy = -120; break;
    case 1: sx = W + 120; sy = randomBetween(0.2*H, 0.8*H); break;
    case 2: sx = randomBetween(0.2*W, 0.8*W); sy = H + 120; break;
    default: sx = -120; sy = randomBetween(0.2*H, 0.8*H); break;
  }

  const sceneRect = envelopeScene.getBoundingClientRect();
  const tx = sceneRect.left + sceneRect.width / 2;
  const ty = sceneRect.top + sceneRect.height / 2;

  const ex = side === 1 ? -250 : side === 3 ? W + 250 : randomBetween(0, W);
  const ey = side === 0 ? H + 250 : side === 2 ? -250 : randomBetween(0, H);

  butterflyEl.style.left = sx + 'px';
  butterflyEl.style.top = sy + 'px';
  butterflyEl.style.transform = 'translate(-50%,-50%)';
  butterflyEl.classList.add('visible');

  const dur1 = 2000, t0 = performance.now();

  function phase1(now) {
    const t = Math.min((now - t0) / dur1, 1);
    const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    const zigX = Math.sin(t * Math.PI * 7) * 50 * (1 - t);
    const zigY = Math.sin(t * Math.PI * 5) * 35 * (1 - t);
    const cx = sx + (tx - sx) * ease + zigX;
    const cy = sy + (ty - sy) * ease + zigY;
    // Point butterfly in direction of travel (head-first, not upside down)
    const prevX = sx + (tx - sx) * (t < 0.5 ? 2*(t-0.01)*(t-0.01) : -1+(4-2*(t-0.01))*(t-0.01));
    const velX = cx - (sx + (tx - sx) * (t < 0.02 ? 0 : (t-0.02 < 0.5 ? 2*(t-0.02)*(t-0.02) : -1+(4-2*(t-0.02))*(t-0.02))) + Math.sin((t-0.02) * Math.PI * 7) * 50 * (1 - (t-0.02)));
    const velY = cy - (sy + (ty - sy) * (t < 0.02 ? 0 : (t-0.02 < 0.5 ? 2*(t-0.02)*(t-0.02) : -1+(4-2*(t-0.02))*(t-0.02))) + Math.sin((t-0.02) * Math.PI * 5) * 35 * (1 - (t-0.02)));
    // Clamp rotation so butterfly stays mostly upright (no flipping)
    let angle = Math.atan2(velY, velX) * 180 / Math.PI;
    // Keep between -90 and 90 so it doesn't go upside down
    if (angle > 90) angle = 90;
    if (angle < -90) angle = -90;
    butterflyEl.style.left = cx + 'px';
    butterflyEl.style.top = cy + 'px';
    butterflyEl.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
    if (t < 1) requestAnimationFrame(phase1); else grabAndFly();
  }

  function grabAndFly() {
    let shakes = 0;
    const sid = setInterval(() => {
      const rx = (Math.random() - 0.5) * 24;
      const ry = (Math.random() - 0.5) * 12;
      envelopeScene.style.transition = 'none';
      envelopeScene.style.transform = `translate(${rx}px,${ry}px) rotate(${rx/3}deg)`;
      shakes++;
      if (shakes > 12) { clearInterval(sid); flyAway(); }
    }, 45);
  }

  function flyAway() {
    const dur2 = 1400, t1 = performance.now();
    function phase2(now) {
      const t = Math.min((now - t1) / dur2, 1);
      const ease = t * t;
      const bx = tx + (ex - tx) * ease;
      const by = ty + (ey - ty) * ease;
      butterflyEl.style.left = bx + 'px';
      butterflyEl.style.top = by + 'px';
      let a2 = Math.atan2(ey - ty, ex - tx) * 180 / Math.PI;
      if (a2 > 90) a2 = 90;
      if (a2 < -90) a2 = -90;
      butterflyEl.style.transform = `translate(-50%,-50%) rotate(${a2}deg)`;
      const cdx = bx - tx, cdy = by - ty;
      const spin = t * 420;
      envelopeScene.style.transform = `translate(${cdx}px,${cdy}px) rotate(${spin}deg) scale(${1 - t*0.6})`;
      envelopeScene.style.opacity = `${1 - t}`;
      if (t < 1) requestAnimationFrame(phase2);
      else { butterflyEl.classList.remove('visible'); tooSlowEl.classList.add('show'); }
    }
    requestAnimationFrame(phase2);
  }

  requestAnimationFrame(phase1);
}
