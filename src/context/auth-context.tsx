
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from '@/lib/firebase'; // Ensure your firebase config is correctly exported from here

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export interface UserProfile {
  uid: string;
  email: string | null;
  name?: string;
  role: 'graduate' | 'company' | 'school' | 'admin';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...userData,
          } as UserProfile);
        } else {
           // This can happen during Google sign-up if the user document hasn't been created yet.
           // We can create a default one here or handle it in the signInWithGoogle function.
           // For now, let's assume it should exist.
          console.warn("User document not found in Firestore for UID:", firebaseUser.uid);
          const profile: Omit<UserProfile, 'uid'> = {
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            role: 'graduate', // Default role
          };
          await createUserDocument(firebaseUser, profile);
          setUser({ uid: firebaseUser.uid, ...profile });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const createUserDocument = async (firebaseUser: FirebaseUser, profile: Omit<UserProfile, 'uid'>) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    await setDoc(userDocRef, {
        ...profile,
        uid: firebaseUser.uid,
        email: firebaseUser.email, // ensure email from auth is stored
        createdAt: new Date(),
    });
  }

  const signUp = async (profile: Omit<UserProfile, 'uid'>, password: string) => {
    if (!profile.email) throw new Error("Email is required for sign up.");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, profile.email, password);
      const firebaseUser = userCredential.user;
      await createUserDocument(firebaseUser, profile);
      // onAuthStateChanged will trigger and set the user state
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user state
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
            const profile: Omit<UserProfile, 'uid'> = {
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                firstName,
                lastName: lastName.join(" "),
                role: 'graduate', // Default role for Google sign-ups
            };
            await createUserDocument(firebaseUser, profile);
        }
        // onAuthStateChanged will handle setting the user state.
    } catch (error) {
        console.error("Error signing in with Google:", error);
        throw error;
    }
  };


  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle setting the user state to null
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
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

    