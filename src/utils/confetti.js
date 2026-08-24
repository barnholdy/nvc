// A small burst for the moment a run is evaluated: the one point in the app
// where something is finished rather than begun. Drawn on a canvas laid over
// everything and taken away again once it has run its course.
const COLORS = ['#4ade80', '#f9e02e', '#ff6b6b', '#60c5f9', '#c084fc', '#fb923c'];
const COUNT = 72;
const DURATION = 1500;

export default function triggerConfetti() {
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) { document.body.removeChild(canvas); return; }

  const cx = canvas.width / 2;
  const cy = canvas.height * 0.55;
  const particles = [];
  for (let i = 0; i < COUNT; i += 1) {
    const angle = ((Math.PI * 2 * i) / COUNT) + ((Math.random() - 0.5) * 0.4);
    const speed = 4 + (Math.random() * 8);
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: (Math.sin(angle) * speed) - 3,
      w: 4 + (Math.random() * 7),
      h: 2 + (Math.random() * 4),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
    });
  }

  let start = null;
  function frame(ts) {
    if (!start) start = ts;
    const t = ts - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      /* eslint-disable no-param-reassign */
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.vx *= 0.99;
      p.rot += p.vr;
      /* eslint-enable no-param-reassign */
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - (t / DURATION));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (t < DURATION) requestAnimationFrame(frame);
    else if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }
  requestAnimationFrame(frame);
}
