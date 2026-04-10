import { useEffect } from 'react';

export default function Confetti({ trigger }) {
  useEffect(() => {
    if (!trigger) return;
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#00E5FF','#8A2BE2','#00FF9C','#FFB800','#FF3B3B','#ffffff'];
    const particles = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 4 + 2,
      opacity: 1,
    }));

    let frame;
    let done = false;

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allDone = true;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        if (p.y > canvas.height) p.opacity -= 0.02;
        if (p.opacity > 0) allDone = false;
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      });
      if (!allDone && !done) frame = requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    animate();
    return () => { done = true; cancelAnimationFrame(frame); };
  }, [trigger]);

  return <canvas id="confetti-canvas" />;
}
