"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

const translations: { [key: string]: any } = { en, fr };

type LocalizationContextType = {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fr')) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: string) => {
    if (lang === 'en' || lang === 'fr') {
      setLanguage(lang);
      localStorage.setItem('language', lang);
    }
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LocalizationContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    // This fallback allows components to render on the server
    // even if they can't get the "real" context.
    // The text will be re-rendered on the client with the correct language.
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key: string) => key,
    };
  }
  return context;
};
