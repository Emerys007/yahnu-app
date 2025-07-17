
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, User as FirebaseUser, sendPasswordResetEmail, linkWithPopup, sendEmailVerification } from "firebase/auth";
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
  schoolName?: string;
  companyName?: string;
  contactName?: string;
  industry?: string;
  experience?: string;
  education?: string;
  skills?: string[] | string;
  phone?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  role: Role;
  signUp: (profile: Omit<UserProfile, 'uid' | 'status'>, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  isGoogleProvider: () => boolean;
  createPassword: () => Promise<void>;
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
          if (userProfile.status === 'pending') {
            // User is pending, but let's not sign them out immediately.
            // This allows us to show them a "pending" status page if we want.
            // For now, we'll just treat them as logged out from a UI perspective.
            setUser(null); 
          } else if (userProfile.status === 'suspended') {
            setUser(null);
          }
          else {
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
    
    // Graduates need approval from their school. Companies/Schools need admin approval. Admins are active immediately.
    const status: UserStatus = profile.role === 'admin' ? 'active' : 'pending';
    
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
    
    // Send verification email
    await sendEmailVerification(firebaseUser);

    const { email, ...profileData } = profile;
    const status = await createUserDocument(firebaseUser, profileData, firebaseUser.email!);
    
    // Always sign out after registration so user has to log in.
    await firebaseSignOut(auth);
  };

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await fetchUserDocument(userCredential.user);

    if (userProfile?.status === 'pending') {
        await firebaseSignOut(auth);
        throw new Error("Your account is pending approval.");
    }
     if (userProfile?.status === 'suspended') {
        await firebaseSignOut(auth);
        throw new Error("Your account has been suspended.");
    }
    
    if (userProfile) setUser(userProfile);
  };

  const signInWithGoogle = async () => {
    if (auth.currentUser) {
        // This is a user who is already logged in with email/password and wants to link their Google account.
        try {
            const result = await linkWithPopup(auth.currentUser, googleProvider);
            const userProfile = await fetchUserDocument(result.user);
            if(userProfile) setUser(userProfile);
        } catch (error: any) {
            // Handle specific errors, e.g., 'auth/credential-already-in-use'
             console.error("Failed to link Google account:", error);
            if(error.code === 'auth/credential-already-in-use') {
                throw new Error("This Google account is already linked to another Yahnu user.");
            }
            throw new Error("Failed to link Google account.");
        }
    } else {
        // This is a new sign-in or sign-up attempt.
        const result = await signInWithPopup(auth, googleProvider);
        const firebaseUser = result.user;
        const userDocRef = doc(db, "users", firebaseUser.uid);
        let userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            const [firstName, ...lastNameParts] = (firebaseUser.displayName || "").split(" ");
            const lastName = lastNameParts.join(" ");
            const profile: Omit<UserProfile, 'uid' | 'email' | 'status'> = {
                name: firebaseUser.displayName || "Google User",
                firstName,
                lastName,
                role: 'graduate', // Default to graduate for Google sign-ups
            };
            await createUserDocument(firebaseUser, profile, firebaseUser.email!);
            userDoc = await getDoc(userDocRef); // Re-fetch the doc after creation
        }
        
        const userProfile = userDoc.data() as UserProfile;
        
        if (userProfile?.status === 'pending') {
            await firebaseSignOut(auth);
            throw new Error("Your account is pending approval. Please contact your school's administrator.");
        }
        if (userProfile?.status === 'suspended') {
            await firebaseSignOut(auth);
            throw new Error("Your account has been suspended. Please contact support.");
        }
        
        if (userProfile) setUser(userProfile);
    }
  };


  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  const isGoogleProvider = () => {
      if (!auth.currentUser) return false;
      return auth.currentUser.providerData.some(p => p.providerId === 'google.com');
  }

  const createPassword = async () => {
      if (!auth.currentUser || !auth.currentUser.email) {
          throw new Error("No user is currently signed in or user has no email.");
      }
      await sendPasswordResetEmail(auth, auth.currentUser.email);
  }

  const value = {
    user,
    loading,
    role: user?.role || 'graduate',
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    isGoogleProvider,
    createPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
