"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { useCountry } from './country-context';

/**
 * Mapping of loaded translation files.
 */
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

  /**
   * Initialise language.  We default to French, but if the code is running
   * in the browser and a saved language is in localStorage we use that instead.
   */
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('language');
      if (saved === 'en' || saved === 'fr') {
        return saved;
      }
    }
    return 'fr';
  });

  /**
   * Change the language and persist it to localStorage (in the browser).
   */
  const handleSetLanguage = (lang: string) => {
    if (lang === 'en' || lang === 'fr') {
      setLanguage(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('language', lang);
      }
    }
  };

  /**
   * Compute the country name for the {country} placeholder.
   */
  const countryName =
    country?.name
      ? language === 'fr'
        ? country.name.fr
        : country.name.en
      : language === 'fr'
        ? "Côte d'Ivoire"
        : 'Ivory Coast';

  /**
   * Deep getter used by t() to find a nested translation string.
   */
  const deepGet = (obj: any, path: string[]): string | undefined => {
    let current = obj;
    for (const segment of path) {
      if (current && typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, segment)) {
        current = current[segment];
      } else {
        return undefined;
      }
    }
    return typeof current === 'string' ? current : undefined;
  };

  /**
   * Translation function.  Tries the current language, then English, then French,
   * and falls back to the key itself if nothing is found.  It also trims the key
   * to avoid problems with stray spaces or newline characters.
   */
  const t = (rawKey: string, values?: { [key: string]: string | number }): string => {
    const key = rawKey.trim();
    const parts = key.split('.').filter(Boolean);

    let result =
      deepGet(translations[language], parts) ??
      deepGet(translations['en'], parts) ??
      deepGet(translations['fr'], parts);

    let translation = result ?? key;

    // Replace named placeholders with provided values
    if (values) {
      translation = translation.replace(/\{(\w+)\}/g, (_match: string, p1: string) => {
        return Object.prototype.hasOwnProperty.call(values, p1) ? String(values[p1]) : `{${p1}}`;
      });
    }
    // Replace {country}
    translation = translation.replace(/\{country\}/g, countryName);

    return translation;
  };

  return (
    <LocalizationContext.Provider value={{ language, setLanguage: handleSetLanguage, t, countryName }}>
      {children}
    </LocalizationContext.Provider>
  );
};

/**
 * Hook to consume the localisation context.
 */
export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
