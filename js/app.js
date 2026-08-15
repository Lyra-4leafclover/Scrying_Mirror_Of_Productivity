/* ==========================================================================
   APP INITIALIZER & AMBIENT PARTICLE SYSTEM
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Obsidian Mirror Portfolio...");

  // Initialize WebGL Liquid Mirror Engine
  if (typeof LiquidMirrorEngine !== 'undefined') {
    window.liquidMirror = new LiquidMirrorEngine("liquid-canvas");
  } else {
    console.error("LiquidMirrorEngine class not loaded!");
  }

  // Ambient Starry Particles Canvas
  initParticles();

  // Audio Toggle Button Listener
  const audioToggle = document.getElementById("audio-toggle");
  if (audioToggle) {
    audioToggle.addEventListener("click", () => {
      if (window.audioSynth) {
        const isEnabled = window.audioSynth.toggle();
        const textSpan = audioToggle.querySelector(".audio-text");
        if (textSpan) {
          textSpan.textContent = isEnabled ? "SOUND: ON" : "SOUND: OFF";
        }
        audioToggle.classList.toggle("active", isEnabled);
      }
    });
  }

  // First interaction audio initialization
  const startAudioOnUserGesture = () => {
    if (window.audioSynth && !window.audioSynth.ctx) {
      window.audioSynth.init();
      console.log("Audio Engine initialized on user gesture!");
    }
  };

  document.addEventListener("pointerdown", startAudioOnUserGesture, { once: true });
  document.addEventListener("keydown", startAudioOnUserGesture, { once: true });
});

function initParticles() {
  const canvas = document.getElementById("particles-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  const particles = [];
  const count = Math.min(80, Math.floor((width * height) / 15000));

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.4 + 0.6,
      alpha: Math.random() * 0.45 + 0.1,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: (Math.random() - 0.5) * 0.2
    });
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(196, 184, 224, ${p.alpha})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#8a7aa8";
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  render();

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });
}
