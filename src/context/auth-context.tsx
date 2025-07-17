
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, User as FirebaseUser, sendPasswordResetEmail, linkWithPopup, sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { app } from '@/lib/firebase'; // Ensure your firebase config is correctly exported from here

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export type Role = 'graduate' | 'company' | 'school' | 'admin';
export type UserStatus = 'pending' | 'active' | 'suspended' | 'declined';

export type EducationEntry = {
  degree: string;
  field: string;
  gradYear: string;
  verified: boolean;
};

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
  education?: EducationEntry[];
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
         if (userProfile && userProfile.status === 'active') {
          setUser(userProfile);
        } else {
           // For pending/suspended/non-existent-doc users, keep them signed out of the app state
           // This also prevents users who haven't been approved from accessing the dashboard.
           setUser(null);
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
    
    // Send email verification
    await sendEmailVerification(firebaseUser);

    const { email, ...profileData } = profile;
    const status = await createUserDocument(firebaseUser, profileData, firebaseUser.email!);
    
    // Sign out the user immediately after registration so they have to log in
    await firebaseSignOut(auth);
  };

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await fetchUserDocument(userCredential.user);

    if (!userProfile) {
        await firebaseSignOut(auth);
        throw new Error("User data not found. Please contact support.");
    }

    if (userProfile.status !== 'active') {
        await firebaseSignOut(auth);
        if (userProfile.role === 'graduate') {
            throw new Error("pending_graduate");
        } else if (userProfile.status === 'pending') {
            throw new Error("pending_org");
        } else if (userProfile.status === 'suspended') {
            throw new Error("suspended");
        }
    }
    
    setUser(userProfile);
  };

  const signInWithGoogle = async () => {
    if (auth.currentUser) {
        try {
            const result = await linkWithPopup(auth.currentUser, googleProvider);
            const userProfile = await fetchUserDocument(result.user);
            if(userProfile) setUser(userProfile);
        } catch (error: any) {
             console.error("Failed to link Google account:", error);
            if(error.code === 'auth/credential-already-in-use') {
                throw new Error("This Google account is already linked to another Yahnu user.");
            }
            throw new Error("Failed to link Google account.");
        }
    } else {
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
            userDoc = await getDoc(userDocRef);
        }
        
        const userProfile = userDoc.data() as UserProfile;
        
        if (userProfile?.status !== 'active') {
            await firebaseSignOut(auth);
            if (userProfile?.role === 'graduate') {
                throw new Error("pending_graduate");
            } else if (userProfile?.status === 'pending') {
                throw new Error("pending_org");
            } else if (userProfile?.status === 'suspended') {
                throw new Error("suspended");
            }
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
