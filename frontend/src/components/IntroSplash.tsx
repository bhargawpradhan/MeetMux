// MeetMux Control Tower — Dark Navy & Cyan Intro Screen
// Heading: "Predict. Protect. Optimize." (White #F8FAFC + Cyan #22D3EE)
// Subtitle: AI-powered supply chain intelligence... (#8FA8B8)
// Hero Visual: Glowing supply-chain network with live disruption & AI rerouting animation
// Intro Cards: LIVE NETWORK, RISK DETECTED, AI CONFIDENCE, ROUTES OPTIMIZED
// Transparent dark glass with #1B3448 border over #050B14 deep navy.
import React, { useEffect, useRef, useState } from 'react';
import { Zap, X, ShieldAlert, Activity, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

const HEADING_TEXT = 'Predict. Protect. Optimize.';

interface LetterData {
  char: string;
  color: string;
  stage: 'hidden' | 'impact' | 'settled';
  timestamp: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export default function IntroSplash({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [modalStage, setModalStage] = useState<'entering' | 'active' | 'warping'>('entering');
  const [screenShake, setScreenShake] = useState(0);

  // Dynamic simulation states for the Hero Network
  const [simPhase, setSimPhase] = useState<'normal' | 'disrupted' | 'rerouted'>('normal');
  const [riskScore, setRiskScore] = useState(42);
  const [progress, setProgress] = useState(0);

  // Letters of "Predict. Protect. Optimize."
  const [letters, setLetters] = useState<LetterData[]>(() => {
    return HEADING_TEXT.split('').map((char, index) => {
      // Color assignment:
      // "Predict." (index 0 to 7) -> #22D3EE
      // " Protect." (index 8 to 16) -> #22D3EE
      // " Optimize." (index 17 to end) -> #F8FAFC
      let color = '#F8FAFC';
      if (index <= 16) {
        color = '#22D3EE';
      }
      return {
        char,
        color,
        stage: 'hidden',
        timestamp: 0,
      };
    });
  });

  const [detailsVisible, setDetailsVisible] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  // Sparks reference for canvas rendering
  const sparksRef = useRef<Spark[]>([]);

  // Trigger spark explosion at letter coordinates
  const triggerLetterSparks = (letterIndex: number, totalLetters: number) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const baseY = height / 2 - 130;
    const spacing = Math.min(22, (width * 0.45) / (totalLetters + 1));
    const letterX = centerX + (letterIndex - totalLetters / 2 + 0.5) * spacing;

    // Trigger subtle screen-shake on impact
    setScreenShake(6);
    setTimeout(() => setScreenShake(0), 100);

    // Spawn 14 vibrant particle sparks in cyan, teal, and diamond white
    const colors = ['#22D3EE', '#14B8A6', '#00B8D9', '#FFFFFF', '#2DD4BF'];
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 6 + 2.5;
      sparksRef.current.push({
        x: letterX,
        y: baseY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        life: 0,
        maxLife: Math.random() * 22 + 18,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 2.5 + 1.2,
      });
    }
  };

  // ── Letter-by-Letter Sequential 3D Animation Timings ───────────────
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Modal enters
    timers.push(setTimeout(() => setModalStage('active'), 100));

    // Animate letters one by one from left to right
    const startDelay = 350;
    const perLetterDelay = 75;

    HEADING_TEXT.split('').forEach((_, idx) => {
      const time = startDelay + idx * perLetterDelay;
      timers.push(
        setTimeout(() => {
          setLetters((prev) =>
            prev.map((l, i) => (i === idx ? { ...l, stage: 'impact', timestamp: performance.now() } : l))
          );
          triggerLetterSparks(idx, HEADING_TEXT.length);

          timers.push(
            setTimeout(() => {
              setLetters((prev) =>
                prev.map((l, i) => (i === idx ? { ...l, stage: 'settled', timestamp: performance.now() } : l))
              );
            }, 300)
          );
        }, time)
      );
    });

    const allLettersDone = startDelay + HEADING_TEXT.length * perLetterDelay + 100;
    timers.push(setTimeout(() => setDetailsVisible(true), allLettersDone));
    timers.push(setTimeout(() => setCtaVisible(true), allLettersDone + 250));

    // Dynamic Supply Chain Hero Simulation:
    // 0-2s: Normal flow (Risk: 42%)
    // 2.2s: Disruption hits route (Risk ramps: 42% -> 78%)
    // 3.6s: AI detects & alternative route appears in cyan/teal
    timers.push(
      setTimeout(() => {
        setSimPhase('disrupted');
        // Animate risk score from 42 to 78
        let currentRisk = 42;
        const riskInterval = setInterval(() => {
          currentRisk += 3;
          if (currentRisk >= 78) {
            currentRisk = 78;
            clearInterval(riskInterval);
          }
          setRiskScore(currentRisk);
        }, 50);
      }, 2200)
    );

    timers.push(
      setTimeout(() => {
        setSimPhase('rerouted');
      }, 3600)
    );

    // Auto-advance progress
    const startTime = Date.now();
    const duration = 6500;
    const pInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(100, Math.round((elapsed / duration) * 100)));
    }, 40);

    // Auto-complete after 6.5s
    timers.push(setTimeout(() => handleLaunch(), 6500));

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(pInterval);
    };
  }, []);

  const handleLaunch = () => {
    setModalStage('warping');
    setTimeout(onComplete, 600);
  };

  // ── Canvas: Deep Navy #050B14, Faint World Grid, Cyan Glow, Sparks ───
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

    let frame = 0;
    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);
      frame++;
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 1. Deep Navy Canvas Background #050B14
      ctx.fillStyle = '#050B14';
      ctx.fillRect(0, 0, width, height);

      // 2. Very subtle radial cyan glow behind the main visual
      const radialGlow = ctx.createRadialGradient(cx, cy, 40, cx, cy, Math.min(width, height) * 0.55);
      radialGlow.addColorStop(0, 'rgba(34, 211, 238, 0.08)');
      radialGlow.addColorStop(0.5, 'rgba(0, 184, 217, 0.03)');
      radialGlow.addColorStop(1, 'rgba(5, 11, 20, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // 3. Faint World-Map / Cyber Grid Texture
      ctx.save();
      ctx.strokeStyle = 'rgba(27, 52, 72, 0.35)';
      ctx.lineWidth = 1;
      const gridSize = 45;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Render Letter Sparks
      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const sp = sparksRef.current[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.14; // gravity
        sp.vx *= 0.96; // drag
        sp.life++;

        const alpha = Math.max(0, 1 - sp.life / sp.maxLife);

        ctx.save();
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size * alpha, 0, Math.PI * 2);
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = sp.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();

        if (sp.life >= sp.maxLife) {
          sparksRef.current.splice(i, 1);
        }
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 select-none overflow-hidden"
      style={{
        backgroundColor: '#050B14',
        transform: `translate(${screenShake ? (Math.random() - 0.5) * screenShake : 0}px, ${
          screenShake ? (Math.random() - 0.5) * screenShake : 0
        }px)`,
        transition: modalStage === 'warping' ? 'all 0.6s cubic-bezier(0.7, 0, 0.84, 0)' : 'none',
        opacity: modalStage === 'warping' ? 0 : 1,
      }}
    >
      {/* Background Canvas: Deep Navy #050B14 + Faint Grid + Radial Cyan Glow */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      {/* ── 3D HOLOGRAPHIC POP-UP MODAL CARD ───────────────────────────── */}
      <div
        className="relative z-10 w-full max-w-4xl rounded-3xl overflow-hidden"
        style={{
          perspective: '1400px',
          transformStyle: 'preserve-3d',
          transform:
            modalStage === 'entering'
              ? 'scale(0.85) rotateX(20deg) translateY(40px)'
              : modalStage === 'active'
              ? 'scale(1) rotateX(0deg) translateY(0)'
              : 'scale(1.15) rotateX(-12deg) translateZ(180px)',
          opacity: modalStage === 'entering' ? 0 : 1,
          transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease',
          background: 'rgba(13, 27, 42, 0.72)', // Transparent dark glass #0D1B2A
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid #1B3448', // Exact #1B3448 border
          boxShadow: '0 20px 60px -10px rgba(5, 11, 20, 0.8), 0 0 30px rgba(34, 211, 238, 0.15)',
        }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#1B3448] bg-[#07111F]/70">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="MeetMux Logo"
              style={{
                width: 32,
                height: 32,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.6))',
                borderRadius: 8,
              }}
            />
            <div className="flex flex-col leading-none">
              <span className="font-black text-sm tracking-widest uppercase" style={{ color: '#22D3EE', letterSpacing: '0.18em' }}>
                MeetMux
              </span>
              <span className="font-mono text-[9px] font-medium tracking-[0.15em] uppercase" style={{ color: '#78909C' }}>
                Control Tower
              </span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE] animate-ping ml-1" />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-[#1B3448] bg-[#07111F]/60 text-[10px] font-mono text-[#2DD4BF]">
              <Activity className="w-3 h-3 text-[#2DD4BF] animate-pulse" />
              SYSTEM ACTIVE · v2.0
            </div>
            <button
              onClick={handleLaunch}
              className="p-1 rounded-lg text-[#78909C] hover:text-[#E6F1F5] hover:bg-[#1B3448]/50 transition-colors"
              title="Skip intro"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Center Content */}
        <div className="p-6 md:p-10 text-center flex flex-col items-center">
          {/* ════ MAIN HEADING: "Predict. Protect. Optimize." ════ */}
          {/* Letter-by-letter 3D pop-up animation */}
          <div
            className="flex items-center justify-center gap-x-0.5 md:gap-x-1 mb-3 whitespace-nowrap overflow-visible max-w-full px-2"
            style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
          >
            {letters.map((l, i) => {
              const isHidden = l.stage === 'hidden';
              const isImpact = l.stage === 'impact';
              const isSettled = l.stage === 'settled';

              if (l.char === ' ') {
                return <span key={i} className="inline-block w-1.5 md:w-2" />;
              }

              return (
                <span
                  key={i}
                  className="inline-block relative font-black tracking-tight select-none"
                  style={{
                    fontSize: 'clamp(1.1rem, 2.3vw, 1.85rem)',
                    fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, sans-serif',
                    color: l.color, // Highlight "Predict" & "Protect" in #22D3EE, "Optimize" in #F8FAFC
                    opacity: isHidden ? 0 : 1,
                    transform: isHidden
                      ? 'translate3d(-80px, 40px, 350px) rotateY(-140deg) rotateX(60deg) scale(0)'
                      : isImpact
                      ? 'translate3d(0, -12px, 80px) rotateY(15deg) scale(1.4)'
                      : 'translate3d(0, 0, 0) rotateY(0deg) scale(1)',
                    transition: isHidden
                      ? 'none'
                      : isImpact
                      ? 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.4), opacity 0.2s ease'
                      : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                    transformStyle: 'preserve-3d',
                    textShadow:
                      l.color === '#22D3EE'
                        ? '0 0 16px rgba(34, 211, 238, 0.7), 0 0 32px rgba(34, 211, 238, 0.3)'
                        : '0 0 12px rgba(248, 250, 252, 0.5)',
                    animation: isSettled ? `subtleWave 3s ease-in-out infinite ${i * 0.08}s` : 'none',
                  }}
                >
                  {l.char}
                </span>
              );
            })}
          </div>

          {/* ════ SUBTITLE ════ */}
          <p
            className="text-xs md:text-sm font-normal max-w-xl mx-auto leading-relaxed mb-6"
            style={{
              color: '#8FA8B8', // Requested subtitle color: #8FA8B8
              opacity: detailsVisible ? 1 : 0,
              transform: detailsVisible ? 'translateY(0)' : 'translateY(12px)',
              transition: 'all 0.5s ease',
            }}
          >
            AI-powered supply chain intelligence that detects disruptions, predicts risk, and recommends resilient routes before delays become costly.
          </p>

          {/* ════ HERO VISUAL: Glowing Global Supply-Chain Network ════ */}
          {/*
                  ●────────●
                 ╱          ╲
             ●──●───────●────●
                ╲    ⚡     ╱
                 ●───────●
                    │
                    ●
          */}
          <div
            className="relative w-full max-w-lg h-44 my-1 flex items-center justify-center rounded-2xl border border-[#1B3448] bg-[#07111F]/60 backdrop-blur-md overflow-hidden"
            style={{
              opacity: detailsVisible ? 1 : 0,
              transform: detailsVisible ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 0.5s ease 0.1s',
            }}
          >
            {/* Ambient inner cyan glow */}
            <div className="absolute inset-0 bg-radial from-[#22D3EE]/5 via-transparent to-transparent pointer-events-none" />

            {/* SVG Global Supply-Chain Network */}
            <svg viewBox="0 0 400 180" className="w-full h-full max-w-md select-none">
              <defs>
                {/* Glowing cyan gradient */}
                <linearGradient id="cyanLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="disruptGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FF4D5A" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#FF4D5A" stopOpacity="0.9" />
                </linearGradient>
                <linearGradient id="tealAltGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.9" />
                </linearGradient>
              </defs>

              {/* ── Network Routes ── */}
              {/* Top Route: A(150, 30) -> B(250, 30) */}
              <line x1="150" y1="30" x2="250" y2="30" stroke="#1B3448" strokeWidth="1.5" />
              {/* Diagonal Left: C(50, 75) -> D(100, 75) -> A(150, 30) */}
              <line x1="50" y1="75" x2="100" y2="75" stroke="#22D3EE" strokeWidth="2" strokeOpacity="0.7" />
              <line x1="100" y1="75" x2="150" y2="30" stroke="#1B3448" strokeWidth="1.5" />
              {/* Diagonal Right: B(250, 30) -> F(350, 75) */}
              <line x1="250" y1="30" x2="350" y2="75" stroke="#1B3448" strokeWidth="1.5" />

              {/* Central Main Line: D(100, 75) -> E(220, 75) -> F(350, 75) */}
              {/* When disrupted, D->E turns red with pulse! */}
              <line
                x1="100"
                y1="75"
                x2="220"
                y2="75"
                stroke={simPhase === 'disrupted' || simPhase === 'rerouted' ? '#FF4D5A' : '#22D3EE'}
                strokeWidth={simPhase === 'disrupted' || simPhase === 'rerouted' ? '2.5' : '2'}
                strokeDasharray={simPhase === 'disrupted' || simPhase === 'rerouted' ? '4 3' : 'none'}
                style={{
                  filter:
                    simPhase === 'disrupted' || simPhase === 'rerouted'
                      ? 'drop-shadow(0 0 6px #FF4D5A)'
                      : 'drop-shadow(0 0 4px #22D3EE)',
                  transition: 'all 0.4s ease',
                }}
              />
              <line x1="220" y1="75" x2="350" y2="75" stroke="#22D3EE" strokeWidth="2" strokeOpacity="0.7" />

              {/* Lower Loop: D(100, 75) -> G(130, 130) -> H(270, 130) -> F(350, 75) */}
              {/* AI Alternative Route: Appears in teal #14B8A6 when rerouted! */}
              <polyline
                points="100,75 130,130 270,130 350,75"
                fill="none"
                stroke={simPhase === 'rerouted' ? '#14B8A6' : '#1B3448'}
                strokeWidth={simPhase === 'rerouted' ? '2.5' : '1.2'}
                style={{
                  filter: simPhase === 'rerouted' ? 'drop-shadow(0 0 8px #14B8A6)' : 'none',
                  transition: 'all 0.5s ease',
                }}
              />

              {/* Bottom Vertical Stem: (200, 130) -> I(200, 165) */}
              <line x1="200" y1="130" x2="200" y2="165" stroke="#1B3448" strokeWidth="1.5" />

              {/* ── Animated Particles Travelling along Routes ── */}
              {/* Particle on normal route */}
              <circle r="2.5" fill="#22D3EE">
                <animateMotion
                  path="M 50,75 L 100,75 L 220,75 L 350,75"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Particle on Alternative Route when activated */}
              {simPhase === 'rerouted' && (
                <circle r="3" fill="#14B8A6">
                  <animateMotion
                    path="M 100,75 L 130,130 L 270,130 L 350,75"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}

              {/* ── Network Nodes ── */}
              {/* Node C */}
              <circle cx="50" cy="75" r="4.5" fill="#14B8A6" />
              {/* Node D: Risk / Disrupted Location */}
              <circle
                cx="100"
                cy="75"
                r={simPhase === 'normal' ? '5' : '6.5'}
                fill={simPhase === 'normal' ? '#22D3EE' : '#FF4D5A'}
                style={{
                  filter: simPhase === 'normal' ? 'drop-shadow(0 0 6px #22D3EE)' : 'drop-shadow(0 0 10px #FF4D5A)',
                  transition: 'all 0.3s ease',
                }}
              />
              {/* Node A */}
              <circle cx="150" cy="30" r="4.5" fill="#22D3EE" />
              {/* Node B */}
              <circle cx="250" cy="30" r="4.5" fill="#14B8A6" />
              {/* Node E: Amber Risk Location */}
              <circle cx="220" cy="75" r="5" fill="#FBBF24" style={{ filter: 'drop-shadow(0 0 6px #FBBF24)' }} />
              {/* Node F: Destination */}
              <circle cx="350" cy="75" r="5" fill="#2DD4BF" style={{ filter: 'drop-shadow(0 0 6px #2DD4BF)' }} />
              {/* Node G: AI Route Node */}
              <circle
                cx="130"
                cy="130"
                r="4.5"
                fill={simPhase === 'rerouted' ? '#14B8A6' : '#78909C'}
              />
              {/* Node H: AI Route Node */}
              <circle
                cx="270"
                cy="130"
                r="4.5"
                fill={simPhase === 'rerouted' ? '#22D3EE' : '#78909C'}
              />
              {/* Node I */}
              <circle cx="200" cy="165" r="4" fill="#78909C" />
            </svg>

            {/* Central Lightning Bolt Icon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md"
                style={{
                  background:
                    simPhase === 'rerouted'
                      ? 'rgba(20, 184, 166, 0.25)'
                      : simPhase === 'disrupted'
                      ? 'rgba(255, 77, 90, 0.2)'
                      : 'rgba(34, 211, 238, 0.15)',
                  border: `1px solid ${
                    simPhase === 'rerouted' ? '#14B8A6' : simPhase === 'disrupted' ? '#FF4D5A' : '#22D3EE'
                  }`,
                }}
              >
                <Zap
                  className="w-4 h-4 animate-pulse"
                  style={{
                    color:
                      simPhase === 'rerouted' ? '#2DD4BF' : simPhase === 'disrupted' ? '#FF4D5A' : '#22D3EE',
                  }}
                />
              </div>
            </div>

            {/* Live Status Overlay Pill */}
            <div className="absolute bottom-2.5 right-3 flex items-center gap-2 px-2.5 py-1 rounded-full border border-[#1B3448] bg-[#07111F]/80 text-[10px] font-mono">
              {simPhase === 'normal' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-pulse" />
                  <span className="text-[#E6F1F5]">FLOW NOMINAL · RISK: {riskScore}%</span>
                </>
              )}
              {simPhase === 'disrupted' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D5A] animate-ping" />
                  <span className="text-[#FF4D5A] font-bold">DISRUPTION DETECTED · RISK: {riskScore}%</span>
                </>
              )}
              {simPhase === 'rerouted' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
                  <span className="text-[#2DD4BF] font-bold">AI REROUTE ACTIVE · RISK: {riskScore}%</span>
                </>
              )}
            </div>
          </div>

          {/* ════ INTRO CARDS: Under / Around the Hero ════ */}
          {/*
              LIVE NETWORK: 12,482 nodes
              RISK DETECTED: 07 disruptions
              AI CONFIDENCE: 94.7%
              ROUTES OPTIMIZED: 1,284
              Transparent dark glass with #1B3448 border.
          */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 w-full max-w-xl"
            style={{
              opacity: detailsVisible ? 1 : 0,
              transform: detailsVisible ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 0.5s ease 0.15s',
            }}
          >
            {[
              { label: 'LIVE NETWORK', val: '12,482 nodes', col: '#22D3EE' },
              { label: 'RISK DETECTED', val: '07 disruptions', col: '#FF4D5A' },
              { label: 'AI CONFIDENCE', val: '94.7%', col: '#2DD4BF' },
              { label: 'ROUTES OPTIMIZED', val: '1,284', col: '#14B8A6' },
            ].map(({ label, val, col }) => (
              <div
                key={label}
                className="px-3.5 py-2.5 rounded-xl text-center relative"
                style={{
                  background: 'rgba(13, 27, 42, 0.55)', // Transparent dark glass #0D1B2A
                  border: '1px solid #1B3448',           // Exact #1B3448 border
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div
                  className="font-mono font-bold text-base md:text-lg tracking-tight"
                  style={{ color: col }}
                >
                  {val}
                </div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#78909C] mt-0.5">
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* ════ ENTER PLATFORM CTA BUTTON ════ */}
          <button
            onClick={handleLaunch}
            className="group relative flex items-center gap-2.5 px-8 py-3 rounded-xl font-bold font-mono text-xs tracking-[0.2em] uppercase text-[#07111F] overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer mt-1"
            style={{
              opacity: ctaVisible ? 1 : 0,
              transform: ctaVisible ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.3)',
              background: 'linear-gradient(135deg, #22D3EE 0%, #14B8A6 100%)', // Bright cyan to teal
              boxShadow: '0 0 25px rgba(34, 211, 238, 0.45)',
            }}
          >
            <span className="relative z-10 flex items-center gap-2">
              ENTER PLATFORM
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
        </div>

        {/* Modal Bottom Progress Bar */}
        <div className="px-6 py-2.5 bg-[#07111F]/80 border-t border-[#1B3448] flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#78909C]">
            AUTONOMOUS INITIALIZATION: {progress}%
          </span>
          <div className="w-36 h-1.5 rounded-full bg-[#1B3448] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #22D3EE, #14B8A6)',
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes subtleWave {
          0%, 100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -4px, 10px);
          }
        }
      `}</style>
    </div>
  );
}
