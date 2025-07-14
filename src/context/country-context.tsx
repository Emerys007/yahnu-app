
"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

type Country = {
  code: string;
  name: {
    en: string;
    fr: string;
  };
  theme: string;
  logoUrl: string;
};

export const allCountries: Country[] = [
    { code: 'CI', name: { en: 'Ivory Coast', fr: 'Côte d\'Ivoire' }, theme: 'ivory-coast', logoUrl: '/images/Country Maps/Ivory Coast.svg' },
    { code: 'NG', name: { en: 'Nigeria', fr: 'Nigéria' }, theme: 'nigeria-green', logoUrl: '/images/Country Maps/Nigeria.svg' },
    { code: 'GH', name: { en: 'Ghana', fr: 'Ghana' }, theme: 'ghana-gold', logoUrl: '/images/Country Maps/Ghana.svg' },
    { code: 'SN', name: { en: 'Senegal', fr: 'Sénégal' }, theme: 'senegal-sun', logoUrl: '/images/Country Maps/Senegal.svg' },
    { code: 'CM', name: { en: 'Cameroon', fr: 'Cameroun' }, theme: 'cameroon-unity', logoUrl: '/images/Country Maps/Cameroon.svg' },
    { code: 'CD', name: { en: 'DR Congo', fr: 'RD Congo' }, theme: 'drc-cobalt', logoUrl: '/images/Country Maps/DRC.svg' },
];

type CountryContextType = {
  country: Country;
  setCountry: (country: Country) => void;
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
  }, []);
  
  const setCountry = (newCountry: Country) => {
    setCountryState(newCountry);
    localStorage.setItem('countryCode', newCountry.code);
    document.documentElement.setAttribute('data-theme', newCountry.theme);
  };
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', country.theme);
  }, [country]);

  const value = { country, setCountry };

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
