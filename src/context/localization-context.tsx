
"use client"

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';
import fr from '@/locales/fr.json';

type Locale = 'fr';

const translations: Record<string, any> = { fr };

interface LocalizationContextType {
  language: Locale;
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
    const savedLanguage = Cookies.get('language') as Locale;
    if (savedLanguage && savedLanguage === 'fr') {
      setLanguageState(savedLanguage);
    } else {
      // Always default to French
      setLanguageState('fr');
      Cookies.set('language', 'fr', { expires: 365, path: '/' });
    }
  }, []);

  const setLanguage = (lang: Locale) => {
    setLanguageState(lang);
    Cookies.set('language', lang, { expires: 365, path: '/' });
  };
  
  const t = useCallback((key: string, params?: { [key: string]: string | number }) => {
      const keys = key.split('.');
      let result = translations[language];
      for (const k of keys) {
          result = result?.[k];
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

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};
