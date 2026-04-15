/**
 * script.js
 * Lyrics-style poem display — line by line with fade-up animation.
 */

// ── Poem lines ──────────────────────────────────────────────────────────────
// Empty strings act as stanza breaks (visual spacing).
const lines = [
  "Aku menyerahkan seluruh kata-kataku kepada angin,",
  "bukan untuk hilang,",
  "tapi agar sampai ke telingamu sebagai bisikan",
  "bahwa ada seseorang yang menyayangimu tanpa lelah,",
  "yang mencintaimu dengan cara yang paling tenang.",
  "",
  "Di dalam doaku, namamu adalah satu-satunya yang bising.",
  "Aku meminta kepada Tuhan agar menjauhkanmu dari luka,",
  "dan aku akan selalu menjadi alasan di balik senyum yang kau cari.",
  "Kita akan menua dalam syukur yang paling indah.",
  "",
  "Aku adalah jiwa yang sudah lelah berkelana,",
  "yang kini memilih untuk berhenti dan menetap di matamu.",
  "Aku tidak lagi ingin mencari pelabuhan lain,",
  "karena bagiku, kau adalah pengabdian yang terakhir.",
  "",
  "Jika dunia di luar sana terlalu riuh dan menyakitimu,",
  "pulanglah kepadaku.",
  "Aku ingin menjadi tempat paling aman yang pernah kau miliki,",
  "menjadi bahu yang menampung segala lelah yang kau bawa.",
  "",
  "Dari aku, dengan segala ketidaksempurnaan ini,",
  "aku menawarkan diri untuk menjagamu.",
  "Tak ada yang kusisakan untuk diriku sendiri,",
  "semuanya sudah kuberikan padamu.",
];

// ── Config ──────────────────────────────────────────────────────────────────
const DELAY_MS     = 3000;  // ms between each line appearing
const STANZA_EXTRA = 600;   // extra ms pause on blank (stanza break) lines

// ── State ───────────────────────────────────────────────────────────────────
let currentIndex    = 0;
let isPaused        = false;
let timer           = null;
let musicOn         = false;
let isAutoScrolling = false;
let poemDone        = false; // true once all lines have appeared

let userScrolled      = false;
let scrollResumeTimer = null;

// Only flag user scroll when WE are not the ones scrolling
window.addEventListener('wheel',     () => { if (!isAutoScrolling) { userScrolled = true; clearTimeout(scrollResumeTimer); scrollResumeTimer = setTimeout(() => { userScrolled = false; }, 2000); } }, { passive: true });
window.addEventListener('touchmove', () => { if (!isAutoScrolling) { userScrolled = true; clearTimeout(scrollResumeTimer); scrollResumeTimer = setTimeout(() => { userScrolled = false; }, 2000); } }, { passive: true });

// ── Padding cleanup on scroll ─────────────────────────────────────────────
window.addEventListener('scroll', () => {
  // 1. Remove top padding once the first line-wrap has scrolled off the top
  if (container.style.paddingTop !== '11vh') {
    const firstWrap = container.querySelector('.poem-line-wrap');
    if (firstWrap) {
      const bottom = firstWrap.getBoundingClientRect().bottom;
      if (bottom < 0) {
        container.style.transition = 'padding-top 0.6s ease';
        container.style.paddingTop = '11vh';
      }
    }
  }

  // 2. Remove bottom padding once poem is done AND last line scrolls off bottom
  if (poemDone && container.style.paddingBottom !== '11vh') {
    const lastWrap = container.querySelector('.poem-line-wrap:last-child');
    if (lastWrap) {
      const top = lastWrap.getBoundingClientRect().top;
      if (top > window.innerHeight) {
        container.style.transition = 'padding-bottom 0.6s ease';
        container.style.paddingBottom = '11vh';
      }
    }
  }
}, { passive: true });

// ── DOM refs ─────────────────────────────────────────────────────────────────
const container    = document.getElementById('poem-container');
const btnPlayPause = document.getElementById('btn-play-pause');
const music        = document.getElementById('bg-music');

// ── Smooth scroll utility ─────────────────────────────────────────────────
// Animates window scroll to a target Y position over `duration` ms.
function smoothScrollTo(targetY, duration) {
  const startY = window.scrollY;
  const diff   = targetY - startY;
  if (Math.abs(diff) < 1) return;
  let startTime = null;
  isAutoScrolling = true;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed  = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    window.scrollTo(0, startY + diff * ease);
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      isAutoScrolling = false;
    }
  }
  requestAnimationFrame(step);
}

// ── Core: show next line ─────────────────────────────────────────────────────
function showNextLine() {
  if (isPaused) return;
  if (currentIndex >= lines.length) {
    container.classList.add('done');
    poemDone = true;
    clearTimeout(timer);
    return;
  }

  const text = lines[currentIndex];

  if (text === '') {
    currentIndex++;
    timer = setTimeout(showNextLine, STANZA_EXTRA);
    return;
  }

  // Outer wrapper drives the height animation (grid 0fr → 1fr)
  const wrap = document.createElement('div');
  wrap.classList.add('poem-line-wrap');
  if (currentIndex > 0 && lines[currentIndex - 1] === '') {
    wrap.classList.add('stanza-break');
  }

  // Inner p does the fade-up
  const el = document.createElement('p');
  el.classList.add('poem-line');
  el.textContent = text;
  wrap.appendChild(el);
  container.appendChild(wrap);

  // Step 1: open the height — previous lines slide up gradually
  requestAnimationFrame(() => {
    requestAnimationFrame(() => wrap.classList.add('expanding'));
  });

  // Step 2: after height is open, fade + rise text in and scroll to center
  setTimeout(() => {
    el.classList.add('visible');
    if (!userScrolled) {
      const rect    = el.getBoundingClientRect();
      const targetY = rect.top + window.scrollY + rect.height / 2 - window.innerHeight / 2;
      smoothScrollTo(targetY, 800);
    }
  }, 920);

  currentIndex++;
  timer = setTimeout(showNextLine, DELAY_MS);
}

// ── Controls ─────────────────────────────────────────────────────────────────
function togglePlayPause() {
  isPaused = !isPaused;
  btnPlayPause.textContent = isPaused ? '▶ Play' : '⏸ Pause';

  if (!isPaused) {
    // Resume: schedule next line immediately
    timer = setTimeout(showNextLine, DELAY_MS);
  } else {
    clearTimeout(timer);
  }
}

function restartPoem() {
  clearTimeout(timer);
  currentIndex = 0;
  isPaused     = false;
  poemDone     = false;
  btnPlayPause.textContent = '⏸ Pause';

  container.innerHTML = '';
  container.classList.remove('done');
  container.style.transition  = '';
  container.style.paddingTop    = '';
  container.style.paddingBottom = '';
  window.scrollTo({ top: 0, behavior: 'instant' });

  timer = setTimeout(showNextLine, 800);
}



// ── Init ─────────────────────────────────────────────────────────────────────
timer = setTimeout(showNextLine, 1200);

// ── Music autoplay ────────────────────────────────────────────────────────
music.play().then(() => {
  musicOn = true;
}).catch(() => {
  const unlock = () => {
    music.play().then(() => { musicOn = true; }).catch(() => {});
  };
  document.addEventListener('click',      unlock, { once: true });
  document.addEventListener('touchstart', unlock, { once: true });
  document.addEventListener('keydown',    unlock, { once: true });
});

function toggleMusic() {
  if (musicOn) {
    music.pause();
    musicOn = false;
    document.getElementById('btn-music').textContent = '🎵 Music';
  } else {
    music.play().catch(() => {});
    musicOn = true;
    document.getElementById('btn-music').textContent = '🔇 Mute';
  }
}

// ── Floating petals & particles ───────────────────────────────────────────
(function () {
  const canvas = document.getElementById('petals');
  const ctx    = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Petal shape: small teardrop drawn with bezier curves
  function drawPetal(ctx, x, y, size, angle, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo( size * 0.6,  -size * 0.8,  size * 1.2, -size * 0.2,  0, size);
    ctx.bezierCurveTo(-size * 1.2, -size * 0.2, -size * 0.6,  -size * 0.8,  0, 0);
    ctx.closePath();
    ctx.fillStyle = '#e8a0a0';
    ctx.fill();
    ctx.restore();
  }

  // Particle: tiny golden glint
  function drawParticle(ctx, x, y, r, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#f5d08a';
    ctx.fill();
    ctx.restore();
  }

  const PETAL_COUNT    = 18;
  const PARTICLE_COUNT = 25;

  // Initialise petals
  const petals = Array.from({ length: PETAL_COUNT }, () => spawnPetal(true));
  const particles = Array.from({ length: PARTICLE_COUNT }, () => spawnParticle(true));

  function spawnPetal(random) {
    return {
      x:      Math.random() * window.innerWidth,
      y:      random ? Math.random() * window.innerHeight : -20,
      size:   6 + Math.random() * 7,
      speedY: 0.4 + Math.random() * 0.6,
      speedX: (Math.random() - 0.5) * 0.5,
      angle:  Math.random() * Math.PI * 2,
      spin:   (Math.random() - 0.5) * 0.02,
      alpha:  0.5 + Math.random() * 0.4,
      sway:   Math.random() * Math.PI * 2,
      swaySpeed: 0.008 + Math.random() * 0.008,
    };
  }

  function spawnParticle(random) {
    return {
      x:      Math.random() * window.innerWidth,
      y:      random ? Math.random() * window.innerHeight : window.innerHeight + 5,
      r:      0.8 + Math.random() * 1.4,
      speedY: -(0.3 + Math.random() * 0.5),
      alpha:  0.4 + Math.random() * 0.5,
      flicker: Math.random() * Math.PI * 2,
      flickerSpeed: 0.03 + Math.random() * 0.04,
    };
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update & draw petals
    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      p.sway  += p.swaySpeed;
      p.x     += p.speedX + Math.sin(p.sway) * 0.4;
      p.y     += p.speedY;
      p.angle += p.spin;
      if (p.y > canvas.height + 20) petals[i] = spawnPetal(false);
      drawPetal(ctx, p.x, p.y, p.size, p.angle, p.alpha);
    }

    // Update & draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.flicker += p.flickerSpeed;
      p.y       += p.speedY;
      const a = p.alpha * (0.6 + 0.4 * Math.sin(p.flicker));
      if (p.y < -5) particles[i] = spawnParticle(false);
      drawParticle(ctx, p.x, p.y, p.r, a);
    }

    requestAnimationFrame(animate);
  }

  animate();
})();
