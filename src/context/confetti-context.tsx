
"use client"

import React, { createContext, useContext, useMemo } from 'react';
import { useConfetti as useConfettiHook } from '@/hooks/use-confetti';

interface ConfettiContextType {
  fire: () => void;
}

const ConfettiContext = createContext<ConfettiContextType | undefined>(undefined);

export const useConfetti = () => {
  const context = useContext(ConfettiContext);
  if (!context) {
    throw new Error('useConfetti must be used within a ConfettiProvider');
  }
  return context;
};

export const ConfettiProvider = ({ children }: { children: React.ReactNode }) => {
  const { fire, Confetti } = useConfettiHook();
  
  const value = useMemo(() => ({ fire }), [fire]);

  return (
    <ConfettiContext.Provider value={value}>
      {children}
      {Confetti}
    </ConfettiContext.Provider>
  );
};
