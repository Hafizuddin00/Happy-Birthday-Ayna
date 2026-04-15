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
  "bahwa ada seseorang yang menyayangimu tanpa jeda,",
  "yang mencintaimu dengan cara yang paling tenang.",
  "",
  "Di dalam doaku, namamu adalah satu-satunya yang bising.",
  "Aku meminta kepada Tuhan agar menjauhkanmu dari luka,",
  "bahkan jika suatu hari nanti aku bukan lagi orang yang kau cari,",
  "aku tetap ingin melihatmu berdiri dengan bahagia.",
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

function toggleMusic() {
  const btn = document.getElementById('btn-music');
  if (musicOn) {
    music.pause();
    btn.textContent = '🎵 Music';
  } else {
    music.play().catch(() => {
      // Autoplay blocked or no file — silently ignore
    });
    btn.textContent = '🔇 Mute';
  }
  musicOn = !musicOn;
}

// ── Init ─────────────────────────────────────────────────────────────────────
// Small initial delay so the page renders before the first line appears
timer = setTimeout(showNextLine, 1200);
