
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
    // Launch Countries
    { code: 'CI', name: { en: 'Ivory Coast', fr: 'Côte d\'Ivoire' }, theme: 'ivory-coast' },
    { code: 'NG', name: { en: 'Nigeria', fr: 'Nigéria' }, theme: 'nigeria-green' },
    { code: 'GH', name: { en: 'Ghana', fr: 'Ghana' }, theme: 'ghana-gold' },
    { code: 'SN', name: { en: 'Senegal', fr: 'Sénégal' }, theme: 'senegal-sun' },
    { code: 'CM', name: { en: 'Cameroon', fr: 'Cameroun' }, theme: 'cameroon-unity' },
    { code: 'CD', name: { en: 'DR Congo', fr: 'RD Congo' }, theme: 'drc-cobalt' },
    // Other Countries (will default theme)
    { code: 'DZ', name: { en: 'Algeria', fr: 'Algérie' }, theme: 'default' },
    { code: 'AO', name: { en: 'Angola', fr: 'Angola' }, theme: 'default' },
    { code: 'BJ', name: { en: 'Benin', fr: 'Bénin' }, theme: 'default' },
    { code: 'BW', name: { en: 'Botswana', fr: 'Botswana' }, theme: 'default' },
    { code: 'BF', name: { en: 'Burkina Faso', fr: 'Burkina Faso' }, theme: 'default' },
    { code: 'BI', name: { en: 'Burundi', fr: 'Burundi' }, theme: 'default' },
    { code: 'CV', name: { en: 'Cabo Verde', fr: 'Cap-Vert' }, theme: 'default' },
    { code: 'CF', name: { en: 'Central African Republic', fr: 'République centrafricaine' }, theme: 'default' },
    { code: 'TD', name: { en: 'Chad', fr: 'Tchad' }, theme: 'default' },
    { code: 'KM', name: { en: 'Comoros', fr: 'Comores' }, theme: 'default' },
    { code: 'CG', name: { en: 'Congo', fr: 'Congo' }, theme: 'default' },
    { code: 'DJ', name: { en: 'Djibouti', fr: 'Djibouti' }, theme: 'default' },
    { code: 'EG', name: { en: 'Egypt', fr: 'Égypte' }, theme: 'default' },
    { code: 'GQ', name: { en: 'Equatorial Guinea', fr: 'Guinée équatoriale' }, theme: 'default' },
    { code: 'ER', name: { en: 'Eritrea', fr: 'Érythrée' }, theme: 'default' },
    { code: 'SZ', name: { en: 'Eswatini', fr: 'Eswatini' }, theme: 'default' },
    { code: 'ET', name: { en: 'Ethiopia', fr: 'Éthiopie' }, theme: 'default' },
    { code: 'GA', name: { en: 'Gabon', fr: 'Gabon' }, theme: 'default' },
    { code: 'GM', name: { en: 'Gambia', fr: 'Gambie' }, theme: 'default' },
    { code: 'GN', name: { en: 'Guinea', fr: 'Guinée' }, theme: 'default' },
    { code: 'GW', name: { en: 'Guinea-Bissau', fr: 'Guinée-Bissau' }, theme: 'default' },
    { code: 'KE', name: { en: 'Kenya', fr: 'Kenya' }, theme: 'default' },
    { code: 'LS', name: { en: 'Lesotho', fr: 'Lesotho' }, theme: 'default' },
    { code: 'LR', name: { en: 'Liberia', fr: 'Libéria' }, theme: 'default' },
    { code: 'LY', name: { en: 'Libya', fr: 'Libye' }, theme: 'default' },
    { code: 'MG', name: { en: 'Madagascar', fr: 'Madagascar' }, theme: 'default' },
    { code: 'MW', name: { en: 'Malawi', fr: 'Malawi' }, theme: 'default' },
    { code: 'ML', name: { en: 'Mali', fr: 'Mali' }, theme: 'default' },
    { code: 'MR', name: { en: 'Mauritania', fr: 'Mauritanie' }, theme: 'default' },
    { code: 'MU', name: { en: 'Mauritius', fr: 'Maurice' }, theme: 'default' },
    { code: 'MA', name: { en: 'Morocco', fr: 'Maroc' }, theme: 'default' },
    { code: 'MZ', name: { en: 'Mozambique', fr: 'Mozambique' }, theme: 'default' },
    { code: 'NA', name: { en: 'Namibia', fr: 'Namibie' }, theme: 'default' },
    { code: 'NE', name: { en: 'Niger', fr: 'Niger' }, theme: 'default' },
    { code: 'RW', name: { en: 'Rwanda', fr: 'Rwanda' }, theme: 'default' },
    { code: 'ST', name: { en: 'Sao Tome and Principe', fr: 'Sao Tomé-et-Principe' }, theme: 'default' },
    { code: 'SC', name: { en: 'Seychelles', fr: 'Seychelles' }, theme: 'default' },
    { code: 'SL', name: { en: 'Sierra Leone', fr: 'Sierra Leone' }, theme: 'default' },
    { code: 'SO', name: { en: 'Somalia', fr: 'Somalie' }, theme: 'default' },
    { code: 'ZA', name: { en: 'South Africa', fr: 'Afrique du Sud' }, theme: 'default' },
    { code: 'SS', name: { en: 'South Sudan', fr: 'Soudan du Sud' }, theme: 'default' },
    { code: 'SD', name: { en: 'Sudan', fr: 'Soudan' }, theme: 'default' },
    { code: 'TZ', name: { en: 'Tanzania', fr: 'Tanzanie' }, theme: 'default' },
    { code: 'TG', name: { en: 'Togo', fr: 'Togo' }, theme: 'default' },
    { code: 'TN', name: { en: 'Tunisia', fr: 'Tunisie' }, theme: 'default' },
    { code: 'UG', name: { en: 'Uganda', fr: 'Ouganda' }, theme: 'default' },
    { code: 'ZM', name: { en: 'Zambia', fr: 'Zambie' }, theme: 'default' },
    { code: 'ZW', name: { en: 'Zimbabwe', fr: 'Zimbabwe' }, theme: 'default' },
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
