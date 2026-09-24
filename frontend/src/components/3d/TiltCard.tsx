// MeetMux Control Tower — Crazy 3D Tilt Card with Physical Depth & Specular Glare
import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  glowColor?: string;
}

export default function TiltCard({
  children,
  className = '',
  maxTilt = 12,
  scale = 1.02,
  glowColor = 'rgba(214, 88, 138, 0.25)',
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -maxTilt;
    const rotY = ((x - centerX) / centerX) * maxTilt;

    setRotateX(rotX);
    setRotateY(rotY);

    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.65,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div style={{ perspective: 1000 }} className="w-full">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{
          rotateX,
          rotateY,
          scale: glarePos.opacity > 0 ? scale : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 280,
          damping: 20,
          mass: 0.5,
        }}
        style={{
          transformStyle: 'preserve-3d',
          boxShadow: glarePos.opacity > 0 ? `0 20px 40px -15px ${glowColor}` : undefined,
        }}
        className={`relative overflow-hidden ${className}`}
      >
        {/* Dynamic Specular Glare Reflection */}
        <div
          className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
          style={{
            opacity: glarePos.opacity,
            background: `radial-gradient(circle 240px at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, 0.45), transparent 70%)`,
          }}
        />

        {/* 3D Content Container */}
        <div style={{ transform: 'translateZ(20px)' }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
