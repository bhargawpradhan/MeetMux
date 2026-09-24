// MeetMux Control Tower — Animated Counter Hook
import { useEffect, useRef, useState } from 'react';

export function useAnimatedCounter(target: number, duration = 800): number {
  const [current, setCurrent] = useState(0);
  const startRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }

    const start = current;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(start + (target - start) * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    startRef.current = Date.now();

    return () => cancelAnimationFrame(frameRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return current;
}
