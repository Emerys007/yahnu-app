
"use client"

import { useState, useCallback, useEffect, useRef } from 'react';
import ReactCanvasConfetti from 'react-canvas-confetti';

// A more stable implementation of the confetti hook to prevent DOM errors.
export function useConfetti() {
  const [isFiring, setIsFiring] = useState(false);
  const animationInstance = useRef<any>(null);

  useEffect(() => {
    if (isFiring) {
      const timeout = setTimeout(() => {
        setIsFiring(false);
        if(animationInstance.current) {
           animationInstance.current.reset();
        }
      }, 4000); // Confetti duration + a little buffer
      return () => clearTimeout(timeout);
    }
    return;
  }, [isFiring]);
  
  const getInstance = useCallback((instance: any) => {
    animationInstance.current = instance;
  }, []);

  const makeShot = useCallback((particleRatio: number, opts: object) => {
    animationInstance.current && animationInstance.current({
      ...opts,
      origin: { y: 0.7 },
      particleCount: Math.floor(200 * particleRatio),
    });
  }, []);

  const fire = useCallback(() => {
    if (!isFiring) {
      setIsFiring(true);
      makeShot(0.25, { spread: 26, startVelocity: 55 });
      makeShot(0.2, { spread: 60 });
      makeShot(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      makeShot(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      makeShot(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [isFiring, makeShot]);

  const Confetti = (
    <ReactCanvasConfetti
      refConfetti={getInstance}
      style={{
        position: 'fixed',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        zIndex: 1000,
        pointerEvents: 'none'
      }}
    />
  );

  return { fire, Confetti };
}
