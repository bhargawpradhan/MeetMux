// MeetMux Control Tower — Live Connected 30-Circle Snake Tail Cursor
// All 30 circles have the EXACT SAME SMALL SIZE (3.5px radius)
// They move continuously one-by-one forming a fluid, connected tail.
// Every circle is connected to its adjacent circle with glowing neon filaments.
// When cursor stops, ALL circles magnetically converge into a single exact point at the cursor!
import React, { useEffect, useRef } from 'react';

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

export default function LiveConnectedCursor() {
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

    // Mouse tracking
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      isMoving: false,
      lastMoveTime: 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      idleTimer: null as any,
      clickWaves: [] as { x: number; y: number; r: number; alpha: number; color: string }[],
    };

    // Exactly 30 circles — all of the EXACT SAME and SMALL size
    const NUM = 30;
    const DOT_RADIUS = 3.5; // Constant uniform small size for all circles

    // Cyberpunk electric gradient: Hot Pink -> Fuchsia -> Electric Violet -> Deep Cyan -> Aqua Green
    const palette = [
      '#ff2a6d', '#ff3377', '#ff3f82', '#ff4d8d', '#ff5a99',
      '#f753a3', '#ea4ca8', '#dd44ad', '#ce3db2', '#be37b7',
      '#ae32bb', '#9d2ec0', '#8b2ac4', '#7827c8', '#6328cb',
      '#4c2bce', '#3331d0', '#2542d4', '#1f56d8', '#1a6bdc',
      '#1580df', '#1095e3', '#0baae6', '#06bfe9', '#00d4ec',
      '#00e2e5', '#00eed9', '#00f6c7', '#00feb4', '#05ffa1',
    ];

    const dots: Dot[] = [];
    for (let i = 0; i < NUM; i++) {
      dots.push({
        x: mouse.x,
        y: mouse.y,
        vx: 0,
        vy: 0,
        color: palette[i % palette.length],
      });
    }

    const onMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isMoving = true;
      mouse.lastMoveTime = performance.now();

      clearTimeout(mouse.idleTimer);
      mouse.idleTimer = setTimeout(() => {
        mouse.isMoving = false;
      }, 160);
    };

    const onMouseDown = (e: MouseEvent) => {
      mouse.clickWaves.push({
        x: e.clientX,
        y: e.clientY,
        r: 3,
        alpha: 1,
        color: '#ff2a6d',
      });
      mouse.clickWaves.push({
        x: e.clientX,
        y: e.clientY,
        r: 1,
        alpha: 0.9,
        color: '#00f2fe',
      });
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);

    let animId: number;
    let frame = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      frame++;
      ctx.clearRect(0, 0, width, height);

      // Smooth lerp of the leader towards the physical mouse
      const leaderFollowSpeed = mouse.isMoving ? 0.32 : 0.45;
      mouse.x += (mouse.targetX - mouse.x) * leaderFollowSpeed;
      mouse.y += (mouse.targetY - mouse.y) * leaderFollowSpeed;

      // ── Physical Updates for all 30 dots ──────────────────────────
      if (mouse.isMoving) {
        // MOVING STATE: Continuous linked tail
        // Circle 0 follows the mouse leader
        // Circle 1 follows circle 0, Circle 2 follows circle 1, etc.
        for (let i = 0; i < NUM; i++) {
          const dot = dots[i];
          const tx = i === 0 ? mouse.x : dots[i - 1].x;
          const ty = i === 0 ? mouse.y : dots[i - 1].y;

          // Progressive elasticity creates a fluid, organic whip motion
          const spring = Math.max(0.14, 0.52 - i * 0.0125);
          const friction = 0.68;

          dot.vx = (dot.vx + (tx - dot.x) * spring) * friction;
          dot.vy = (dot.vy + (ty - dot.y) * spring) * friction;

          // Subtle organic serpentine wave along the body of the tail
          const wavePhase = frame * 0.12 + i * 0.4;
          const waveAmp = i > 1 ? Math.min(1.4, (i / NUM) * 1.5) : 0;
          const waveX = Math.sin(wavePhase) * waveAmp;
          const waveY = Math.cos(wavePhase) * waveAmp;

          dot.x += dot.vx + waveX;
          dot.y += dot.vy + waveY;
        }
      } else {
        // STOPPED STATE: ALL 30 circles snap into a SINGLE EXACT POINT at the cursor!
        for (let i = 0; i < NUM; i++) {
          const dot = dots[i];
          const dx = mouse.targetX - dot.x;
          const dy = mouse.targetY - dot.y;

          // High magnetic attraction pulling all dots into the exact cursor position
          const pull = 0.42;
          const friction = 0.62;

          dot.vx = (dot.vx + dx * pull) * friction;
          dot.vy = (dot.vy + dy * pull) * friction;

          dot.x += dot.vx;
          dot.y += dot.vy;

          // Direct snap when within 0.75px threshold so they merge perfectly
          if (Math.hypot(dx, dy) < 0.75) {
            dot.x = mouse.targetX;
            dot.y = mouse.targetY;
            dot.vx = 0;
            dot.vy = 0;
          }
        }
      }

      // Check how many dots have converged (for rendering singularity effect)
      let allConverged = true;
      for (let i = 0; i < NUM; i++) {
        if (Math.hypot(mouse.targetX - dots[i].x, mouse.targetY - dots[i].y) > 2) {
          allConverged = false;
          break;
        }
      }

      // ── 1. Draw glowing connections between all adjacent circles ────
      ctx.save();
      for (let i = 0; i < NUM - 1; i++) {
        const d1 = dots[i];
        const d2 = dots[i + 1];
        const segDist = Math.hypot(d2.x - d1.x, d2.y - d1.y);

        // Only draw connection line if circles aren't merged at the exact same pixel
        if (segDist > 0.8) {
          const grad = ctx.createLinearGradient(d1.x, d1.y, d2.x, d2.y);
          grad.addColorStop(0, d1.color + 'ee');
          grad.addColorStop(1, d2.color + 'bb');

          ctx.beginPath();
          ctx.moveTo(d1.x, d1.y);
          ctx.lineTo(d2.x, d2.y);
          ctx.strokeStyle = grad;
          // Crisp, uniform line width connecting all dots
          ctx.lineWidth = 2.0;
          ctx.lineCap = 'round';
          ctx.shadowColor = d1.color;
          ctx.shadowBlur = 8;
          ctx.stroke();
        }
      }
      ctx.restore();

      // ── 2. Draw all 30 small circles (EXACT SAME SIZE) ─────────────
      for (let i = NUM - 1; i >= 0; i--) {
        const dot = dots[i];

        ctx.save();
        ctx.shadowColor = dot.color;
        ctx.shadowBlur = mouse.isMoving ? 10 : 16;

        // Circle body (constant uniform small radius for all 30 circles!)
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = dot.color;
        ctx.fill();

        // White hot center core for high-tech neon look
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, DOT_RADIUS * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
      }

      // ── 3. Singularity effect when all circles merge into one point ──
      if (allConverged || !mouse.isMoving) {
        ctx.save();
        const pulse = Math.sin(frame * 0.15) * 1.5;

        // Concentrated super-bright glowing core at the single point
        ctx.beginPath();
        ctx.arc(mouse.targetX, mouse.targetY, DOT_RADIUS + 1.2 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff2a6d';
        ctx.shadowBlur = 25;
        ctx.fill();

        // Radiating energy sonar rings
        const ring1 = (frame * 1.8) % 36;
        const alpha1 = Math.max(0, 1 - ring1 / 36);
        ctx.beginPath();
        ctx.arc(mouse.targetX, mouse.targetY, 4 + ring1, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 42, 109, ${alpha1 * 0.9})`;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = '#ff2a6d';
        ctx.shadowBlur = 14;
        ctx.stroke();

        const ring2 = ((frame * 1.8) + 18) % 36;
        const alpha2 = Math.max(0, 1 - ring2 / 36);
        ctx.beginPath();
        ctx.arc(mouse.targetX, mouse.targetY, 4 + ring2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 242, 254, ${alpha2 * 0.8})`;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 10;
        ctx.stroke();

        ctx.restore();
      }

      // ── 4. Click shockwave ripples ──────────────────────────────────
      for (let i = mouse.clickWaves.length - 1; i >= 0; i--) {
        const w = mouse.clickWaves[i];
        w.r += 3.8;
        w.alpha -= 0.035;

        if (w.alpha <= 0) {
          mouse.clickWaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
        ctx.strokeStyle = w.color;
        ctx.globalAlpha = w.alpha;
        ctx.lineWidth = 2.2;
        ctx.shadowColor = w.color;
        ctx.shadowBlur = 14;
        ctx.stroke();
        ctx.restore();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      clearTimeout(mouse.idleTimer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
