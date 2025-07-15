
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from '@/lib/firebase'; // Ensure your firebase config is correctly exported from here

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export type Role = 'graduate' | 'company' | 'school' | 'admin';

export interface UserProfile {
  uid: string;
  email: string | null;
  name?: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  schoolId?: string;
  companyName?: string;
  contactName?: string;
  industry?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  role: Role;
  signUp: (profile: Omit<UserProfile, 'uid'>, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserDocument = async (firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...userDoc.data(),
      } as UserProfile;
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userProfile = await fetchUserDocument(firebaseUser);
         if (userProfile) {
          setUser(userProfile);
        } else {
           console.warn("User document not found for UID:", firebaseUser.uid);
           setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'graduate' }); // Fallback
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const createUserDocument = async (firebaseUser: FirebaseUser, profile: Omit<UserProfile, 'uid' | 'email'>, email: string) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    await setDoc(userDocRef, {
        ...profile,
        uid: firebaseUser.uid,
        email: email, // ensure email from auth is stored
        createdAt: new Date(),
    });
  }

  const signUp = async (profile: Omit<UserProfile, 'uid'>, password: string) => {
    if (!profile.email) throw new Error("Email is required for sign up.");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, profile.email, password);
      const firebaseUser = userCredential.user;
      const { email, ...profileData } = profile;
      await createUserDocument(firebaseUser, profileData, firebaseUser.email!);
      const userProfile = await fetchUserDocument(firebaseUser);
      if(userProfile) setUser(userProfile);

    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userProfile = await fetchUserDocument(userCredential.user);
      if (userProfile) setUser(userProfile);

    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // New user via Google
            const [firstName, ...lastName] = (firebaseUser.displayName || "").split(" ");
            const profile: Omit<UserProfile, 'uid' | 'email'> = {
                name: firebaseUser.displayName,
                firstName,
                lastName: lastName.join(" "),
                role: 'graduate', // Default role for Google sign-ups
            };
            await createUserDocument(firebaseUser, profile, firebaseUser.email!);
        }
        
        const userProfile = await fetchUserDocument(firebaseUser);
        if (userProfile) setUser(userProfile);
    } catch (error) {
        console.error("Error signing in with Google:", error);
        throw error;
    }
  };


  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    role: user?.role || 'graduate',
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
