// MeetMux Control Tower — Outward Radial Multi-Colored Particle Animation
// Spawns vibrant small multi-colored particles from the center that emanate
// and travel outwards towards the screen boundaries in a continuous, ambient flow.
import React, { useEffect, useRef } from 'react';

interface Particle {
  angle: number;
  dist: number;
  speed: number;
  baseRadius: number;
  color: string;
  spin: number;
  alpha: number;
}

export default function RadialOutwardParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Multicolored particle palette: Sand golds, desert turquoise, coral ruby, emerald, amethyst, amber, diamond white
    // Multicolored particle palette matching dark navy, cyan, teal, warning, critical, success
    const colors = [
      '#22D3EE', // Bright Cyan
      '#00B8D9', // Primary Blue
      '#14B8A6', // Secondary Teal
      '#2DD4BF', // Success Teal
      '#FBBF24', // Warning Amber
      '#FF4D5A', // Critical Coral
      '#E6F1F5', // Diamond Starlight
      '#38BDF8', // Sky Cyan
    ];

    const PARTICLE_COUNT = 160;
    const particles: Particle[] = [];

    // Max distance to corner
    const maxDist = () => Math.hypot(width / 2, height / 2) + 60;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * maxDist(),
        speed: Math.random() * 1.6 + 0.9,
        baseRadius: Math.random() * 1.6 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        spin: (Math.random() - 0.5) * 0.003,
        alpha: Math.random() * 0.7 + 0.3,
      });
    }

    let animId: number;
    let frame = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      frame++;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const limit = maxDist();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Accelerate slightly as distance increases (natural 3D perspective depth)
        const currentSpeed = p.speed * (1 + (p.dist / limit) * 1.8);
        p.dist += currentSpeed;
        p.angle += p.spin;

        // Reset particle to center when it leaves the screen
        if (p.dist > limit) {
          p.dist = Math.random() * 15; // start near center
          p.angle = Math.random() * Math.PI * 2;
          p.speed = Math.random() * 1.6 + 0.9;
          p.color = colors[Math.floor(Math.random() * colors.length)];
        }

        // Calculate (x, y) coordinates radiating outward from center
        const x = cx + Math.cos(p.angle) * p.dist;
        const y = cy + Math.sin(p.angle) * p.dist;

        // Particle size expands smoothly as it radiates outward
        const progress = p.dist / limit;
        const radius = p.baseRadius * (0.8 + progress * 1.2);

        // Alpha envelope: fade-in from center, peak in mid-screen, fade-out near edges
        let opacity = p.alpha;
        if (progress < 0.12) {
          opacity *= progress / 0.12;
        } else if (progress > 0.75) {
          opacity *= Math.max(0, 1 - (progress - 0.75) / 0.25);
        }

        // Render outward moving particle
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = opacity;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();

        // Subtle glowing tail streak towards center
        const tailLen = Math.min(18, currentSpeed * 4);
        const tailX = x - Math.cos(p.angle) * tailLen;
        const tailY = y - Math.sin(p.angle) * tailLen;

        const grad = ctx.createLinearGradient(tailX, tailY, x, y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, p.color);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = radius * 0.8;
        ctx.stroke();

        ctx.restore();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        opacity: 0.85,
        mixBlendMode: 'screen',
      }}
    />
  );
}
