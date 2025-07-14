
"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AccountType = 'graduate' | 'company' | 'school' | 'admin';

type AuthContextType = {
  accountType: AccountType;
  setAccountType: (accountType: AccountType) => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accountType, setAccountType] = useState<AccountType>('admin'); // Default accountType

  const handleSetAccountType = (newAccountType: AccountType) => {
    setAccountType(newAccountType);
  };

  return (
    <AuthContext.Provider value={{ accountType, setAccountType: handleSetAccountType, isAuthenticated: true }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Fallback for when a component is rendered outside the provider,
    // which shouldn't happen in the dashboard.
    return {
      accountType: 'graduate',
      setAccountType: () => {},
      isAuthenticated: false,
    };
  }
  return context;
};
