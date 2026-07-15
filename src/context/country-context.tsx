
"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface CountryContextType {
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  country: {
    code: string;
    name: string;
  };
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountry] = useState('CI');
  const country = {
    code: selectedCountry,
    name: selectedCountry === 'CI' ? "Côte d'Ivoire" : selectedCountry,
  };

  return (
    <CountryContext.Provider value={{ selectedCountry, setSelectedCountry, country }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}
