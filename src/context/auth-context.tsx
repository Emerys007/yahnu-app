
"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Role = 'graduate' | 'company' | 'school' | 'admin';

type AuthContextType = {
  role: Role;
  setRole: (role: Role) => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<Role>('graduate'); // Default role

  const handleSetRole = (newRole: Role) => {
    setRole(newRole);
  };

  return (
    <AuthContext.Provider value={{ role, setRole: handleSetRole, isAuthenticated: true }}>
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
      role: 'graduate',
      setRole: () => {},
      isAuthenticated: false,
    };
  }
  return context;
};
