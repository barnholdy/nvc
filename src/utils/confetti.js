const COLORS = ['#4ade80', '#f9e02e', '#ff6b6b', '#60c5f9', '#c084fc', '#fb923c', '#fff'];

export function triggerConfetti(originEl) {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Burst origin: center of the triggering element, fallback to screen center
  let ox = canvas.width / 2;
  let oy = canvas.height / 2;
  if (originEl) {
    const r = originEl.getBoundingClientRect();
    ox = r.left + r.width / 2;
    oy = r.top + r.height / 2;
  }

  const COUNT = 90;
  const particles = [];
  for (let i = 0; i < COUNT; i++) {
    const angle = (Math.PI * 2 * i) / COUNT + (Math.random() - 0.5) * 0.4;
    const speed = Math.random() * 9 + 3;
    particles.push({
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed * (0.6 + Math.random() * 0.8),
      vy: Math.sin(angle) * speed * (0.6 + Math.random() * 0.8) - 3,
      w: Math.random() * 9 + 4,
      h: Math.random() * 5 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.35,
    });
  }

  const DURATION = 1600;
  let start = null;

  function frame(ts) {
    if (!start) start = ts;
    const t = ts - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const alpha = Math.max(0, 1 - t / DURATION);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.vx *= 0.98; // air resistance
      p.rot += p.vr;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (t < DURATION) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(frame);
}
