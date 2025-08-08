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
    {
        code: 'CI',
        name: { en: 'Côte d\'Ivoire', fr: 'Côte d\'Ivoire' },
        logoUrl: '/images/Country Maps/IvoryCoast.svg',
        states: ["Abidjan", "Bas-Sassandra", "Comoé", "Denguélé", "Gôh-Djiboua", "Lacs", "Lagunes", "Montagnes", "Sassandra-Marahoué", "Savanes", "Vallée du Bandama", "Woroba", "Yamoussoukro", "Zanzan"]
    },
    {
        code: 'GH',
        name: { en: 'Ghana', fr: 'Ghana' },
        logoUrl: '/images/Country Maps/Ghana.svg',
        states: ["Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern", "Greater Accra", "North East", "Northern", "Oti", "Savannah", "Upper East", "Upper West", "Volta", "Western", "Western North"]
    },
    {
        code: 'NG',
        name: { en: 'Nigeria', fr: 'Nigéria' },
        logoUrl: '/images/Country Maps/Nigeria.svg',
        states: ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"]
    },
    {
        code: 'SN',
        name: { en: 'Senegal', fr: 'Sénégal' },
        logoUrl: '/images/Country Maps/Senegal.svg',
        states: ["Dakar", "Diourbel", "Fatick", "Kaffrine", "Kaolack", "Kédougou", "Kolda", "Louga", "Matam", "Saint-Louis", "Sédhiou", "Tambacounda", "Thiès", "Ziguinchor"]
    },
    {
        code: 'CM',
        name: { en: 'Cameroon', fr: 'Cameroun' },
        logoUrl: '/images/Country Maps/Cameroon.svg',
        states: ["Adamaoua", "Centre", "East", "Far North", "Littoral", "North", "North-West", "South", "South-West", "West"]
    },
    {
        code: 'CD',
        name: { en: 'Democratic Republic of Congo', fr: 'République Démocratique du Congo' },
        logoUrl: '/images/Country Maps/DRCongo.svg',
        states: ["Bas-Uele", "Équateur", "Haut-Katanga", "Haut-Lomami", "Haut-Uele", "Ituri", "Kasaï", "Kasaï central", "Kasaï oriental", "Kinshasa", "Kongo-Central", "Kwango", "Kwilu", "Lomami", "Lualaba", "Mai-Ndombe", "Maniema", "Mongala", "Nord-Kivu", "Nord-Ubangi", "Sankuru", "Sud-Kivu", "Sud-Ubangi", "Tanganyika", "Tshopo", "Tshuapa"]
    }
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