"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { useCountry } from './country-context';

const translations: { [key: string]: any } = { en, fr };

type LocalizationContextType = {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string, values?: { [key: string]: string | number }) => string;
  countryName: string;
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider = ({ children }: { children: ReactNode }) => {
  const { country } = useCountry();
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

  const countryName = country?.name ? (language === 'fr' ? country.name.fr : country.name.en) : (language === 'fr' ? 'Côte d\'Ivoire' : 'Ivory Coast');

  const t = (key: string, values?: { [key: string]: string | number }): string => {
    // Handle nested keys by splitting on '.' and traversing the object
    const keys = key.split('.');
    let translation: any = translations[language];

    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        translation = key; // Fallback to the key itself if not found
        break;
      }
    }

    // Ensure translation is a string
    if (typeof translation !== 'string') {
      translation = key;
    }

    if (values) {
        Object.keys(values).forEach(valueKey => {
            const regex = new RegExp(`{${valueKey}}`, 'g');
            translation = translation.replace(regex, String(values[valueKey]));
        });
    }
    // Always replace country placeholder
    translation = translation.replace(/{country}/g, countryName);
    return translation;
  };

  return (
    <LocalizationContext.Provider value={{ language, setLanguage: handleSetLanguage, t, countryName }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);

  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }

  return context;
}