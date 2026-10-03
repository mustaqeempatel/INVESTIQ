/* ==========================================================================
   INVESTIQ 3D SPATIAL HERO VISUALIZATION
   Hardware-Accelerated Financial Constellation & Wave Grid
   ========================================================================== */

class Hero3DScene {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.animId = null;
    this.running = false;
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.targetX = (e.clientX - rect.left - rect.width / 2) * 0.05;
      this.mouse.targetY = (e.clientY - rect.top - rect.height / 2) * 0.05;
    });

    // Generate 3D Particle Constellation
    const particleCount = Math.min(80, Math.floor(window.innerWidth / 18));
    this.particles = [];
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: (Math.random() - 0.5) * this.width * 1.2,
        y: (Math.random() - 0.5) * this.height * 1.2,
        z: Math.random() * 800 + 100,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        vz: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2.5 + 1.2,
        color: Math.random() > 0.4 ? 'rgba(0, 240, 255,' : 'rgba(139, 92, 246,'
      });
    }

    this.start();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  loop() {
    if (!this.running) return;
    this.render();
    this.animId = requestAnimationFrame(() => this.loop());
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Smooth mouse parallax interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    const fov = 400;
    const centerX = this.width / 2 + this.mouse.x;
    const centerY = this.height / 2 + this.mouse.y;

    const projected = [];

    // Project 3D particles to 2D screen
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;

      // Wrap around bounds
      if (p.z <= 50) p.z = 800;
      if (p.z > 800) p.z = 50;

      const scale = fov / (fov + p.z);
      const projX = centerX + p.x * scale;
      const projY = centerY + p.y * scale;
      const projRadius = p.radius * scale;
      const alpha = Math.min(0.85, Math.max(0.1, (1 - p.z / 800) * 1.2));

      projected.push({ x: projX, y: projY, scale, alpha, color: p.color, radius: projRadius });
    });

    // Draw connecting lattice lines between nearby particles
    ctx.lineWidth = 0.8;
    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const dx = projected[i].x - projected[j].x;
        const dy = projected[i].y - projected[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 110) {
          const lineAlpha = (1 - dist / 110) * 0.18 * Math.min(projected[i].alpha, projected[j].alpha);
          ctx.strokeStyle = `rgba(0, 240, 255, ${lineAlpha})`;
          ctx.beginPath();
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(projected[j].x, projected[j].y);
          ctx.stroke();
        }
      }
    }

    // Draw glowing nodes
    projected.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
      ctx.fillStyle = `${p.color} ${p.alpha})`;
      ctx.shadowColor = '#00F0FF';
      ctx.shadowBlur = p.radius > 2 ? 10 : 0;
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }
}
