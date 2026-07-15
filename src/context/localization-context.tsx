
"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

type Locale = 'en' | 'fr';

const translations: Record<Locale, Record<string, unknown>> = { en, fr };

interface LocalizationContextType {
  language: Locale;
  countryName: string;
  setLanguage: (lang: Locale) => void;
  t: (key: string, params?: { [key: string]: string | number }) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within a LocalizationProvider");
  }
  return context;
};

export const LocalizationProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Locale>('fr');

  useEffect(() => {
    const saved = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith('language='))
      ?.split('=')[1];
    const preferred: Locale = saved === 'en' ? 'en' : 'fr';
    setLanguageState(preferred);
    document.cookie = `language=${preferred}; Max-Age=31536000; Path=/; SameSite=Lax`;
  }, []);

  const setLanguage = (lang: Locale) => {
    setLanguageState(lang);
    document.cookie = `language=${lang}; Max-Age=31536000; Path=/; SameSite=Lax`;
  };
  
  const t = useCallback((key: string, params?: { [key: string]: string | number }) => {
      const keys = key.split('.');
      let result: unknown = translations[language];
      for (const k of keys) {
          result = result && typeof result === 'object'
            ? (result as Record<string, unknown>)[k]
            : undefined;
          if (!result) {
              break;
          }
      }

      let text = typeof result === 'string' ? result : key;

       if (params) {
         Object.keys(params).forEach(pKey => {
            text = text.replace(`{${pKey}}`, String(params[pKey]));
         })
       }

      return text;
  }, [language]);

  const value = useMemo(() => ({
    language,
    countryName: "Côte d'Ivoire",
    setLanguage,
    t,
  }), [language, t]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};
