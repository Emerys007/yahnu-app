
"use client"

import { useState, useCallback, useEffect } from 'react';
import ReactCanvasConfetti from 'react-canvas-confetti';

export function useConfetti() {
  const [isFiring, setIsFiring] = useState(false);

  const fire = useCallback(() => {
    if (!isFiring) {
      setIsFiring(true);
    }
  }, [isFiring]);

  useEffect(() => {
    if (isFiring) {
      const timeout = setTimeout(() => setIsFiring(false), 3000); // Confetti duration
      return () => clearTimeout(timeout);
    }
    return;
  }, [isFiring]);

  const Confetti = isFiring ? (
    <ReactCanvasConfetti
      fire={true}
      particleCount={150}
      angle={90}
      spread={100}
      startVelocity={45}
      origin={{ x: 0.5, y: 0.5 }}
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
  ) : null;

  return { fire, Confetti };
}

