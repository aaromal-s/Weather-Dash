/**
 * Weather Analytics Engine - Dynamic HTML5 Canvas Background Effects Engine
 * Renders GPU-accelerated particle animations reactive to weather condition state.
 */

class WeatherBackgroundEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.activeTheme = 'theme-clear';
    this.animId = null;
    this.width = 0;
    this.height = 0;
    
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.createParticles();
    this.loop();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.createParticles();
  }

  setTheme(theme) {
    if (this.activeTheme === theme) return;
    this.activeTheme = theme;
    this.createParticles();
  }

  createParticles() {
    this.particles = [];
    
    if (this.activeTheme === 'theme-clear') {
      // Golden light particles & floating sun flares
      const count = Math.floor((this.width * this.height) / 25000);
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 3 + 1,
          alpha: Math.random() * 0.5 + 0.2,
          vx: (Math.random() - 0.5) * 0.3,
          vy: -Math.random() * 0.4 - 0.1,
          pulse: Math.random() * 0.02 + 0.005
        });
      }
    } else if (this.activeTheme === 'theme-rain') {
      // Dynamic falling raindrops
      const count = Math.floor((this.width * this.height) / 8000);
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          length: Math.random() * 20 + 10,
          speed: Math.random() * 10 + 12,
          alpha: Math.random() * 0.4 + 0.2,
          width: Math.random() * 1.5 + 0.8
        });
      }
    } else if (this.activeTheme === 'theme-snow') {
      // Drifting snowflakes
      const count = Math.floor((this.width * this.height) / 12000);
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 3.5 + 1,
          speed: Math.random() * 1.5 + 0.5,
          sway: Math.random() * 0.02 + 0.005,
          swayOffset: Math.random() * Math.PI * 2,
          alpha: Math.random() * 0.7 + 0.3
        });
      }
    } else if (this.activeTheme === 'theme-cloudy') {
      // Drifting cloud circles
      const count = 18;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * (this.height * 0.6),
          radius: Math.random() * 120 + 80,
          vx: Math.random() * 0.3 + 0.1,
          alpha: Math.random() * 0.08 + 0.03
        });
      }
    } else if (this.activeTheme === 'theme-atmosphere') {
      // Fog waves
      const count = 12;
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: this.height - Math.random() * (this.height * 0.5),
          radius: Math.random() * 180 + 100,
          vx: Math.random() * 0.2 + 0.05,
          alpha: Math.random() * 0.06 + 0.02
        });
      }
    }
  }

  loop() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.activeTheme === 'theme-clear') {
      this.drawClear();
    } else if (this.activeTheme === 'theme-rain') {
      this.drawRain();
    } else if (this.activeTheme === 'theme-snow') {
      this.drawSnow();
    } else if (this.activeTheme === 'theme-cloudy') {
      this.drawCloudy();
    } else if (this.activeTheme === 'theme-atmosphere') {
      this.drawAtmosphere();
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }

  drawClear() {
    // Draw subtle golden glow in top corner
    const gradient = this.ctx.createRadialGradient(
      this.width * 0.85, 0, 10,
      this.width * 0.85, 0, this.width * 0.6
    );
    gradient.addColorStop(0, 'rgba(253, 224, 71, 0.15)');
    gradient.addColorStop(1, 'rgba(253, 224, 71, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Particles
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += p.pulse;
      if (p.alpha > 0.7 || p.alpha < 0.2) p.pulse = -p.pulse;

      if (p.y < 0) {
        p.y = this.height;
        p.x = Math.random() * this.width;
      }
      if (p.x < 0 || p.x > this.width) p.x = Math.random() * this.width;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(254, 240, 138, ${p.alpha})`;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = 'rgba(253, 224, 71, 0.5)';
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
  }

  drawRain() {
    this.particles.forEach(p => {
      p.y += p.speed;
      if (p.y > this.height) {
        p.y = -p.length;
        p.x = Math.random() * this.width;
      }

      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x - 2, p.y + p.length);
      this.ctx.strokeStyle = `rgba(56, 189, 248, ${p.alpha})`;
      this.ctx.lineWidth = p.width;
      this.ctx.stroke();
    });

    // Occasional lightning flash
    if (Math.random() < 0.003) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawSnow() {
    this.particles.forEach(p => {
      p.swayOffset += p.sway;
      p.x += Math.sin(p.swayOffset) * 0.8;
      p.y += p.speed;

      if (p.y > this.height) {
        p.y = -10;
        p.x = Math.random() * this.width;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      this.ctx.shadowBlur = 6;
      this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
  }

  drawCloudy() {
    this.particles.forEach(p => {
      p.x += p.vx;
      if (p.x - p.radius > this.width) {
        p.x = -p.radius;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      this.ctx.fill();
    });
  }

  drawAtmosphere() {
    this.particles.forEach(p => {
      p.x += p.vx;
      if (p.x - p.radius > this.width) {
        p.x = -p.radius;
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(45, 212, 191, ${p.alpha})`;
      this.ctx.fill();
    });
  }
}

export let bgEngine = null;

export function initBackgroundEffects(canvasId) {
  bgEngine = new WeatherBackgroundEngine(canvasId);
  return bgEngine;
}
