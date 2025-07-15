
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, User as FirebaseUser } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { app } from '@/lib/firebase'; // Ensure your firebase config is correctly exported from here

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export type Role = 'graduate' | 'company' | 'school' | 'admin';
export type UserStatus = 'pending' | 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string | null;
  name?: string;
  role: Role;
  status: UserStatus;
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
  signUp: (profile: Omit<UserProfile, 'uid' | 'status'>, password: string) => Promise<void>;
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
          if (userProfile.role === 'graduate' && userProfile.status === 'pending') {
            setUser(null);
            await firebaseSignOut(auth);
          } else {
            setUser(userProfile);
          }
        } else {
           console.warn("User document not found for UID:", firebaseUser.uid);
           setUser(null);
           await firebaseSignOut(auth);
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
    
    // Graduates start as pending, others are active by default
    const status: UserStatus = profile.role === 'graduate' ? 'pending' : 'active';
    
    await setDoc(userDocRef, {
        ...profile,
        uid: firebaseUser.uid,
        email: email, // ensure email from auth is stored
        status: status,
        createdAt: new Date(),
    });

    return status;
  }

  const signUp = async (profile: Omit<UserProfile, 'uid' | 'status'>, password: string) => {
    if (!profile.email) throw new Error("Email is required for sign up.");
    
    const userCredential = await createUserWithEmailAndPassword(auth, profile.email, password);
    const firebaseUser = userCredential.user;
    const { email, ...profileData } = profile;
    const status = await createUserDocument(firebaseUser, profileData, firebaseUser.email!);
    
    // Don't auto-login pending graduates
    if (status === 'pending') {
        await firebaseSignOut(auth);
    } else {
        const userProfile = await fetchUserDocument(firebaseUser);
        if(userProfile) setUser(userProfile);
    }
  };

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await fetchUserDocument(userCredential.user);

    if (userProfile?.role === 'graduate' && userProfile.status === 'pending') {
        await firebaseSignOut(auth);
        throw new Error("Your account is pending approval by your school's administrator.");
    }
    
    if (userProfile) setUser(userProfile);
  };

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    const userDocRef = doc(db, "users", firebaseUser.uid);
    let userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        const [firstName, ...lastName] = (firebaseUser.displayName || "").split(" ");
        const profile: Omit<UserProfile, 'uid' | 'email' | 'status'> = {
            name: firebaseUser.displayName || "Google User",
            firstName,
            lastName: lastName.join(" "),
            role: 'graduate', 
        };
        await createUserDocument(firebaseUser, profile, firebaseUser.email!);
        userDoc = await getDoc(userDocRef); // Re-fetch the doc after creation
    }
    
    const userProfile = userDoc.data() as UserProfile;
    
    if (userProfile?.role === 'graduate' && userProfile.status === 'pending') {
        await firebaseSignOut(auth);
        throw new Error("Your account is pending approval. Please contact your school's administrator.");
    }
    
    if (userProfile) setUser(userProfile);
  };


  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
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
