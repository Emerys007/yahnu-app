"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { apiFetch } from '@/lib/api-client';
import type { Role, UserProfile } from '@/lib/auth-types';

export type { EducationEntry, Role, UserProfile, UserStatus } from '@/lib/auth-types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  role: Role;
  googleEnabled: boolean;
  signUp: (profile: Omit<UserProfile, 'uid' | 'status'>, password: string, inviteToken?: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: (returnTo?: string) => Promise<void>;
  isGoogleProvider: () => boolean;
  createPassword: () => Promise<{ debugUrl?: string }>;
  updateProfile: (updates: ProfileUpdateInput) => Promise<ProfileUpdateResult>;
  refreshUser: () => Promise<void>;
}

export type SignUpResult = {
  created: boolean;
  emailDelivery: 'sent' | 'development_link' | 'failed';
  debugUrl?: string;
};

export type ProfileUpdateResult = {
  emailChangeDelivery?: 'sent' | 'development_link' | 'failed';
  debugUrl?: string;
};

export type ProfileUpdateInput = Partial<Pick<UserProfile,
  'email' | 'name' | 'firstName' | 'lastName' | 'schoolName' | 'companyName' |
  'contactName' | 'industry' | 'experience' | 'education' | 'skills' | 'phone'
>> & { currentPassword?: string };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

type SessionResponse = { data: { user: UserProfile | null; googleEnabled: boolean } };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  const setAuthenticatedUser = useCallback((profile: UserProfile | null) => {
    setUser(profile);
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await apiFetch<SessionResponse>('/api/auth/session');
    setGoogleEnabled(response.data.googleEnabled);
    setAuthenticatedUser(response.data.user);
  }, [setAuthenticatedUser]);

  useEffect(() => {
    refreshUser()
      .catch((error) => {
        console.error('Unable to restore the current session.', error);
        setAuthenticatedUser(null);
      })
      .finally(() => setLoading(false));
  }, [refreshUser, setAuthenticatedUser]);

  const signUp = useCallback(async (
    profile: Omit<UserProfile, 'uid' | 'status'>,
    password: string,
    inviteToken?: string,
  ) => {
    const response = await apiFetch<{ data: SignUpResult }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: inviteToken ? undefined : profile.email,
        password,
        role: profile.role,
        name: profile.name,
        firstName: profile.firstName,
        lastName: profile.lastName,
        schoolId: profile.schoolId,
        schoolName: profile.schoolName,
        companyName: profile.companyName,
        contactName: profile.contactName,
        industry: profile.industry,
        inviteToken,
      }),
    });
    return response.data;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await apiFetch<{ data: { user: UserProfile } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthenticatedUser(response.data.user);
  }, [setAuthenticatedUser]);

  const signOut = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuthenticatedUser(null);
    }
  }, [setAuthenticatedUser]);

  const signInWithGoogle = useCallback(async (returnTo = '/dashboard') => {
    if (!googleEnabled) throw new Error('Google sign-in is not configured.');
    const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/dashboard';
    window.location.assign(`/api/auth/google/start?returnTo=${encodeURIComponent(safeReturnTo)}`);
  }, [googleEnabled]);

  const isGoogleProvider = useCallback(() => user?.authProvider === 'google', [user]);

  const createPassword = useCallback(async () => {
    if (!user?.email) throw new Error('No email address is associated with this account.');
    const response = await apiFetch<{ data: { debugUrl?: string } }>('/api/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email: user.email }),
    });
    return response.data;
  }, [user]);

  const updateProfile = useCallback(async (updates: ProfileUpdateInput) => {
    const response = await apiFetch<{ data: { user: UserProfile } & ProfileUpdateResult }>('/api/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setAuthenticatedUser(response.data.user);
    if (response.data.debugUrl) window.location.assign(response.data.debugUrl);
    return {
      emailChangeDelivery: response.data.emailChangeDelivery,
      debugUrl: response.data.debugUrl,
    };
  }, [setAuthenticatedUser]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    loading,
    role: user?.role ?? 'graduate',
    googleEnabled,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    isGoogleProvider,
    createPassword,
    updateProfile,
    refreshUser,
  }), [user, loading, googleEnabled, signUp, signIn, signOut, signInWithGoogle, isGoogleProvider, createPassword, updateProfile, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
