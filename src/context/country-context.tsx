
"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

type Country = {
  code: string;
  name: {
    en: string;
    fr: string;
  };
  theme: string;
};

export const allCountries: Country[] = [
    { code: 'CI', name: { en: 'Ivory Coast', fr: 'Côte d\'Ivoire' }, theme: 'ivory-coast' },
    { code: 'NG', name: { en: 'Nigeria', fr: 'Nigéria' }, theme: 'nigeria-green' },
    { code: 'GH', name: { en: 'Ghana', fr: 'Ghana' }, theme: 'ghana-gold' },
    { code: 'SN', name: { en: 'Senegal', fr: 'Sénégal' }, theme: 'senegal-sun' },
    { code: 'CM', name: { en: 'Cameroon', fr: 'Cameroun' }, theme: 'cameroon-unity' },
    { code: 'CD', name: { en: 'DR Congo', fr: 'RD Congo' }, theme: 'drc-cobalt' },
];

const launchCountryCodes = ['CI', 'NG', 'GH', 'SN', 'CM', 'CD'];

type CountryContextType = {
  country: Country;
  setCountry: (country: Country) => void;
  isLaunchCountry: boolean;
};

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export const CountryProvider = ({ children }: { children: ReactNode }) => {
  const [country, setCountryState] = useState<Country>(allCountries[0]); // Default to Ivory Coast

  useEffect(() => {
    const savedCountryCode = localStorage.getItem('countryCode');
    const savedCountry = allCountries.find(c => c.code === savedCountryCode);
    if (savedCountry) {
      setCountryState(savedCountry);
    }
    // Note: Auto-detection via IP would happen here in a real-world scenario
  }, []);
  
  const setCountry = (newCountry: Country) => {
    setCountryState(newCountry);
    localStorage.setItem('countryCode', newCountry.code);
    document.documentElement.setAttribute('data-theme', newCountry.theme);
  };
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', country.theme);
  }, [country]);

  const isLaunchCountry = useMemo(() => launchCountryCodes.includes(country.code), [country.code]);

  const value = { country, setCountry, isLaunchCountry };

  return (
    <CountryContext.Provider value={value}>
      {children}
    </CountryContext.Provider>
  );
};

export const useCountry = (): CountryContextType => {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
};
